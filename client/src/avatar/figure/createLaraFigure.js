// Real-time renderer for LARA's built-in figure: a gender-neutral AI presence drawn on a canvas
// every frame. Head motion, gaze, blinking and glow follow LARA's presence; the mouth is driven
// by the word-boundary events of the speech engine that is voicing her.

const REFERENCE_HEIGHT = 720;
const FRAMING = 1.16;
const FRAMING_OFFSET = -48;
const MAX_PIXEL_RATIO = 1.75;
const TAU = Math.PI * 2;

const AMBER = [255, 186, 102];
const VIOLET = [168, 152, 255];
const EYE = [255, 224, 176];

const mix = (from, to, amount) => from.map((value, index) => Math.round(value + (to[index] - value) * amount));
const rgba = (color, alpha) => `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${Math.max(0, Math.min(1, alpha))})`;
const approach = (current, target, rate, dt) => current + (target - current) * Math.min(1, rate * dt);

function countSyllables(word) {
  const groups = word.toLowerCase().match(/[aeiouy]+/g);
  return Math.max(1, Math.min(5, groups ? groups.length : 1));
}

function createBokeh(count) {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: count }, () => ({
    x: random(),
    y: random() * 0.85,
    radius: 0.03 + random() * 0.07,
    alpha: 0.03 + random() * 0.06,
    speed: 0.05 + random() * 0.12,
    phase: random() * TAU,
    color: random() > 0.8 ? VIOLET : AMBER
  }));
}

const GAZE_BY_PRESENCE = {
  thinking: () => ({ x: -13 + Math.random() * 5, y: -9 }),
  listening: () => ({ x: Math.random() * 4 - 2, y: 1 }),
  speaking: () => ({ x: Math.random() * 10 - 5, y: Math.random() * 3 - 1 }),
  idle: () => ({ x: Math.random() * 14 - 7, y: Math.random() * 5 - 2 })
};

