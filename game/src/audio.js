// audio.js — every sound is synthesized with WebAudio: no audio files, no
// network, nothing to load. A soft blip for footsteps, a chime for loot, a
// rising two-tone for the alarm, a low sting for getting caught.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  step(sneaking) {
    const now = performance.now();
    if (now - this.lastStep < (sneaking ? 320 : 210)) return;
    this.lastStep = now;
    this.tone(140 + Math.random() * 40, 0.05, 'sine', sneaking ? 0.02 : 0.045);
  }

  coin() {
    this.tone(1900, 0.09, 'triangle', 0.08, 0, 2400);
  }

  smoke() {
    this.tone(320, 0.35, 'sawtooth', 0.04, 0, 90);
  }

  emp() {
    this.tone(880, 0.25, 'square', 0.05, 0, 110);
    this.tone(440, 0.3, 'square', 0.04, 0.08, 55);
  }

  pickup() {
    this.tone(660, 0.1, 'triangle', 0.09);
    this.tone(990, 0.16, 'triangle', 0.09, 0.08);
  }

  sapphire() {
    this.tone(523, 0.12, 'triangle', 0.1);
    this.tone(659, 0.12, 'triangle', 0.1, 0.1);
    this.tone(784, 0.2, 'triangle', 0.1, 0.2);
    this.tone(1046, 0.3, 'triangle', 0.09, 0.3);
  }

  alarmTick() {
    this.tone(1175, 0.09, 'square', 0.035);
    this.tone(880, 0.09, 'square', 0.035, 0.12);
  }

  caught() {
    this.tone(220, 0.5, 'sawtooth', 0.09, 0, 110);
    this.tone(165, 0.7, 'sawtooth', 0.08, 0.25, 82);
  }

  win() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', 0.09, i * 0.11));
  }
}
