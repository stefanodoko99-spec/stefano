// The road (2026-09-26: "a big red road with the van, and the road being made
// as I scroll"). Between the front page's sheets lie lanes (index.html,
// .lane). In each, a red road crosses the page on a long S, and the band's
// own van drives it as the lane passes up the screen, laying the road behind
// it: what is behind the van is drawn, what is ahead is bare paper. The lanes
// run one way and the next the other, as one road down the page would, its
// turns off the page's edges.
//
// Everything is worked out from the laid-out page (layout()) as scroll
// positions and handed to the browser as keyframes on a ScrollTimeline: the
// road and the van move by transform alone, on the compositor, with the
// scroll itself, so on a phone they keep pace with the finger. The road is
// drawn out by a window sliding over it while the road inside slides back the
// same way, so it stands still as it appears. Where there is no ScrollTimeline
// the one clock moves them (update()). Without the band's van (no WebGL) the
// roads lie drawn and empty; with the press stopped, drawn, with the van
// parked halfway across each.
import gsap from 'gsap';
import { state, bus } from '../state.js';

const SVG = 'http://www.w3.org/2000/svg';
const STEPS = 32; // keyframes along one crossing
// the lane's middle at these heights of the screen: the van sets out, and has crossed
const FROM = 0.94;
const TO = 0.16;

const lerp = (a, b, t) => a + (b - a) * t;

/** The road across a lane W wide and H high: a cubic S from past one edge to past the other. */
function geometry(W, H, T, back, low) {
  const pad = T * 2.2;
  const y0 = H * (low ? 0.64 : 0.36);
  const y1 = H * (low ? 0.36 : 0.64);
  const x0 = back ? W + pad : -pad;
  const x1 = back ? -pad : W + pad;
  const P = [[x0, y0], [lerp(x0, x1, 0.42), y0], [lerp(x0, x1, 0.58), y1], [x1, y1]];
  const at = (t) => {
    const u = 1 - t;
    return [
      u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
    ];
  };
  // the road measured along its length, so the van keeps one speed on the S
  const table = [[0, 0]];
  let len = 0;
  let prev = at(0);
  for (let i = 1; i <= 240; i++) {
    const p = at(i / 240);
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    table.push([i / 240, len]);
    prev = p;
  }
  const along = (f) => {
    const s = f * len;
    let lo = 0;
    let hi = table.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (table[mid][1] < s) lo = mid; else hi = mid; }
    const [ta, sa] = table[lo];
    const [tb, sb] = table[hi];
    const t = lerp(ta, tb, sb > sa ? (s - sa) / (sb - sa) : 0);
    const p = at(t);
    const q = at(Math.min(1, t + 0.002));
    const r = at(Math.max(0, t - 0.002));
    return { x: p[0], y: p[1], angle: (Math.atan2(q[1] - r[1], q[0] - r[0]) * 180) / Math.PI };
  };
  const d = `M${P[0].map((v) => v.toFixed(1)).join(' ')}C${P.slice(1).map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' ')}`;
  return { d, pad, along };
}

