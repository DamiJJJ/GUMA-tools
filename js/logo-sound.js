"use strict";

// Sounds of the logo click eggs (gumaWireLogoEgg() in js/components.js),
// each in step with its animation in js/tailwind-config.js:
//
//   band   header logo, guma-logo-band (1.25 s): the rubber creaks as the
//          wordmark is pulled, snaps as it is let go and twangs while it
//          wobbles out. Also the "Guma LEA" exhibit in the Evidence Locker,
//          whose hover replays the same animation.
//   stamp  About logo, guma-logo-stamp (0.9 s): the rubber-stamp thud of
//          js/stamp-press.js, as the shield bottoms out.
//
// Synthesised on the shared context of js/guma-audio.js, like every egg
// sound. Exposes window.GumaLogoSound.

window.GumaLogoSound = (function () {
  // ── Config ──────────────────────────────────────────────────────────
  // Timeline of guma-logo-band, in seconds: pulled until 24%, snapped
  // back by 33%, then a wobble every 24% (stretch peaks at 45%, 69%...)
  // that has died out by the end.
  const BAND_S = 1.25;
  const PULL_S = 0.24 * BAND_S;
  const SNAP_S = 0.33 * BAND_S;
  const WOBBLE_S = 0.24 * BAND_S;
  const FIRST_PEAK_S = 0.45 * BAND_S;
  const BAND_GAIN = 0.8;
  // guma-logo-stamp: the shield is pressed furthest down at 18%.
  const STAMP_PRESS_S = 0.18 * 0.9;

  // ── Rubber band ─────────────────────────────────────────────────────
  function buildBand(ctx, out, t) {
    const { filter, burst, tone } = window.GumaAudio;
    const master = ctx.createGain();
    master.gain.value = BAND_GAIN;
    master.connect(out);

    // Pull: stick-slip creak. A slow sawtooth is a train of tiny catches;
    // a resonant band-pass turns them into the squeak of stretched rubber,
    // both climbing with the tension.
    const creak = ctx.createOscillator();
    creak.type = "sawtooth";
    creak.frequency.setValueAtTime(38, t);
    creak.frequency.exponentialRampToValueAtTime(95, t + PULL_S);
    const creakTone = filter(ctx, "bandpass", 500, 5);
    creakTone.frequency.setValueAtTime(500, t);
    creakTone.frequency.exponentialRampToValueAtTime(1500, t + PULL_S);
    const creakEnv = ctx.createGain();
    creakEnv.gain.setValueAtTime(0.0001, t);
    creakEnv.gain.exponentialRampToValueAtTime(0.5, t + PULL_S * 0.8);
    creakEnv.gain.exponentialRampToValueAtTime(0.0001, t + PULL_S + 0.02);
    creak.connect(creakTone);
    creakTone.connect(creakEnv);
    creakEnv.connect(master);
    creak.start(t);
    creak.stop(t + PULL_S + 0.05);

    // Let go: the slap of the band flying back, and a quick falling zip.
    const snap = t + PULL_S;
    burst(ctx, master, snap, { type: "bandpass", freq: 2200, q: 1.2, peak: 0.9, release: 0.04 });
    tone(ctx, master, snap, { type: "triangle", from: 900, to: 140, glide: 0.07, peak: 0.6, release: 0.09 });

    // Twang: a low string tone through a resonant low-pass. One slow LFO,
    // phased so it peaks with every stretch of the wordmark, sweeps the
    // filter (the "wah") and bends the pitch; both die out with the wobble.
    const end = t + BAND_S;
    const twangAt = t + SNAP_S - 0.06;
    const twang = ctx.createOscillator();
    twang.type = "sawtooth";
    twang.frequency.value = 98;
    const wah = filter(ctx, "lowpass", 700, 8);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, twangAt);
    env.gain.exponentialRampToValueAtTime(0.55, twangAt + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    twang.connect(wah);
    wah.connect(env);
    env.connect(master);

    const wobble = ctx.createOscillator();
    wobble.frequency.value = 1 / WOBBLE_S;
    const sweep = ctx.createGain();
    sweep.gain.setValueAtTime(500, twangAt);
    sweep.gain.exponentialRampToValueAtTime(30, end);
    const bend = ctx.createGain();
    bend.gain.setValueAtTime(14, twangAt);
    bend.gain.exponentialRampToValueAtTime(1, end);
    wobble.connect(sweep);
    sweep.connect(wah.frequency);
    wobble.connect(bend);
    bend.connect(twang.frequency);

    twang.start(twangAt);
    twang.stop(end + 0.02);
    // A sine peaks a quarter period in: started a quarter (and one whole)
    // period before the first stretch, it peaks with it and every one
    // after it, and is already running when the twang starts.
    const wobbleAt = t + FIRST_PEAK_S - WOBBLE_S / 4 - WOBBLE_S;
    wobble.start(wobbleAt);
    wobble.stop(end + 0.02);
  }

  // ── Public API ──────────────────────────────────────────────────────
  /** @returns {{stop: Function} | null} GumaAudio.play() handle */
  function band() {
    return window.GumaAudio?.play(buildBand) || null;
  }

  /** @returns {{stop: Function} | null} GumaAudio.play() handle */
  function stamp() {
    return window.GumaStampPress?.thud(STAMP_PRESS_S) || null;
  }

  return { band, stamp };
})();
