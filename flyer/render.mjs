// Renders flyer.html, one side of A5: flyer-print-bleed.pdf (send this one to
// the printer: A5 plus 3 mm bleed), flyer.pdf (trim size, to look at and to
// send) and flyer.png (300 dpi preview).
// usage: node flyer/render.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const url = (q = '') => pathToFileURL(path.join(dir, 'flyer.html')).href + q;
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
  // the heads are fitted to their tracks once the fonts are in (sheet.js)
  await page.waitForFunction(() => document.documentElement.dataset.fitted === '1');
};

for (const [q, file, w, h] of [['?bleed=1', 'flyer-print-bleed.pdf', '154mm', '216mm'], ['', 'flyer.pdf', '148mm', '210mm']]) {
  await open(q);
  await page.pdf({ path: path.join(dir, file), width: w, height: h, printBackground: true, pageRanges: '1', preferCSSPageSize: false });
}

await open('');
// content that runs into the foot rule means the sheet is overfull
const fit = await page.evaluate(() => {
  const s = document.querySelector('.sheet');
  const foot = s.querySelector('.foot');
  return { gap: Math.round(foot.getBoundingClientRect().top - foot.previousElementSibling.getBoundingClientRect().bottom), over: s.scrollHeight > s.clientHeight };
});
console.log('sheet', fit);
await page.screenshot({ path: path.join(dir, 'flyer.png'), clip: { x: 0, y: 0, width: 559, height: 794 } });
await browser.close();
console.log('wrote flyer-print-bleed.pdf, flyer.pdf, flyer.png');
