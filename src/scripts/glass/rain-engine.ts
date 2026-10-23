// Digital water drops for the site-wide background. Glowing droplets fall down a pixel grid, each dragging a fading
// trail of square "pixels" (some carry faint 0s and 1s), and land with a dashed ripple and a few pixel splashes.
//
// Calm, stepped motion in the spirit of Hubert's matrix rain: the scene advances in ticks (about every 48 ms on a
// computer, 64 ms on a phone) and only draws on a tick, so it runs at roughly 15 to 21 frames a second. Each drop has
// its own speed, 60 to 220 px a second with most on the slow side, and its position is snapped to the 7 px grid, so
// drops jump cell by cell at different rates. Drops start at random heights and wait a random moment before falling
// again, so the columns never move in step.
//
// The same engine runs in a background worker (OffscreenCanvas) where the browser allows it, and on the page otherwise.
// It never touches the DOM, so it is safe in both. Every frame is image copies and rectangles: no blur, no shadows, no
// text drawing (the glows and the 0/1 glyphs are drawn once into sprites).

export type RainCfg = {
  phone: boolean;
  dpr: number;
  max: number; // number of drops
  stepMs: number; // tick length; nothing moves or draws between ticks
  colors: [string, string, string]; // "r,g,b" for main, light and accent drops
};

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Drop = { z: number; col: number; rgb: string; y: number; v: number; len: number; land: number; data: boolean; glyphs: number[]; a: number; wait: number };
type Ripple = { x: number; y: number; r: number; max: number; a: number; rgb: string; z: number };
type Spark = { x: number; y: number; vx: number; vy: number; t: number; a: number; rgb: string };

export type RainApi = { resize(w: number, h: number): void; run(on: boolean): void; still(): void };

const CELL = 7;
const MIN_SPEED = 60;
const MAX_SPEED = 220;

