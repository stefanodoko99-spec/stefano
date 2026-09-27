// The telegraph counter. The blank is a real form: it asks for what it needs,
// counts the words the way a telegraph office did, and hands the telegram on.
// Served by the Worker (worker/public-api.js), a telegram is posted to the
// site and kept in the admin's inbox. A page with no Worker behind it (a plain
// static preview) writes the telegram into the visitor's own mail app instead,
// addressed to Stefano. The blank carries a honeypot line for bots either way.
import gsap from 'gsap';
import { state, bus } from '../state.js';
import { albaniaNow } from '../i18n.js';
import { judder, sound } from './press.js';
import { site, has } from './site.js';
import { orderText } from './calculator.js';
import { sourceOf } from './from.js';

const endpoint = () => (site.inbox ? '/api/telegram' : '');

const words = (s) => (String(s).trim().match(/\S+/g) || []).length;
const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const rePhone = /^\+?[\d\s().-]{7,}$/;

export function initTelegram() {
  const form = document.querySelector('[data-telegram]');
  if (!form) return;
  const status = form.querySelector('[data-telegram-status]');
  const count = form.querySelector('[data-telegram-count]');
  const msg = form.querySelector('[data-telegram-message]');
  const to = () => (document.querySelector('[data-mail]')?.getAttribute('href') || '').replace(/^mailto:/, '');
  let tried = false;
  let lastErrs = {};

  // the reply language starts as the sheet's own (Stefano answers in Albanian or English: an Italian sheet starts on English)
  const pickLang = () => {
    if (form.querySelector('input[name="lang"]:checked')) return;
    const r = form.querySelector(`input[name="lang"][value="${state.lang === 'sq' ? 'sq' : 'en'}"]`);
    if (r) r.checked = true;
  };
  pickLang();

  // a list sent from the price calculator, or a best option asked for (?rates=0,2), opens the message; the rest is the visitor's
  const picked = (new URLSearchParams(location.search).get('rates') || '').split(',').filter((v) => /^\d{1,2}$/.test(v)).map(Number);
  if (picked.length && has('rates') && !msg.value.trim()) msg.value = orderText(state.T, state.lang, picked);

  // With visits counted, the site also counts telegrams begun (once a page, a
  // number and nothing else), so that the admin can set them against those sent.
  let begun = false;
  form.addEventListener('input', () => {
    if (begun || !site.counted || !site.inbox) return;
    begun = true;
    try { navigator.sendBeacon?.('/api/telegram/started'); } catch { /* not counted */ }
  });

  const recount = () => { count.textContent = String(words(msg.value)); };
  msg.addEventListener('input', recount);
  recount();

  function check() {
    const T = state.T;
    const f = new FormData(form);
    const errs = {};
    if (!String(f.get('name') || '').trim()) errs.name = T.ctErrName;
    if (words(f.get('message') || '') < 2) errs.message = T.ctErrMessage;
    const reply = String(f.get('reply') || '').trim();
    if (!reEmail.test(reply) && !rePhone.test(reply)) errs.reply = T.ctErrReply;
    form.querySelectorAll('[data-err]').forEach((el) => {
      const k = el.dataset.err;
      el.textContent = errs[k] || '';
      form.elements[k]?.setAttribute('aria-invalid', errs[k] ? 'true' : 'false');
    });
    lastErrs = errs;
    return errs;
  }
  // once a send has been tried, each line is checked again as it is corrected
  form.addEventListener('input', () => { if (tried) check(); });

  function compose() {
    const T = state.T;
    const f = new FormData(form);
    const name = String(f.get('name')).trim();
    const business = String(f.get('business') || '').trim();
    const body = [
      T.ctKind.toUpperCase(),
      `${T.ctFrom}: ${name}${business ? `, ${business}` : ''}`,
      `${T.ctReplyTo}: ${String(f.get('reply')).trim()}`,
      `${T.ctReplyIn}: ${f.get('lang') === 'en' ? 'English' : 'Shqip'}`,
      '',
      String(f.get('message')).trim(),
    ].join('\n');
    return { subject: T.ctSubject(name), body };
  }

  function say(text, copyText) {
    status.replaceChildren();
    const p = document.createElement('p');
    p.textContent = text;
    status.appendChild(p);
    if (!copyText) return;
    const row = document.createElement('p');
    row.className = 'telegram__fallback';
    const note = document.createElement('span');
    note.textContent = `${state.T.ctNoMail} `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--line btn--sm';
    btn.textContent = state.T.ctCopy;
    btn.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(copyText); ok = true; } catch { ok = false; }
      btn.textContent = ok ? state.T.ctCopied : state.T.ctCopyFail;
      judder(btn);
    });
    row.append(note, btn);
    status.appendChild(row);
  }

  // The counter's stamp, pressed onto the blank once the telegram has gone,
  // with the Albanian time it went. It is decoration (aria-hidden): the
  // status line says the same thing in words.
  let stamp = null;
  let stampedAt = null;
  const paintStamp = () => {
    if (!stamp) return;
    const { date, time } = albaniaNow(state.lang, true, stampedAt);
    stamp.firstChild.textContent = stamp.dataset.kind === 'sent' ? state.T.ctStampSent : state.T.ctStampHanded;
    stamp.lastChild.textContent = `${time} · ${date}`;
  };
  function press(kind) {
    if (!stamp) {
      stamp = document.createElement('span');
      stamp.className = 'telegram__stamp';
      stamp.setAttribute('aria-hidden', 'true');
      stamp.append(document.createElement('b'), document.createElement('i'));
      form.appendChild(stamp);
    }
    stamp.dataset.kind = kind;
    stampedAt = new Date();
    paintStamp();
    // under the addressee and the word count, not on them: across the strip's
    // rule on a phone (the count sits on its own line at the left there), just
    // below the rule on a wide blank, where the count sits at the right
    const strip = form.querySelector('.telegram__strip');
    if (strip) stamp.style.top = `${Math.round(strip.offsetTop + strip.offsetHeight + (state.mobile ? -10 : 12))}px`;
    const land = () => {
      judder(form, 0.9);
      sound.press();
      // a small knock under the thumb where phones allow it, and only with sound on
      if (state.sound) navigator.vibrate?.(12);
    };
    if (state.reduced) { gsap.fromTo(stamp, { opacity: 0 }, { opacity: 1, duration: 0.15 }); land(); return 0.15; }
    // it comes down onto the paper, so it gathers speed and stops dead
    gsap.fromTo(stamp, { opacity: 0, scale: 1.32, rotation: -12 }, { opacity: 1, scale: 1, rotation: -6, duration: 0.17, ease: 'power2.in', onComplete: land });
    return 0.32;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    tried = true;
    const errs = check();
    const first = Object.keys(errs)[0];
    if (first) {
      judder(form);
      say(state.T.ctErrSummary);
      form.elements[first]?.focus();
      return;
    }
    const { subject, body } = compose();
    const url = endpoint();
    if (url) {
      const submit = form.querySelector('[type="submit"]');
      if (submit?.disabled) return; // one telegram per press, however often it is tapped
      if (submit) submit.disabled = true;
      say(state.T.ctSending);
      try {
        const data = new URLSearchParams(new FormData(form));
        // where the visit came from, when a shared link said so (src/ui/from.js)
        if (sourceOf()) data.set('from', sourceOf());
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: data.toString(),
        });
        if (res.status === 429) { say(state.T.ctTooMany); return; }
        if (!res.ok) throw new Error(String(res.status));
        form.classList.add('is-sent');
        say(state.T.ctSent);
        press('sent');
      } catch {
        say(state.T.ctFailed);
      } finally {
        if (submit) submit.disabled = false;
      }
      return;
    }
    // no form service yet: the telegram leaves through the visitor's own mail
    // app, once the stamp has landed (on a phone the mail app takes the screen)
    form.classList.add('is-handed');
    say(state.T.ctHanded, `${to()}\n${subject}\n\n${body}`);
    gsap.delayedCall(press('handed'), () => {
      location.href = `mailto:${to()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });

  bus.on('lang', () => {
    paintStamp();
    recount();
    if (tried && Object.keys(lastErrs).length) check();
  });
}
