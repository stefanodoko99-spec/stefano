// The conductor. One clock (GSAP's ticker) drives everything that moves:
// Lenis smooth scroll, the inking, the running line, the game and the WebGL
// layer. Nothing else on the sheet runs its own animation loop.
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';
import { STRINGS, initialLang, rememberLang, applyStrings } from './i18n.js';
import { state, bus, prefersReduced, SHORT } from './state.js';
import { layPaper } from './ui/paper.js';
import { fitAll } from './ui/fit.js';
import { collectInk, measureInk, updateInk, roller } from './ui/ink.js';
import { createIntro } from './ui/intro.js';
import { startClock, initNav, initMenu, initWords } from './ui/toolbar.js';
import { createMarquee } from './ui/marquee.js';
import { initFan } from './ui/fan.js';
import { initCases } from './ui/cases.js';
import { initVerse } from './ui/verse.js';
import { initExtra } from './ui/extra.js';
import { warmSheets } from './ui/warm.js';
import { initProof } from './ui/proof.js';
import { initEdition, editionMeasure, editionUpdate } from './ui/edition.js';
import { initGame } from './ui/game.js';
import { initLetter } from './ui/letter.js';
import { playTiles, resetTiles } from './ui/tiles.js';
import { sound } from './ui/press.js';
import { initFeed } from './ui/feed.js';
import { initTypecase } from './ui/typecase.js';
import { initFolio } from './ui/folio.js';
import { initTelegram } from './ui/telegram.js';
import { initSetline } from './ui/setline.js';
import { readSite, applySite } from './ui/site.js';
import { initPortrait } from './ui/portrait.js';
import { initGraphic } from './ui/graphic.js';
import { initCalculator } from './ui/calculator.js';
import { initPrint } from './ui/print.js';
import { initSetfront } from './ui/setfront.js';
import { initMagnifier } from './ui/magnifier.js';
import { initTilt } from './ui/tilt.js';
import { initNight } from './ui/night.js';
import { initShare } from './ui/share.js';
import { initRoad } from './ui/road.js';
import { noteSource } from './ui/from.js';
import { paintRoutes, syncAddress, isHere, routeOf } from './routes.js';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
const root = document.documentElement;
if (state.reduced) root.classList.add('no-motion');

const tickers = [];
gsap.ticker.lagSmoothing(0);
// First on the ticker, ahead of GSAP's own tweens: the tick reads the page
// before anything this frame writes to it. After the tweens, every read phase
// forced a second style pass (the deal's cards, the flourish's strokes).
gsap.ticker.add((time, deltaMs) => {
  const dt = Math.min(0.1, deltaMs / 1000);
  state.time = time;
  for (const f of tickers) f(time, dt);
}, false, true);

// pointer, shared by the ink, the loupe and the lamp
const P = state.pointer;
window.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
  P.vx = e.clientX - (P.x < -999 ? e.clientX : P.x);
  P.vy = e.clientY - (P.y < -999 ? e.clientY : P.y);
  P.x = e.clientX; P.y = e.clientY;
  P.moved = 1;
}, { passive: true });
document.addEventListener('pointerleave', () => { P.x = P.y = -9999; });
// iOS Safari shows :active (the press under a finger) only on a page that listens for touches
document.addEventListener('touchstart', () => {}, { passive: true });

