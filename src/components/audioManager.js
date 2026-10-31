// Procedural Web Audio API sound synthesizer for tactile paper & origami interactions
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('thywill_muted') === 'true';
    this.initialized = false;
    this.lastRustleTime = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn("Web Audio not supported", e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('thywill_muted', this.isMuted);
    if (!this.isMuted) {
      this.playCrease(0.4);
    }
    return this.isMuted;
  }

  // Generate crisp paper crease / snap
  playCrease(intensity = 0.6) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.12;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Filtered crackle / crisp snap
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (this.ctx.sampleRate * 0.025));
      const white = (Math.random() * 2 - 1) * decay;
      data[i] = white + (Math.random() > 0.96 ? (Math.random() * 2 - 1) * 1.5 : 0);
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Highpass filter for crisp paper texture
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + duration);

    // Bandpass for paper resonance
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2400, now);
    bandpass.Q.setValueAtTime(3.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18 * intensity, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseNode.connect(filter);
    filter.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);
  }

  // Soft paper rustle / page glide
  playRustle(velocity = 1.0) {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastRustleTime < 110) return; // throttle
    this.lastRustleTime = nowMs;

    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.22;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastVal = 0;
    for (let i = 0; i < bufferSize; i++) {
      // Soft pink/brown noise for fibrous paper friction
      const white = Math.random() * 2 - 1;
      lastVal = (lastVal + (0.04 * white)) / 1.04;
      data[i] = lastVal * 3.5;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const centerFreq = 950 + Math.min(velocity * 600, 2000);
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    const peakGain = Math.min(0.08 * velocity, 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + duration);
  }

  // Subtle sacred chime on navigation jump or page landing
  playChime(pitch = 520) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.99, now + 1.2);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  // Divine celestial blast / shockwave surge on surrender
  playSacredBlast() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    try {
      // 1. Warm celestial sub-bass resonance swell
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(220, now + 1.2);
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.07, now + 0.3);
      subGain.gain.exponentialRampToValueAtTime(0.00001, now + 2.2);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 2.2);

      // 2. Harmonic sacred chime chord (528 Hz miracle note + 792 Hz + 1056 Hz angelic harmonics)
      const pitches = [528, 792, 1056];
      pitches.forEach((pitch, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now + 0.08 * idx);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.995, now + 2.6);
        gain.gain.setValueAtTime(0.0001, now + 0.08 * idx);
        gain.gain.linearRampToValueAtTime(0.05 / (idx + 1), now + 0.2 + 0.08 * idx);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + 0.08 * idx);
        osc.stop(now + 2.8);
      });

      // 3. Gentle celestial rush / breath of radiant light (swept filtered noise)
      const duration = 1.8;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.9);
      filter.frequency.exponentialRampToValueAtTime(600, now + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.065, now + 0.4);
      noiseGain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + duration);
    } catch (err) {
      console.warn("Sacred blast audio synthesis error:", err);
    }
  }
}

export const audioManager = new AudioManager();

