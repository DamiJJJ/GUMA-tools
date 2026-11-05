"use strict";

// Hidden "burnout" easter egg: clicking the trigger word a few times in a row
// dims the page and plays a burnout with a synthesised screech: a tire rolls
// in, spins in place on a hot patch of rubber under a plume of smoke, then
// catches grip and launches off, leaving a rubber stripe behind. Opt-in per
// page via [data-guma-egg] on the trigger element.

(function () {
  // ── Config ──────────────────────────────────────────────────────────
  const CLICKS_REQUIRED = 5;
  const CLICK_WINDOW_MS = 1500; // max gap between two counted clicks
  const SHOW_MS = 4200;
  const FADE_MS = 400;
  const SOUND_SECONDS = 3.6;

  // Timeline, in ms from launch().
  const ARRIVE_MS = 760; // tire rolls in from the left and stops at centre
  const WHEELSPIN_AT_MS = 420; // starts out-spinning the road before it stops
  const LAUNCH_AT_MS = 3110; // grip - the tire takes off to the right
  const EXIT_MS = 3900; // off-screen on the right
  const SQUAT_MS = 160; // the tire loads up just before the launch

  const BURNOUT_RPS = 2.6; // wheel speed while burning, revolutions per second
  const SPIN_RAMP = 3.5; // how briskly the wheel chases its target speed

  // Smoke is emitted from behind the contact patch while the wheel spins.
  const PUFF_EVERY_MS = 60;
  const PUFF_UNTIL_MS = LAUNCH_AT_MS + 220;

  let clicks = 0;
  let lastClickAt = 0;
  let active = null; // { overlay, stop, audio, timers[] }

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
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function buildOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "guma-egg-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const backdrop = document.createElement("div");
    backdrop.className = "guma-egg-backdrop";
    overlay.appendChild(backdrop);

    const arena = document.createElement("div");
    arena.className = "guma-egg-arena";

    // Ground, rubber mark, heat glow and smoke all hang off the contact
    // patch line (see .guma-egg-ground and friends); JS moves them along x.
    const ground = document.createElement("div");
    ground.className = "guma-egg-ground";
    arena.appendChild(ground);

    const skid = document.createElement("div");
    skid.className = "guma-egg-skid";
    arena.appendChild(skid);

    const heat = document.createElement("div");
    heat.className = "guma-egg-heat";
    arena.appendChild(heat);

    const smokeWrap = document.createElement("div");
    smokeWrap.className = "guma-egg-smoke-wrap";
    arena.appendChild(smokeWrap);

    const track = document.createElement("div");
    track.className = "guma-egg-track";
    const tire = window.GumaTireSpin.create({ className: "guma-egg-tire" });
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

    return { overlay, arena, track, tire, skid, heat, smokeWrap };
  }

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeOutCubic = (v) => 1 - Math.pow(1 - v, 3);
  const easeInQuad = (v) => v * v;

  // One puff of tire smoke: swells from the contact patch and is thrown back
  // and up, away from the direction of travel.
  function emitPuff(wrap, x, radius) {
    const size = radius * (0.6 + Math.random() * 0.5);
    const el = document.createElement("div");
    el.className = "guma-egg-smoke";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${x - radius * 0.35 - size / 2}px`;
    el.style.top = `${-size / 2 - radius * 0.06}px`;
    wrap.appendChild(el);

    const dx = -(radius * 1.1 + Math.random() * radius * 1.7);
    const dy = -(radius * 0.45 + Math.random() * radius * 1.1);
    const grow = 2.2 + Math.random() * 1.3;
    const anim = el.animate(
      [
        { transform: "translate(0, 0) scale(0.25)", opacity: 0 },
        { transform: `translate(${dx * 0.22}px, ${dy * 0.12}px) scale(0.95)`, opacity: 0.85, offset: 0.14 },
        { transform: `translate(${dx}px, ${dy}px) scale(${grow})`, opacity: 0 },
      ],
      { duration: 1500 + Math.random() * 900, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)", fill: "forwards" },
    );
    anim.onfinish = () => el.remove();
  }

  /**
   * Drives the whole scene from one clock, so the wheel's spin can be tied to
   * how far it travels (a true roll on the way in) and the rubber mark can
   * follow the tire out. Returns a stop function.
   */
  function runScene(scene) {
    const { arena, track, tire, skid, heat, smokeWrap } = scene;
    // Geometry is measured on the first frame: the Tailwind runtime only
    // generates the .guma-egg-* rules after the overlay lands in the DOM.
    let radius = 0;
    let startX = -window.innerWidth;
    let endX = 0;
    let patchHalf = 0;

    let raf = 0;
    let t0 = 0;
    let last = 0;
    let x = startX;
    let angle = 0;
    let rps = 0;
    let jitter = 0;
    let nextPuff = WHEELSPIN_AT_MS;
    let shaken = false;

    function frame(now) {
      if (!t0) {
        t0 = last = now;
        radius = tire.el.getBoundingClientRect().height / 2 || 96;
        startX = -(window.innerWidth / 2 + radius * 1.4);
        endX = window.innerWidth / 2 + radius * 1.6;
        patchHalf = radius * 0.55;
        x = startX;
      }
      const t = now - t0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Position: ease in to the centre, hold, then accelerate away.
      const prevX = x;
      if (t < ARRIVE_MS) x = startX * (1 - easeOutCubic(t / ARRIVE_MS));
      else if (t < LAUNCH_AT_MS) x = 0;
      else x = endX * easeInQuad(clamp01((t - LAUNCH_AT_MS) / (EXIT_MS - LAUNCH_AT_MS)));
      const rollRps = dt ? (x - prevX) / dt / (2 * Math.PI * radius) : 0;

      // Spin: pure rolling until the wheelspin kicks in, then burnout speed;
      // never slower than the road, so the launch still reads as rolling.
      const burning = t >= WHEELSPIN_AT_MS && t < LAUNCH_AT_MS + 250;
      if (!burning && t < WHEELSPIN_AT_MS) rps = rollRps;
      else rps += ((burning ? BURNOUT_RPS : rollRps) - rps) * Math.min(1, dt * SPIN_RAMP);
      rps = Math.max(rps, rollRps);
      angle += rps * dt * Math.PI * 2;
      tire.draw(angle, rps);

      // Body: a nervous shiver while stationary and spinning, a squat as the
      // grip loads up, a stretch as it launches.
      const stationary = t >= ARRIVE_MS && t < LAUNCH_AT_MS;
      jitter += ((stationary ? (Math.random() - 0.5) * 3 : 0) - jitter) * 0.5;
      let sx = 1;
      let sy = 1;
      if (stationary) {
        sx = 1.015;
        sy = 0.985;
      }
      if (t >= LAUNCH_AT_MS - SQUAT_MS && t < LAUNCH_AT_MS) {
        sx = 1.05;
        sy = 0.94;
      } else if (t >= LAUNCH_AT_MS) {
        const k = clamp01((t - LAUNCH_AT_MS) / 300);
        sx = 1.08 - 0.04 * k;
        sy = 0.96 + 0.02 * k;
      }
      track.style.transform = `translate(${x.toFixed(1)}px, ${jitter.toFixed(2)}px) scale(${sx}, ${sy})`;

      // Heat glow under the tire builds while it burns, fades after launch.
      const heatLevel =
        t < LAUNCH_AT_MS ? clamp01((t - ARRIVE_MS + 200) / 900) : 1 - clamp01((t - LAUNCH_AT_MS) / 250);
      heat.style.opacity = (heatLevel * (0.85 + Math.random() * 0.15)).toFixed(2);
      heat.style.transform = `translateX(${x.toFixed(1)}px)`;

      // Rubber mark: a patch that darkens and spreads under the spinning
      // tire, then a stripe stretched out behind it as it leaves.
      const grow = clamp01((t - ARRIVE_MS + 120) / 700);
      const left = -patchHalf * grow;
      const right = Math.max(patchHalf * grow, x + radius * 0.2);
      skid.style.transform = `translateX(${left.toFixed(1)}px)`;
      skid.style.width = `${Math.max(0, right - left).toFixed(1)}px`;
      skid.style.opacity = grow.toFixed(2);

      if (t >= nextPuff && t < PUFF_UNTIL_MS) {
        emitPuff(smokeWrap, x, radius);
        nextPuff = t + PUFF_EVERY_MS;
      }

      if (!shaken && t >= LAUNCH_AT_MS) {
        shaken = true;
        arena.animate(
          [
            { transform: "translate(0, 0)" },
            { transform: "translate(-6px, 3px)" },
            { transform: "translate(5px, -2px)" },
            { transform: "translate(-3px, 1px)" },
            { transform: "translate(0, 0)" },
          ],
          { duration: 280, easing: "ease-out" },
        );
      }

      if (t < SHOW_MS) raf = requestAnimationFrame(frame);
    }

    // Park the tire off-screen before the first paint, not at the centre.
    track.style.transform = `translate(${startX}px, 0)`;
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  // Reduced motion keeps the scene but not the movement: the tire stands at
  // the centre on its rubber patch while the caption shows.
  function poseStill(scene) {
    const raf = requestAnimationFrame(() => {
      const radius = scene.tire.el.getBoundingClientRect().height / 2 || 96;
      scene.skid.style.transform = `translateX(${-radius * 0.55}px)`;
      scene.skid.style.width = `${radius * 1.1}px`;
      scene.skid.style.opacity = "1";
    });
    return () => cancelAnimationFrame(raf);
  }

  function dismiss() {
    if (!active) return;
    const scene = active;
    active = null;

    scene.timers.forEach(clearTimeout);
    document.removeEventListener("keydown", onKeyDown);
    scene.stop();
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

    const scene = buildOverlay();
    document.body.appendChild(scene.overlay);
    scene.overlay.addEventListener("click", dismiss);
    document.addEventListener("keydown", onKeyDown);

    active = {
      overlay: scene.overlay,
      stop: prefersReducedMotion() ? poseStill(scene) : runScene(scene),
      audio: playBurnout(),
      timers: [setTimeout(dismiss, SHOW_MS)],
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
