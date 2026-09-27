import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import fs from 'node:fs';

const root = import.meta.dirname;

// The sheets: the broadside itself, the work, about and the websites each as a
// page of its own, the two case editions, the colophon at length, the telegraph
// counter and the 404. Static output in dist/; the Albanian and Italian pages
// are written from these after the build (tools/build-sq.mjs).
const pages = {
  main: 'index.html',
  work: 'work/index.html',
  about: 'about/index.html',
  services: 'services/index.html',
  elixir: 'work/elixir/index.html',
  martiri: 'work/bar-martiri/index.html',
  made: 'how-it-was-made/index.html',
  contact: 'contact/index.html',
  privacy: 'privacy/index.html',
  terms: 'terms/index.html',
  notFound: '404.html',
  // the admin panel: its own small script and styles, none of the sheet's (served by the Worker)
  admin: 'admin/index.html',
};

// <!-- @include name.html --> pulls in a shared piece of every sheet from
// partials/, so the toolbar, the dateline and the foot are set once, and each
// part of the front page is set once for the front page and for its own page.
// A part that leads its own page (<!-- @include sheet-work.html lead -->) opens
// with the dateline, and its head is the page's h1, inked as the page opens;
// on the front page the same markers leave the part exactly as it was. What
// only the front page's copy says is set between <!-- front --> and
// <!-- /front -->, and what only the part's own page says between <!-- page -->
// and <!-- /page -->.
const LEAD = { LEAD_CLASS: ' sheet--lead', LEAD_TOP: '<!-- @include dateline.html -->\n\n', H: '1', SUB: '2', HEAD_CLASS: ' sheethead--page', HEAD_SOURCE: ' data-ink-source="intro"' };
const PLAIN = { LEAD_CLASS: '', LEAD_TOP: '', H: '2', SUB: '3', HEAD_CLASS: '', HEAD_SOURCE: '' };
const only = (html, keep, drop) => html
  .replace(new RegExp(`[ \\t]*<!--\\s*${drop}\\s*-->[\\s\\S]*?<!--\\s*/${drop}\\s*-->\\n?`, 'g'), '')
  .replace(new RegExp(`<!--\\s*/?${keep}\\s*-->`, 'g'), '');
function partials() {
  const dir = resolve(root, 'partials');
  const include = (html) => html.replace(/<!--\s*@include\s+([\w.-]+)(\s+lead)?\s*-->/g, (_, file, lead) => {
    const vars = lead ? LEAD : PLAIN;
    const part = fs.readFileSync(resolve(dir, file), 'utf8').replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
    return include(lead ? only(part, 'page', 'front') : only(part, 'front', 'page'));
  });
  return {
    name: 'sheet-partials',
    transformIndexHtml: { order: 'pre', handler: include },
    configureServer(server) {
      server.watcher.add(dir);
      server.watcher.on('change', (file) => { if (file.startsWith(dir)) server.ws.send({ type: 'full-reload' }); });
    },
  };
}

export default defineConfig({
  plugins: [partials()],
  server: { port: 3670, strictPort: true },
  preview: { port: 3671, strictPort: true },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: Object.fromEntries(Object.entries(pages).map(([k, v]) => [k, resolve(root, v)])),
    },
  },
});
