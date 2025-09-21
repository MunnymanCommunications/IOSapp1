import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface OrbProps {
  state: OrbState;
  audioLevel: number; // A value from 0 to 1. Note: May not be available with all audio libraries.
}

export const Orb: React.FC<OrbProps> = ({ state, audioLevel }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let rotationAnimation: Animated.CompositeAnimation | null = null;
    let pulseAnimation: Animated.CompositeAnimation | null = null;
    
    // Stop all animations before starting new ones
    rotationValue.stopAnimation();
    pulseValue.stopAnimation();
    
    // Reset values
    rotationValue.setValue(0);
    pulseValue.setValue(1);


    if (state === 'thinking') {
      rotationAnimation = Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();
    }
    
    if (state === 'idle' || state === 'speaking' || state === 'listening') {
      let duration = 2500;
      if (state === 'speaking') duration = 500;
      if (state === 'listening') duration = 1500;

      pulseAnimation = Animated.loop(
        Animated.sequence([
            Animated.timing(pulseValue, { toValue: 1.05, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(pulseValue, { toValue: 1, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      );
      pulseAnimation.start();
    } 

    return () => {
      rotationAnimation?.stop();
      pulseAnimation?.stop();
    };

  }, [state, rotationValue, pulseValue]);

  // Keep the spring animation for potential future use or for other interactive states.
  // Currently, it won't trigger as audioLevel is not updated.
  useEffect(() => {
    if (state === 'listening' && audioLevel > 0) {
      Animated.spring(scaleValue, {
        toValue: 1 + audioLevel * 0.5,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [audioLevel, state, scaleValue]);

  const spin = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { transform: [{ scale: pulseValue }] }]} />
      <Animated.View style={[styles.orb, { transform: [{ scale: scaleValue }] }]}>
        <Animated.View style={[styles.orbInner, { transform: [{ rotate: spin }] }]}/>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 125,
    backgroundColor: '#67E8F9', // Fallback color
    opacity: 0.4,
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: 125,
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orbInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8B5CF6', // Fallback color
    opacity: 0.8,
  },
});
