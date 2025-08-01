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
    volume: number = 0.3
  ): Promise<void> {
    if (!this.enabled || !this.audioContext) return;

    try {
      await this.resumeAudioContext();

      // Create multiple oscillators for richer sound
      const mainOsc = this.audioContext.createOscillator();
      const subOsc = this.audioContext.createOscillator();
      const noiseOsc = this.audioContext.createOscillator();
      
      const mainGain = this.audioContext.createGain();
      const subGain = this.audioContext.createGain();
      const noiseGain = this.audioContext.createGain();
      const masterGain = this.audioContext.createGain();
      
      // Create a low-pass filter for warmth
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = frequency * 4;
      filter.Q.value = 2;

      // Connect the audio graph
      mainOsc.connect(mainGain);
      subOsc.connect(subGain);
      noiseOsc.connect(noiseGain);
      
      mainGain.connect(filter);
      subGain.connect(filter);
      noiseGain.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(this.audioContext.destination);

      // Configure oscillators
      mainOsc.type = type;
      mainOsc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime); // Sub harmonic
      
      noiseOsc.type = 'sawtooth';
      noiseOsc.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime); // Harmonic

      // Set gain levels
      const currentTime = this.audioContext.currentTime;
      const attackTime = 0.005;
      const decayTime = duration * 0.3;
      const sustainLevel = volume * 0.7;

      // Main oscillator (strongest)
      mainGain.gain.setValueAtTime(0, currentTime);
      mainGain.gain.linearRampToValueAtTime(volume, currentTime + attackTime);
      mainGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + decayTime);
      mainGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Sub oscillator (adds weight)
      subGain.gain.setValueAtTime(0, currentTime);
      subGain.gain.linearRampToValueAtTime(volume * 0.3, currentTime + attackTime);
      subGain.gain.exponentialRampToValueAtTime(sustainLevel * 0.3, currentTime + decayTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Noise oscillator (adds brightness)
      noiseGain.gain.setValueAtTime(0, currentTime);
      noiseGain.gain.linearRampToValueAtTime(volume * 0.1, currentTime + attackTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + attackTime + 0.02);

      // Master gain envelope
      masterGain.gain.setValueAtTime(1, currentTime);

      mainOsc.start(currentTime);
      subOsc.start(currentTime);
      noiseOsc.start(currentTime);
      
      mainOsc.stop(currentTime + duration);
      subOsc.stop(currentTime + duration);
      noiseOsc.stop(currentTime + duration);
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
        // Single line - crisp, satisfying pop
        await this.playTone(660, 0.12, 'square', 0.35);
        break;
      
      case 2:
        // Double line - ascending power chord
        await this.playSequence([
          { frequency: 523, duration: 0.08, type: 'square', volume: 0.3 }, // C
          { frequency: 698, duration: 0.12, type: 'square', volume: 0.35, delay: 40 } // F
        ]);
        break;
      
      case 3:
        // Triple line - ascending triad
        await this.playSequence([
          { frequency: 523, duration: 0.06, type: 'square', volume: 0.3 }, // C
          { frequency: 659, duration: 0.06, type: 'square', volume: 0.32, delay: 30 }, // E
          { frequency: 784, duration: 0.14, type: 'square', volume: 0.38, delay: 30 } // G
        ]);
        break;
      
      case 4:
        // Tetris - triumphant fanfare
        await this.playSequence([
          { frequency: 523, duration: 0.08, type: 'sawtooth', volume: 0.4 }, // C
          { frequency: 659, duration: 0.08, type: 'sawtooth', volume: 0.42, delay: 35 }, // E
          { frequency: 784, duration: 0.08, type: 'sawtooth', volume: 0.44, delay: 35 }, // G
          { frequency: 1047, duration: 0.16, type: 'sawtooth', volume: 0.5, delay: 35 }, // C (high)
          { frequency: 1319, duration: 0.2, type: 'sawtooth', volume: 0.45, delay: 80 } // E (high)
        ]);
        break;
      
      default:
        // Fallback for any other line count
        await this.playTone(660, 0.12, 'square', 0.35);
        break;
    }
  }

  /**
   * Play piece lock sound
   */
  async playPieceLock(): Promise<void> {
    await this.playTone(330, 0.06, 'square', 0.25);
  }

  /**
   * Play piece move sound
   */
  async playPieceMove(): Promise<void> {
    await this.playTone(200, 0.04, 'triangle', 0.12);
  }

  /**
   * Play piece rotate sound
   */
  async playPieceRotate(): Promise<void> {
    await this.playTone(440, 0.05, 'square', 0.18);
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