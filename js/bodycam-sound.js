"use strict";

// ── Outage soundtrack ────────────────────────────────────────────────────
// The sound of the bodycam outage easter egg (js/bodycam-render.js), one
// cue per phase of the animation:
//
//   drain  low-battery chirps, falling in pitch and coming faster as the
//          charge plummets, over a whine sagging with it
//   die    a relay click, then the old-CRT power-off: a falling zap, the
//          thump of the collapsing picture and a crackle of static charge
//   dark   mains hum, and a dead-battery pip every time the icon blinks
//   wake   a power-on thunk and a burst of TV static that clears with the
//          snow on screen
//
// Synthesised like the other eggs (js/easter-egg.js, js/stamp-press.js), so
// the repo ships no audio files. The whole track is scheduled up front on
// the Web Audio clock, from the same phase list the animation runs on, so
// it cannot drift from the picture.
//
// A fresh AudioContext needs a moment to bring the audio device up, and a
// track scheduled on it meanwhile comes out late. So the context is woken
// on the first tap on the battery (warm()), and is already running by the
// fifth. Should it still be waking up (Safari), the track joins the picture
// where it is by then, skipping the cues that are already behind.

(function () {
  const MASTER_GAIN = 0.7;
  // How far behind its phase start a cue may be and still play.
  const CUE_SLACK_S = 0.05;

  // Battery levels (fractions of the start charge) the drain chirps at.
  // The render eases the drain in (level = 1 - p²), so the chirps bunch up
  // towards the end by themselves.
  const CHIRP_LEVELS = [0.75, 0.5, 0.25, 0.05];
  const CHIRP_HZ = [1760, 1480, 1245, 1047];

  let audio = null;
  let noiseBuffer = null;

  function audioCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    // Before any click or key press the browser would refuse to start it
    // (and say so in the console); there is nothing to hear yet anyway.
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    if (!audio) {
      try {
        audio = new Ctx();
      } catch (err) {
        return null;
      }
    }
    return audio;
  }

  // ── Building blocks ────────────────────────────────────────────────────
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

  /** Looping white noise; one second of it, shared by every cue. */
  function noise(ctx) {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    return src;
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

  // ── Cues ───────────────────────────────────────────────────────────────
  // Each cue gets the context, the master bus, the start of its phase and
  // the phase length in seconds. A phase cut to zero for reduced motion
  // still gets its click or thunk: the picture cuts instead of animating,
  // and a cut wants a sound too.

  /** The charge plummets: piezo chirps over a sagging whine. */
  function drain(ctx, out, t, d) {
    const whine = ctx.createOscillator();
    whine.type = "triangle";
    whine.frequency.setValueAtTime(520, t);
    whine.frequency.exponentialRampToValueAtTime(70, t + d);
    const whineEnv = ctx.createGain();
    whineEnv.gain.setValueAtTime(0.0001, t);
    whineEnv.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    whineEnv.gain.exponentialRampToValueAtTime(0.0001, t + d);
    whine.connect(whineEnv);
    whineEnv.connect(out);
    whine.start(t);
    whine.stop(t + d + 0.02);

    // A piezo is a square wave; the low-pass keeps it from shrieking.
    const piezo = filter(ctx, "lowpass", 3500);
    piezo.connect(out);
    CHIRP_LEVELS.forEach((level, i) => {
      const at = t + d * Math.sqrt(1 - level);
      tone(ctx, piezo, at, { type: "square", from: CHIRP_HZ[i], peak: 0.22, release: 0.07 });
    });
  }

  /** Old-CRT power-off: click, falling zap, thump, crackle. */
  function die(ctx, out, t, d) {
    // The relay dropping out - the cut itself.
    burst(ctx, out, t, { type: "highpass", freq: 2500, peak: 0.5, release: 0.025 });
    // The picture collapsing: a low thump.
    tone(ctx, out, t, { from: 110, to: 38, glide: 0.3, peak: 0.7, release: 0.35 });
    if (d <= 0) return;

    // The flyback letting go: a bright zap falling with the white line.
    tone(ctx, out, t + 0.01, { type: "triangle", from: 3200, to: 90, glide: d * 0.9, peak: 0.22, release: d });
    // Static charge bleeding off the tube: a few random ticks.
    for (let i = 0; i < 7; i++) {
      const at = t + 0.03 + Math.random() * d;
      burst(ctx, out, at, { type: "highpass", freq: 4000, peak: 0.12 + Math.random() * 0.15, release: 0.008 });
    }
  }

  /** Dead air: mains hum, and a pip with every blink of the battery. */
  function dark(ctx, out, t, d, blink) {
    // 60 Hz (US mains) as a sawtooth: the buzz is in its harmonics, which
    // laptop speakers can actually play.
    const hum = ctx.createOscillator();
    hum.type = "sawtooth";
    hum.frequency.value = 60;
    const humTone = filter(ctx, "lowpass", 320);
    const humEnv = ctx.createGain();
    humEnv.gain.setValueAtTime(0.0001, t);
    humEnv.gain.exponentialRampToValueAtTime(0.07, t + 0.3);
    humEnv.gain.setValueAtTime(0.07, t + Math.max(0.3, d - 0.15));
    humEnv.gain.exponentialRampToValueAtTime(0.0001, t + d);
    hum.connect(humTone);
    humTone.connect(humEnv);
    humEnv.connect(out);
    hum.start(t);
    hum.stop(t + d + 0.02);

    // The icon is on for one blink, off for the next.
    const piezo = filter(ctx, "lowpass", 3000);
    piezo.connect(out);
    for (let at = 0; at < d - 0.2; at += 2 * blink) {
      tone(ctx, piezo, t + at, { type: "square", from: 880, peak: 0.1, release: 0.06 });
      tone(ctx, piezo, t + at + 0.09, { type: "square", from: 660, peak: 0.1, release: 0.08 });
    }
  }

  /** Back on air: a thunk, then static that fades out with the snow. */
  function wake(ctx, out, t, d) {
    tone(ctx, out, t, { from: 70, to: 45, glide: 0.2, peak: 0.5, release: 0.22 });
    if (d <= 0) return;

    // Held full while the snow is opaque, then gone with it (drawWakeUp
    // fades the snow out over the last 60% of the phase).
    const src = noise(ctx);
    const low = filter(ctx, "highpass", 400);
    const high = filter(ctx, "lowpass", 7000);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
    env.gain.setValueAtTime(0.32, t + d * 0.4);
    env.gain.linearRampToValueAtTime(0.0001, t + d);
    src.connect(low);
    low.connect(high);
    high.connect(env);
    env.connect(out);
    src.start(t);
    src.stop(t + d + 0.02);
  }

  const CUES = { drain, die, dark, wake };

  // ── Playback ───────────────────────────────────────────────────────────
  /**
   * Schedules the track so that each cue lands with its phase on screen.
   * @param {number} startedAt performance.now() when the animation began
   */
  function schedule(ctx, phases, blink, startedAt) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    const out = ctx.createGain();
    out.gain.value = MASTER_GAIN;
    out.connect(comp);

    const now = ctx.currentTime;
    let t = now + 0.01 - Math.max(0, performance.now() - startedAt) / 1000;
    for (const [name, ms] of phases) {
      if (t >= now - CUE_SLACK_S) CUES[name]?.(ctx, out, Math.max(t, now), ms / 1000, blink);
      t += ms / 1000;
    }
  }

  /**
   * Wakes the audio device ahead of the outage. Called on every tap on the
   * battery; the tap is the user gesture the browser wants for it.
   */
  function warm() {
    const ctx = audioCtx();
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  }

  /**
   * Plays the outage soundtrack in step with the animation.
   * @param {Array<[string, number]>} phases [name, ms] in play order
   * @param {number} blinkMs how long the dead battery stays on (and off)
   * @param {number} startedAt performance.now() when the animation began
   */
  function outage(phases, blinkMs, startedAt) {
    const ctx = audioCtx();
    if (!ctx) return;
    const play = () => schedule(ctx, phases, blinkMs / 1000, startedAt);
    if (ctx.state === "running") play();
    else ctx.resume().then(play).catch(() => {});
  }

  window.BodycamSound = { warm, outage };
})();
