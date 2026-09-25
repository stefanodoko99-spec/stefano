// One WebGL canvas over the whole sheet. Each frame it draws only what is
// on screen: the engraving band into its box, the work plates into theirs,
// and the brayer wherever it is rolling. It is called by the one clock in
// main.js and never runs a loop of its own.
import * as THREE from 'three';
import { shared, srgb } from './engrave.js';
import { createBand } from './band.js';
import { createBrayer } from './brayer.js';
import { createPlates } from './plates.js';
import { createFluid } from './fluid.js';
import { state, bus, clamp } from '../state.js';
import { roller } from '../ui/ink.js';
import { sound } from '../ui/press.js';
import { sunNow } from '../sun.js';
import { weatherNow } from '../weather.js';

// a finger's lens is larger than the pointer's (it is read at arm's length),
// but no taller than a phone's short plate can show
const touchLens = (r) => Math.min(124, r.width * 0.36, r.height * 0.46);

const compositeFrag = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tVel;
  uniform vec4 uVelRect;    // where the screen is in the drawing buffer: x, y, width, height (device px)
  uniform vec2 uView;
  uniform float uDpr;
  uniform vec3 uPaper;
  uniform vec3 uInk;
  uniform vec3 uRed;
  uniform float uSplit;
  uniform float uRadius;    // css px
  varying vec2 vUv;
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
  void main() {
    vec2 uv = vUv;
    vec2 px = uv * uView;
    // the wet ink lies over the screen, wherever the screen is on the canvas
    vec2 vel = texture2D(tVel, (gl_FragCoord.xy - uVelRect.xy) / uVelRect.zw).xy;
    vec2 k = 1.0 / uView;
    // the black plate and the red plate slip apart where the ink is stirred
    vec2 offB = vel * 0.16 * k;
    vec2 offR = -vel * 0.26 * k + vec2(1.1, -0.8) * k;
    vec4 A = texture2D(tScene, uv + offB);
    vec4 B = texture2D(tScene, uv + offR);
    float ink = A.r;
    float red = mix(1.0, B.g, B.a);
    float starve = smoothstep(0.74, 0.96, vnoise(px * 0.011 + 11.0)) * 0.13 + step(0.9965, hash12(floor(px * 1.3))) * 0.55;
    red *= 1.0 - starve;
    vec3 redCol = uRed * (0.93 + 0.09 * vnoise(px * 0.06));
    vec3 paper = uPaper * (0.97 + 0.05 * hash12(floor(px * 0.6)));
    vec3 col = mix(paper, redCol, clamp(red, 0.0, 1.0));
    float pin = 1.0 - step(0.995, hash12(floor(px * 1.1) + 3.0)) * 0.85;
    col = mix(col, uInk, clamp(ink, 0.0, 1.0) * pin);
    // the heavy ink ground under each cut, with a paper hairline above it
    float panelH = uSplit > 0.5 ? uView.y * 0.5 : uView.y;
    float by = mod(uv.y * uView.y, panelH);
    float ground = step(by, 11.0) * (1.0 - step(0.992, hash12(floor(px * 0.9) + 9.0)) * 0.8);
    col = mix(col, uPaper, step(12.5, by) * step(by, 14.5));
    col = mix(col, uInk, ground);
    // two panels on a narrow sheet: a paper gutter with a rule down its middle
    if (uSplit > 0.5) {
      float d = abs(uv.y - 0.5) * uView.y;
      col = mix(col, uPaper, step(d, 6.0));
      col = mix(col, uInk, step(d, 1.2));
    }
    // the rounded corners of the box it is drawn into (style.css): outside
    // them the canvas is left clear, so the paper shows; written premultiplied
    vec2 rq = abs(px - uView * 0.5) - (uView * 0.5 - uRadius);
    float rd = length(max(rq, 0.0)) + min(max(rq.x, rq.y), 0.0) - uRadius;
    float ra = uRadius > 0.0 ? 1.0 - smoothstep(-0.7, 0.7, rd) : 1.0;
    gl_FragColor = vec4(col * ra, ra);
  }