export function createLaraFigure(canvas) {
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = reducedMotion ? 0.3 : 1;
  const bokeh = createBokeh(16);

  const input = { presence: "idle", micLevel: 0, paused: false };
  const motion = { tilt: 0, gazeX: 0, gazeY: 0, glow: 0.45, violet: 0, listen: 0, mouth: 0 };

  let syllables = [];
  let lastPulseAt = 0;
  let nextRhythmAt = 0;
  let gazeTarget = { x: 0, y: 0 };
  let nextGazeAt = 0;
  let lastPresence = input.presence;
  let blinkStartedAt = -1;
  let nextBlinkAt = performance.now() + 2500;
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let frame = 0;
  let lastTime = performance.now();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function pulse(word) {
    const now = performance.now();
    const step = 170;

    for (let index = 0; index < countSyllables(word); index += 1) {
      syllables.push({ at: now + index * step, strength: 0.6 + Math.random() * 0.4 });
    }

    lastPulseAt = now;
  }

  function mouthTarget(now, speaking) {
    if (!speaking) {
      syllables = [];
      return 0;
    }

    // Some voices report no word boundaries; keep a speaking rhythm while they talk.
    if (now - lastPulseAt > 700 && now > nextRhythmAt) {
      syllables.push({ at: now, strength: 0.45 + Math.random() * 0.45 });
      nextRhythmAt = now + 150 + Math.random() * 100;
    }

    syllables = syllables.filter((syllable) => now - syllable.at < 700);
    let level = 0;

    for (const syllable of syllables) {
      const age = now - syllable.at;

      if (age >= 0) {
        const envelope = age < 55 ? age / 55 : Math.exp(-(age - 55) / 120);
        level = Math.max(level, envelope * syllable.strength);
      }
    }

    return level;
  }

  function eyeOpenness(now) {
    if (blinkStartedAt < 0 && now > nextBlinkAt) {
      blinkStartedAt = now;
    }

    if (blinkStartedAt < 0) {
      return 1;
    }

    const progress = (now - blinkStartedAt) / 150;

    if (progress >= 1) {
      blinkStartedAt = -1;
      nextBlinkAt = now + 2200 + Math.random() * 4200;
      return 1;
    }

    return Math.max(0.08, Math.abs(1 - progress * 2));
  }

  function update(dt, now) {
    const { presence, micLevel } = input;
    const speaking = presence === "speaking" && !input.paused;
    const time = now / 1000;

    if (presence !== lastPresence) {
      lastPresence = presence;
      nextGazeAt = 0;
    }

    if (now > nextGazeAt) {
      gazeTarget = (GAZE_BY_PRESENCE[presence] || GAZE_BY_PRESENCE.idle)();
      nextGazeAt = now + 1200 + Math.random() * 2600;
    }

    const tiltTargets = {
      idle: Math.sin(time * 0.35) * 0.015,
      listening: 0.05 + Math.sin(time * 0.6) * 0.01,
      thinking: -0.035 + Math.sin(time * 0.8) * 0.012,
      speaking: Math.sin(time * 1.1) * 0.022
    };

    const glowTargets = {
      idle: 0.45,
      listening: 0.8 + micLevel * 0.5,
      thinking: 0.65,
      speaking: 0.7 + motion.mouth * 0.5
    };

    motion.mouth = approach(motion.mouth, mouthTarget(now, speaking), 18, dt);
    motion.tilt = approach(motion.tilt, (tiltTargets[presence] ?? 0) * motionScale, 2.5, dt);
    motion.gazeX = approach(motion.gazeX, gazeTarget.x, 6, dt);
    motion.gazeY = approach(motion.gazeY, gazeTarget.y, 6, dt);
    motion.glow = approach(motion.glow, glowTargets[presence] ?? 0.45, 4, dt);
    motion.violet = approach(motion.violet, presence === "thinking" ? 1 : 0, 2, dt);
    motion.listen = approach(motion.listen, presence === "listening" ? 1 : 0, 3, dt);
  }

  function drawBackground(time, accent) {
    const centerX = width / 2;
    const backdrop = ctx.createRadialGradient(centerX, height * 0.42, 0, centerX, height * 0.42, Math.max(width, height) * 0.75);
    backdrop.addColorStop(0, "#22170d");
    backdrop.addColorStop(0.55, "#0d0a07");
    backdrop.addColorStop(1, "#060504");
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, width, height);

    for (const light of bokeh) {
      const x = (light.x + Math.sin(time * light.speed + light.phase) * 0.02 * motionScale) * width;
      const y = (light.y + Math.cos(time * light.speed * 0.8 + light.phase) * 0.02 * motionScale) * height;
      const radius = light.radius * height;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, rgba(light.color, light.alpha));
      glow.addColorStop(1, rgba(light.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    }

    const halo = ctx.createRadialGradient(centerX, height * 0.44, 0, centerX, height * 0.44, height * 0.55);
    halo.addColorStop(0, rgba(accent, 0.1 + motion.glow * 0.16));
    halo.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);
  }

  function drawTorso(time, accent) {
    const breath = Math.sin(time * 0.9) * 0.006 * motionScale;

    ctx.save();
    ctx.translate(0, REFERENCE_HEIGHT);
    ctx.scale(1, 1 + breath);
    ctx.translate(0, -REFERENCE_HEIGHT);

    ctx.beginPath();
    ctx.moveTo(-380, 730);
    ctx.bezierCurveTo(-372, 628, -292, 572, -150, 552);
    ctx.bezierCurveTo(-92, 544, -64, 528, -58, 500);
    ctx.lineTo(58, 500);
    ctx.bezierCurveTo(64, 528, 92, 544, 150, 552);
    ctx.bezierCurveTo(292, 572, 372, 628, 380, 730);
    ctx.closePath();

    const body = ctx.createLinearGradient(0, 500, 0, 720);
    body.addColorStop(0, "#2b231c");
    body.addColorStop(1, "#0c0a08");
    ctx.fillStyle = body;
    ctx.fill();

    const rim = ctx.createLinearGradient(-380, 0, 380, 0);
    rim.addColorStop(0, rgba(accent, 0.55));
    rim.addColorStop(0.3, rgba(accent, 0.08));
    rim.addColorStop(0.7, rgba(accent, 0.05));
    rim.addColorStop(1, rgba(accent, 0.35));
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-96, 548);
    ctx.quadraticCurveTo(0, 602, 96, 548);
    ctx.strokeStyle = rgba(accent, 0.22);
    ctx.lineWidth = 2;
    ctx.stroke();

    [4, 10, 16, 10, 4].forEach((size, index) => {
      const barHeight = (6 + size) * (0.6 + motion.mouth * 0.8);
      ctx.fillStyle = rgba(accent, 0.3 + motion.mouth * 0.45);
      ctx.beginPath();
      ctx.roundRect(-19.5 + index * 9, 640 - barHeight / 2, 3, barHeight, 1.5);
      ctx.fill();
    });

    ctx.restore();

    const neck = ctx.createLinearGradient(-48, 0, 48, 0);
    neck.addColorStop(0, "#110e0b");
    neck.addColorStop(0.5, "#2a231c");
    neck.addColorStop(1, "#110e0b");
    ctx.fillStyle = neck;
    ctx.beginPath();
    ctx.roundRect(-46, 420, 92, 100, 18);
    ctx.fill();
  }

  function drawHead(now, time, accent) {
    const bob = (Math.sin(time * 0.9) * 3 + motion.mouth * 5) * motionScale;

    ctx.save();
    ctx.translate(0, bob + 460);
    ctx.rotate(motion.tilt);
    ctx.translate(0, -460);

    ctx.beginPath();
    ctx.ellipse(0, 320, 128, 158, 0, 0, TAU);
    ctx.strokeStyle = rgba(accent, 0.05 + motion.glow * 0.07);
    ctx.lineWidth = 16;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 320, 116, 146, 0, 0, TAU);
    const shell = ctx.createRadialGradient(-46, 240, 10, -10, 300, 240);
    shell.addColorStop(0, "#6b5847");
    shell.addColorStop(0.45, "#33291f");
    shell.addColorStop(1, "#110d0a");
    ctx.fillStyle = shell;
    ctx.fill();

    const rim = ctx.createLinearGradient(-120, 0, 120, 0);
    rim.addColorStop(0, rgba(accent, 0.75));
    rim.addColorStop(0.25, rgba(accent, 0.05));
    rim.addColorStop(0.75, rgba(accent, 0.03));
    rim.addColorStop(1, rgba(accent, 0.45));
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-38, 228, 46, 18, -0.35, 0, TAU);
    ctx.fillStyle = "rgba(255, 240, 220, 0.07)";
    ctx.fill();

    for (const side of [-1, 1]) {
      const x = side * 117;
      ctx.beginPath();
      ctx.arc(x, 330, 15, 0, TAU);
      ctx.fillStyle = "#1a1511";
      ctx.fill();
      ctx.strokeStyle = rgba(accent, 0.28);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const sensor = ctx.createRadialGradient(x, 330, 0, x, 330, 14);
      sensor.addColorStop(0, rgba(accent, 0.25 + motion.listen * 0.5 + input.micLevel * motion.listen * 0.4));
      sensor.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = sensor;
      ctx.beginPath();
      ctx.arc(x, 330, 14, 0, TAU);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(0, 352, 90, 68, 0, 0, TAU);
    const visor = ctx.createLinearGradient(0, 284, 0, 420);
    visor.addColorStop(0, "rgba(6, 5, 4, 0.92)");
    visor.addColorStop(1, "rgba(18, 14, 11, 0.85)");
    ctx.fillStyle = visor;
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 352, 82, 60, 0, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = "rgba(255, 228, 196, 0.12)";
    ctx.lineWidth = 3;
    ctx.stroke();

    drawEyes(now);
    drawMouth(time, accent);

    ctx.restore();
  }

  function drawEyes(now) {
    const openness = eyeOpenness(now);
    const color = mix(EYE, VIOLET, motion.violet * 0.6);
    const eyeY = 336 + motion.gazeY;
    const eyeHeight = 12 * (1 + motion.listen * 0.15);

    for (const side of [-1, 1]) {
      const x = side * 38 + motion.gazeX;
      const glow = ctx.createRadialGradient(x, eyeY, 0, x, eyeY, 34);
      glow.addColorStop(0, rgba(color, 0.2 + motion.glow * 0.25));
      glow.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - 34, eyeY - 34, 68, 68);

      ctx.beginPath();
      ctx.roundRect(x - 15, eyeY - (eyeHeight * openness) / 2, 30, Math.max(1.6, eyeHeight * openness), 6);
      ctx.fillStyle = rgba(color, 0.95);
      ctx.fill();
    }
  }

  function drawMouth(time, accent) {
    const level = motion.mouth;
    const mouthWidth = 46 + level * 40;
    const amplitude = level * 15;
    const color = mix(EYE, accent, 0.3);

    const glow = ctx.createRadialGradient(0, 384, 0, 0, 384, 60);
    glow.addColorStop(0, rgba(accent, 0.1 + level * 0.25));
    glow.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-60, 324, 120, 120);

    ctx.beginPath();

    for (let index = 0; index <= 40; index += 1) {
      const progress = index / 40;
      const x = -mouthWidth / 2 + progress * mouthWidth;
      const envelope = Math.sin(Math.PI * progress);
      const smile = envelope * 3 * (1 - level);
      const y =
        384 +
        smile +
        (Math.sin(progress * 11 + time * 16) * 0.65 + Math.sin(progress * 23 - time * 11) * 0.35) * amplitude * envelope;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = rgba(color, 0.7 + level * 0.3);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.stroke();

    if (motion.violet > 0.05) {
      const x = Math.sin(time * 3) * (mouthWidth / 2 - 4);
      ctx.beginPath();
      ctx.arc(x, 384, 3, 0, TAU);
      ctx.fillStyle = rgba(VIOLET, motion.violet * 0.9);
      ctx.fill();
    }
  }

  function render(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt, now);

    const time = now / 1000;
    const accent = mix(AMBER, VIOLET, motion.violet);
    const scale = (height / REFERENCE_HEIGHT) * FRAMING;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawBackground(time, accent);

    ctx.save();
    ctx.translate(width / 2, FRAMING_OFFSET * scale);
    ctx.scale(scale, scale);
    drawTorso(time, accent);
    drawHead(now, time, accent);
    ctx.restore();

    frame = requestAnimationFrame(render);
  }

  frame = requestAnimationFrame(render);

  return {
    setInput(next) {
      Object.assign(input, next);
    },
    pulse,
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
    }
  };
}
