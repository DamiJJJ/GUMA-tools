"use strict";

// Hidden "burnout" easter egg: clicking the trigger word a few times in a row
// dims the page and plays a tire-burning-rubber animation with a synthesised
// screech. Opt-in per page via [data-guma-egg] on the trigger element.

(function () {
  // ── Config ──────────────────────────────────────────────────────────
  const CLICKS_REQUIRED = 5;
  const CLICK_WINDOW_MS = 1500; // max gap between two counted clicks
  const SHOW_MS = 4200; // matches the guma-egg-drive animation
  const FADE_MS = 400;
  const SMOKE_STOP_MS = 3050; // when the tire launches off-screen
  const SOUND_SECONDS = 3.6;

  // Wheel speed follows the three beats of guma-egg-drive: rolling in, standing
  // still and screaming, then launching. In revolutions per second.
  const SPEED_DRIVE_IN = 1.15;
  const SPEED_BURNOUT = 2.4;
  const SPEED_LAUNCH = 3;
  const BURNOUT_AT_MS = 680; // 16% of the drive animation - tire has landed
  const LAUNCH_AT_MS = 3110; // 74% - tire takes off

  // Hand-picked puffs, offset in px from the contact patch, so the plume boils
  // out from under the tire instead of hanging around it as a cloud. Weighted
  // to the left, which is where the tread meets the ground in this view.
  const SMOKE_PUFFS = [
    { x: -18, y: -10, size: 115, delay: 0 },
    { x: 20, y: -2, size: 92, delay: 0.2 },
    { x: -62, y: -16, size: 100, delay: 0.38 },
    { x: 40, y: -18, size: 80, delay: 0.55 },
    { x: -36, y: 4, size: 125, delay: 0.75 },
    { x: 4, y: -26, size: 85, delay: 0.95 },
    { x: -88, y: -6, size: 108, delay: 1.15 },
    { x: 26, y: -12, size: 98, delay: 1.32 },
  ];

  let clicks = 0;
  let lastClickAt = 0;
  let active = null; // { overlay, audio, timers[] }

  // ── Sound ───────────────────────────────────────────────────────────
  // Synthesised rather than shipped as an audio asset: keeps the repo free of
  // binaries and the whole thing works offline on GitHub Pages.
  function playBurnout() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;

    let ctx;
    try {
      ctx = new Ctx();
    } catch (err) {
      return null;
    }

    const t0 = ctx.currentTime;
    const end = t0 + SOUND_SECONDS;

    const master = ctx.createGain();
    master.connect(ctx.destination);
    // Held flat right up to the launch, then torn away in two stages - a single
    // exponential to near-silence collapses so fast the tire flew off in silence.
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.45, t0 + 0.3);
    master.gain.setValueAtTime(0.45, t0 + LAUNCH_AT_MS / 1000);
    master.gain.exponentialRampToValueAtTime(0.1, end - 0.12);
    master.gain.exponentialRampToValueAtTime(0.0001, end);

    // One white-noise source feeds everything - a tire makes no tonal sound of
    // its own, only filtered friction.
    const noiseBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * SOUND_SECONDS), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Scrub: the broadband rush of rubber dragging over asphalt, under it all.
    const scrub = ctx.createBiquadFilter();
    scrub.type = "bandpass";
    scrub.Q.value = 0.8;
    scrub.frequency.setValueAtTime(700, t0);
    scrub.frequency.linearRampToValueAtTime(1900, t0 + SOUND_SECONDS * 0.7);
    scrub.frequency.linearRampToValueAtTime(1100, end);
    const scrubGain = ctx.createGain();
    scrubGain.gain.value = 0.28;
    noise.connect(scrub);
    scrub.connect(scrubGain);
    scrubGain.connect(master);

    // Squeal: tread blocks grip and let go hundreds of times a second, which is
    // narrowband noise rather than a tone. High-Q resonators on the same noise
    // give that breathy, unstable pitch; an oscillator only ever sounds like a
    // siren. Partials sit slightly off the exact harmonics and each resonance
    // wanders on its own, because a perfectly steady squeal reads as synthetic.
    const squealBus = ctx.createGain();
    squealBus.connect(master);

    const SQUEAL_HZ = 760;
    const PARTIALS = [
      { mult: 1, q: 20, gain: 4.5 },
      { mult: 2.02, q: 16, gain: 2.2 },
      { mult: 3.06, q: 12, gain: 0.9 },
    ];

    PARTIALS.forEach((partial) => {
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = partial.q;

      const base = SQUEAL_HZ * partial.mult;
      band.frequency.setValueAtTime(base, t0);
      let at = t0;
      while (at < end) {
        at = Math.min(end, at + 0.05 + Math.random() * 0.1);
        // Overall climb as the wheel spins up, plus a jitter that never repeats.
        const climb = 1 + 0.3 * ((at - t0) / SOUND_SECONDS);
        const wobble = 1 + (Math.random() - 0.5) * 0.08;
        band.frequency.linearRampToValueAtTime(base * climb * wobble, at);
      }

      // High Q passes only a sliver of the noise, so each partial needs makeup gain.
      const gain = ctx.createGain();
      gain.gain.value = partial.gain;
      noise.connect(band);
      band.connect(gain);
      gain.connect(squealBus);
    });

    // A burnout squeal surges and catches rather than holding one level.
    squealBus.gain.setValueAtTime(0.85, t0);
    let surge = t0;
    while (surge < end) {
      surge = Math.min(end, surge + 0.12 + Math.random() * 0.18);
      squealBus.gain.linearRampToValueAtTime(0.6 + Math.random() * 0.5, surge);
    }

    noise.start(t0);
    noise.stop(end);

    return ctx;
  }

  // ── Scene ───────────────────────────────────────────────────────────
  function buildOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "guma-egg-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const backdrop = document.createElement("div");
    backdrop.className = "guma-egg-backdrop";
    overlay.appendChild(backdrop);

    const arena = document.createElement("div");
    arena.className = "guma-egg-arena";

    const skid = document.createElement("div");
    skid.className = "guma-egg-skid";
    arena.appendChild(skid);

    const smokeWrap = document.createElement("div");
    smokeWrap.className = "guma-egg-smoke-wrap";
    SMOKE_PUFFS.forEach((puff) => {
      const el = document.createElement("div");
      el.className = "guma-egg-smoke";
      el.style.width = `${puff.size}px`;
      el.style.height = `${puff.size}px`;
      el.style.left = `${puff.x - puff.size / 2}px`;
      el.style.top = `${puff.y - puff.size / 2}px`;
      el.style.animationDelay = `${puff.delay}s`;
      smokeWrap.appendChild(el);
    });
    arena.appendChild(smokeWrap);

    const track = document.createElement("div");
    track.className = "guma-egg-track";
    const tire = window.GumaTireSpin.create({ className: "guma-egg-tire", speed: SPEED_DRIVE_IN });
    track.appendChild(tire.el);
    arena.appendChild(track);

    overlay.appendChild(arena);

    const caption = document.createElement("div");
    caption.className = "guma-egg-caption";
    const title = document.createElement("p");
    title.className = "guma-egg-title";
    title.textContent = "Palimy gumę!";
    const sub = document.createElement("p");
    sub.className = "guma-egg-sub";
    sub.textContent = "Ogumienie odblokowane";
    caption.appendChild(title);
    caption.appendChild(sub);
    overlay.appendChild(caption);

    return { overlay, smokeWrap, tire };
  }

  function dismiss() {
    if (!active) return;
    const scene = active;
    active = null;

    scene.timers.forEach(clearTimeout);
    document.removeEventListener("keydown", onKeyDown);
    scene.tire.destroy();
    if (scene.audio) {
      try {
        scene.audio.close();
      } catch (err) {
        /* already closed */
      }
    }

    scene.overlay.classList.add("is-leaving");
    setTimeout(() => scene.overlay.remove(), FADE_MS);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") dismiss();
  }

  function launch() {
    if (active) return;

    const { overlay, smokeWrap, tire } = buildOverlay();
    document.body.appendChild(overlay);
    overlay.addEventListener("click", dismiss);
    document.addEventListener("keydown", onKeyDown);

    active = {
      overlay,
      tire,
      audio: playBurnout(),
      timers: [
        setTimeout(() => tire.setSpeed(SPEED_BURNOUT), BURNOUT_AT_MS),
        setTimeout(() => smokeWrap.classList.add("is-done"), SMOKE_STOP_MS),
        setTimeout(() => tire.setSpeed(SPEED_LAUNCH), LAUNCH_AT_MS),
        setTimeout(dismiss, SHOW_MS),
      ],
    };
  }

  // ── Trigger ─────────────────────────────────────────────────────────
  function poke(trigger) {
    trigger.classList.remove("is-poked");
    // Force a reflow so the animation restarts on every click.
    void trigger.offsetWidth;
    trigger.classList.add("is-poked");
  }

  function init() {
    const trigger = document.querySelector("[data-guma-egg]");
    if (!trigger || !window.GumaTireSpin) return;

    trigger.classList.add("guma-egg-trigger");
    trigger.addEventListener("click", () => {
      const now = Date.now();
      clicks = now - lastClickAt > CLICK_WINDOW_MS ? 1 : clicks + 1;
      lastClickAt = now;

      if (clicks >= CLICKS_REQUIRED) {
        clicks = 0;
        launch();
        return;
      }
      // Only nudge once the clicking looks deliberate, so a stray click on the
      // heading gives nothing away.
      if (clicks >= 2) poke(trigger);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
