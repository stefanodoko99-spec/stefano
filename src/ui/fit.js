// Wood-type line fitting. A compositor fills the measure by choosing the
// size and the width of each line of type, never by stretching it; Anybody's
// width axis lets the page do the same thing live, line by line.
import { state, bus } from '../state.js';

const S = 100; // measuring size in px; widths scale linearly with size
// The names (the cases, the EXTRA, a case edition's title) were in a fat face;
// since the modern edition (2026-09-25) they are Anybody at its heaviest, set
// wide: fitted by size alone, at this one width (style.css --fat-w).
const FAT_W = 118;

// Per-role settings. prefer = the width the face looks most like itself at.
export const ROLES = {
  name:  { face: 'var', weight: 900, prefer: 70, min: 44, max: 330, mode: () => (state.mobile ? 'words' : 'one') },
  side:  { face: 'var', weight: 800, prefer: 96, min: 16, max: 86, mode: () => 'one' },
  head:  { face: 'var', weight: 900, prefer: 74, min: 30, max: () => (state.mobile ? 104 : 176), mode: () => (state.mobile ? 'balance' : 'one'), grow: true },
  case:  { face: 'fat', min: 40, max: () => (state.mobile ? 120 : 176), mode: () => (state.mobile ? 'balance' : 'one') },
  extra: { face: 'fat', min: 48, max: () => (state.mobile ? 150 : 250), mode: () => (state.mobile ? 'balance' : 'one') },
  // the title of a case edition, set in the fat face across the masthead,
  // and its facts beside it, kept to one size band so a short fact stays level
  edition: { face: 'fat', min: 44, max: () => (state.mobile ? 120 : 260), mode: () => (state.mobile ? 'balance' : 'one') },
  fact: { face: 'var', weight: 800, prefer: 96, min: 16, max: 44, mode: () => 'one' },
  // a trade on the front page (Websites, Design, Marketing), fitted to its own column
  trade: { face: 'var', weight: 900, prefer: 74, min: 36, max: () => (state.mobile ? 120 : 190), mode: () => (state.mobile ? 'balance' : 'one'), grow: true },
  mail:  { face: 'var', weight: 850, prefer: 78, min: 20, max: () => (state.mobile ? 60 : 112), mode: () => 'one', parent: true, lower: true },
};

let meter;
function measurer() {
  if (meter) return meter;
  meter = document.createElement('span');
  meter.className = 'fit-meter'; // named so the print stylesheet leaves it measuring
  meter.setAttribute('aria-hidden', 'true');
  Object.assign(meter.style, {
    position: 'absolute', left: '-9999px', top: '0', visibility: 'hidden', whiteSpace: 'nowrap',
    lineHeight: '1', letterSpacing: '0', fontKerning: 'normal',
  });
  document.body.appendChild(meter);
  return meter;
}

function width(text, role, size, stretch) {
  const m = measurer();
  m.style.fontFamily = 'Anybody';
  m.style.fontWeight = role.face === 'fat' ? '900' : String(role.weight);
  m.style.fontStretch = role.face === 'fat' ? `${FAT_W}%` : `${stretch}%`;
  m.style.textTransform = role.lower ? 'none' : 'uppercase';
  m.style.fontSize = `${size}px`;
  m.textContent = text;
  return m.getBoundingClientRect().width;
}

const val = (v) => (typeof v === 'function' ? v() : v);

