# Manual Setup for Gemini Orb Assistant (iOS)

This guide contains the necessary steps to configure the native iOS project. These steps cannot be performed automatically and are required for the app to function correctly.

## 1. Install Dependencies

You need to add several new native libraries to the project. Open your terminal in the project's root directory and run the following commands:

```bash
# For streaming audio from the microphone
npm install react-native-live-audio-stream

# For playing audio responses from the AI
npm install react-native-sound
npm install react-native-fs # Needed for temporary audio files

# For managing the API_KEY securely
npm install react-native-dotenv

# For handling Base64 audio data from the stream
npm install buffer
```

## 2. Configure API Key

The app loads your Gemini API key from an environment variable.

### A. Create a `.env` file

In the root of your project, create a new file named `.env` and add your API key to it:

```
API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Note:** Ensure `.env` is added to your `.gitignore` file to keep your key private.

### B. Update `babel.config.js`

Add the `react-native-dotenv` plugin to your `babel.config.js` file. This allows the app to read the `.env` file.

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Add this plugins array
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
  ],
};
```

## 3. Set iOS Permissions

The app requires permission to access the microphone.

### Open `Info.plist`

In Xcode, open the `ios/[YourAppName]/Info.plist` file.

### Add Microphone Permission

Right-click in the file and choose "Add Row". Set the key to `NSMicrophoneUsageDescription` (it will autocomplete to "Privacy - Microphone Usage Description"). In the "Value" column, add a user-facing reason, such as:

`This app requires microphone access for the voice assistant to hear you.`

Your `Info.plist` source code should contain:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app requires microphone access for the voice assistant to hear you.</string>
```

## 4. Link Native Modules

After adding the new dependencies, you must link their native iOS parts.

Run the following command in your terminal:

```bash
cd ios
pod install
cd ..
```

This command installs the native iOS code for `react-native-live-audio-stream`, `react-native-sound`, and `react-native-fs` using CocoaPods.

## 5. Implement Audio Playback (Developer Task)

The `useVoiceAssistant.ts` hook has placeholder logic for playing audio received from Gemini. The current code queues the audio chunks but does not play them.

To complete this, you will need to replace the pseudo-code section inside the `playNextAudioChunk` function with a real implementation using `react-native-sound` and `react-native-fs`.

**Example Implementation Snippet:**
```javascript
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

// Inside playNextAudioChunk function...
const tempAudioPath = `${RNFS.CachesDirectoryPath}/temp_audio_${Date.now()}.wav`;

RNFS.writeFile(tempAudioPath, base64Chunk, 'base64')
  .then(() => {
    const sound = new Sound(tempAudioPath, '', (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        // Handle error: release resources and continue processing queue
        isPlayingRef.current = false;
        playNextAudioChunk();
        return;
      }
      sound.play((success) => {
        if (!success) {
          console.log('Playback failed due to audio decoding errors.');
        }
        sound.release();
        RNFS.unlink(tempAudioPath).catch(err => console.error("Failed to delete temp audio file", err)); // Clean up temp file
        isPlayingRef.current = false;
        playNextAudioChunk(); // Play the next chunk
      });
    });
  })
  .catch(err => {
    console.error("Failed to write temp audio file", err);
    isPlayingRef.current = false;
    playNextAudioChunk();
  });

```

After completing these steps, you can build and run the app from Xcode on a physical iOS device.
