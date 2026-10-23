// Starts the site-wide background rain on the fixed canvas in the layout. 40 drops on a computer at a 48 ms tick;
// 16 drops on a phone at a 64 ms tick, drawn at 1x. Pauses while the tab is hidden. Reduced motion: no rain at all.
// Where the browser allows it the drawing runs in a background worker, so scrolling and taps never wait on it.
import { PHONE, RM, SHOT, tokenRgb } from './env';
import { rainEngine, type RainApi, type RainCfg } from './rain-engine';

function moduleWorkers(): boolean {
  let ok = false;
  try {
    const probe = { get type() { ok = true; return 'module' as const; } };
    new Worker(URL.createObjectURL(new Blob([''], { type: 'text/javascript' })), probe).terminate();
  } catch { /* not supported */ }
  return ok;
}

export function startRain(canvas: HTMLCanvasElement) {
  if (RM && !SHOT) return;
  const cfg: RainCfg = {
    phone: PHONE,
    dpr: PHONE ? 1 : Math.min(devicePixelRatio || 1, 2),
    max: PHONE ? 16 : 40,
    stepMs: PHONE ? 64 : 48,
    colors: [tokenRgb('--cool', '53,167,255'), tokenRgb('--ice', '150,215,255'), tokenRgb('--gold', '245,179,0')],
  };
  const size = (): [number, number] => { const r = canvas.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };

  let api: RainApi | null = null;
  if (!SHOT && 'transferControlToOffscreen' in canvas && 'Worker' in window && moduleWorkers()) {
    try {
      const worker = new Worker(new URL('./rain.worker.ts', import.meta.url), { type: 'module' });
      const off = canvas.transferControlToOffscreen();
      worker.postMessage({ canvas: off, cfg }, [off]);
      api = { resize: (w, h) => worker.postMessage({ size: [w, h] }), run: (on) => worker.postMessage({ on }), still: () => {} };
    } catch { api = null; }
  }
  if (!api) api = rainEngine(canvas, cfg, (cb) => { requestAnimationFrame(cb); });
  const a = api;
  a.resize(...size());
  if (SHOT) { a.still(); return; } // screenshots: one still frame
  let w = 0, h = 0;
  if ('ResizeObserver' in window) new ResizeObserver(() => { const [nw, nh] = size(); if (nw !== w || nh !== h) { w = nw; h = nh; a.resize(nw, nh); } }).observe(canvas);
  const sync = () => a.run(!document.hidden);
  document.addEventListener('visibilitychange', sync);
  sync();
}