export function initRoad(stage) {
  const lanes = [...document.querySelectorAll('[data-lane]')];
  if (!lanes.length) return null;

  const timeline = typeof ScrollTimeline === 'function'
    ? new ScrollTimeline({ source: document.scrollingElement || document.documentElement, axis: 'block' })
    : null;
  let sprite = null; // the band's van as a picture: { url, w, h }
  let built = null; // each lane's crossing, laid out
  let anims = [];
  let lastS = -1;

  // each lane's parts, made once: the window, the road in it, and the van
  const parts = lanes.map((lane, i) => {
    const clip = document.createElement('div');
    clip.className = 'lane__clip';
    const road = document.createElement('div');
    road.className = 'lane__road';
    const svg = document.createElementNS(SVG, 'svg');
    const paths = ['lane__edge', 'lane__tar', 'lane__line'].map((c) => {
      const p = document.createElementNS(SVG, 'path');
      p.setAttribute('class', c);
      return p;
    });
    svg.append(...paths);
    road.append(svg);
    clip.append(road);
    const van = document.createElement('img');
    van.className = 'lane__van';
    van.alt = '';
    van.decoding = 'async';
    van.hidden = true;
    lane.replaceChildren(clip, van);
    // one way, then the other; the S climbs, then falls
    return { lane, clip, road, svg, paths, van, back: i % 2 === 1, low: i % 4 < 2 };
  });

  // the band's van, printed at the height the lanes show it (again after PROOF re-inks the sheet)
  function paint(h) {
    const s = stage?.vanSprite?.(h);
    if (!s) return false;
    sprite = { url: s.canvas.toDataURL('image/png'), w: s.canvas.width / s.dpr, h: s.canvas.height / s.dpr, at: h };
    return true;
  }

  function layout() {
    const vh = window.innerHeight;
    const doc = document.scrollingElement || document.documentElement;
    const M = Math.max(1, doc.scrollHeight - vh);
    const sy = window.scrollY;
    return parts.map((p) => {
      const r = p.lane.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      const T = parseFloat(getComputedStyle(p.lane).getPropertyValue('--road')) || H * 0.4;
      const g = geometry(W, H, T, p.back, p.low);
      const mid = r.top + sy + H / 2;
      let s0 = mid - vh * FROM;
      let s1 = mid - vh * TO;
      // a lane the scroll cannot carry all the way is crossed in what the scroll has
      s0 = Math.max(0, s0);
      s1 = Math.min(M, s1);
      if (s1 - s0 < 40) s0 = Math.max(0, s1 - 40);
      return { ...p, W, H, T, g, s0, s1, M };
    });
  }

  // where everything stands at one point of a crossing (0 to 1)
  function pose(b, f) {
    const { g, W, T, back } = b;
    const at = g.along(f);
    const w = sprite ? (sprite.w * b.vanH) / sprite.h : 0;
    // the window shows the road up to the van's nose, so the van always stands on it; the
    // road slides back as far as the window slides on, so it stands still as it is drawn
    const shown = at.x + g.pad + (back ? -1 : 1) * w * 0.4;
    const clip = back ? shown : shown - (W + g.pad * 2);
    const q = { clip: `translateX(${clip.toFixed(1)}px)`, road: `translateX(${(-clip).toFixed(1)}px)`, van: 'none' };
    if (sprite) {
      // the wheels on the near half of the road, turned with it; going left, the van faces left
      const turn = back ? (((at.angle - 180 + 540) % 360) - 180) : at.angle;
      q.van = `translate(${(at.x - w / 2).toFixed(1)}px, ${(at.y - b.vanH * 0.86 + T * 0.14).toFixed(1)}px) rotate(${turn.toFixed(2)}deg)${back ? ' scaleX(-1)' : ''}`;
    }
    return q;
  }

  function clear() {
    anims.forEach((a) => a.cancel());
    anims = [];
  }

  function build() {
    clear();
    built = layout();
    const still = state.reduced;
    // the van as tall as the widest lane's road wants it
    const vanH = Math.round(Math.max(...built.map((b) => b.T)) * 1.28);
    if ((!sprite || sprite.at !== vanH) && !paint(vanH)) sprite = null;
    for (const b of built) {
      b.vanH = vanH;
      const Wc = b.W + b.g.pad * 2;
      b.svg.setAttribute('width', Wc.toFixed(0));
      b.svg.setAttribute('height', b.H.toFixed(0));
      b.svg.setAttribute('viewBox', `${(-b.g.pad).toFixed(1)} 0 ${Wc.toFixed(1)} ${b.H.toFixed(1)}`);
      b.paths.forEach((p) => p.setAttribute('d', b.g.d));
      b.clip.style.width = b.road.style.width = `${Wc.toFixed(1)}px`;
      b.clip.style.left = `${(-b.g.pad).toFixed(1)}px`;
      b.lane.style.setProperty('--dash', `${(b.T * 0.52).toFixed(1)}px ${(b.T * 0.42).toFixed(1)}px`);
      b.van.hidden = !sprite;
      if (sprite) {
        if (b.van.src !== sprite.url) b.van.src = sprite.url;
        b.van.style.height = `${vanH}px`;
        b.van.style.width = `${((sprite.w * vanH) / sprite.h).toFixed(1)}px`;
      }
      // no van, or the press stopped: the road lies drawn, the van parked halfway
      if (!sprite || still) {
        const end = pose(b, 1);
        b.clip.style.transform = end.clip;
        b.road.style.transform = end.road;
        b.van.style.transform = sprite ? pose(b, 0.5).van : '';
        continue;
      }
      if (timeline) {
        const frames = { clip: [], road: [], van: [] };
        const put = (s, f) => {
          const o = Math.min(1, Math.max(0, s / b.M));
          const q = pose(b, f);
          frames.clip.push({ offset: o, transform: q.clip });
          frames.road.push({ offset: o, transform: q.road });
          frames.van.push({ offset: o, transform: q.van });
        };
        put(0, 0);
        for (let k = 0; k <= STEPS; k++) put(lerp(b.s0, b.s1, k / STEPS), k / STEPS);
        put(b.M, 1);
        for (const [el, key] of [[b.clip, 'clip'], [b.road, 'road'], [b.van, 'van']]) {
          el.style.transform = '';
          anims.push(el.animate(frames[key], { timeline, fill: 'both', easing: 'linear' }));
        }
      }
    }
    lastS = -1;
    update();
  }

  function update() {
    if (!built || anims.length || state.reduced || !sprite) return;
    const s = state.scroll;
    if (s === lastS) return;
    lastS = s;
    for (const b of built) {
      const q = pose(b, Math.min(1, Math.max(0, (s - b.s0) / (b.s1 - b.s0))));
      b.clip.style.transform = q.clip;
      b.road.style.transform = q.road;
      b.van.style.transform = q.van;
    }
  }

  let call = null;
  const soon = () => { call?.kill(); call = gsap.delayedCall(0.15, build); };
  new ResizeObserver(soon).observe(document.body);
  for (const e of ['refit', 'lang', 'resize', 'edition', 'still']) bus.on(e, soon);
  // PROOF re-inks the sheet: the van is printed again in the new inks
  bus.on('proof', () => { if (sprite) paint(sprite.at); soon(); });
  build();
  return { update, build };
}