export function rainEngine(canvas: AnyCanvas, cfg: RainCfg, frame: (cb: (t: number) => void) => void): RainApi {
  const { dpr, max, stepMs } = cfg;
  const [MAIN, LIGHT, ACCENT] = cfg.colors;
  const maybe = canvas.getContext('2d') as Ctx | null;
  if (!maybe) return { resize() {}, run() {}, still() {} };
  const ctx = maybe;
  const make = (w: number, h: number): AnyCanvas => {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };
  const sprite = (rgb: string) => {
    const s = make(30 * dpr, 48 * dpr);
    const g = s.getContext('2d') as Ctx;
    g.scale(dpr, dpr);
    const glow = g.createRadialGradient(15, 32, 0, 15, 32, 15);
    glow.addColorStop(0, `rgba(${rgb},.6)`); glow.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = glow; g.fillRect(0, 0, 30, 48);
    g.beginPath(); g.moveTo(15, 15); g.bezierCurveTo(17, 22, 21, 26, 21, 32); g.arc(15, 32, 6, 0, Math.PI); g.bezierCurveTo(9, 26, 13, 22, 15, 15); g.closePath();
    const body = g.createLinearGradient(9, 15, 21, 38);
    body.addColorStop(0, 'rgba(255,255,255,.95)'); body.addColorStop(0.55, `rgba(${rgb},.95)`); body.addColorStop(1, `rgba(${rgb},.75)`);
    g.fillStyle = body; g.fill();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(12.6, 30, 1.6, 0, Math.PI * 2); g.fill();
    return s;
  };
  const glyph = (ch: string, rgb: string) => {
    const s = make(8 * dpr, 11 * dpr);
    const g = s.getContext('2d') as Ctx;
    g.scale(dpr, dpr); g.font = '9px ui-monospace,Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = `rgb(${rgb})`; g.fillText(ch, 4, 5.5);
    return s;
  };
  const SPR: Record<string, AnyCanvas> = {};
  const GLY: Record<string, [AnyCanvas, AnyCanvas]> = {};
  for (const rgb of [MAIN, LIGHT, ACCENT]) { SPR[rgb] = sprite(rgb); GLY[rgb] = [glyph('0', rgb), glyph('1', rgb)]; }
  const pick = () => { const r = Math.random(); return r < 0.18 ? ACCENT : r < 0.45 ? LIGHT : MAIN; };

  let W = 1, H = 1, on = false, ticking = false, last = 0;
  let drops: Drop[] = [], ripples: Ripple[] = [], sparks: Spark[] = [];

  const spawn = (d: Drop, first: boolean): Drop => {
    const z = 0.45 + Math.random() * 0.55; // depth: near drops are bigger, brighter and land lower
    const r = Math.random();
    d.z = z; d.col = Math.round((Math.random() * W) / (CELL * 2)) * CELL * 2; d.rgb = pick();
    d.v = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * r * r; // most drops slow, a few quick
    d.y = first ? Math.random() * H * 1.1 - H * 0.3 : -30 - Math.random() * 80;
    d.wait = first ? 0 : Math.random() * 2.5; // a random pause before the column falls again
    d.len = 5 + Math.round(z * 9); d.land = H * (0.3 + Math.random() * 0.68);
    if (first && d.y > d.land) d.y = d.land * Math.random();
    d.data = Math.random() < 0.35; d.glyphs = Array.from({ length: d.len }, () => (Math.random() < 0.5 ? 0 : 1));
    d.a = 0.3 + z * 0.6;
    return d;
  };
  const step = (dt: number) => {
    for (const d of drops) {
      if (d.wait > 0) { d.wait -= dt; continue; }
      d.y += d.v * dt;
      if (d.data && Math.random() < 0.06) d.glyphs[(Math.random() * d.len) | 0] = Math.random() < 0.5 ? 0 : 1;
      if (d.y >= d.land) {
        if (ripples.length < 30) ripples.push({ x: d.col, y: d.land, r: 2, max: 14 + d.z * 30, a: d.a, rgb: d.rgb, z: d.z });
        if (sparks.length < 45) for (let k = 0; k < 3; k++) sparks.push({ x: d.col, y: d.land, vx: (Math.random() - 0.5) * 70 * d.z, vy: -(50 + Math.random() * 70) * d.z, t: 0, a: d.a, rgb: d.rgb });
        spawn(d, false);
      }
    }
    for (const r of ripples) r.r += (22 + r.z * 26) * dt;
    ripples = ripples.filter((r) => r.r < r.max);
    for (const s of sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 320 * dt; }
    sparks = sparks.filter((s) => s.t < 0.6);
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const d of drops) {
      if (d.wait > 0 || d.y < -30) continue;
      const top = Math.floor(d.y / CELL) * CELL; // snapped to the grid: the drop jumps cell by cell
      ctx.fillStyle = `rgb(${d.rgb})`; // trail: squares on the pixel grid, fading upward
      for (let k = 1; k <= d.len; k++) {
        const cy = top - k * CELL;
        if (cy < -CELL) break;
        ctx.globalAlpha = d.a * 0.7 * (1 - k / (d.len + 1));
        if (d.data && k % 3 === 2) ctx.drawImage(GLY[d.rgb][d.glyphs[k - 1]], d.col - 4, cy - 5.5, 8, 11);
        else { const sz = k < 3 ? 3 : 2; ctx.fillRect(d.col - sz / 2, cy - sz / 2, sz, sz); }
      }
      const s = 0.5 + d.z * 0.55;
      ctx.globalAlpha = d.a;
      ctx.drawImage(SPR[d.rgb], d.col - 15 * s, top - 32 * s, 30 * s, 48 * s);
    }
    ctx.lineWidth = 1.2;
    for (const r of ripples) {
      const f = 1 - r.r / r.max;
      ctx.strokeStyle = `rgb(${r.rgb})`;
      ctx.globalAlpha = r.a * f * 0.85; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = r.a * f * 0.55; ctx.setLineDash([]); ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * 0.5, r.r * 0.14, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (const s of sparks) { ctx.globalAlpha = s.a * (1 - s.t / 0.6); ctx.fillStyle = `rgb(${s.rgb})`; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 2, 2); }
    ctx.globalAlpha = 1;
  };
  const tick = (t: number) => {
    if (!on) { ticking = false; return; }
    frame(tick);
    if (last && t - last < stepMs) return; // nothing moves or draws between ticks
    const dt = last ? Math.min(0.12, (t - last) / 1000) : stepMs / 1000;
    last = t;
    step(dt); draw();
  };
  return {
    resize(w, h) {
      W = Math.max(1, w); H = Math.max(1, h);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!drops.length) drops = Array.from({ length: max }, () => spawn({} as Drop, true));
      else for (const d of drops) { if (d.col > W) d.col = Math.round((Math.random() * W) / (CELL * 2)) * CELL * 2; d.land = Math.min(d.land, H * 0.98); }
      if (!on) draw();
    },
    run(v) { on = v; if (on && !ticking) { ticking = true; last = 0; frame(tick); } },
    still() { for (let i = 0; i < 40; i++) step(stepMs / 1000); draw(); },
  };
}