function scrollToHash(hash, immediate = false) {
  if (hash === '#top') {
    if (state.lenis) state.lenis.scrollTo(0, { duration: immediate ? 0 : 1.25, immediate });
    else window.scrollTo({ top: 0, behavior: state.reduced || immediate ? 'auto' : 'smooth' });
    return;
  }
  // a link to a group of the menu (#rates-design) opens the card at it (src/ui/site.js), read from the card's top
  const el = hash && hash.length > 1 ? (/^#rates-[a-z]+$/.test(hash) ? document.querySelector('#rates .ratecard') : document.querySelector(hash)) : null;
  if (!el) return;
  let y;
  if (el.matches('[data-case]') && !state.mobile) {
    const stack = el.parentElement;
    let top = stack.getBoundingClientRect().top + state.scroll;
    for (let s = stack.firstElementChild; s && s !== el; s = s.nextElementSibling) top += s.offsetHeight;
    y = top + (el.nextElementSibling?.offsetHeight || 0) * 0.62;
  } else if (hash === '#front') {
    y = 0;
  } else {
    y = el.getBoundingClientRect().top + state.scroll - (state.mobile ? 12 : 20);
  }
  if (state.lenis) state.lenis.scrollTo(y, { duration: immediate ? 0 : 1.25, immediate });
  else window.scrollTo({ top: y, behavior: state.reduced || immediate ? 'auto' : 'smooth' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

async function boot() {
  layPaper();
  // a shared link that names its place (?utm_source=…): noted for a telegram, and cleared from the address
  noteSource();
  state.lang = initialLang();
  state.T = STRINGS[state.lang];
  // the admin's settings (from the Worker): what they switch on is set before anything is fitted
  readSite();
  applyStrings(state.T);
  applySite(state.T);
  paintRoutes(state.lang);
  syncAddress(state.lang);
  // the word for the sheet you are on stays pressed
  if (routeOf() !== 'home') {
    document.querySelectorAll('a[data-route]:not([data-hash])').forEach((a) => { if (isHere(a)) a.setAttribute('aria-current', 'page'); });
  }
  const intro = createIntro();
  tickers.push((t, dt) => intro.update(dt));
  intro.progress(0.04);

  // the fitting needs the faces' real metrics
  const faces = ['900 100px Anybody', '400 20px Inter', '600 20px Inter', '850 40px Anybody'];
  let n = 0;
  await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null).then(() => intro.progress(0.06 + (++n / faces.length) * 0.4))));
  fitAll();
  const edition = initEdition();
  collectInk();
  bus.on('edition', () => collectInk());

  const lenis = state.reduced ? null : new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
  state.lenis = lenis;
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    window.__lenis = lenis;
    if (!state.introDone) lenis.stop();
  }

  // the WebGL layer: the engraving band, the plates and the brayer
  let stage = null;
  try {
    const { createStage } = await import('./gl/stage.js');
    intro.progress(0.62);
    stage = createStage(document.querySelector('[data-gl-canvas]'));
  } catch (err) {
    console.warn('WebGL layer unavailable; the sheet prints without it.', err);
  }
  intro.progress(0.8);

  startClock();
  const nav = initNav();
  initMenu((hash) => scrollToHash(hash));
  const setProof = initProof();
  const tilesEl = document.querySelector('[data-tiles]');
  const setLang = (lang) => {
    if (lang === state.lang) return;
    sound.paper();
    playTiles(tilesEl, () => {
      state.lang = lang;
      state.T = STRINGS[lang];
      rememberLang(lang);
      applyStrings(state.T);
      applySite(state.T);
      paintRoutes(lang);
      syncAddress(lang);
      fitAll();
      bus.emit('lang', lang);
      collectInk();
      ScrollTrigger.refresh();
    });
  };
  // Stop the press. Everything that moves by itself reads state.reduced every
  // frame (the running line, the stamp, the engraving, the brayer, the plates),
  // so turning it on stops them where they are and sets every head inked; the
  // choice is kept, and the next sheet opens as it does for reduced motion: no
  // counter, no feed, no glide.
  const setStill = (on) => {
    state.still = on;
    try { if (on) localStorage.setItem('sd-still', '1'); else localStorage.removeItem('sd-still'); } catch { /* not kept */ }
    state.reduced = prefersReduced || on;
    root.classList.toggle('no-motion', state.reduced);
    if (lenis) lenis.options.lerp = state.reduced ? 1 : 0.1;
    bus.emit('still', on);
  };
  initWords({ onLang: setLang, onProof: (on) => setProof(on), onStill: setStill });
  // the night edition: the engraving's sun, and the date line's, turn the sheet dark
  initNight();
  initShare();
  const marquee = createMarquee();
  initFan();
  initCases(stage);
  initVerse();
  const extra = initExtra();
  if (intro.covering()) {
    const dropWarm = warmSheets();
    if (dropWarm) intro.onOpen(dropWarm);
  }
  const game = initGame();
  initLetter();
  initFeed();
  initTypecase();
  initFolio(stage);
  initPortrait(stage);
  initGraphic(stage);
  initTelegram();
  initSetline();
  // the optional parts that behave, not only show (each does nothing unless switched on)
  initPrint();
  initSetfront();
  initCalculator();
  initMagnifier();
  // a phone's tilt leans the engraving's light, where the engraving is drawn
  if (stage) initTilt();
  // the road between the front page's sheets, laid by the band's van as it is read
  const road = initRoad(stage);

  // A link to a part of this sheet is carried there by the one scroll; a link
  // to another sheet is left to the browser, and the press feeds that sheet in.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.closest('[data-menu]')) return;
    const href = a.getAttribute('href');
    let hash = null;
    if (href.startsWith('#')) hash = href;
    else if (/^(mailto|tel):/.test(href)) return;
    else if (isHere(a)) hash = a.dataset.hash || new URL(a.href).hash || '#top';
    if (!hash || hash.length < 2) return;
    if (hash !== '#top' && !document.querySelector(hash)) return;
    e.preventDefault();
    scrollToHash(hash);
  });

  // the one clock
  let lastRollX = null;
  tickers.push((t, dt) => {
    if (lenis) lenis.raf(t * 1000);
    state.scroll = lenis ? lenis.scroll : window.scrollY;
    state.velocity = lenis ? lenis.velocity : 0;
    // read everything first, so the page lays out once per frame...
    const edTop = editionMeasure(edition);
    nav.measure();
    measureInk();
    stage?.measure();
    // ...then write
    if (editionUpdate(edition, lenis, edTop)) return; // carried back to the top: measure again next frame
    nav.apply();
    updateInk();
    marquee(dt);
    extra(dt);
    road?.update();
    game(dt);
    if (stage) stage.frame(t, dt);
    if (state.sound) {
      const speed = roller.visible && lastRollX !== null ? Math.abs(roller.x - lastRollX) / Math.max(dt, 0.001) : 0;
      sound.roll(speed);
    }
    lastRollX = roller.visible ? roller.x : null;
    P.moved = 0;
    P.vx *= 0.5; P.vy *= 0.5;
  });

  if (stage) root.classList.add('gl-on');
  ScrollTrigger.refresh();
  intro.progress(1);

  // keep the sheet fitted to its window
  let lastW = state.vw;
  let resizeCall = null;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  window.addEventListener('resize', () => {
    resizeCall?.kill();
    resizeCall = gsap.delayedCall(0.16, () => {
      // a phone's address bar sliding in or out: the height only, and by a little
      if (touch && window.innerWidth === state.vw && Math.abs(window.innerHeight - state.vh) < 160) {
        state.vh = window.innerHeight;
        return;
      }
      const wasMobile = state.mobile, wasShort = state.short;
      state.vw = window.innerWidth;
      state.vh = window.innerHeight;
      state.mobile = window.matchMedia('(max-width: 767px)').matches;
      state.short = window.matchMedia(SHORT).matches;
      if (wasMobile !== state.mobile || wasShort !== state.short) { location.reload(); return; }
      stage?.resize();
      if (state.vw !== lastW) {
        lastW = state.vw;
        fitAll();
        collectInk();
        resetTiles(tilesEl);
      }
      bus.emit('resize');
      ScrollTrigger.refresh();
    });
  });

  await intro.done;
  lenis?.start();
  // A phone scrolls natively (Lenis smooths only the wheel), yet Lenis still
  // listens to every touch with non-passive handlers, which makes Safari wait
  // on the page before it moves the scroll: a busy frame then held the finger.
  // Once the intro no longer needs touches held back, those listeners go.
  if (lenis && !state.fine) lenis.virtualScroll.destroy();
  stage?.primePlates();
  if (location.hash) gsap.delayedCall(0.1, () => scrollToHash(location.hash));
}

boot().catch((err) => {
  console.error(err);
  document.querySelector('.intro')?.remove();
  root.classList.add('fitted');
});
