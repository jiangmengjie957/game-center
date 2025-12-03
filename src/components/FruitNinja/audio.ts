export class AudioManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
  
    constructor() {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Reduce overall volume
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
  
    resume() {
      if (this.ctx?.state === 'suspended') {
        this.ctx.resume();
      }
    }
  
    playSlice() {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
  
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
  
      osc.connect(gain);
      gain.connect(this.masterGain);
  
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }
  
    playSplat() {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      // Low thud
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.2);
  
      gain.gain.setValueAtTime(1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
  
      osc.connect(gain);
      gain.connect(this.masterGain);
  
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }
  
    playBomb() {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      osc.type = 'square';
      osc.frequency.setValueAtTime(50, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.5);
  
      gain.gain.setValueAtTime(1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
  
      osc.connect(gain);
      gain.connect(this.masterGain);
  
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    }
  
    playStart() {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.5);
  
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
  
      osc.connect(gain);
      gain.connect(this.masterGain);
  
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    }
  }
  
  export const audioManager = new AudioManager();