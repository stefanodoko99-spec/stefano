// The print and social pieces' one script (flyer.html, menuja.html,
// instagram.html), loaded in the head.
//
// ?bleed=1 (the A5 pieces): 3 mm more paper on every side for the printer,
// the page grown to match (sheet.css).
//
// Then each [data-fit] line is fitted to its track, as the site does
// (src/ui/fit.js): Anybody at the width it was set at, sized to fill the
// track, never scaled by a transform or letter-spaced. A line that would pass
// its cap (data-fit-max, in px) is set at the cap and widened toward 100, never
// past it, so it falls short rather than turning into an extended face. The
// renderers wait for html[data-fitted].
if (new URLSearchParams(location.search).get('bleed')) {
  document.documentElement.classList.add('bleed');
  document.head.insertAdjacentHTML('beforeend', '<style>@page { size: 154mm 216mm; }</style>');
}

(() => {
  const TYPE = ['fontFamily', 'fontWeight', 'fontStyle', 'fontSize', 'fontStretch', 'letterSpacing', 'textTransform', 'fontFeatureSettings', 'fontVariantNumeric'];
  let probe;
  function width(text, cs, size, stretch) {
    if (!probe) {
      probe = document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(probe);
    }
    for (const k of TYPE) probe.style[k] = cs[k];
    Object.assign(probe.style, { position: 'absolute', left: '-9999px', top: '0', whiteSpace: 'nowrap', lineHeight: '1', fontSize: `${size}px`, fontStretch: `${stretch}%` });
    probe.textContent = text;
    return probe.getBoundingClientRect().width;
  }

  function fit() {
    for (const el of document.querySelectorAll('[data-fit]')) {
      const cs = getComputedStyle(el);
      const text = el.textContent.trim();
      // the line's track: its own box, less its padding, and a pixel in hand
      const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 1;
      const set = parseFloat(cs.fontStretch) || 100;
      const max = parseFloat(el.dataset.fitMax) || Infinity;
      let size = (100 * room) / width(text, cs, 100, set);
      if (size > max) {
        size = max;
        let lo = set, hi = Math.max(set, 100);
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          if (width(text, cs, size, mid) > room) hi = mid; else lo = mid;
        }
        el.style.fontStretch = `${lo.toFixed(1)}%`;
      }
      el.style.fontSize = `${size.toFixed(2)}px`;
    }
    probe?.remove();
    document.documentElement.dataset.fitted = '1';
  }

  // the faces are asked for by name, so they are in before anything is measured
  const faces = () => Promise.all(['900 16px Anybody', '400 16px Inter'].map((f) => document.fonts.load(f))).then(() => document.fonts.ready);
  const start = () => faces().then(fit);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
