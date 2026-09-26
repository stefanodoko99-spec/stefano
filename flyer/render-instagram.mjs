// Renders instagram.html to seven 1080x1350 carousel slides (instagram-1.png … instagram-7.png).
// usage: node flyer/render-instagram.mjs
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
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, 'instagram.html')).href, { waitUntil: 'networkidle0' });
// the heads are fitted to their tracks once the fonts are in (sheet.js)
await page.waitForFunction(() => document.documentElement.dataset.fitted === '1');
const slides = await page.$$('.slide');
for (const [i, el] of slides.entries()) {
  // content that runs past the foot rule means the slide is overfull
  const fit = await el.evaluate((s) => {
    const foot = s.querySelector('.foot');
    const prev = foot.previousElementSibling;
    return { gap: Math.round(foot.getBoundingClientRect().top - prev.getBoundingClientRect().bottom), over: s.scrollHeight > s.clientHeight };
  });
  console.log(`slide ${i + 1}`, fit);
  await el.screenshot({ path: path.join(dir, `instagram-${i + 1}.png`) });
}
await browser.close();