// Solve for the stretch that makes `text` at `size` exactly `target` wide.
function solveStretch(text, role, size, target, lo, hi) {
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (width(text, role, size, mid) > target) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

export function fitText(text, role, target) {
  const max = val(role.max), min = val(role.min);
  if (role.face === 'fat') {
    const size = Math.max(min, Math.min(max, (S * target) / width(text, role, S)));
    return { size, stretch: FAT_W };
  }
  let stretch = role.prefer;
  let size = (S * target) / width(text, role, S, stretch);
  if (size > max) {
    // at the size cap the line may fall short; it never widens into an extended face
    size = max;
    stretch = solveStretch(text, role, size, target, stretch, Math.max(stretch, 100));
  } else if (size < min) {
    size = min;
    stretch = solveStretch(text, role, size, target, 50, stretch);
    const w = width(text, role, size, stretch);
    if (w > target) size = (size * target) / w; // narrowest cut still too wide: go smaller
  }
  return { size, stretch };
}

// Split a phrase into lines of roughly equal length, at spaces.
function balance(text, n) {
  const words = text.split(/\s+/);
  if (n <= 1 || words.length < 2) return [text];
  if (n === 2) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
      const score = Math.max(a.length, b.length);
      if (!best || score < best.score) best = { score, lines: [a, b] };
    }
    return best.lines;
  }
  const per = text.length / n;
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur.length + 1 + w.length) > per * 1.15 && lines.length < n - 1) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  lines.push(cur);
  return lines;
}

function linesFor(text, role, target) {
  const mode = role.mode();
  if (mode === 'words') return text.split(/\s+/);
  if (mode === 'balance') {
    const fits = (lines) => lines.every((l) => {
      if (role.face === 'fat') return (S * target) / width(l, role, S) >= val(role.min);
      return width(l, role, val(role.min), 58) <= target;
    });
    if (role.grow) {
      // A compositor breaks a long head rather than setting it small: take
      // another line whenever it sets the smallest line a third larger.
      let best = null;
      for (let n = 1; n <= 3; n++) {
        const lines = balance(text, n);
        if (lines.length !== n) break;
        if (!fits(lines)) continue;
        const size = Math.min(...lines.map((l) => fitText(l, role, target).size));
        if (!best || size > best.size * 1.33) best = { lines, size };
      }
      if (best) return best.lines;
    }
    for (let n = 1; n <= 3; n++) {
      const lines = balance(text, n);
      if (fits(lines)) return lines;
    }
    return balance(text, 3);
  }
  return [text];
}

function contentWidth(el) {
  const cs = getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

// Build (or rebuild) one fitted element. Inked elements get an outline copy
// under a clipped fill; only the fill is exposed to assistive technology.
export function fitElement(el) {
  const role = ROLES[el.dataset.fit];
  if (!role) return;
  if (el.dataset.src === undefined) {
    const keyed = el.querySelector('[data-i18n]');
    el.dataset.key = keyed ? keyed.dataset.i18n : '';
    el.dataset.src = el.textContent.trim().replace(/\s+/g, ' ');
  }
  const text = el.dataset.key && state.T[el.dataset.key] ? state.T[el.dataset.key] : el.dataset.src;
  // --reserve keeps room for something beside the line (the Extra sheet's stamp)
  const reserve = parseFloat(getComputedStyle(el).getPropertyValue('--reserve')) || 0;
  const target = Math.max(40, (role.parent ? contentWidth(el.parentElement) : el.clientWidth) - reserve);
  const lines = linesFor(text, role, target);
  const inked = el.hasAttribute('data-ink');
  const frag = document.createDocumentFragment();
  lines.forEach((line) => {
    const { size, stretch } = fitText(line, role, target);
    const span = document.createElement('span');
    span.className = `fit-line${inked ? ' ink' : ''}`;
    span.style.fontSize = `${size.toFixed(2)}px`;
    span.style.fontStretch = `${stretch.toFixed(2)}%`;
    if (lines.length > 1 || state.mobile) span.style.display = 'block';
    if (inked) {
      const outline = document.createElement('span');
      outline.className = 'ink__outline';
      outline.setAttribute('aria-hidden', 'true');
      outline.textContent = line;
      const win = document.createElement('span');
      win.className = 'ink__win';
      const fill = document.createElement('span');
      fill.className = 'ink__fill';
      fill.textContent = line;
      win.appendChild(fill);
      span.style.setProperty('--stroke', `${Math.max(1, Math.min(2.2, size / 70)).toFixed(2)}px`);
      span.append(outline, win);
    } else {
      span.textContent = line;
    }
    frag.appendChild(span);
  });
  el.replaceChildren(frag);
}

export function fitAll() {
  document.querySelectorAll('[data-fit]').forEach(fitElement);
  document.documentElement.classList.add('fitted');
  bus.emit('refit');
}
