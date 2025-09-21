import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Session, LiveServerMessage, Modality } from '@google/genai';
import { AssistantState } from '../types';
import LiveAudioStream from 'react-native-live-audio-stream';
import Sound from 'react-native-sound';
import { Buffer } from 'buffer'; // Required for base64 handling

const API_KEY = process.env.API_KEY;

// Enable playback of audio
Sound.setCategory('Playback');

export const useVoiceAssistant = () => {
  const [state, setState] = useState<AssistantState>(AssistantState.IDLE);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0); // Note: react-native-live-audio-stream doesn't provide volume levels. This is a placeholder.

  const sessionRef = useRef<Session | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  
  // Function to process and play audio from the queue
  const playNextAudioChunk = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    setState(AssistantState.SPEAKING);

    const base64Chunk = audioQueueRef.current.shift();

    if (!base64Chunk) {
        isPlayingRef.current = false;
        return;
    }
    
    // react-native-sound plays from a file. We write the base64 chunk to a temporary file.
    // NOTE: This requires a library to handle temporary file system access, like 'react-native-fs'.
    // This part is a complex native integration detailed in POST_GENERATION_STEPS.md
    console.log("Playing audio chunk. Native implementation required.");
    // ---- START OF PSEUDO-CODE for playback ----
    // const tempPath = `${FileSystem.cacheDirectory}/temp_audio.wav`;
    // FileSystem.writeFile(tempPath, base64Chunk, 'base64').then(() => {
    //   const sound = new Sound(tempPath, '', (error) => {
    //     if (error) { console.log('failed to load the sound', error); return; }
    //     sound.play(() => {
    //       sound.release();
    //       FileSystem.unlink(tempPath); // Clean up
    //       isPlayingRef.current = false;
    //       playNextAudioChunk();
    //     });
    //   });
    // });
    // ---- END OF PSEUDO-CODE ----
    
    // For now, we'll simulate playback completion
    setTimeout(() => {
        isPlayingRef.current = false;
        playNextAudioChunk();
    }, 500); // Simulate audio chunk duration
  }, []);


  const cleanup = useCallback(() => {
    console.log("Cleaning up resources...");
    LiveAudioStream.stop();
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
    }
    setUserTranscript('');
    setAiResponse('');
    setError('');
    setAudioLevel(0);
    setState(AssistantState.IDLE);
  }, []);

  const handleServerMessage = useCallback((message: LiveServerMessage) => {
      if (message.serverContent?.modelTurn?.parts) {
          const part = message.serverContent.modelTurn.parts[0];
          if (part.text) {
              setAiResponse(prev => prev + part.text);
          }
          if (part.inlineData) {
              // Queue the incoming audio data (base64 string)
              audioQueueRef.current.push(part.inlineData.data);
              playNextAudioChunk();
          }
      }
      
      // FIX: The `speechRecognitionResult` is part of the `userTurn` content.
      if (message.serverContent?.userTurn?.speechRecognitionResult) {
          setUserTranscript(message.serverContent.userTurn.speechRecognitionResult.transcript);
      }

      if (message.serverContent?.turnComplete) {
        // When the turn is complete, check if all audio has been played, then switch back.
        const checkPlaybackDone = setInterval(() => {
            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                clearInterval(checkPlaybackDone);
                setState(AssistantState.LISTENING);
                setAiResponse('');
            }
        }, 100);
      }
  }, [playNextAudioChunk]);

  const startConversation = useCallback(async () => {
    if (!API_KEY) {
      setError("API_KEY environment variable not set. See POST_GENERATION_STEPS.md");
      return;
    }
    setState(AssistantState.THINKING); 
    setAiResponse('');
    setUserTranscript('');
    audioQueueRef.current = [];

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const newSession = await ai.live.connect({
            model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
            config: {
                responseModalities: [Modality.AUDIO, Modality.TEXT],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Algenib' }
                  }
                },
            },
            callbacks: {
                onmessage: handleServerMessage,
                onerror: (e: ErrorEvent) => {
                    setError(`Live connection error: ${e.message || 'Connection failed.'}`);
                    cleanup();
                },
                onclose: () => {
                    if (state !== AssistantState.IDLE) {
                       cleanup();
                    }
                },
            },
        });
        sessionRef.current = newSession;

        const options = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // VOICE_RECOGNITION
        };

        LiveAudioStream.init(options);
        LiveAudioStream.on('data', (data: string) => {
            // data is a base64-encoded string of the audio chunk
            if (sessionRef.current) {
                // Convert base64 string to ArrayBuffer
                const audioBuffer = Buffer.from(data, 'base64');
                // FIX: The method to send audio data is `sendAudio`.
                sessionRef.current.sendAudio(audioBuffer);
            }
        });
        
        LiveAudioStream.start();
        setState(AssistantState.LISTENING);

    } catch (err: any) {
        setError(`Failed to start session: ${err.message}`);
        cleanup();
    }
  }, [cleanup, handleServerMessage, state]);
  
  const stopConversation = useCallback(() => {
    setState(AssistantState.IDLE);
    cleanup();
  }, [cleanup]);

  useEffect(() => {
      return () => {
          cleanup();
      };
  }, [cleanup]);

  return { state, startConversation, stopConversation, userTranscript, aiResponse, audioLevel, error };
};
