// Exports the Stefano Doko identity: logo PNGs, favicons, Instagram, web preview, business card, guide.
// usage: python brand/final/make.py && node brand/final/render.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const url = (f) => pathToFileURL(path.join(dir, f)).href;
const out = (...p) => { const f = path.join(dir, 'export', ...p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };

const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'C:/Program Files/Google/Chrome/Application/chrome.exe'), args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();

// raster copies of SVGs: an HTML wrapper on disk, so file:// images are allowed to load
async function raster(svg, file, w, h, transparent = true) {
  const wrap = path.join(dir, '_wrap.html');
  fs.writeFileSync(wrap, `<!doctype html><style>*{margin:0}html,body{background:transparent}img{display:block;width:${w}px;height:${h}px}</style><img src="logo/${svg}">`);
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(wrap).href, { waitUntil: 'load' });
  await page.screenshot({ path: file, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
}
const ratio = (svg) => { const m = fs.readFileSync(path.join(dir, 'logo', svg), 'utf8').match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); return m[2] / m[1]; };

for (const f of fs.readdirSync(path.join(dir, 'logo')).filter((f) => f.endsWith('.svg'))) {
  const w = f.startsWith('lockup') || f.startsWith('wordmark') ? 2000 : 1080;
  await raster(f, out('logo-png', f.replace('.svg', '.png')), w, Math.round(w * ratio(f)));
}
for (const [s, name] of [[16, 'favicon-16.png'], [32, 'favicon-32.png'], [48, 'favicon-48.png'], [96, 'favicon-96.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  await raster(s >= 180 ? 'app-icon.svg' : 'favicon.svg', out('web', name), s, s);
}
fs.copyFileSync(path.join(dir, 'logo', 'favicon.svg'), out('web', 'favicon.svg'));
// highlight covers: icon only, Instagram prints the name
for (const f of fs.readdirSync(path.join(dir, 'logo', 'highlights')).filter((f) => f.endsWith('.svg'))) {
  await raster('highlights/' + f, out('instagram', 'highlights', f.replace('.svg', '.png')), 1080, 1920, false);
}

// templates
const shots = [
  ['ig-post.html', 'instagram/post-cover.png', 1080, 1350],
  ['ig-work.html', 'instagram/post-work.png', 1080, 1350],
  ['ig-story.html', 'instagram/story.png', 1080, 1920],
  ['og.html', 'web/og-image.png', 1200, 630],
  ['og-site.html', 'web/og-site.png', 1200, 630],
];
for (const [src, dst, w, h] of shots) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(url('templates/' + src), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out(...dst.split('/')), clip: { x: 0, y: 0, width: w, height: h } });
}
fs.copyFileSync(out('logo-png', 'avatar.png'), out('instagram', 'profile-picture.png'));

// business card: printer PDF with 3 mm bleed, a trim-size PDF to look at, PNG previews
for (const [q, file, w, h] of [['?bleed=1', 'business-card-print-bleed.pdf', '91mm', '61mm'], ['', 'business-card.pdf', '85mm', '55mm']]) {
  await page.goto(url('templates/card.html') + q, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out('print', file), width: w, height: h, printBackground: true, preferCSSPageSize: false });
}
await page.setViewport({ width: 322, height: 208 * 2, deviceScaleFactor: 5 });
await page.goto(url('templates/card.html'), { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const cards = await page.$$('.frame');
await cards[0].screenshot({ path: out('print', 'card-front.png') });
await cards[1].screenshot({ path: out('print', 'card-back.png') });

// the guide
if (fs.existsSync(path.join(dir, 'guide.html'))) {
  await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await page.goto(url('guide.html'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(dir, 'guide.png'), fullPage: true });
}
fs.rmSync(path.join(dir, '_wrap.html'), { force: true });
await browser.close();
console.log('exported to brand/final/export/');
