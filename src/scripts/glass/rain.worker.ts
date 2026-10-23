// Background worker for the hero rain: owns the OffscreenCanvas, so the page's main thread (scrolling, taps) never
// waits on the drawing.
import { rainEngine, type RainApi, type RainCfg } from './rain-engine';

type Msg = { canvas?: OffscreenCanvas; cfg?: RainCfg; size?: [number, number]; on?: boolean };

const scope = self as unknown as { requestAnimationFrame?: (cb: (t: number) => void) => number; addEventListener: typeof addEventListener };
const frame = scope.requestAnimationFrame
  ? (cb: (t: number) => void) => { scope.requestAnimationFrame!(cb); }
  : (cb: (t: number) => void) => { setTimeout(() => cb(performance.now()), 1000 / 30); };

let engine: RainApi | null = null;
scope.addEventListener('message', (e) => {
  const d = (e as MessageEvent<Msg>).data;
  if (d.canvas && d.cfg) engine = rainEngine(d.canvas, d.cfg, frame);
  else if (d.size) engine?.resize(d.size[0], d.size[1]);
  else if (typeof d.on === 'boolean') engine?.run(d.on);
});
