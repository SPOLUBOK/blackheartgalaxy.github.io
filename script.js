const canvas = document.querySelector("#singularity");
const ctx = canvas.getContext("2d", { alpha: true });
const toggleButton = document.querySelector("#toggleCopy");
const copyPanel = document.querySelector("#copyPanel");

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  time: 0,
  mouseX: 0,
  mouseY: 0,
  targetX: 0,
  targetY: 0,
  stars: [],
  sparks: [],
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

  const starCount = Math.min(360, Math.max(130, Math.floor((state.width * state.height) / 4700)));
  state.stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    z: randomBetween(0.24, 1),
    r: randomBetween(0.45, 1.9),
    vx: randomBetween(-0.08, 0.08),
    vy: randomBetween(-0.04, 0.12),
    hue: Math.random() > 0.74 ? randomBetween(180, 315) : randomBetween(32, 52),
    blink: randomBetween(0.6, 1.8),
  }));

  state.sparks = Array.from({ length: 84 }, (_, index) => ({
    angle: (index / 84) * Math.PI * 2,
    speed: randomBetween(0.0018, 0.006),
    radius: randomBetween(115, 360),
    size: randomBetween(0.8, 3.2),
    shade: index % 3,
  }));
}

function drawStars() {
  const influenceRadius = Math.max(130, Math.min(state.width, state.height) * 0.24);

  for (const star of state.stars) {
    const dx = star.x - state.mouseX;
    const dy = star.y - state.mouseY;
    const distance = Math.hypot(dx, dy) || 1;
    const force = Math.max(0, 1 - distance / influenceRadius);
    const push = force * force * 7.5 * star.z;

    star.x += star.vx + (dx / distance) * push + (state.targetX - 0.5) * star.z * 0.36;
    star.y += star.vy + (dy / distance) * push + (state.targetY - 0.5) * star.z * 0.24;

    if (star.x < -20) star.x = state.width + 20;
    if (star.x > state.width + 20) star.x = -20;
    if (star.y < -20) star.y = state.height + 20;
    if (star.y > state.height + 20) star.y = -20;

    const twinkle = 0.52 + Math.sin(state.time * star.blink + star.x * 0.02) * 0.34;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${star.hue}, 100%, ${70 + star.z * 18}%, ${0.32 + twinkle * 0.52})`;
    ctx.arc(star.x, star.y, star.r * star.z, 0, Math.PI * 2);
    ctx.fill();

    if (force > 0.04) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(68, 246, 255, ${force * 0.28})`;
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x + (dx / distance) * 18, star.y + (dy / distance) * 18);
      ctx.stroke();
    }
  }
}

function ellipsePoint(cx, cy, radius, angle, tilt, wobble) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: cx + cos * radius + Math.sin(angle * 3 + state.time) * wobble,
    y: cy + sin * radius * tilt + Math.cos(angle * 2 - state.time) * wobble * 0.35,
  };
}

