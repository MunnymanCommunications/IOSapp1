import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from 'react-native';
import { Orb } from './components/Orb';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { AssistantState } from './types';

const App: React.FC = () => {
  const {
    state,
    startConversation,
    stopConversation,
    userTranscript,
    aiResponse,
    audioLevel,
    error,
  } = useVoiceAssistant();

  const isConversationActive = state !== AssistantState.IDLE;

  const getOrbState = () => {
    switch (state) {
      case AssistantState.LISTENING:
        return 'listening';
      case AssistantState.THINKING:
        return 'thinking';
      case AssistantState.SPEAKING:
        return 'speaking';
      default:
        return 'idle';
    }
  };

  const getButtonText = () => {
    if (state === AssistantState.THINKING) return 'Connecting...';
    return isConversationActive ? 'Stop Session' : 'Start Session';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.grid}></View>

      <View style={styles.contentContainer}>
        <View style={styles.orbContainer}>
          <Orb state={getOrbState()} audioLevel={audioLevel} />
        </View>

        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptText}>
            <Text style={styles.transcriptLabel}>You: </Text>
            {userTranscript}
          </Text>
          <Text style={styles.transcriptText}>
            <Text style={styles.transcriptLabelOrb}>Orb: </Text>
            {aiResponse}
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={isConversationActive ? stopConversation : startConversation}
            disabled={state === AssistantState.THINKING}
            style={({ pressed }) => [
              styles.button,
              isConversationActive && state !== AssistantState.THINKING && styles.buttonStop,
              state === AssistantState.THINKING && styles.buttonDisabled,
              !isConversationActive && styles.buttonStart,
              pressed && { opacity: 0.8 },
            ]}>
            <Text style={styles.buttonText}>{getButtonText()}</Text>
          </Pressable>
          <Text style={styles.helperText}>
            {isConversationActive
              ? 'Click to end the live audio session.'
              : 'Click to start a live audio session.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-900
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    // Note: React Native doesn't have an easy equivalent for the grid background.
    // This could be implemented with a custom view or a library.
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptContainer: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)', // border-gray-700/50
    padding: 12,
    justifyContent: 'flex-start',
  },
  transcriptText: {
    fontSize: 16,
    color: '#E5E7EB', // text-gray-200
    marginBottom: 8,
  },
  transcriptLabel: {
    fontWeight: 'bold',
    color: '#67E8F9', // text-cyan-300
  },
  transcriptLabelOrb: {
    fontWeight: 'bold',
    color: '#C4B5FD', // text-purple-300
  },
  errorText: {
    color: '#EF4444', // text-red-500
    marginTop: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 9999,
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
        },
        android: {
            elevation: 5,
        },
    }),
  },
  buttonStart: {
    backgroundColor: '#67E8F9', // A fallback for gradient
  },
  buttonStop: {
    backgroundColor: '#DC2626', // bg-red-600
  },
  buttonDisabled: {
    backgroundColor: '#4B5563', // bg-gray-600
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  helperText: {
    marginTop: 12,
    color: '#9CA3AF', // text-gray-400
    fontSize: 12,
  },
});

export default App;
