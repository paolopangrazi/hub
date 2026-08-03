(function () {
  "use strict";
  const CFG = {
    clusterEvery:  260,
    nodesPerCluster: [10, 22],
    clusterRadius: [70, 130],
    linkDist:      150,
    hoverRadius:   150,
    bridgeRadius:  280,
    bridgeDist:    340,
    maxBridges:    4,
    fireThreshold: 0.55,
    decay:         0.965,
    fadeInMs:      350,
    fadeOutMs:     2200,
    propagation:   0.62,
    refractoryMs:  650,
    pulseSpeed:    260,
    orbit:         9,
    hue: { line: "0,220,140", bridge: "80,240,175", node: "0,210,130", hot: "180,255,215" }
  };

  const root = document.getElementById("neural-banner");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  root.appendChild(canvas);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, DPR = 1;
  let nodes = [], pulses = [], clusters = [], wakes = [];
  let primary = -1, secondary = -1;
  const mouse = { x: -9999, y: -9999, active: false };

  const glow = document.createElement("canvas");
  (function makeGlow() {
    const s = 64; glow.width = glow.height = s;
    const g = glow.getContext("2d");
    const grad = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    grad.addColorStop(0,   "rgba(" + CFG.hue.hot  + ",0.9)");
    grad.addColorStop(0.25,"rgba(" + CFG.hue.node + ",0.45)");
    grad.addColorStop(1,   "rgba(" + CFG.hue.node + ",0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
  })();

  const rand = (a, b) => a + Math.random() * (b - a);
  const isAwake = (g) => g === primary || g === secondary;
  const wakeOf = (g) => { const w = wakes[g] || 0; return w * w * (3 - 2 * w); };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = root.clientWidth; H = root.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
  }

  function seed() {
    nodes = []; pulses = []; clusters = []; wakes = [];
    primary = secondary = -1;
    const nClusters = Math.max(2, Math.round(W / CFG.clusterEvery));
    for (let c = 0; c < nClusters; c++) {
      const spread = rand(CFG.clusterRadius[0], CFG.clusterRadius[1]);
      const cx = ((c + 0.5) / nClusters) * W + rand(-40, 40);
      const cy = rand(spread * 0.8, H - spread * 0.8);
      clusters.push({ x: cx, y: cy, r: spread });
      wakes.push(0);
      const count = Math.round(rand(CFG.nodesPerCluster[0], CFG.nodesPerCluster[1]));
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * spread;
        nodes.push({
          group: c,
          hx: cx + Math.cos(ang) * dist,
          hy: cy + Math.sin(ang) * dist,
          x: 0, y: 0,
          r: 1.2 + Math.random() * 1.8,
          energy: 0,
          lastFire: -1e9,
          phase: Math.random() * Math.PI * 2,
          spin: rand(0.4, 1.1) * (Math.random() < 0.5 ? -1 : 1)
        });
      }
    }
  }

  function fire(n, now) {
    if (now - n.lastFire < CFG.refractoryMs) return;
    n.lastFire = now;
    n.energy = 1;
    let bridges = 0;
    for (const m of nodes) {
      if (m === n) continue;
      const d = Math.hypot(m.x - n.x, m.y - n.y);
      if (m.group === n.group) {
        if (d < CFG.linkDist)
          pulses.push({ from: n, to: m, bridge: false, t: 0, dur: (d / CFG.pulseSpeed) * 1000 });
      } else if (isAwake(m.group) && isAwake(n.group) && bridges < CFG.maxBridges) {
        if (d < CFG.bridgeDist) {
          pulses.push({ from: n, to: m, bridge: true, t: 0, dur: (d / CFG.pulseSpeed) * 1000 });
          bridges++;
        }
      }
    }
  }

  function groupsUnderCursor() {
    if (!mouse.active) return [-1, -1];
    const best = new Map();
    for (const n of nodes) {
      const d = Math.hypot(mouse.x - n.x, mouse.y - n.y);
      if (!best.has(n.group) || d < best.get(n.group)) best.set(n.group, d);
    }
    const sorted = [...best.entries()].sort((a, b) => a[1] - b[1]);
    const p = (sorted[0] && sorted[0][1] < CFG.hoverRadius)  ? sorted[0][0] : -1;
    let   s = (sorted[1] && sorted[1][1] < CFG.bridgeRadius) ? sorted[1][0] : -1;
    if (p === -1) s = -1;
    return [p, s];
  }

  let last = performance.now(), rafId = 0, visible = true;
  const IDLE_INTERVAL = 66;   // ~15fps when nothing is happening

  // idle = no cursor, no travelling pulses, every group fully dimmed
  function idle() {
    if (mouse.active || pulses.length) return false;
    for (let g = 0; g < wakes.length; g++) if (wakes[g] > 0.01) return false;
    return true;
  }
  function start() {
    if (reduceMotion) return;
    last = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (visible && !reduceMotion) rafId = requestAnimationFrame(tick);
    const elapsed = now - last;
    if (idle() && elapsed < IDLE_INTERVAL) return;   // throttle when nothing's happening
    const dt = Math.min(elapsed, 50); last = now;
    ctx.clearRect(0, 0, W, H);

    [primary, secondary] = groupsUnderCursor();

    for (let g = 0; g < wakes.length; g++) {
      const target = isAwake(g) ? 1 : 0;
      const tau = (target === 1 ? CFG.fadeInMs : CFG.fadeOutMs) / 3;
      wakes[g] += (target - wakes[g]) * (1 - Math.exp(-dt / tau));
    }

    for (const n of nodes) {
      n.x = n.hx + Math.cos(now / 3000 * n.spin + n.phase) * CFG.orbit;
      n.y = n.hy + Math.sin(now / 3400 * n.spin + n.phase) * CFG.orbit;
      if (isAwake(n.group)) {
        const d = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        const reach = secondary !== -1 ? CFG.bridgeRadius : CFG.hoverRadius;
        if (d < reach)
          n.energy = Math.min(1, n.energy + (1 - d / reach) * 0.14 * (dt / 16));
        if (n.energy >= CFG.fireThreshold) fire(n, now);
      }
      n.energy *= Math.pow(CFG.decay, dt / 16);
      if (n.energy < 0.005) n.energy = 0;
    }

    ctx.globalCompositeOperation = "lighter";
    for (let i = pulses.length - 1; i >= 0; i--) {
      const q = pulses[i];
      q.t += dt;
      const k = q.t / q.dur;
      const w = Math.min(wakeOf(q.from.group), wakeOf(q.to.group));
      if (k >= 1 || w < 0.03) {
        if (k >= 1 && w > 0.03)
          q.to.energy = Math.min(1, q.to.energy + CFG.propagation * w);
        pulses.splice(i, 1);
        continue;
      }
      const x = q.from.x + (q.to.x - q.from.x) * k;
      const y = q.from.y + (q.to.y - q.from.y) * k;
      const a = Math.sin(k * Math.PI) * w;
      const sz = (q.bridge ? 18 : 14) * (0.6 + 0.4 * w);
      ctx.globalAlpha = w;
      ctx.drawImage(glow, x - sz / 2, y - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(" + CFG.hue.hot + "," + (0.9 * a) + ")";
      ctx.beginPath(); ctx.arc(x, y, q.bridge ? 2 : 1.6, 0, Math.PI * 2); ctx.fill();
    }

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      if (a.energy < 0.05) continue;
      const wa = wakeOf(a.group);
      if (wa < 0.02) continue;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        if (b.energy < 0.05) continue;
        const sameGroup = a.group === b.group;
        const wPair = sameGroup ? wa : Math.min(wa, wakeOf(b.group));
        if (wPair < 0.02) continue;
        const maxD = sameGroup ? CFG.linkDist : CFG.bridgeDist;
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) > maxD || Math.abs(dy) > maxD) continue;
        const d = Math.hypot(dx, dy);
        if (d > maxD) continue;
        const strength = Math.min(a.energy, b.energy) * (1 - d / maxD) * wPair;
        if (strength < 0.02) continue;
        const hue = sameGroup ? CFG.hue.line : CFG.hue.bridge;
        // flat stroke instead of a per-frame gradient allocation — no GC churn
        const alpha = strength * (a.energy + b.energy) * 0.5;
        ctx.strokeStyle = "rgba(" + hue + "," + alpha + ")";
        ctx.lineWidth = (sameGroup ? 0.8 : 1.1) + strength * 1.4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    for (const n of nodes) {
      const twinkle = 0.25 + 0.15 * Math.sin(now / 900 + n.phase);
      const w = wakeOf(n.group);
      const e = n.energy * w;
      const glowAlpha = 0.35 * twinkle + e;
      if (glowAlpha > 0.09) {              // skip near-invisible glow sprites (most idle nodes)
        const glowSize = n.r * 6 + e * 26;
        ctx.globalAlpha = glowAlpha;
        ctx.drawImage(glow, n.x - glowSize / 2, n.y - glowSize / 2, glowSize, glowSize);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "rgba(" + (e > 0.4 ? CFG.hue.hot : CFG.hue.node) + "," + (twinkle + e * 0.8) + ")";
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + e * 1.6, 0, Math.PI * 2); ctx.fill();
      const since = now - n.lastFire;
      if (since < 500 && w > 0.02) {
        const k = since / 500;
        ctx.strokeStyle = "rgba(" + CFG.hue.hot + "," + (0.5 * (1 - k) * w) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, 4 + k * 26, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  root.addEventListener("pointermove", (e) => {
    const r = root.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
  });
  root.addEventListener("pointerleave", () => { mouse.active = false; });
  window.addEventListener("resize", resize);
  resize();
  if (reduceMotion) {
    for (const n of nodes) { n.energy = 0.3; }
    wakes = wakes.map(() => 1);
    tick(performance.now());
  } else {
    // pause the whole loop while the banner is scrolled off-screen
    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) start(); else cancelAnimationFrame(rafId);
    }, { threshold: 0 });
    io.observe(root);
  }
})();
