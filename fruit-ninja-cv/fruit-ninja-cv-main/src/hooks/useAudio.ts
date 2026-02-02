/**
 * Audio system for Fruit Ninja
 * Uses Web Audio API with enhanced synthesis for satisfying game sounds
 */

import { useRef, useCallback, useEffect, useState } from 'react';

type SoundType = 'slice' | 'bomb' | 'splat' | 'miss' | 'combo' | 'gameOver';

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Helper to create noise buffer for realistic textures
  const createNoiseBuffer = useCallback((duration: number): AudioBuffer | null => {
    const ctx = audioContextRef.current;
    if (!ctx) return null;
    
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }, []);

  // Sharp blade slice sound - satisfying "shing"
  const playSlice = useCallback(() => {
    if (!isEnabledRef.current) return;
    const ctx = initAudio();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    const now = ctx.currentTime;
    const pitchVar = 0.9 + Math.random() * 0.2;

    // High-frequency metallic swoosh
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(2000 * pitchVar, now);
    osc1.frequency.exponentialRampToValueAtTime(800 * pitchVar, now + 0.08);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // High sine "ting" 
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3500 * pitchVar, now);
    osc2.frequency.exponentialRampToValueAtTime(2000 * pitchVar, now + 0.05);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.08);

    // White noise whoosh
    const noiseBuffer = createNoiseBuffer(0.15);
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      noise.buffer = noiseBuffer;
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.connect(filter).connect(noiseGain).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.15);
    }
  }, [initAudio, createNoiseBuffer]);

  // Deep, punchy bomb explosion
  const playBomb = useCallback(() => {
    if (!isEnabledRef.current) return;
    const ctx = initAudio();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    const now = ctx.currentTime;

    // Deep boom
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Mid crackle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(300, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.35);

    // Noise burst for explosion texture
    const noiseBuffer = createNoiseBuffer(0.4);
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4000, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      noise.buffer = noiseBuffer;
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      noise.connect(filter).connect(noiseGain).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.4);
    }
  }, [initAudio, createNoiseBuffer]);

  // Juicy splat sound
  const playSplat = useCallback(() => {
    if (!isEnabledRef.current) return;
    const ctx = initAudio();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    const now = ctx.currentTime;
    const pitchVar = 0.85 + Math.random() * 0.3;

    // Low wet thump
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(250 * pitchVar, now);
    osc1.frequency.exponentialRampToValueAtTime(80 * pitchVar, now + 0.15);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Splatter noise
    const noiseBuffer = createNoiseBuffer(0.2);
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      filter.Q.value = 2;
      noise.buffer = noiseBuffer;
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      noise.connect(filter).connect(noiseGain).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.2);
    }
  }, [initAudio, createNoiseBuffer]);

  // Soft thud for missed fruit
  const playMiss = useCallback(() => {
    if (!isEnabledRef.current) return;
    const ctx = initAudio();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    const now = ctx.currentTime;

    // Dull thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }, [initAudio]);

  // Rising chime for combos
  const playCombo = useCallback(() => {
    if (!isEnabledRef.current) return;
    const ctx = initAudio();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    const now = ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5 - major chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.06;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }, [initAudio]);

  // Sad descending tone for game over
  const playGameOver = useCallback(() => {
    if (!isEnabledRef.current) return;
    const ctx = initAudio();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    const now = ctx.currentTime;
    const notes = [440, 392, 349, 294]; // A4, G4, F4, D4

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + i * 0.25;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }, [initAudio]);

  // Toggle audio on/off
  const toggleAudio = useCallback(() => {
    isEnabledRef.current = !isEnabledRef.current;
    setIsAudioEnabled(isEnabledRef.current);
    return isEnabledRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSlice,
    playBomb,
    playSplat,
    playMiss,
    playCombo,
    playGameOver,
    toggleAudio,
    initAudio,
    isAudioEnabled,
  };
}
