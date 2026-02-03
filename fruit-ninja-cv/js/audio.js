/**
 * Audio Manager for Fruit Ninja CV
 * Handles all game sound effects using Web Audio API
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isMuted = false;
        this.isInitialized = false;
    }

    /**
     * Initialize the audio context (must be called after user interaction)
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Generate all sounds
            this.sounds = {
                slice1: this.createSliceSound(400),
                slice2: this.createSliceSound(450),
                slice3: this.createSliceSound(500),
                splat: this.createSplatSound(),
                bomb: this.createBombSound(),
                whoosh: this.createWhooshSound(),
                gameOver: this.createGameOverSound(),
                combo: this.createComboSound(),
                start: this.createStartSound()
            };

            this.isInitialized = true;
            console.log('Audio initialized successfully');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    /**
     * Create a slice sound (short, sharp)
     */
    createSliceSound(frequency) {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }

    /**
     * Create a splat sound (wet, impact)
     */
    createSplatSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            // Create noise for splat effect
            const bufferSize = this.audioContext.sampleRate * 0.2;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            
            const noise = this.audioContext.createBufferSource();
            const filter = this.audioContext.createBiquadFilter();
            const gainNode = this.audioContext.createGain();
            
            noise.buffer = buffer;
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            noise.start();
        };
    }

    /**
     * Create a bomb explosion sound
     */
    createBombSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            // Low rumble
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
            // Add noise burst
            const bufferSize = this.audioContext.sampleRate * 0.3;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
            }
            
            const noise = this.audioContext.createBufferSource();
            const noiseGain = this.audioContext.createGain();
            
            noise.buffer = buffer;
            noise.connect(noiseGain);
            noiseGain.connect(this.audioContext.destination);
            
            noiseGain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            noise.start();
        };
    }

    /**
     * Create a whoosh/throw sound
     */
    createWhooshSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const bufferSize = this.audioContext.sampleRate * 0.15;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                const t = i / bufferSize;
                output[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.3;
            }
            
            const noise = this.audioContext.createBufferSource();
            const filter = this.audioContext.createBiquadFilter();
            const gainNode = this.audioContext.createGain();
            
            noise.buffer = buffer;
            filter.type = 'bandpass';
            filter.frequency.value = 2000;
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            
            noise.start();
        };
    }

    /**
     * Create a game over sound
     */
    createGameOverSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const notes = [400, 350, 300, 250];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, i * 150);
            });
        };
    }

    /**
     * Create a combo sound (ascending)
     */
    createComboSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.15);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }

    /**
     * Create a start game sound
     */
    createStartSound() {
        return () => {
            if (!this.audioContext || this.isMuted) return;
            
            const notes = [300, 400, 500, 600];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                    
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.15);
                }, i * 80);
            });
        };
    }

    /**
     * Play a specific sound
     */
    play(soundName) {
        if (!this.isInitialized || this.isMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound();
        }
    }

    /**
     * Play a random slice sound
     */
    playSlice() {
        const sliceSounds = ['slice1', 'slice2', 'slice3'];
        const randomSound = sliceSounds[Math.floor(Math.random() * sliceSounds.length)];
        this.play(randomSound);
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * Set mute state
     */
    setMuted(muted) {
        this.isMuted = muted;
    }
}

// Create global audio manager instance
const audioManager = new AudioManager();
