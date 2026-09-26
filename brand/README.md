# Stefano Doko: brand, print and social

Everything here is generated from code. Edit a source file, then run its script to regenerate the outputs.

## The identity in use: `final/`

The mark is an **S next to a D drawn as a speech bubble**: the initials, and the one thing the site asks of every visitor, *write to Stefano*.
It uses one typeface (Inter), three colours and one unit of measure. `final/guide.png` is the one-page brand guide.

| Colour | Hex | Used for |
| --- | --- | --- |
| Doko Red | `#E23B2E` | the mark, one word per headline |
| Ink | `#141414` | text |
| Cream | `#EFE6D2` | backgrounds |

| Path | What it holds |
| --- | --- |
| `final/logo/` | SVG masters: mark colourways, lockups (EN/SQ, light/dark), stacked lockup, wordmark, favicon, app icon, avatar |
| `final/logo/highlights/` | Instagram highlight covers (SVG), one icon per section |
| `final/templates/` | HTML sources for the Instagram post, work post, story, link previews and business card |
| `final/export/logo-png/` | PNG copies of every logo |
| `final/export/instagram/` | profile picture, posts, story, `highlights/` covers, `highlights-preview.png` |
| `final/export/web/` | favicons, apple-touch-icon, 192/512 icons, `og-image.png`, `og-site.png` (the site's link preview) |
| `final/export/print/` | `business-card-print-bleed.pdf` (send this one to the printer: 85×55 mm plus 3 mm bleed), `business-card.pdf` (trim size), previews |
| `final/guide.html` → `final/guide.png` | the brand guide |

Regenerate everything:

```bash
python brand/final/make.py
python brand/final/highlights.py
node brand/final/render.mjs
```

`make.py` writes the SVG masters, `highlights.py` writes the highlight covers, and `render.mjs` rasterises them and renders the templates in headless Chrome.

### Where it is used on the site

- `public/`: `favicon.svg`, `favicon.ico`, `favicon-48/96.png`, `apple-touch-icon.png`, `icon-192/512.png`, `site.webmanifest` and `og.png`, all copied from `final/export/web/`.
- `partials/head.html`: the icon and manifest links.
- `partials/defs.html`: `<symbol id="sd-mark">`. The S uses `currentColor` and the bubble uses `var(--alarm)`.
- `partials/chrome.html`: `.lockup__mark` in the toolbar and `.pill__mark` in the sticky pill.
- `src/style.css`: the block at the very end, starting "The mark (brand/final)".

**Every raster in `public/` carries an embedded origin note.** After copying new icons in, re-embed the note with `impeccable embed-prompt <file> --prompt-file <txt>`, then check that `impeccable embed-prompt --scan public public/work` reports `0 missing`.

## Still placeholders: fill these in before printing or launch

- Business card (`final/templates/card.html`, the `dd[data-f]` elements): tel `+355 6X XXX XXXX`, web `domain.al`, IG `@handle`. The email is set: `stefanodoko19@icloud.com`, the same as on the site, the flyers (`../flyer/flyer.html`, `../flyer/menuja.html`) and Instagram slide 7 (`../flyer/instagram.html`).
- `final/export/print/card-preview.png` (front and back side by side) is not written by `render.mjs`: rebuild it after re-rendering the card.

## Explorations (kept for reference, not in use)

| Folder | Direction |
| --- | --- |
| `make_logo.py`, `logo-*.svg` | v1: the press seal, broadside style |
| `v2/` | Paul Rand: SD from three half-discs |
| `v3/` | Saul Bass: a cut-paper hand pointing at a red sun |
| `v4/` | Paula Scher: the name getting louder |
| `v5/` | Massimo Vignelli: the name as a subway sign (includes the Inter font, OFL) |
| `v6/` | Milton Glaser: the O in DOKO is a sun |
| `v7/` | nine minimal marks after Haviv, Bierut and Experimental Jetset. `v7/bierut-bubble` is the origin of the final mark |
| `v8/` | eight more after Noma Bar, Fukuda, Lindon Leader and Build |

Each folder has its own `make.py` (or `make_logo.py`) and `render.mjs`.

## Requirements

- Python 3 with `fonttools`, `brotli` (for reading woff2), `Pillow` and `pypdf`: `pip install fonttools brotli pillow pypdf`
- Node, with the project's dependencies installed (`npm install`, which provides `puppeteer-core`)
- Google Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`. The render scripts point at this path, so change it on another machine. `final/render.mjs` and the three in `../flyer/` also find Chrome in `/Applications` on a Mac, or take the path from `CHROME`.

Fonts: Inter (`v5/fonts-src/`), plus the site's Anybody, Ultra and Old Standard (`../public/fonts/`, with licences in `../public/fonts/licenses`). All are under the SIL Open Font License.
