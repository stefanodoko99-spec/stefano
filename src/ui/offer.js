// What he makes, and the best options (the front page, since 2026-09-28): the
// three trades list the menu's lines under them and the price they start from,
// and the lines ticked in the admin as the best are offered first, each on a
// loose sheet that asks for an offer in a telegram. Everything here is the rate
// card's (site.rates), so a price changed in the admin changes here too; with
// the card off, the trades say what they are and nothing is priced.
import { pathFor } from '../routes.js';
import { site, has, money, pick, perOf } from './site.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

// the price a line starts from, as the card sets it: "from" small, the unit apart and quieter
function priceOf(T, lang, it, from, cls) {
  const p = el('span', `${cls}__price`);
  if (from) p.append(el('span', `${cls}__pre`, `${T.rateFrom} `));
  p.append(money(it.price, site.rates.currency, lang));
  const per = perOf(T, lang, it);
  if (per) p.append(el('span', `${cls}__per`, ` / ${per}`));
  return p;
}

function paintTrades(T, lang, live) {
  document.querySelectorAll('[data-trade]').forEach((trade) => {
    const rows = live ? site.rates.items.filter((it) => it.group === trade.dataset.trade) : [];
    const list = trade.querySelector('[data-trade-list]');
    const from = trade.querySelector('[data-trade-from]');
    const link = trade.querySelector('.trade__foot .word');
    list.hidden = from.hidden = !rows.length;
    if (link) link.hidden = !live;
    if (!rows.length) return;
    list.replaceChildren(...rows.map((it) => el('li', 'trade__item', pick(it.name, lang))));
    // where the trade starts: its cheapest line
    const low = rows.reduce((a, it) => (it.price < a.price ? it : a));
    from.replaceChildren(priceOf(T, lang, low, rows.length > 1 || low.from, 'trade'));
  });
}

function paintBest(T, lang, live) {
  const sec = document.querySelector('[data-best]');
  if (!sec) return;
  const picks = live ? site.rates.items.map((it, i) => [it, i]).filter(([it]) => it.best) : [];
  sec.hidden = !picks.length;
  if (!picks.length) return;
  const contact = pathFor('contact', lang);
  sec.querySelector('[data-picks]').replaceChildren(...picks.map(([it, i]) => {
    const li = el('li', 'pick');
    const strip = el('p', 'pick__strip');
    strip.append(el('span', '', it.group ? T.rateGroups[it.group] : T.ratesKind));
    li.append(strip, el('h3', 'pick__name', pick(it.name, lang)));
    const price = el('p', 'pick__cost');
    price.append(priceOf(T, lang, it, it.from, 'pick'));
    li.append(price);
    const desc = pick(it.desc, lang);
    if (desc) li.append(el('p', 'pick__desc', desc));
    // the telegram opens with this line written in (src/ui/telegram.js), for the visitor to finish
    const ask = el('a', 'btn btn--ink pick__ask');
    ask.href = `${contact}?rates=${i}`;
    ask.append(el('span', '', T.bestAsk));
    ask.insertAdjacentHTML('beforeend', '<svg class="hand" aria-hidden="true"><use href="#hand"/></svg>');
    li.append(ask);
    return li;
  }));
}

/** The trades' lines and prices, and the best options, in the page's language. */
export function paintOffer(T, lang) {
  const live = has('rates') && !!site.rates && site.rates.items.length > 0;
  paintTrades(T, lang, live);
  paintBest(T, lang, live);
}
