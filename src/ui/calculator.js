// The price calculator (switched on in the admin): since 2026-09-28 it is the
// rate card itself. Each line of the menu is a box to tick, in any tab (painted
// by src/ui/site.js), each tab says how many of its lines are ticked, and the
// sum stands at the card's foot, ruled off like a tariff's total, with the way
// to send the list in a telegram. The telegram page writes the list into the
// message (src/ui/telegram.js), where it stays the visitor's to finish. Only the
// admin's own rates are added up, and the note under the total says it is an
// estimate from the card, not an offer.
import { state, bus } from '../state.js';
import { pathFor } from '../routes.js';
import { site, has, money, pick, priceText, perOf, ticked } from './site.js';

/**
 * The ticked rates' total: "from" when any of them is a starting price. The
 * care each month is added up apart ("from €1,350 + €40 / month"), and a rate
 * priced per photo or per product counts once, so it makes a starting price.
 */
export function totalText(T, lang, items) {
  const sum = (list) => {
    const from = list.some((it) => it.from || (it.group !== 'monthly' && perOf(T, lang, it)));
    return `${from ? `${T.rateFrom} ` : ''}${money(list.reduce((a, it) => a + it.price, 0), site.rates.currency, lang)}`;
  };
  const once = items.filter((it) => it.group !== 'monthly');
  const monthly = items.filter((it) => it.group === 'monthly');
  return [once.length ? sum(once) : '', monthly.length ? `${sum(monthly)} / ${T.rateMonth}` : ''].filter(Boolean).join(' + ');
}

/** The ticked rates (their places on the card) as a telegram's first lines, in the page's language. */
export function orderText(T, lang, picked) {
  const items = picked.map((i) => site.rates?.items[i]).filter(Boolean);
  if (!items.length) return '';
  const lines = items.map((it) => `— ${pick(it.name, lang)} (${priceText(T, lang, it)})`);
  return `${T.calcWant}\n${lines.join('\n')}\n${T.calcSum(totalText(T, lang, items))}\n\n`;
}

export function initCalculator() {
  const card = document.querySelector('[data-optional="rates"] .ratecard');
  const foot = card?.querySelector('[data-calc]');
  if (!foot || !has('calculator') || !site.rates?.items.length) return;
  foot.hidden = false;
  card.querySelector('[data-calc-how]').hidden = false;
  const out = foot.querySelector('[data-calc-total]');
  const send = foot.querySelector('[data-calc-send]');

  const update = () => {
    const T = state.T;
    const lang = state.lang;
    const ids = [...ticked].sort((a, b) => a - b);
    const items = ids.map((i) => site.rates.items[i]).filter(Boolean);
    out.textContent = items.length ? totalText(T, lang, items) : T.calcNone;
    send.hidden = !items.length;
    send.href = `${pathFor('contact', lang)}?rates=${ids.join(',')}`;
    // each tab: how many of its lines are ticked, else how many it has
    card.querySelectorAll('.ratecard__tab').forEach((tab) => {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      const n = panel?.querySelectorAll('.rate__box').length ?? 0;
      const t = panel?.querySelectorAll('.rate__box:checked').length ?? 0;
      const count = tab.querySelector('.ratecard__n');
      if (count) count.textContent = t ? `✓ ${t}` : String(n);
      tab.classList.toggle('has-ticked', t > 0);
    });
  };
  card.addEventListener('change', (e) => {
    const box = e.target.closest?.('.rate__box');
    if (!box) return;
    if (box.checked) ticked.add(Number(box.value)); else ticked.delete(Number(box.value));
    update();
  });
  update();
  // the card is set again in the new language, its lines ticked as they were
  bus.on('lang', update);
}
