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
// Synthesised like the other eggs, on the shared context and building
// blocks of js/guma-audio.js (loaded before this file). The whole track is
// scheduled up front on the Web Audio clock, from the same phase list the
// animation runs on, so it cannot drift from the picture.
//
// A fresh AudioContext needs a moment to bring the audio device up, and a
// track scheduled on it meanwhile comes out late. So the context is woken
// on the first tap on the battery (warm()), and is already running by the
// fifth. Should it still be waking up (Safari), the track joins the picture
// where it is by then, skipping the cues that are already behind.

(function () {
  const { filter, noise, tone, burst } = window.GumaAudio;

  const MASTER_GAIN = 0.7;
  // How far behind its phase start a cue may be and still play.
  const CUE_SLACK_S = 0.05;

  // Battery levels (fractions of the start charge) the drain chirps at.
  // The render eases the drain in (level = 1 - p²), so the chirps bunch up
  // towards the end by themselves.
  const CHIRP_LEVELS = [0.75, 0.5, 0.25, 0.05];
  const CHIRP_HZ = [1760, 1480, 1245, 1047];

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
   * Schedules the track into `bus` so that each cue lands with its phase
   * on screen.
   * @param {number} startedAt performance.now() when the animation began
   */
  function schedule(ctx, bus, phases, blink, startedAt) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    comp.connect(bus);
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
   * Plays the outage soundtrack in step with the animation.
   * @param {Array<[string, number]>} phases [name, ms] in play order
   * @param {number} blinkMs how long the dead battery stays on (and off)
   * @param {number} [startedAt] performance.now() when the animation began
   * @returns {{stop: Function}} GumaAudio.play() handle
   */
  function outage(phases, blinkMs, startedAt = performance.now()) {
    // A track that is late joins the picture where it is (schedule()), so
    // it plays however long the context takes to wake up.
    return window.GumaAudio.play((ctx, bus) => schedule(ctx, bus, phases, blinkMs / 1000, startedAt), { late: Infinity });
  }

  // ── Locker exhibit ─────────────────────────────────────────────────────
  // The "Usterka techniczna" exhibit in the Evidence Locker plays the
  // lens of its hover (guma-bcam-egg-dark in js/tailwind-config.js, 2 s)
  // the way failing electronics sound: no tones at all (a pitch sweep only
  // ever sounds like a spaceship), just thin, high-passed electrical noise.
  // Every flicker of the lens is a short "zzt" of arcing, chopped at mains
  // rate, and a relay clicks as the lens goes out and again as the power
  // comes back. No steady hiss in between: it only muddied the flickers.
  // The keyframes are that animation's opacity.
  const DIM_S = 2;
  const DIM_KEYS = [
    [0, 1],
    [0.06, 0.15],
    [0.1, 1],
    [0.15, 0.3],
    [0.18, 0.9],
    [0.23, 0.1],
    [0.26, 0.7],
    [0.42, 0],
    [0.72, 0],
    [0.75, 0.7],
    [0.78, 0.1],
    [0.84, 1],
  ];
  const DIM_OUT = 0.42; // the lens is out
  const DIM_ON = 0.72; // the power comes back
  const ZAP_MIN_STEP = 0.3; // an opacity jump at least this big zaps
  const ZAP_GAIN = 0.5;

  /** A "zzt": high-passed noise chopped at mains rate (2 x 60 Hz). */
  function zap(ctx, out, t, dur, peak) {
    const src = noise(ctx);
    const thin = filter(ctx, "highpass", 2500);
    const top = filter(ctx, "lowpass", 9000);
    const chop = ctx.createGain();
    chop.gain.value = 0.5;
    const mains = ctx.createOscillator();
    mains.type = "square";
    mains.frequency.value = 120;
    const depth = ctx.createGain();
    depth.gain.value = 0.5;
    mains.connect(depth);
    depth.connect(chop.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + 0.003);
    env.gain.setValueAtTime(peak, t + dur * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(thin);
    thin.connect(top);
    top.connect(chop);
    chop.connect(env);
    env.connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
    mains.start(t);
    mains.stop(t + dur + 0.02);
  }

  function buildDim(ctx, bus, t) {
    const out = ctx.createGain();
    out.gain.value = MASTER_GAIN;
    out.connect(bus);
    const at = (p) => t + p * DIM_S;
    const relay = (when) => burst(ctx, out, when, { type: "highpass", freq: 3000, peak: 0.35, release: 0.006 });

    // Zzt with every jump of the lens, as loud as the jump is big.
    DIM_KEYS.forEach(([p, level], i) => {
      if (!i) return;
      const [p0, level0] = DIM_KEYS[i - 1];
      const step = Math.abs(level - level0);
      if (step < ZAP_MIN_STEP || p - p0 > 0.1) return;
      zap(ctx, out, at(p0), Math.max(0.03, (p - p0) * DIM_S), step * ZAP_GAIN);
    });

    // The relay drops as the lens goes out, and pulls in as it comes back.
    relay(at(DIM_OUT));
    relay(at(DIM_ON));
  }

  /**
   * The lens going out and back on, for the locker exhibit.
   * @returns {{stop: Function}} GumaAudio.play() handle
   */
  function dim() {
    return window.GumaAudio.play(buildDim);
  }

  /**
   * Wakes the audio device ahead of the outage. Called on every tap on the
   * battery; the tap is the user gesture the browser wants for it.
   */
  function warm() {
    window.GumaAudio.warm();
  }

  window.BodycamSound = { warm, outage, dim };
})();
