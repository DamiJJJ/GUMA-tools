// js/guma-audio.js
// ── GUMA audio (easter-egg sounds) ────────────────────────────
// Standalone, vanilla, no imports. Exposes window.GumaAudio.
// Every easter-egg sound is synthesised with Web Audio, so the repo
// ships no audio files and it all works offline on GitHub Pages. The
// sounds themselves live with their eggs; this file holds what they
// share: one AudioContext per page, play() to run a sound on a bus of
// its own (so it can be cut short - the Evidence Locker stops an
// exhibit's sound when the pointer leaves it) and the building blocks
// the sounds are made of.
// Loads before every egg module (right before js/guma-profile.js, or
// js/stamp-press.js where that comes first).

"use strict";

window.GumaAudio = (function () {
  // ── Config ───────────────────────────────────────────────────
  const LEAD_S = 0.005; // scheduling headroom before the first note
  const STOP_FADE_S = 0.08; // stop() fades out instead of clicking
  // A context still waking up (Safari, first sound) plays the sound as
  // soon as it runs - unless that takes long enough for the sound to
  // land out of step with its picture.
  const LATE_MS = 250;

  let _ctx = null;
  let _noise = null;

  // ── Context ──────────────────────────────────────────────────
  /** The shared context, or null (no Web Audio, or no gesture yet). */
  function context() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    // Before any click or key press the browser would refuse to start it
    // (and say so in the console); there is nothing to hear yet anyway.
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    if (!_ctx) {
      try {
        _ctx = new Ctx();
      } catch (err) {
        return null;
      }
    }
    return _ctx;
  }

  /**
   * Wakes the audio device ahead of a sound. Call it from a click or key
   * press: that is the gesture Safari wants before it lets audio start.
   */
  function warm() {
    const ctx = context();
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  }

  /**
   * Plays one sound on a bus of its own.
   * @param {(ctx: AudioContext, out: AudioNode, t: number) => void} build
   *   schedules the sound into `out`, starting at context time t
   * @param {{late?: number}} [opts] ms a waking context may take before
   *   the sound is dropped (Infinity: always play, the sound catches up)
   * @returns {{stop: (fade?: number) => void}} stop() fades the sound
   *   out; safe before it has started and after it has ended
   */
  function play(build, { late = LATE_MS } = {}) {
    let bus = null;
    let stopped = false;
    const handle = {
      stop(fade = STOP_FADE_S) {
        if (stopped) return;
        stopped = true;
        if (!bus) return;
        const t = bus.context.currentTime;
        bus.gain.cancelScheduledValues(t);
        bus.gain.setValueAtTime(bus.gain.value, t);
        bus.gain.linearRampToValueAtTime(0, t + fade);
        const done = bus;
        setTimeout(() => done.disconnect(), fade * 1000 + 50);
      },
    };

    const ctx = context();
    if (!ctx) return handle;
    const start = () => {
      if (stopped) return;
      bus = ctx.createGain();
      bus.connect(ctx.destination);
      build(ctx, bus, ctx.currentTime + LEAD_S);
    };
    if (ctx.state === "running") {
      start();
    } else {
      const asked = performance.now();
      ctx
        .resume()
        .then(() => {
          if (performance.now() - asked < late) start();
        })
        .catch(() => {});
    }
    return handle;
  }

  // ── Building blocks ──────────────────────────────────────────
  /** Gain with a fast attack and an exponential tail, starting at t. */
  function envelope(ctx, t, peak, attack, release) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    return g;
  }

  function filter(ctx, type, freq, q = 0.7) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  /** Looping white noise; one second of it, shared by every sound. */
  function noise(ctx) {
    if (!_noise || _noise.sampleRate !== ctx.sampleRate) {
      _noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = _noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = _noise;
    src.loop = true;
    return src;
  }

  /** WaveShaper curve for a soft clipper: tanh, normalised to +-1. */
  function softClip(drive) {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    return curve;
  }

  /**
   * One enveloped tone at t, gliding from `from` to `to` Hz over `glide` s.
   * @param {AudioNode} out destination
   */
  function tone(ctx, out, t, { type = "sine", from, to = from, glide, peak, attack = 0.004, release }) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + (glide ?? attack + release));
    const env = envelope(ctx, t, peak, attack, release);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + attack + release + 0.02);
  }

  /** One enveloped burst of noise at t, through a single filter. */
  function burst(ctx, out, t, { type, freq, q, peak, attack = 0.001, release }) {
    const src = noise(ctx);
    const band = filter(ctx, type, freq, q);
    const env = envelope(ctx, t, peak, attack, release);
    src.connect(band);
    band.connect(env);
    env.connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + attack + release + 0.02);
  }

  return { context, warm, play, envelope, filter, noise, softClip, tone, burst };
})();
