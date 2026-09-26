// Renders menuja.html, the menu on one A5 sheet printed both sides:
// menuja-print-bleed.pdf (send this one to the printer: A5 plus 3 mm bleed),
// menuja.pdf (trim size, to look at and to send) and menuja-1.png, menuja-2.png
// (each side, 300 dpi preview).
// usage: node flyer/render-menuja.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const url = (q = '') => pathToFileURL(path.join(dir, 'menuja.html')).href + q;
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
// A5 at 96 css px per inch: 559 x 794; scale 3.125 gives ~300 dpi
await page.setViewport({ width: 559, height: 794, deviceScaleFactor: 3.125 });
await page.emulateMediaType('print');
const open = async (q) => {
  await page.goto(url(q), { waitUntil: 'networkidle0' });
  // the heads are fitted to their tracks once the fonts are in
  await page.waitForFunction(() => document.documentElement.dataset.fitted === '1');
};

for (const [q, file, w, h] of [['?bleed=1', 'menuja-print-bleed.pdf', '154mm', '216mm'], ['', 'menuja.pdf', '148mm', '210mm']]) {
  await open(q);
  await page.pdf({ path: path.join(dir, file), width: w, height: h, printBackground: true, preferCSSPageSize: false });
}

// the previews, one side at a time at the top of the page
await open('');
const sides = await page.$$eval('.sheet', (s) => s.length);
for (let i = 0; i < sides; i++) {
  // content that runs into the foot rule means the side is overfull
  const fit = await page.evaluate((i) => {
    const all = [...document.querySelectorAll('.sheet')];
    all.forEach((s, j) => { s.style.display = j === i ? '' : 'none'; });
    const s = all[i];
    const foot = s.querySelector('.foot');
    const prev = foot.previousElementSibling;
    const pt = (px) => Math.round(px * 0.75 * 10) / 10;
    return {
      gap: Math.round(foot.getBoundingClientRect().top - prev.getBoundingClientRect().bottom),
      over: s.scrollHeight > s.clientHeight,
      fitted: [...s.querySelectorAll('[data-fit]')].map((f) => `${f.textContent.trim()} ${pt(parseFloat(f.style.fontSize))}pt`),
    };
  }, i);
  console.log(`side ${i + 1}`, fit);
  await page.screenshot({ path: path.join(dir, `menuja-${i + 1}.png`), clip: { x: 0, y: 0, width: 559, height: 794 } });
}
await browser.close();
console.log('wrote menuja-print-bleed.pdf, menuja.pdf, menuja-1.png, menuja-2.png');