function drawAccretionDisk(cx, cy, baseRadius) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12 + Math.sin(state.time * 0.28) * 0.04);
  ctx.scale(1, 0.38);

  for (let ring = 0; ring < 7; ring += 1) {
    const radius = baseRadius * (1.05 + ring * 0.12);
    const width = Math.max(2, baseRadius * (0.08 - ring * 0.006));
    const hue = ring % 2 ? 188 : 33;
    const alpha = 0.17 - ring * 0.014;

    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = `hsla(${hue}, 100%, ${56 + ring * 4}%, ${alpha})`;
    ctx.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const gradient = ctx.createLinearGradient(-baseRadius * 2.3, 0, baseRadius * 2.3, 0);
  gradient.addColorStop(0, "rgba(68, 246, 255, 0)");
  gradient.addColorStop(0.2, "rgba(68, 246, 255, 0.26)");
  gradient.addColorStop(0.42, "rgba(255, 176, 0, 0.9)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.98)");
  gradient.addColorStop(0.62, "rgba(255, 77, 45, 0.92)");
  gradient.addColorStop(0.78, "rgba(255, 61, 242, 0.26)");
  gradient.addColorStop(1, "rgba(255, 61, 242, 0)");

  ctx.beginPath();
  ctx.lineWidth = Math.max(18, baseRadius * 0.16);
  ctx.strokeStyle = gradient;
  ctx.shadowColor = "rgba(255, 176, 0, 0.9)";
  ctx.shadowBlur = 28;
  ctx.ellipse(0, 0, baseRadius * 1.42, baseRadius * 1.42, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawGlyphs(cx, cy, baseRadius) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalCompositeOperation = "lighter";

  for (const spark of state.sparks) {
    spark.angle += spark.speed;
    const radius = baseRadius * 1.2 + Math.sin(state.time * 1.4 + spark.radius) * 18 + spark.radius * 0.35;
    const point = ellipsePoint(cx, cy, radius, spark.angle + state.time * 0.08, 0.42, 5);
    const alpha = 0.18 + Math.sin(state.time * 2 + spark.angle * 4) * 0.14;
    const color =
      spark.shade === 0
        ? `rgba(255, 176, 0, ${alpha})`
        : spark.shade === 1
          ? `rgba(68, 246, 255, ${alpha})`
          : `rgba(255, 61, 242, ${alpha})`;

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.rect(point.x, point.y, spark.size * 4.4, spark.size);
    ctx.fill();
  }

  ctx.restore();
}

function drawBlackHole() {
  const driftX = Math.sin(state.time * 0.18) * state.width * 0.045 + (state.targetX - 0.5) * 42;
  const driftY = Math.cos(state.time * 0.21) * state.height * 0.035 + (state.targetY - 0.5) * 32;
  const cx = state.width * 0.48 + driftX;
  const cy = state.height * 0.44 + driftY;
  const baseRadius = Math.max(115, Math.min(state.width, state.height) * 0.18);

  const glow = ctx.createRadialGradient(cx, cy, baseRadius * 0.55, cx, cy, baseRadius * 2.9);
  glow.addColorStop(0, "rgba(0, 0, 0, 0)");
  glow.addColorStop(0.28, "rgba(255, 176, 0, 0.18)");
  glow.addColorStop(0.46, "rgba(255, 77, 45, 0.12)");
  glow.addColorStop(0.68, "rgba(68, 246, 255, 0.08)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  drawAccretionDisk(cx, cy, baseRadius);
  drawGlyphs(cx, cy, baseRadius);

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "#000";
  ctx.shadowColor = "rgba(0, 0, 0, 1)";
  ctx.shadowBlur = 42;
  ctx.arc(cx, cy, baseRadius * 0.58, 0, Math.PI * 2);
  ctx.fill();

  const rim = ctx.createRadialGradient(cx, cy, baseRadius * 0.45, cx, cy, baseRadius * 0.78);
  rim.addColorStop(0, "rgba(0, 0, 0, 0)");
  rim.addColorStop(0.7, "rgba(0, 0, 0, 0.3)");
  rim.addColorStop(0.86, "rgba(255, 246, 212, 0.88)");
  rim.addColorStop(0.91, "rgba(68, 246, 255, 0.55)");
  rim.addColorStop(1, "rgba(255, 61, 242, 0)");
  ctx.beginPath();
  ctx.fillStyle = rim;
  ctx.arc(cx, cy, baseRadius * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 10; i += 1) {
    const offset = Math.sin(state.time * 3.1 + i) * 10;
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = i % 2 ? "rgba(68, 246, 255, 0.12)" : "rgba(255, 61, 242, 0.12)";
    ctx.arc(cx + offset, cy - offset * 0.35, baseRadius * (0.76 + i * 0.045), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVignette() {
  const vignette = ctx.createRadialGradient(
    state.width * 0.5,
    state.height * 0.45,
    state.height * 0.2,
    state.width * 0.5,
    state.height * 0.5,
    Math.max(state.width, state.height) * 0.72,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.72, "rgba(0, 0, 0, 0.24)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.88)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, state.width, state.height);
}

function animate() {
  state.time += 0.016;
  state.mouseX += (state.targetX * state.width - state.mouseX) * 0.09;
  state.mouseY += (state.targetY * state.height - state.mouseY) * 0.09;

  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#020204";
  ctx.fillRect(0, 0, state.width, state.height);
  drawStars();
  drawBlackHole();
  drawVignette();

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  state.targetX = event.clientX / state.width;
  state.targetY = event.clientY / state.height;
});
window.addEventListener("pointerleave", () => {
  state.targetX = 0.5;
  state.targetY = 0.5;
});

toggleButton.addEventListener("click", () => {
  const collapsed = document.body.classList.toggle("copy-collapsed");
  toggleButton.textContent = collapsed ? "Развернуть текст" : "Свернуть текст";
  toggleButton.setAttribute("aria-expanded", String(!collapsed));
  copyPanel.setAttribute("aria-hidden", String(collapsed));
});

state.targetX = 0.5;
state.targetY = 0.5;
resize();
animate();
