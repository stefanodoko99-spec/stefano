// Renders flyer.html to flyer.pdf (A5, print) and flyer.png (300 dpi preview).
// usage: node flyer/render.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
// A5 at 96 css px per inch: 559 x 794; scale 3.125 gives ~300 dpi
await page.setViewport({ width: 559, height: 794, deviceScaleFactor: 3.125 });
await page.goto(pathToFileURL(path.join(dir, 'flyer.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const overflow = await page.evaluate(() => {
  const s = document.querySelector('.sheet');
  return { scroll: s.scrollHeight, client: s.clientHeight };
});
console.log('sheet', overflow);
await page.pdf({ path: path.join(dir, 'flyer.pdf'), width: '148mm', height: '210mm', printBackground: true, pageRanges: '1' });
await page.screenshot({ path: path.join(dir, 'flyer.png'), clip: { x: 0, y: 0, width: 559, height: 794 } });
await browser.close();
console.log('wrote flyer.pdf, flyer.png');
