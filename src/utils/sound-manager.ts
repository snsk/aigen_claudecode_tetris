/**
 * Sound manager for game audio effects
 * Uses Web Audio API to generate synthetic sounds
 */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  constructor() {
    this.initAudioContext();
  }

  /**
   * Initialize audio context
   */
  private initAudioContext(): void {
    try {
      // Check if we're in a test environment or browser environment
      if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) {
        this.enabled = false;
        return;
      }
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  /**
   * Resume audio context if suspended (required by browser policies)
   */
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Create and play a synthetic sound with multiple components
   */
  private async playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.35
  ): Promise<void> {
    if (!this.enabled || !this.audioContext) return;

    try {
      await this.resumeAudioContext();

      // Create multiple oscillators for warm, pleasing sound
      const mainOsc = this.audioContext.createOscillator();
      const subOsc = this.audioContext.createOscillator();
      const harmonicOsc = this.audioContext.createOscillator();
      const warmthOsc = this.audioContext.createOscillator();
      
      const mainGain = this.audioContext.createGain();
      const subGain = this.audioContext.createGain();
      const harmonicGain = this.audioContext.createGain();
      const warmthGain = this.audioContext.createGain();
      const masterGain = this.audioContext.createGain();
      
      // Create filters for warm, pleasant tone
      const lowPassFilter = this.audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = frequency * 4;
      lowPassFilter.Q.value = 1.5; // Gentler filtering

      const warmthFilter = this.audioContext.createBiquadFilter();
      warmthFilter.type = 'peaking';
      warmthFilter.frequency.value = frequency * 0.5;
      warmthFilter.Q.value = 2;
      warmthFilter.gain.value = 3; // Boost low-mid frequencies for warmth

      // Connect the audio graph
      mainOsc.connect(mainGain);
      subOsc.connect(subGain);
      harmonicOsc.connect(harmonicGain);
      warmthOsc.connect(warmthGain);
      
      mainGain.connect(lowPassFilter);
      subGain.connect(warmthFilter);
      harmonicGain.connect(lowPassFilter);
      warmthGain.connect(warmthFilter);
      
      lowPassFilter.connect(masterGain);
      warmthFilter.connect(masterGain);
      masterGain.connect(this.audioContext.destination);

      // Configure oscillators for pleasing sound
      mainOsc.type = type;
      mainOsc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime); // Perfect fifth below
      
      harmonicOsc.type = 'triangle';
      harmonicOsc.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime); // Perfect fifth above
      
      warmthOsc.type = 'triangle';
      warmthOsc.frequency.setValueAtTime(frequency * 0.25, this.audioContext.currentTime); // Sub bass for warmth

      // Set gain levels for pleasant sound
      const currentTime = this.audioContext.currentTime;
      const attackTime = 0.01; // Gentle attack
      const decayTime = duration * 0.3;
      const sustainLevel = volume * 0.7;

      // Main oscillator (primary tone)
      mainGain.gain.setValueAtTime(0, currentTime);
      mainGain.gain.linearRampToValueAtTime(volume * 0.8, currentTime + attackTime);
      mainGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + decayTime);
      mainGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Sub oscillator (adds body)
      subGain.gain.setValueAtTime(0, currentTime);
      subGain.gain.linearRampToValueAtTime(volume * 0.4, currentTime + attackTime);
      subGain.gain.exponentialRampToValueAtTime(sustainLevel * 0.4, currentTime + decayTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Harmonic oscillator (adds sparkle)
      harmonicGain.gain.setValueAtTime(0, currentTime);
      harmonicGain.gain.linearRampToValueAtTime(volume * 0.15, currentTime + attackTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + attackTime + 0.05);

      // Warmth oscillator (adds depth)
      warmthGain.gain.setValueAtTime(0, currentTime);
      warmthGain.gain.linearRampToValueAtTime(volume * 0.2, currentTime + attackTime * 2);
      warmthGain.gain.exponentialRampToValueAtTime(sustainLevel * 0.2, currentTime + decayTime);
      warmthGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      mainOsc.start(currentTime);
      subOsc.start(currentTime);
      harmonicOsc.start(currentTime);
      warmthOsc.start(currentTime);
      
      mainOsc.stop(currentTime + duration);
      subOsc.stop(currentTime + duration);
      harmonicOsc.stop(currentTime + duration);
      warmthOsc.stop(currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  /**
   * Play multiple tones in sequence
   */
  private async playSequence(
    notes: Array<{ frequency: number; duration: number; type?: OscillatorType; volume?: number; delay?: number }>
  ): Promise<void> {
    if (!this.enabled || !this.audioContext) return;

    let currentTime = 0;
    for (const note of notes) {
      if (note.delay) {
        await new Promise(resolve => setTimeout(resolve, note.delay));
      }
      setTimeout(() => {
        this.playTone(note.frequency, note.duration, note.type, note.volume);
      }, currentTime);
      currentTime += (note.duration * 1000) / 2; // Overlap notes slightly
    }
  }

  /**
   * Play line clear sound effect
   */
  async playLineClear(lineCount: number): Promise<void> {
    if (!this.enabled) return;

    switch (lineCount) {
      case 1:
        // Single line - warm, satisfying chime
        await this.playTone(587, 0.18, 'sine', 0.4); // D5
        break;
      
      case 2:
        // Double line - pleasant ascending harmony
        await this.playSequence([
          { frequency: 523, duration: 0.12, type: 'sine', volume: 0.35 }, // C5
          { frequency: 659, duration: 0.16, type: 'sine', volume: 0.4, delay: 20 } // E5
        ]);
        break;
      
      case 3:
        // Triple line - beautiful ascending triad
        await this.playSequence([
          { frequency: 523, duration: 0.1, type: 'sine', volume: 0.35 }, // C5
          { frequency: 659, duration: 0.1, type: 'sine', volume: 0.37, delay: 20 }, // E5
          { frequency: 784, duration: 0.18, type: 'sine', volume: 0.42, delay: 20 } // G5
        ]);
        break;
      
      case 4:
        // Tetris - majestic, celebratory cascade
        await this.playSequence([
          { frequency: 523, duration: 0.12, type: 'sine', volume: 0.4 }, // C5
          { frequency: 659, duration: 0.12, type: 'sine', volume: 0.42, delay: 25 }, // E5
          { frequency: 784, duration: 0.12, type: 'sine', volume: 0.44, delay: 25 }, // G5
          { frequency: 1047, duration: 0.15, type: 'sine', volume: 0.48, delay: 25 }, // C6
          { frequency: 1319, duration: 0.2, type: 'sine', volume: 0.45, delay: 60 } // E6
        ]);
        break;
      
      default:
        // Fallback for any other line count
        await this.playTone(587, 0.18, 'sine', 0.4);
        break;
    }
  }

  /**
   * Play piece lock sound
   */
  async playPieceLock(): Promise<void> {
    await this.playTone(440, 0.1, 'sine', 0.3); // A4 - pleasant lock sound
  }

  /**
   * Play piece move sound
   */
  async playPieceMove(): Promise<void> {
    await this.playTone(294, 0.06, 'triangle', 0.15); // D4 - soft movement
  }

  /**
   * Play piece rotate sound
   */
  async playPieceRotate(): Promise<void> {
    await this.playTone(370, 0.08, 'sine', 0.2); // F#4 - gentle rotation
  }

  /**
   * Play hold sound
   */
  async playHold(): Promise<void> {
    await this.playSequence([
      { frequency: 554, duration: 0.04, type: 'square', volume: 0.2 },
      { frequency: 698, duration: 0.06, type: 'square', volume: 0.22, delay: 25 }
    ]);
  }

  /**
   * Play game over sound
   */
  async playGameOver(): Promise<void> {
    await this.playSequence([
      { frequency: 330, duration: 0.2, type: 'sawtooth', volume: 0.2 },
      { frequency: 277, duration: 0.2, type: 'sawtooth', volume: 0.2, delay: 100 },
      { frequency: 220, duration: 0.4, type: 'sawtooth', volume: 0.25, delay: 100 }
    ]);
  }

  /**
   * Play level up sound
   */
  async playLevelUp(): Promise<void> {
    await this.playSequence([
      { frequency: 523, duration: 0.1, type: 'sine', volume: 0.2 }, // C
      { frequency: 659, duration: 0.1, type: 'sine', volume: 0.2, delay: 50 }, // E
      { frequency: 784, duration: 0.15, type: 'sine', volume: 0.25, delay: 50 } // G
    ]);
  }

  /**
   * Enable/disable sound
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.audioContext !== null;
  }

  /**
   * Cleanup audio context
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}