`;
const fullVert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function fullTri() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return g;
}

export function createStage(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, stencil: false, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); return null; }
  const dpr = Math.min(window.devicePixelRatio || 1, state.mobile ? 2 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  shared.uLineScale.value = dpr;

  const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  // the engraving band (and the wet ink it is stirred with) only where a sheet
  // carries one; the other sheets need just the plates and the brayer
  const hasBand = !!document.querySelector('[data-gl="band"], [data-edition]');
  const band = hasBand ? createBand() : null;
  const bandRT = new THREE.WebGLRenderTarget(4, 4, { samples: hasBand ? 4 : 0, depthBuffer: hasBand });
  const composite = new THREE.Mesh(fullTri(), new THREE.ShaderMaterial({
    vertexShader: fullVert,
    fragmentShader: compositeFrag,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: bandRT.texture },
      tVel: { value: null },
      uVelRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uView: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: dpr },
      uPaper: shared.uPaper,
      uInk: shared.uInk,
      uRed: shared.uRed,
      uSplit: { value: 0 },
      uRadius: { value: 0 },
    },
  }));
  composite.frustumCulled = false;

  const plates = createPlates();
  const brayer = createBrayer();
  const overlay = new THREE.Scene();
  overlay.add(brayer.group);
  const overlayCam = new THREE.PerspectiveCamera(20, 1, 1, 20000);
  const fluid = hasBand ? createFluid(renderer) : null;
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  blank.needsUpdate = true;

  let bandEls = [...document.querySelectorAll('[data-gl="band"]')];
  // each band's corner radius (style.css .band), read once and again after a resize
  let radii = new WeakMap();
  const radiusOf = (el) => {
    let v = radii.get(el);
    if (v === undefined) { v = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0; radii.set(el, v); }
    return v;
  };
  bus.on('edition', () => { bandEls = [...document.querySelectorAll('[data-gl="band"]')]; });
  let vw = 0, vh = 0;
  const buf = new THREE.Vector2();
  let drewLast = true;

  // A phone scrolls the page itself, between this script's frames (Safari on
  // the iPhone above all), so a canvas fixed to the screen drew the band and
  // the plates where the page had been a frame before: they trailed the
  // finger. On a phone the canvas is part of the page instead (onPage). It
  // covers the screen and a margin above and below it, scrolls with the type
  // around it, and is set back over the screen only once the page has carried
  // it a good way. Its holder is exactly as tall as the page and clips it, so
  // the canvas never lengthens the page. A tablet scrolls itself the same way,
  // so it draws on the page too; its case sheets, held on screen while read,
  // have canvases of their own (below). A screen with a mouse keeps the canvas
  // fixed: Lenis moves its page in the same frame as the drawing.
  const onPage = state.mobile || !state.fine;
  let holder = null;
  let ch = 0;         // the canvas's height, css px (the screen's, when fixed)
  let cw = 0;
  let over = 0;       // the margin drawn above and below the screen
  let cTop = 0;       // where the canvas's top is on screen this frame
  let anchor = 0;     // where the canvas's top is on the page
  let pageH = 0, holderH = -1;
  let reanchor = true;
  if (onPage) {
    holder = document.createElement('div');
    holder.className = 'gl-page';
    holder.setAttribute('aria-hidden', 'true');
    canvas.before(holder);
    holder.appendChild(canvas);
  }

  // A tablet holds each case sheet on screen while it is read (sticky), which
  // a canvas scrolled with the page cannot follow, and a canvas fixed to the
  // screen trails the sheets as they come and go. So each case sheet has a
  // canvas of its own, inside it: it moves with its sheet, held or not, and
  // the next sheet laid over it covers it as paper covers paper. The sheet's
  // plates and the brayer on its name are drawn there, and only when they
  // change: a scroll alone carries the drawing with the sheet. Drawn at the
  // screen's own density, it is sharp without the page canvas's smoothing.
  // A sheet out of sight (off the screen, or under the next one) lets its
  // drawing go after a moment and draws it again on its return, so at most
  // two sheets hold one: the one being read and the one laid over it.
  const sheets = [];
  const sheetOfKey = new Map();
  if (onPage && !state.mobile) {
    document.querySelectorAll('[data-case] > .case__sheet').forEach((el) => {
      const c = document.createElement('canvas');
      c.className = 'gl-case';
      c.setAttribute('aria-hidden', 'true');
      el.append(c);
      let r;
      try {
        r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: false, premultipliedAlpha: true, stencil: false, powerPreference: 'high-performance' });
      } catch (e) {
        c.remove();
        return;
      }
      const sd = Math.min(window.devicePixelRatio || 1, 2);
      r.setPixelRatio(sd);
      r.setClearColor(0x000000, 0);
      r.autoClear = false;
      // w, h: the sheet's size as measured; bw, bh: the size its drawing is kept at (0: let go)
      const s = { el, canvas: c, renderer: r, dpr: sd, buf: new THREE.Vector2(1, 1), left: 0, top: 0, w: 0, h: 0, bw: 0, bh: 0, seen: 0, on: false, live: [], forced: 2, dirty: false, brayer: false, lost: false };
      c.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        s.lost = true;
        // its pictures are printed by the page again
        el.querySelectorAll('.plate.is-gl').forEach((f) => f.classList.remove('is-gl'));
      });
      el.querySelectorAll('[data-ink]').forEach((h) => sheetOfKey.set(h.dataset.ink, s));
      sheets.push(s);
    });
  }

  function resize() {
    vw = state.vw; vh = state.vh;
    if (onPage) {
      // sized for the tallest the screen gets, so the address bar coming and
      // going as the page scrolls never re-sizes the canvas mid-scroll
      const tall = Math.max(vh, window.screen?.height || 0);
      over = Math.round(tall * 0.3);
      const want = Math.ceil(tall + over * 2);
      if (want !== ch || vw !== cw) {
        ch = want; cw = vw;
        renderer.setSize(vw, ch, false);
        canvas.style.height = `${ch}px`;
      }
      reanchor = true;
    } else {
      ch = vh; cw = vw;
      renderer.setSize(vw, vh, false);
    }
    renderer.getDrawingBufferSize(buf);
    overlayCam.aspect = vw / vh;
    overlayCam.position.set(0, 0, vh / 2 / Math.tan(THREE.MathUtils.degToRad(10)));
    overlayCam.near = 10; overlayCam.far = overlayCam.position.z * 3;
    overlayCam.updateProjectionMatrix();
    fluid?.resize(vw, vh);
    band?.setLineSpacing(4.4 * dpr);
    // the case sheets' canvases follow their sheets' size, measured each frame
    for (const s of sheets) s.forced = 2;
  }
  resize();

  // Compile every shader while the intro is still counting, so the first
  // stir, the first plate and the first pass of the brayer cost nothing.
  function warm() {
    if (band) {
      band.aim(4, 'full');
      band.revealSky();
      renderer.setRenderTarget(bandRT);
      renderer.compile(band.scene, band.camera);
      renderer.setRenderTarget(null);
      renderer.compile(composite, orthoCam);
    }
    renderer.compile(overlay, overlayCam);
    // The plates' program, linked through a probe plate that is never drawn.
    // Its material is never disposed: that keeps the program for the real
    // plates, and disposing it deleted the program while Chrome was still
    // linking it, which logged 12 GL warnings on sheets without the band.
    const probe = plates.add(document.createElement('figure').appendChild(document.createElement('img')).parentElement, []);
    plates.list.splice(plates.list.indexOf(probe), 1);
    renderer.compile(probe.mesh, orthoCam);
    // each case sheet's canvas links the plates' and the brayer's programs too
    for (const s of sheets) {
      s.renderer.compile(probe.mesh, orthoCam);
      s.renderer.compile(overlay, overlayCam);
    }
    fluid?.warm();
  }
  warm();
  if (import.meta.env.DEV && band) console.info(`band: ${band.draws} meshes after merging`);
  // for checks in development only (the weather's storm state, band.debugWeather)
  if (import.meta.env.DEV && band) window.__sdBand = band;

  // Rects are measured on screen; the canvas's own top is cTop there (0 when
  // it is fixed). GL counts up from the canvas's bottom edge.
  const glY = (bottom) => ch - (bottom - cTop);

  // scissor to the part of a rect that is on the canvas and above an occluding sheet
  function clipTo(r, occTop = Infinity) {
    const top = Math.max(cTop, r.top), bottom = Math.min(cTop + ch, r.bottom, occTop);
    const left = Math.max(0, r.left), right = Math.min(vw, r.right);
    if (bottom <= top || right <= left) return false;
    renderer.setScissor(left, glY(bottom), right - left, bottom - top);
    renderer.setScissorTest(true);
    return true;
  }

  const p = state.pointer;
  const bands = [];
  const live = [];

  // With no pointer to stir it (a phone), a tap on the band flicks the wet
  // ink outward from the fingertip. The events only note the tap; the frame
  // splats it, so the one clock stays the only thing that draws.
  const taps = [];
  if (fluid && !state.fine) {
    let down = null;
    window.addEventListener('pointerdown', (e) => {
      // a tap on the band, but not on its sun, which is a button of its own
      down = e.pointerType === 'touch' && !state.reduced && e.target.closest?.('[data-gl="band"]') && !e.target.closest('[data-sky]') ? { x: e.clientX, y: e.clientY, t: e.timeStamp } : null;
    }, { passive: true });
    window.addEventListener('pointerup', (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && e.timeStamp - down.t < 350) taps.push([e.clientX, e.clientY]);
      down = null;
    }, { passive: true });
    window.addEventListener('pointercancel', () => { down = null; }, { passive: true });
  }
  // a desktop re-cuts the band at 30 fps; a phone every frame, up to about
  // 60 fps (every other frame on a 120 Hz screen), so the van drives smoothly
  const bandEvery = state.mobile ? 1 / 75 : 1 / 30;
  let lastScroll = -1, lastRX = NaN, lastRY = NaN, lastRV = false, bandAcc = 1, forced = 2;
  // the engraving's sun is set where the sun stands over Albania, again each half minute
  let sunAt = -Infinity;
  // and its sky takes Albania's weather, asked when the band is first near the
  // screen and again each half hour (the Worker asks MET Norway no more often)
  let wxAt = -Infinity;
  // The night edition's inks for what is drawn here: the page goes dark, and
  // its pictures (the engraving, the plates, the brayer) print as by lamplight,
  // a dimmer paper under the same black and the red flood deepened. They
  // cross-fade with the page's colours (0.8s, src/style.css).
  const INKS = { day: { paper: srgb('#EFE6D2'), red: srgb('#E23B2E') }, night: { paper: srgb('#B4AA95'), red: srgb('#8A271D') } };
  let nightK = state.night ? 1 : 0;
  const paintInks = () => {
    const e = nightK * nightK * (3 - 2 * nightK);
    shared.uPaper.value.lerpVectors(INKS.day.paper, INKS.night.paper, e);
    shared.uRed.value.lerpVectors(INKS.day.red, INKS.night.red, e);
  };
  paintInks();
  // the button over the engraving's sun (or moon), and where it was last set
  const skyBtn = document.querySelector('[data-sky]');
  const skyBand = skyBtn?.closest('[data-gl="band"]') || null;
  let skyRect = null, skyEdge = 0;
  const skyAt = { left: NaN, top: NaN, d: 0 };
  // a phone's tilt (src/ui/tilt.js keeps its last reading): where it is held
  // (a hold that drifts to it over a few seconds), and the lean from that hold
  const tilt = { x: 0, y: 0, hx: 0, hy: 0, held: false, moving: false };
  // the page's canvas shows the brayer (as last drawn); where the brayer rolls:
  // on the page (null) or on a case sheet's canvas
  let pageBrayer = false;
  let brayerAt = null;
  const force = () => { forced = 2; for (const s of sheets) s.forced = 2; };
  bus.on('refit', () => { force(); bandAcc = 1; reanchor = true; });
  bus.on('resize', () => { force(); bandAcc = 1; reanchor = true; radii = new WeakMap(); });
  bus.on('lang', () => { force(); reanchor = true; });
  bus.on('proof', force);

  // what is on screen this frame: reads only, done in the tick's read phase.
  // On the page the canvas reaches past the screen, and may be moved this
  // frame, so everything within reach of it is measured. A case sheet on
  // screen has all its plates measured: its canvas holds the whole sheet.
  function measure() {
    bands.length = 0;
    live.length = 0;
    let lo = 0, hi = vh;
    if (onPage) {
      cTop = canvas.getBoundingClientRect().top;
      pageH = document.body.offsetHeight;
      lo = -over * 1.6; hi = vh + over * 1.6;
    }
    skyRect = null;
    for (const el of bandEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom > lo && r.top < hi && r.width > 0) {
        r.radius = radiusOf(el);
        bands.push(r);
        // the band's own top rule, which its button is placed inside of
        if (el === skyBand) { skyRect = r; skyEdge = el.clientTop; }
      }
    }
    let prev = null;
    for (const s of sheets) {
      s.live.length = 0;
      const r = s.canvas.getBoundingClientRect();
      s.left = r.left;
      s.top = r.top;
      s.w = r.width;
      s.h = r.height;
      // on screen or within half a screen of it, so it is drawn before it shows
      s.on = !s.lost && r.bottom > -vh * 0.5 && r.top < vh * 1.5 && r.width > 0;
      // the sheet before, with this one laid square over it, is out of sight
      if (prev?.on && s.on && r.top <= prev.top + 0.5) prev.on = false;
      prev = s;
    }
    for (const pl of plates.list) {
      if (!pl.ready) continue;
      const s = pl.sheet;
      if (s) {
        if (s.lost) { pl.figure.classList.remove('is-gl'); continue; }
        if (!s.on) continue;
        const r = pl.imgEl.getBoundingClientRect();
        if (r.width > 4 && r.bottom > s.top && r.top < s.top + s.h) {
          pl.rect = r;
          pl.occTop = Infinity;
          s.live.push(pl);
        }
        continue;
      }
      const r = pl.imgEl.getBoundingClientRect();
      if (r.bottom > lo && r.top < hi && r.width > 4) {
        pl.rect = r;
        pl.occTop = pl.occluder ? pl.occluder.getBoundingClientRect().top : Infinity;
        live.push(pl);
      }
    }
  }

  // A plate's loupe and development this frame, and whether it needs drawing
  // again: its lens moved, it developed, or it no longer sits where it was
  // drawn on its canvas (ox, oy: where that canvas's corner is on screen).
  const tl = state.touchLoupe;
  function tend(pl, dt, ox, oy) {
    const r = pl.rect;
    let changed = false;
    const pointer = state.fine && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
    const touch = tl.on && tl.fx >= r.left && tl.fx <= r.right && tl.fy >= r.top && tl.fy <= r.bottom;
    // where the lens sits; kept where it was while it closes. A held finger's
    // lens is lifted above it, but kept on the picture (a phone's plates are
    // short, and the lens is drawn inside its plate); a tapped letter's lens
    // sits on its detail, wherever that is.
    if (touch) {
      const R = touchLens(r);
      pl.lx = tl.x;
      pl.ly = tl.until ? tl.y : Math.max(r.top + R * 0.55, Math.min(r.bottom - R * 0.55, tl.y));
      pl.touch = true;
    } else if (pointer) { pl.lx = p.x; pl.ly = p.y; pl.touch = false; }
    const target = pointer || touch ? 1 : 0;
    if (Math.abs(target - pl.loupe) > 0.002 || (pointer && p.moved) || (touch && tl.moved)) changed = true;
    pl.loupe += (target - pl.loupe) * Math.min(1, dt * 12);
    if (Math.abs(target - pl.loupe) < 0.002) pl.loupe = target;
    if (pl.develop !== pl.drawnDevelop || pl.leader !== pl.drawnLeader) changed = true;
    const at = pl.at;
    if (!at || Math.abs(at[0] - (r.left - ox)) > 0.25 || Math.abs(at[1] - (r.top - oy)) > 0.25 || Math.abs(at[2] - r.width) > 0.25 || Math.abs(at[3] - r.height) > 0.25) changed = true;
    return changed;
  }

  // A phone's lean this frame, from its last reading. The hold drifts toward
  // the way the phone is held (over about four seconds), so a tilt leans the
  // light off the sun and the view with it, and both settle back as the phone
  // is held still. Nothing leans with the press stopped.
  function lean(dt) {
    const o = state.tilt;
    if (!o.on || state.reduced) { tilt.held = false; tilt.moving = false; return false; }
    if (!tilt.held) { tilt.hx = o.x; tilt.hy = o.y; tilt.held = true; }
    const k = Math.min(1, dt / 4);
    tilt.hx += (o.x - tilt.hx) * k;
    tilt.hy += (o.y - tilt.hy) * k;
    const x = clamp((o.x - tilt.hx) / 20, -1, 1), y = clamp((o.y - tilt.hy) / 20, -1, 1);
    tilt.moving = Math.abs(x - tilt.x) > 0.003 || Math.abs(y - tilt.y) > 0.003;
    tilt.x += (x - tilt.x) * Math.min(1, dt * 10);
    tilt.y += (y - tilt.y) * Math.min(1, dt * 10);
    return true;
  }

  // a plate's uniforms, for the canvas it is drawn on (ox, oy: that canvas's corner on screen)
  function setPlate(pl, size, density, ox, oy) {
    const r = pl.rect;
    const u = pl.mat.uniforms;
    u.uMouse.value.set((pl.lx ?? p.x) - r.left, (pl.ly ?? p.y) - r.top);
    u.uLoupe.value = pl.loupe;
    u.uLoupeR.value = pl.touch ? touchLens(r) : Math.min(96, r.width * 0.26);
    u.uDevelop.value = state.reduced ? 1 : pl.develop;
    u.uLeader.value = state.reduced ? 1 : pl.leader;
    pl.drawnDevelop = pl.develop;
    pl.drawnLeader = pl.leader;
    pl.at = [r.left - ox, r.top - oy, r.width, r.height];
    u.uView.value.set(r.width, r.height);
    u.uCanvas.value.copy(size);
    u.uDpr.value = density;
  }

  function frame(t, dt) {
    shared.uTime.value = t;
    // the night edition's inks cross-fade with the page's colours; everything
    // drawn is drawn again in them while they do
    const nightTo = state.night ? 1 : 0;
    if (nightK !== nightTo) {
      nightK = state.reduced ? nightTo : nightK < nightTo ? Math.min(nightTo, nightK + dt / 0.8) : Math.max(nightTo, nightK - dt / 0.8);
      paintInks();
      force();
    }
    // stir the ink where there is ink to stir
    let stirred = false;
    if (fluid && p.moved && state.fine && !state.reduced) {
      for (const r of bands) {
        if (p.x > r.left - 40 && p.x < r.right + 40 && p.y > r.top - 40 && p.y < r.bottom + 40) {
          fluid.splat(p.x / vw, 1 - p.y / vh, p.vx, -p.vy);
          stirred = true;
          break;
        }
      }
    }
    if (taps.length) {
      // a ring of pushes outward from the tap, over four frames and fading,
      // the way a mouse stirs over many (one push in one frame barely shows)
      for (const tap of taps) {
        if (tap[2] === undefined) { tap[2] = 4; sound.splat(); }
        const [x, y, left] = tap;
        const k = left / 4;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2, ox = Math.cos(a), oy = Math.sin(a);
          fluid.splat((x + ox * 9) / vw, 1 - (y + oy * 9) / vh, ox * 52 * k, -oy * 52 * k);
        }
        tap[2] = left - 1;
      }
      for (let i = taps.length - 1; i >= 0; i--) if (taps[i][2] <= 0) taps.splice(i, 1);
      stirred = true;
    }
    const stirring = fluid ? fluid.step(dt) : false;
    const vel = fluid && (stirring || fluid.awake) ? fluid.texture : blank;

    // the brayer rolls on the canvas of the sheet whose head it inks, and
    // fades out where it last rolled
    const brayerOn = roller.visible || brayer.group.visible;
    if (roller.visible) brayerAt = sheetOfKey.get(roller.key) || null;
    const brayerMoved = brayerOn && (roller.x !== lastRX || roller.y !== lastRY || roller.visible !== lastRV || brayer.fading);
    lastRX = roller.x;
    lastRY = roller.y;
    lastRV = roller.visible;

    // a finger's loupe (a phone): on the plate under the finger, the lens just above it
    if (tl.on && tl.until && performance.now() > tl.until) { tl.on = false; tl.until = 0; tl.moved = 1; }
    let platesChanged = false;
    for (const pl of live) if (tend(pl, dt, 0, cTop)) platesChanged = true;
    for (const s of sheets) for (const pl of s.live) if (tend(pl, dt, s.left, s.top)) s.dirty = true;
    tl.moved = 0;

    if (brayerOn) brayer.place(roller, vw, vh, dt);
    const brayerShown = brayerOn && brayer.group.visible;

    drawPage(t, dt, { stirring, stirred, vel, platesChanged, brayerOn, brayerMoved, brayerShown });
    for (const s of sheets) drawSheet(s, t, brayerMoved, brayerShown);
  }

  // the page's canvas (or the screen's): the band, the plates off the case
  // sheets, and the brayer on the page's heads
  function drawPage(t, dt, f) {
    const brayerHere = f.brayerOn && !brayerAt;
    if (!bands.length && !live.length && !brayerHere) {
      if (drewLast) { renderer.setRenderTarget(null); renderer.setScissorTest(false); renderer.clear(); drewLast = false; }
      pageBrayer = false;
      return;
    }

    // On the page: the canvas is set back over the screen once the page has
    // carried it half its margin (or when a resize asks), and everything is
    // drawn again where it now is. Kept within the page, whole pixels down it.
    let anchored = false;
    if (onPage) {
      if (pageH !== holderH) { holderH = pageH; holder.style.height = `${pageH}px`; }
      const most = Math.max(0, holderH - ch);
      const want = Math.round(Math.min(most, Math.max(0, anchor - cTop - over)));
      if (reanchor || Math.abs(want - anchor) > over * 0.5 || (want !== anchor && (want === 0 || want >= most))) {
        cTop += want - anchor;
        anchor = want;
        canvas.style.transform = `translate3d(0, ${anchor}px, 0)`;
        reanchor = false;
        anchored = true;
      }
    }

    // Draw only when something changed. The engraving itself is re-cut at
    // 30 fps on a desktop and every frame on a phone (bandEvery), or every
    // frame while the pointer works it.
    // A canvas on the page needs nothing for a scroll alone: what it drew
    // moves with the page.
    const scrolled = !onPage && state.scroll !== lastScroll;
    lastScroll = state.scroll;
    const br = bands[0];
    const insideBand = !!br && state.fine && p.x >= br.left && p.x <= br.right && p.y >= br.top && p.y <= br.bottom;
    bandAcc += dt;
    if (br && t - sunAt > 30) {
      band.setSun(sunNow());
      sunAt = t;
      forced = Math.max(forced, 1);
    }
    if (br && t - wxAt > 1800) {
      wxAt = t;
      weatherNow().then((w) => {
        state.weather = w;
        band.setWeather(w);
        forced = Math.max(forced, 1);
        bus.emit('weather', w);
      });
    }
    const leaning = !!br && lean(dt);
    const bandDue = !!br && (forced > 0 || band.morphing || (!state.reduced && (insideBand || tilt.moving || bandAcc >= bandEvery)));
    // the brayer moved here, or has gone from here to a case sheet
    const brayerChanged = brayerHere ? f.brayerMoved : pageBrayer;
    if (!(scrolled || anchored || bandDue || f.stirring || f.stirred || f.platesChanged || brayerChanged || forced > 0)) return;
    if (forced > 0) forced--;

    drewLast = true;
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, vw, ch);
    renderer.clear();
    const s = buf.y / ch; // device px to a css px, as the drawing buffer was rounded
    shared.uLineScale.value = dpr;

    // the band (the front page's, or the next edition's copy of it)
    if (br) {
      const w = Math.max(4, Math.round(br.width * dpr)), h = Math.max(4, Math.round(br.height * dpr));
      const resized = bandRT.width !== w || bandRT.height !== h;
      if (resized) bandRT.setSize(w, h);
      const aspect = br.width / br.height;
      const split = aspect < 2.4;
      if (bandDue || resized) {
        band.update(t, Math.min(bandAcc, 0.1), {
          px: ((p.x - br.left) / br.width) * 2 - 1,
          py: ((p.y - br.top) / br.height) * 2 - 1,
          inside: insideBand,
          still: state.reduced,
          tilt: leaning ? tilt : null,
          night: state.night,
        });
        bandAcc = 0;
        shared.uRes.value.set(w, h);
        bandRT.scissorTest = false;
        bandRT.viewport.set(0, 0, w, h);
        renderer.setRenderTarget(bandRT);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        if (!split) {
          band.aim(aspect, 'full');
          renderer.render(band.scene, band.camera);
        } else {
          const hh = Math.floor(h / 2);
          for (const [panel, y, ph] of [['left', hh, h - hh], ['right', 0, hh]]) {
            bandRT.viewport.set(0, y, w, ph);
            bandRT.scissor.set(0, y, w, ph);
            bandRT.scissorTest = true;
            renderer.setRenderTarget(bandRT);
            shared.uRes.value.set(w, ph);
            band.aim(w / ph, panel);
            renderer.render(band.scene, band.camera);
          }
          bandRT.scissorTest = false;
          bandRT.viewport.set(0, 0, w, h);
        }
        renderer.setRenderTarget(null);
        placeSky();
      }
      const u = composite.material.uniforms;
      u.uSplit.value = split ? 1 : 0;
      u.tVel.value = f.vel;
      u.uVelRect.value.set(0, glY(vh) * s, buf.x, vh * s);
      for (const r of bands) {
        u.uView.value.set(r.width, r.height);
        u.uRadius.value = r.radius || 0;
        renderer.setViewport(r.left, glY(r.bottom), r.width, r.height);
        if (clipTo(r)) renderer.render(composite, orthoCam);
        renderer.setScissorTest(false);
      }
    }

    // the plates
    for (const pl of live) {
      const r = pl.rect;
      setPlate(pl, buf, dpr, 0, cTop);
      renderer.setViewport(r.left, glY(r.bottom), r.width, r.height);
      if (clipTo(r, pl.occTop)) renderer.render(pl.mesh, orthoCam);
      renderer.setScissorTest(false);
    }

    // the brayer
    pageBrayer = false;
    if (brayerHere && f.brayerShown) {
      // drawn into the part of the canvas that is the screen, as its camera sees it
      shared.uRes.value.set(buf.x, vh * s);
      shared.uLight.value.set(-0.45, 0.8, 0.62).normalize();
      renderer.setViewport(0, glY(vh), vw, vh);
      if (roller.clipBottom < vh) {
        if (clipTo({ top: 0, bottom: vh, left: 0, right: vw }, roller.clipBottom)) renderer.render(overlay, overlayCam);
      } else {
        renderer.render(overlay, overlayCam);
      }
      renderer.setScissorTest(false);
      pageBrayer = true;
    }
  }

  // The button over the engraving's sun (or moon): set where the body stands
  // in the panel that draws it, as large as it is drawn (at least 48px, a
  // finger's press). It sits over the canvas, so its focus ring shows. Moved
  // only when it has moved by more than a pixel.
  function placeSky() {
    if (!skyBtn || !skyRect) return;
    const r = skyRect;
    const split = r.width / r.height < 2.4;
    const panel = split ? band.skyPanel() : 'full';
    const ph = split ? r.height / 2 : r.height;
    const at = band.project(r.width / ph, panel);
    if (!at) { if (!skyBtn.hidden) skyBtn.hidden = true; return; }
    const d = Math.round(Math.min(160, Math.max(48, at.r * r.width * 2.2)));
    const cx = (at.x * 0.5 + 0.5) * r.width;
    const cy = (0.5 - at.y * 0.5) * ph + (panel === 'right' ? r.height - ph : 0);
    const left = Math.round(cx - d / 2), top = Math.round(cy - d / 2 - skyEdge);
    if (skyBtn.hidden) skyBtn.hidden = false;
    if (Math.abs(left - skyAt.left) > 1 || Math.abs(top - skyAt.top) > 1 || d !== skyAt.d) {
      skyAt.left = left; skyAt.top = top; skyAt.d = d;
      skyBtn.style.left = `${left}px`;
      skyBtn.style.top = `${top}px`;
      skyBtn.style.width = `${d}px`;
      skyBtn.style.height = `${d}px`;
    }
  }

  // a case sheet's own canvas (a tablet): its plates, and the brayer on its
  // name. The next sheet covers it by being laid over it, so nothing is cut.
  function drawSheet(s, t, brayerMoved, brayerShown) {
    const r = s.renderer;
    if (!s.on) {
      if (s.bw && t - s.seen > 2) {
        r.setSize(1, 1, false);
        s.bw = s.bh = 0;
        s.brayer = false;
      }
      return;
    }
    s.seen = t;
    if (Math.abs(s.bw - s.w) > 0.25 || Math.abs(s.bh - s.h) > 0.25) {
      r.setSize(s.w, s.h, false);
      r.getDrawingBufferSize(s.buf);
      s.bw = s.w;
      s.bh = s.h;
      s.forced = Math.max(s.forced, 1);
    }
    const brayerHere = brayerShown && brayerAt === s;
    if (!(s.forced > 0 || s.dirty || (brayerHere && brayerMoved) || brayerHere !== s.brayer)) return;
    if (s.forced > 0) s.forced--;
    s.dirty = false;
    const y = (bottom) => s.h - (bottom - s.top);
    r.setRenderTarget(null);
    r.setScissorTest(false);
    r.setViewport(0, 0, s.w, s.h);
    r.clear();
    for (const pl of s.live) {
      const rc = pl.rect;
      setPlate(pl, s.buf, s.dpr, s.left, s.top);
      const top = Math.max(s.top, rc.top), bottom = Math.min(s.top + s.h, rc.bottom);
      const left = Math.max(s.left, rc.left), right = Math.min(s.left + s.w, rc.right);
      if (bottom <= top || right <= left) continue;
      r.setViewport(rc.left - s.left, y(rc.bottom), rc.width, rc.height);
      r.setScissor(left - s.left, y(bottom), right - left, bottom - top);
      r.setScissorTest(true);
      r.render(pl.mesh, orthoCam);
      r.setScissorTest(false);
    }
    s.brayer = brayerHere;
    if (brayerHere) {
      // the screen's part of the sheet, as the brayer's camera sees the screen;
      // its outlines are cut to this canvas's density
      shared.uRes.value.set(vw * s.dpr, vh * s.dpr);
      shared.uLineScale.value = s.dpr;
      shared.uLight.value.set(-0.45, 0.8, 0.62).normalize();
      r.setViewport(-s.left, y(vh), vw, vh);
      r.render(overlay, overlayCam);
      shared.uLineScale.value = dpr;
    }
  }

  // Upload the screenshot textures while the reader is still on the front
  // page, one per idle moment, so no upload lands in the middle of a scroll.
  function primePlates() {
    const queue = plates.list.slice();
    const later = (f) => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 900 }) : setTimeout(f, 80));
    const next = () => {
      const pl = queue.shift();
      if (!pl) return;
      pl.load(() => { if (pl.tex) (pl.sheet ? pl.sheet.renderer : renderer).initTexture(pl.tex); later(next); });
    };
    later(next);
  }

  // A plate on a case sheet with a canvas of its own is drawn there; the next
  // sheet covers it by itself, so it needs no occluder.
  function addPlate(figure, anchors, occluder) {
    const pl = plates.add(figure, anchors);
    pl.sheet = sheets.find((s) => s.el.contains(figure)) || null;
    pl.occluder = pl.sheet ? null : occluder;
    return pl;
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.documentElement.classList.remove('gl-on');
  });

  return { measure, frame, resize, addPlate, primePlates };
}
