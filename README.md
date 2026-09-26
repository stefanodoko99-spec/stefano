# Stefano Doko, the day's broadside

Portfolio for Stefano Doko, graphic designer and web designer and developer in Albania. Every sheet of the site is a daily broadside, set since 2026-09-25 the way a paper is set today (DESIGN.md, "The modern edition"): heads in a wood gothic fitted to the measure, the names of the work set wide, everything that is read in Inter, hairline rules, pill-shaped controls, and a relief engraving in one black ink with an alarm-red flood. An ink brayer rolls across each sheet head and the type takes ink under it, and the Elixir van from the engraving drives down the sheet as it is read, painting its road red behind it.

English, Albanian and Italian, all three complete, each at its own address. The sheets are a static build: Vite, three.js, GSAP (with Lenis for smooth scroll) and opentype.js for the letter caster, no framework. A small Cloudflare Worker serves them and adds an admin panel: the email, the WhatsApp number, fourteen optional parts that stay off until switched on there, and the inbox the contact form posts to. Without the Worker the build still runs on any static host, as the bare sheet.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Opens on http://localhost:3670. `npm run build` runs `vite build` and then `node tools/build-sq.mjs`, which writes the Albanian and the Italian twin of every sheet, so `dist/` holds twenty-four sheets (eight in each language), `404.html` and the admin. `npm run preview` serves the build on port 3671. Neither runs the Worker, so both show the sheet a fresh admin starts from: the rate card with the menu, every other optional part off, the placeholder email, the telegram handed to the mail app.

With the Worker:

```bash
npm run worker:dev
```

It builds, then serves `dist/` through the Worker on http://127.0.0.1:3672 (`wrangler dev`, with KV simulated in `.wrangler/state`). The admin is at http://127.0.0.1:3672/admin/. It needs a `.dev.vars` file beside `package.json` (git ignores it) with `SESSION_SECRET=` and a long random string, and `DEV_LOGIN=1` for the one-click local sign-in, which the Worker only honours on localhost. `npm run admin:password` writes a local password hash into it instead, if you want to sign in the real way. `wrangler dev` serves the build it found when it started: after a change, stop it and run `npm run worker:dev` again.

In the Claude app the launch entries are `stefano-doko` (3670), `stefano-doko-preview` (3671) and `stefano-doko-worker` (3672).

## The sheets

| Sheet | English | Albanian | Italian | Source |
| --- | --- | --- | --- | --- |
| The front page | `/` | `/sq/` | `/it/` | `index.html` |
| The work (fan, the three case sheets, graphic work and readers' letters when on) | `/work/` | `/sq/puna/` | `/it/lavori/` | `work/index.html` |
| About Stefano (the verse, the portrait when on) | `/about/` | `/sq/rreth/` | `/it/chi-e/` | `about/index.html` |
| Websites (the three columns, the type case, the rates and calculator when on) | `/services/` | `/sq/sherbimet/` | `/it/servizi/` | `services/index.html` |
| Elixir, case edition | `/work/elixir/` | `/sq/puna/elixir/` | `/it/lavori/elixir/` | `work/elixir/index.html` |
| Bar Martiri, case edition | `/work/bar-martiri/` | `/sq/puna/bar-martiri/` | `/it/lavori/bar-martiri/` | `work/bar-martiri/index.html` |
| How it was made | `/how-it-was-made/` | `/sq/si-u-be/` | `/it/come-e-fatto/` | `how-it-was-made/index.html` |
| The telegraph counter (contact, with its questions) | `/contact/` | `/sq/kontakt/` | `/it/contatti/` | `contact/index.html` |
| Privacy (what the site keeps; no cookies) | `/privacy/` | `/sq/privatesia/` | `/it/privacy/` | `privacy/index.html` |
| Terms of use | `/terms/` | `/sq/kushtet/` | `/it/termini/` | `terms/index.html` |
| Sheet not found (it lists the pages) | any other address | | | `404.html` |
| The admin (English and Albanian in one) | `/admin/` | | | `admin/index.html`, `src/admin/` |

- `vite.config.js` lists every page. A small plugin there replaces `<!-- @include name.html -->` with that file from `partials/` (head, defs, chrome, dateline, foot, end), so the toolbar, the dateline and the foot are set once.
- The front page's parts are partials too (`partials/sheet-work.html`, `-graphic`, `-quotes`, `-about`, `-services`, `-rates`), set once for the front page and for their own pages. `<!-- @include sheet-work.html lead -->` makes a part lead its page: the dateline above its head, its head the page's `h1` (inked as the page opens), its column heads one level up, and no room kept above it (`sheet--lead`). Without `lead` the same partial prints exactly as the front page always had it (checked byte for byte against the build before the split).
- Every word and link on the front page leads to a page (since 2026-09-25, Luca's ask): the menus, the tab bar and the index go to the work, about, websites and contact pages; the contents, the feature and the fan to the case editions (Greta and graphic work to their place on the work page). The front page keeps every part, so an old link such as `/#services` still scrolls there. On the front page the menu words still mark the part being read, through `data-spy`; on a part's own page its word is marked as the page (`aria-current="page"`). Only "Front page" and "Amusements" in the index stay on the front page, which is where they are.
- One `src/main.js` boots every sheet. Each module does nothing where its elements are absent, and the stage builds the band and the ink fluid only where there is a band.
- Every word in the three languages is in `src/i18n.js`, key for key. The HTML carries the English, so a sheet reads without JavaScript. At build time `tools/build-sq.mjs` writes the Albanian and the Italian sheets from it (everything marked `data-i18n`, `data-i18n-list` or `data-i18n-attr`, the proof notes and the verse), points `data-route` links at the sheets of that language and gives every sheet its canonical and hreflang links (`en`, `sq`, `it` and `x-default`), `og:locale` and its own link preview. The Italian has not yet been read by a native speaker; the Person in the structured data still knows Albanian and English only, since Stefano is not said to speak Italian.
- Addresses are in `src/routes.js`. The language switch re-sets the sheet in place and, in the built site, moves the address to its twin (`history.replaceState`). In development each sheet has one address. The switch is three keys in the toolbar (EN, SQ, IT) and, on a phone, the tab bar's language word, which opens the three names above it. A visitor's own choice is kept and wins over the address they arrive at.
- The front page holds three case sheets. Elixir and Bar Martiri have keys, callouts and facts. Dresses by Greta is a preview: its name and two plates, the middle card of the fan and an entry in the contents ("A first look"), with no address, link to its site or facts until its domain is bought. The footer names only Elixir and Bar Martiri, since Greta has no page.
- From sheet to sheet the new page feeds in with a cross-document view transition. Its opt-in is written inline in `partials/head.html`: in the stylesheet alone it sometimes counted too late and the transition was dropped.
- Every sheet's foot shares it (the phone's own share sheet, or the address copied) and says when the site was last set: `tools/build-sq.mjs` stamps the build's date in each language, and writes it as `dateModified` too. The index has a search over every sheet's words (desktop and tablet; a phone's keyboard would cover it), read from `dist/search/<lang>.json`, which the same tool writes at build time.
- The engraving's sky takes the weather over Tirana (DESIGN.md, "The weather over Albania"): `src/weather.js` asks the Worker's `GET /api/weather`, which asks MET Norway's locationforecast for 41.3275, 19.8187 (the hour under way, not the first in MET's list, which can start an hour or two back) (free for any use with credit; its terms want an app name and contact in the User-Agent and caching, so the Worker keeps a reading for 30 minutes in the Cache API). The caption credits "MET Norway"; the privacy page says the browser never contacts them. Served without the Worker there is no reading and the sky stays as cut. `?weather=<MET symbol>&wind=<m/s>` sets it by hand for stills and checks (`rain`, `heavyrainandthunder`, `snow`, `fog`, `cloudy`…); in development `window.__sdBand.debugWeather()` shows the storm's state.
- A link shared with `?utm_source=` (and `utm_medium`, `utm_campaign`) is noted for the tab by `src/ui/from.js` and taken out of the address; a telegram sent afterwards carries it, and the admin shows it as "Came via". The poster's and the print edition's codes say so themselves.
- Phones, tablets and a phone held sideways were measured sheet by sheet on 2026-09-25 (DESIGN.md, Layout: the phone rhythm, the breakpoints; `.impeccable/build-notes.md`, "Phones, tablets and a phone held sideways"). A touch screen at least 768px wide and under 560px tall (`SHORT` in `src/state.js`, the same query in `src/style.css`) lays the case sheets one after another instead of holding them on screen.

### The Worker and the admin

- `worker/index.js` (Hono) sees every request first (`run_worker_first` in `wrangler.jsonc`). Pages leave through `worker/inject.js`, which writes the public part of the settings into them: `data-features` on `<html>`, a JSON script `#site-settings` (with `<` escaped, so typed text cannot close it), the email in every `a[data-mail]` and `[data-mail-text]`, and, once the email or the WhatsApp number is live, a JSON-LD Person carrying them. Other files pass through untouched.
- Structured data: `tools/build-sq.mjs` writes a schema.org graph into every sheet in both languages (a ProfilePage and the Person on the front page; on each case sheet, the live site it is about, credited to him; breadcrumbs everywhere), from facts the sheets already state. The Worker's Person above has the same id (`/#stefano`), so search engines read them as one.
- `shared/settings.js` is the one definition of the settings: their defaults, the check applied on save (in the admin, then again in the Worker), what each optional part needs before it shows, and the public view a page receives. A quote without its permission box ticked never reaches a page.
- `worker/admin-api.js` is the admin's API: settings, the photos (the portrait and each piece of graphic work: JPEG or WebP only, checked by its first bytes, at most 3 MB; a piece taken off the list takes its photo with it) and the inbox. Only these upload routes set a photo's key, so a saved setting can never point a page at someone else's file.
- `/stefano-doko.vcf` is his contact card (vCard 3.0, `?lang=sq` or `?lang=it` for its trade and address in that language), made by `shared/vcard.js`, the same module that makes the QR code on the contact page. It carries only what the site already shows: name, trade, country, the email, and the number while the WhatsApp part is live.
- With visit counts live, the Worker adds Cloudflare Web Analytics' beacon (the site token typed in the admin) to every page it serves, and the privacy notes switch to the wording that says so. The beacon sets no cookie. `worker/public-api.js` takes telegrams: same-origin posts only, a honeypot line, at most 6 an hour from one address. `worker/auth.js` signs the admin in (PBKDF2 password hash, HMAC-signed `SameSite=Strict` cookie, 10 tries per 15 minutes); `worker/store.js` keeps everything in one KV namespace.
- In the page, `src/ui/site.js` reads the settings and shows each part that is live. Each part is in the HTML already, hidden; switched off, the sheet is exactly the sheet without it.
- The admin (`src/admin/`) is plain JavaScript with its own stylesheet and a strict Content-Security-Policy, and never puts typed text in the page as HTML. It is not indexed.

## Before launch

- **The Worker's first deploy** (only when Luca asks for it). Create the KV namespace and put the id it prints into `wrangler.jsonc` in place of the zeros (the id is not a secret):

  ```bash
  npx wrangler kv namespace create SITE
  ```

  Set the two secrets. The session secret is any long random string; the password hash comes from the tool, which asks for the password without showing it, so it never reaches the screen, a file or the shell history:

  ```bash
  npx wrangler secret put SESSION_SECRET
  ```

  ```bash
  node tools/admin-password.mjs --print | npx wrangler secret put ADMIN_PASSWORD_HASH
  ```

  Then `npm run build` and `npx wrangler deploy`. Never set `DEV_LOGIN` on the deployed Worker (it is ignored off localhost anyway). The domain is added to the Worker in the Cloudflare dashboard.
- **Email.** The address is `stefanodoko19@icloud.com` (given 2026-09-24). Type it in the admin (Contact): the Worker then writes it into every sheet as it is served. The HTML keeps the placeholder `hello@example.invalid` (in `partials/chrome.html`, `partials/foot.html`, `index.html`, `contact/index.html` and `404.html`), which is what a page served without the Worker shows; to change that too, replace every match. The flyer and the business card carry the placeholder separately (see Print and brand).
- **Domain.** Build with the domain set. `tools/build-sq.mjs` then makes canonical, hreflang, `og:url` and `og:image` absolute on all twenty-four sheets, writes `dist/sitemap.xml` and adds it to `dist/robots.txt`. Without it the links stay root-relative and there is no sitemap. Don't leave a build made with a test domain in `dist/`.

  ```bash
  SITE_URL=https://the-domain npm run build
  ```

  In PowerShell: `$env:SITE_URL='https://the-domain'; npm run build`.
- **Contact form.** Served by the Worker, it posts the telegram to the admin's inbox (Telegrams, with an unread count), and the privacy note on the page says the site keeps it. Served without the Worker, it hands the telegram to the visitor's own mail app and nothing is stored. Nobody is notified of a new telegram: someone has to look in the admin.
- **The optional parts.** All but the rate card are off; the rate card starts on, with the menu (`shared/menu.js`, since 2026-09-26), until the admin changes it. Each shows once it is switched on in the admin and has what it needs; the admin's overview says which are live and what each is waiting for. Everything they show is typed or uploaded there: prices, quotes (with permission), the portrait, pieces of graphic work (with the client's permission), the number, the month he is free from, his profile addresses, Greta's link, the Web Analytics token. Every text has a box per language; an empty Italian box shows the English.
- **The Italian.** Have an Italian speaker read it (`STRINGS.it` in `src/i18n.js`, the Italian boxes in the admin) before it is announced.
- **Awwwards.** `SUBMISSION.md` holds the entry (title, description, the one signature, what to send) and what has to be true before it goes.
- **Dresses by Greta.** When its domain exists, type it in the admin (Greta) and switch the link on; add facts only from what its live site says, and re-shoot its plates: `node tools/shoot-work.mjs greta-home greta-phone`, then `python tools/embed-plates.py`.

## What the site may say

Everything it states comes from `PRODUCT.md`. Stefano is based in Albania (no city). The work is Elixir and Bar Martiri, told only as their own sites tell it, and Dresses by Greta by name. Web design and development, front end and back end, were confirmed by Luca on 2026-09-23 and have their own sheet (`#services`). The type case on that sheet holds 27 languages: the set Luca asked for ("the coding languages Claude can do"), not a list from Stefano, so trim it if he won't take work in some of them. Print services are not confirmed and are not stated anywhere. No invented clients, years or metrics. Prices, client quotes and the portrait appear only as entered in the admin, and a quote only with its permission box ticked. Test data used to check the layout goes back out of the settings.

## One clock

GSAP's ticker is the only animation loop. `src/main.js` adds one callback. It steps Lenis (`autoRaf: false`), reads everything the frame needs (the edition, the toolbar, the ink, the stage's boxes), and only then writes: the inking, the marquee, the stamp, the game and the WebGL stage, in that order. No module calls `requestAnimationFrame` itself. A new per-frame read belongs in a `measure*()` function, not among the writes.

The stage redraws only when something it draws has changed. A new visual input needs a place in that check, or it freezes on screen.

Where it draws depends on who scrolls the page. With a mouse, Lenis scrolls it in the frame that draws, so one canvas fixed to the screen follows. A phone or a tablet scrolls the page itself, between the script's frames, and a fixed canvas left the band and the plates trailing the finger: there the canvas is part of the page (`onPage` in `src/gl/stage.js`), scrolls with it and is only set back over the screen now and then. A tablet also holds each case sheet on screen while it is read, which a canvas on the page cannot follow, so each case sheet there draws its plates and the brayer on its name on a canvas of its own, inside the sheet (`.gl-case`): it moves with its sheet and the next sheet covers it. A sheet out of sight lets its drawing go after two seconds, so at most two hold one.

## Where each finding lives

| Finding (Awwwards SOTY teardown) | On this site | Code |
| --- | --- | --- |
| Liquid cursor | the pointer stirs the band's wet ink: a small stable-fluids solver slips the red plate against the black | `src/gl/fluid.js`, composite in `src/gl/stage.js` |
| A live world | the engraving's sun stands where the sun stands over Albania now: it rises behind the perfumes, sets into the sea by Bar Martiri, and lights the hatching from its side; after dark it has set, and the caption says which | `src/sun.js`, `setSun` in `src/gl/band.js`, the sun line in `src/ui/toolbar.js` |
| Device tilt | on a phone or a tablet a tilt leans the light and the view, as the pointer does on a computer, and they settle back when it is held still; iPhones ask first, through a word under the band | `src/ui/tilt.js`, `lean` in `src/gl/stage.js` |
| Dark mode | the night edition: press the engraving's sun and it turns into a moon, and the whole site goes dark (newsprint ink on dark stock, the engraving printed as by lamplight); press the moon for the day. A sun (or moon) in every sheet's date line does the same, the choice is kept in the browser (`sd-night`) and set before the first paint | `src/ui/night.js`, `turnSky` and the moon in `src/gl/band.js`, `placeSky` and the night inks in `src/gl/stage.js`, `:root.is-night` in `src/style.css` |
| Cursor reveal, frozen glass | a printer's loupe over each work plate: magnified true colour, a glass rim that bends the image | `src/gl/plates.js` |
| One 3D object riding the scroll | the brayer, a hand ink roller drawn with the engraving material | `src/gl/brayer.js`, `src/ui/ink.js` |
| Outline-to-fill headline | each sheet head is uninked type until the roller passes | `src/ui/ink.js`, `.ink` in `src/style.css` |
| Scroll-driven | the road: five lanes between the front page's sheets, a big red road drawn across each as it rises up the screen, the engraving's own van laying it, one lane one way and the next the other. The van is printed once by the stage from the band's (`vanSprite`); the road is drawn by a window sliding over it while it slides back inside, and all of it is laid out from the page and moved on the compositor by a ScrollTimeline (the one clock where there is none), so it never trails a phone's scroll. The verse's column rule draws down as the words take ink | `src/ui/road.js`, `src/gl/stage.js`, `src/ui/verse.js` |
| HUD labels | lettered callouts with leader rules out to the details of each screenshot | `src/ui/cases.js`, leaders inside the plates in `src/gl/plates.js` |
| Grid glitch transition | type-case tiles, black and red a hair out of register, while the language is re-set | `src/ui/tiles.js` |
| Pinned case exhibit | each case sheet is held while it develops, then the next sheet is laid over it and the read one fades | `src/ui/cases.js`, `.stack` in `src/style.css` |
| Ring reveal, odometer | the proof counter rolls with the real loading, then the stamp opens onto the sheet | `src/ui/intro.js` |
| Chamfered frames, slit wipes | bevelled plate mounts; ledes, inline cuts and the red sheet open out of a slit like paper through rollers | `.plate__mount`, `[data-feed]`, `src/ui/feed.js` |
| Theme flip with copy rewrite | PRINT / PROOF: the sheet flips to its marked-up proof (uninked type, baseline grid, struck draft, red-pencil notes) | `src/ui/proof.js` |
| Sentence with inline pictures, word highlight | the verse inks word by word around two cuts of the work | `src/ui/verse.js` |
| Two-face marquee | wood gothic and newspaper italic on one running line, speed and direction from the scroll | `src/ui/marquee.js` |
| Fanned cards | five proofs dealt into a fan: two per live site, Greta's phone in the middle | `src/ui/fan.js` |
| Stacked-card menu | the index deals out as a stack of small sheets | `src/ui/toolbar.js` |
| Live clock | the dateline keeps Albania time | `src/ui/toolbar.js`, `albaniaNow` in `src/i18n.js` |
| Grain | newsprint grain and ink speckle, generated in the browser | `src/ui/paper.js` |
| Sliced type, circular badge | the Extra headline slips in three slices under the pointer; a turning stamp to write | `src/ui/extra.js` |
| Specimen hover cards | the colophon's typeface names | `.specimen` in `index.html` |
| Sticky pill toolbar | appears once the masthead has gone by, with a reading rule | `src/ui/toolbar.js` |
| Sound off by default | press sounds synthesised with Web Audio, no files | `src/ui/press.js` |
| Footer game | Jump the ink | `src/ui/game.js` |
| Font from a drawing | draw a letter, cast it into a real .otf in the browser, download it | `src/ui/letter.js` (opentype.js, loaded on first cast) |
| Joke 404 | the sheet's words lie pied on the floor; set them again | `404.html`, `src/notfound.js` |
| Loop back to top | past the foot the front page is set again and carries you back to the top | `src/ui/edition.js` |

Also on the sheets:

| Part | Code |
| --- | --- |
| Wood-type fitting: each line takes the size and width that fill the measure (Anybody's width axis), never a stretch | `src/ui/fit.js` |
| Case editions: plates of the live sites with lettered keys, the rings and rules placed from the live pages | `src/ui/folio.js`, `src/data/plates.json` |
| The type case: the languages lie in their boxes like sorts in a compositor's case | `src/ui/typecase.js` |
| Set your own line: whatever is typed is fitted to the measure as it is typed | `src/ui/setline.js` |
| The poster press: the typed line printed as a 1080 × 1350 broadside (Albania's date, the line fitted into one to three lines, the engraving, Stefano's mark, name and a code to the site), to save or to share from the phone. Made on the visitor's own device; nothing is uploaded | `src/ui/poster.js`, the press in `src/ui/setline.js` |
| The telegraph counter: the contact form, with a word count like a telegraph office | `src/ui/telegram.js` |

The optional parts, each off until switched on in the admin:

| Part | Code |
| --- | --- |
| WhatsApp: "Write on WhatsApp" beside the email buttons, the number on the contact page | `src/ui/site.js` |
| Availability: "Available for new work from November 2026" (or "now") under the front page's lede, on the contact page and on the print edition | `src/ui/site.js`, `[data-avail]` |
| Profile links: Instagram, Facebook, LinkedIn and Behance at the foot of every sheet and on the contact page (`rel="me"`, and `sameAs` in the Person) | `src/ui/site.js`, `shared/settings.js` (`LINKS`) |
| Save to contacts: a button for the card, and on a wider screen its QR code; the admin downloads the code as an SVG for print | `src/ui/site.js`, `src/ui/qr.js`, `shared/vcard.js` |
| Readers write: client quotes as letters to the editor, before About | `src/ui/site.js`, `#quotes` in `index.html` |
| The rates: the menu, after the websites, a tab for each group; up to 24 rates, in no group or under Websites, Design, Marketing, Add-ons, Every month and Once a season, each maybe per something ("/ photo"). It starts on with the flyers' menu (`shared/menu.js`), which the admin can also put back | `src/ui/site.js`, `partials/sheet-rates.html`, `RATE_GROUPS` in `shared/settings.js` |
| The price calculator: under the rates, the visitor ticks lines and sees them add up (an estimate, not an offer), then sends the list, which opens the telegram with it written in | `src/ui/calculator.js`, `?rates=` in `src/ui/telegram.js` |
| Portrait: a photo on the About sheet, printed as an engraving, the loupe shows the photograph | `src/ui/portrait.js` |
| Graphic work: pieces uploaded in the admin, each with its title, client and year, on a sheet after the websites, printed as engravings that develop into colour; only pieces the client allows | `src/ui/graphic.js`, `#graphic` in `index.html` |
| Visit counts: Cloudflare Web Analytics, no cookies; the privacy notes say so while it is on | `worker/inject.js` |
| Greta's visit link | `src/ui/site.js` |
| The print edition: "Print a copy" in the date line (not on phones); the front page prints as one A4 broadside with a QR code | `src/ui/print.js`, `@media print` in `src/style.css` |
| Your business on the front page: the contact page sets a visitor's business name as a masthead, then carries it into the telegram | `src/ui/setfront.js` |
| The loupe on phones: hold a plate, or tap a letter of a case page's key | `src/ui/magnifier.js`, the touch branch in `src/gl/stage.js` |

## The engraving

`src/gl/band.js` builds the scene from plain geometry (lathed bottles, an extruded van, umbrellas, a palm, the sea). `src/gl/engrave.js` turns tone into line: surfaces are cut into parallel lines whose thickness follows the light, with cross-hatching in the shadows and screen-space outlines. The band renders its two plates (black and red) into one target, and the composite prints them on newsprint with a hair of misregistration. Moving the pointer over the band moves the lamp, and the hatching re-cuts itself.

`public/band-poster.jpg` is a still of the band for browsers without WebGL, rendered from the page by `node tools/stills.mjs`.

## Link previews

Each sheet has its own picture for WhatsApp, Facebook, LinkedIn and the rest, in each language: `public/og/<en|sq|it>/<home|work|about|services|elixir|martiri|made|contact>.jpg` (the work's shows the fan's three phones), 1200 by 630. `node tools/og.mjs` renders them in headless Chrome from the sheet's own words (`src/i18n.js`), fonts and picture, laid out like the brand's broadside (`brand/final/templates/og-site.html`); `--only home,elixir` and `--lang it` narrow it. `tools/build-sq.mjs` points each sheet's `og:image` at its preview, and at `public/og.png` (the brand set's, `brand/final/export/web/og-site.png`) where a sheet has none. After rendering, give each new picture its origin note, as every public raster has one:

```bash
impeccable embed-prompt public/og/it/home.jpg --prompt-file note.txt
```

(the impeccable CLI path is under Checking it). `impeccable embed-prompt --scan public` should then report 0 missing. Re-render after changing any word a preview carries: the name and the three lines beside it, a case's facts, a sheet's head, the foot line.

## Checking it

The Claude app's browser pane paints no WebGL frames, so visual and performance checks run in headless Chrome on the real GPU. The tools use `puppeteer-core`, a dev dependency that `npm install` sets up, and drive the installed Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`. Nothing downloads a browser. If Chrome moves, change `executablePath` in the tool.

Run them from the project folder:

```bash
node tools/capture.mjs
```

```bash
python tools/stitch.py
```

Frames land in `.impeccable/review/frames/`, stitched pages in `.impeccable/review/desktop.png` and `mobile.png`.

The engraving's sun follows the hour in Albania. To see another hour, add `?sun=HH:MM` (Albania time, today) to the address. In late September `?sun=06:45` shows the sunrise behind the perfumes and `?sun=18:25` the sun going into the sea (both move with the season), and `?sun=22:00` is night. `tools/stills.mjs` renders the band's still at 16:30, so it does not depend on when it is run.

| Tool | What it does | Serve first |
| --- | --- | --- |
| `tools/capture.mjs [url] [--only desktop\|mobile]` | pages down the front page a screen at a time and saves each screen; reports fps, overflow and console errors | `npm run dev` |
| `tools/stills.mjs [url] [--og]` | re-renders `public/band-poster.jpg`; `--og` also replaces `public/og.png` | `npm run dev` |
| `tools/shoot-work.mjs [name ...] [--debug <dir>]` | re-shoots the case plates from the live sites (non-essential cookies declined, nothing ordered or sent) and places every callout from the live page; writes `public/work/*.jpg` and `src/data/plates.json` | nothing, it visits the live sites |
| `python tools/embed-plates.py` | after a re-shoot, writes each plate's origin note; then `impeccable embed-prompt --scan public public/work` should report 0 missing | nothing |
| `tools/profile.mjs [url] [--mobile] [--cpu 4] [--label name]` | scrolls with real wheel events, stirs the band, hovers a plate; records every frame interval and the long animation frames | `npm run build`, then `npm run preview` |
| `tools/redsheet.mjs [--at selector] [--mobile] [--cpu 4] [--invalidations]` | traces the first sight of one part of the page (the red EXTRA sheet by default), GPU shader compiles included | `npm run build`, then `npm run preview` |
| `tools/trace.mjs [url] [fromY] [toY]` | Chrome trace of a scroll stretch: layout and style work, and the script that forced it | `npm run dev` |
| `tools/cpu.mjs [url] [stir\|scroll]` | CPU profile of one interaction, by function | `npm run dev` |
| `tools/og.mjs [--only sheets] [--lang langs]` | renders the link previews (see Link previews): home, work, about, services, elixir, martiri, made, contact | nothing, it reads the files |
| `npm run test:admin` | 86 end-to-end checks of the Worker (the weather route among them): sign-in and its locks, saving and its checks, what a page receives in each language, the photos, the contact card, the profile links, the analytics beacon, the inbox, the form's numbers and where a visit came from. Keeps the local settings and numbers it finds and puts them back, even when a step throws halfway; deletes its telegrams and its test photos. The Worker takes 6 telegrams an hour from one address, so a third run within the hour stops at the telegram (it says so); `npx wrangler kv key delete "rl:tg:127.0.0.1" --binding SITE --local` clears the local count | a fresh `npm run worker:dev` (restart it after every build) |

Performance runs are saved in `.impeccable/perf/`. `ship-desktop.json` and `ship-mobile-cpu4.json` are the baseline to beat (p95 16.8 ms). Other work on the machine swings the numbers, so compare runs made back to back. The impeccable CLI is not on PATH: it is at `~/.claude/skills/impeccable/scripts/bin/windows-x64/impeccable.exe`.

## Print and brand

Vite never reads these folders. Their renderers use the same `puppeteer-core`.

- `brand/final/` is the identity: the SD mark (a black S and a red D shaped like a speech bubble), its colours and type, and the rules in `guide.html`. `python brand/final/make.py && node brand/final/render.mjs` writes the logo SVGs in `logo/` and every export in `export/`: logo PNGs, favicons, Instagram posts, the link preview and the business card PDFs (`export/print/`). The site's favicons and `og.png` are copies of `export/web/` with an origin note embedded (`impeccable embed-prompt`). `python brand/final/highlights.py` makes the Instagram highlight covers.
- `brand/make_logo.py`, `brand/render.mjs` and `brand/v2/` to `brand/v8/` are the earlier logo studies.
- `flyer/` holds the A5 flyer (`node flyer/render.mjs`), the two-sided A5 menu flyer with all 24 lines of the menu (`node flyer/render-menuja.mjs`, with a bleed PDF for the printer) and the seven-slide Instagram carousel (`node flyer/render-instagram.mjs`), all in the modern edition. Their prices are estimates Luca has not confirmed, and they carry the real email, `stefanodoko19@icloud.com`.
- The business card (`brand/final/templates/card.html`) still has placeholders on the back: email, phone, web address and Instagram handle.

## Type

Anybody (Etcetera Type Co, SIL OFL) for the heads, the labels and, set wide, the names of the work, and Inter (Rasmus Andersson, SIL OFL; the brand's face, the Latin subset from `brand/v5/fonts-src`) for everything that is read, both self-hosted in `public/fonts/` with their licences beside them. Ultra and Old Standard, the broadside's first faces, are no longer used by the site or the admin; their files stay there for the brand set's templates (`brand/final/templates`). `tools/fonts-src/Ultra-Regular.ttf` is the full Ultra font, read by the logo studies `brand/make_logo.py` and `brand/v6/make.py`.

## Accessibility

Real headings and landmarks (one `<h1>` a sheet: the copy of the front page at the foot sets its masthead as a plain block), a skip link, keyboard-reachable controls with themed focus rings, `aria-pressed` on the language, sound, proof and stop words, and live regions for the copy button, the game and the letter caster. With reduced motion the intro, the brayer, the marquee, the word inking and the loop are replaced by their finished states.

**Stop the press.** A word in every sheet's date line (named "Stop the press: stop animations" for screen readers) gives anyone that same still sheet without changing a system setting (WCAG 2.2.2, pause, stop, hide): it stops the running line, the stamp, the engraving and the brayer where they are, inks every head, keeps the clock to the minute and drops the scroll's glide; the choice is kept in the browser (`sd-still`), and the next sheet opens with no counter and no feed. `state.reduced` is the one flag every moving part reads, so the switch only has to set it (`setStill` in `src/main.js`).

**Hit areas** (WCAG 2.2, 2.5.8): the date line's and the toolbar's words are 12 to 14px of type, but they take a press over 24px under a mouse and 44px under a finger, grown with padding and taken back out of the layout with an equal negative margin, so nothing on the sheet moves.

**The night edition.** The engraving's sun is a real button (`[data-sky]`), set over the sun wherever it stands and above the canvas, so it takes the keyboard and shows its focus ring; its name is "Night edition" with `aria-pressed`. The date line's sun is the same switch on every sheet, a 44px press under a finger. The night colours pass axe's contrast check on the front page, the contact page, a case page and the colophon; the red EXTRA sheet keeps its black ink, the contact card's QR code stays dark on light, and printing always prints the day's black on white.

**Language on a phone.** The tab bar's language word is named with the code it shows first ("IT, Language: Italian"), so a voice command can say what it sees. It opens the three names above the bar with focus on the current one. A choice or Escape closes them and returns focus to the word; a tap elsewhere just closes them.

On 2026-09-24 axe-core (WCAG 2.2 A and AA, plus best practice) found nothing on the contact page or on any panel of the admin, with the optional parts off and on. The one finding on the front page is on phones: the proofs at the back of the fanned deck are almost covered by the front one, so axe calls them too small a target. They are dealt forward by a swipe, the manicules or a tap, and every proof's sheet is also in the contents, whose entries are full-size links. On 2026-09-25, with all fourteen parts on, the same run on the front page (English and Italian on a desktop, Italian and Albanian on a phone, the language names open), the contact page (English desktop, Italian phone) and the admin's overview, contact, rates, graphic work and visits panels found nothing else, once the phone's language names had been moved inside the tab bar's navigation.

## Notes

`PRODUCT.md` holds the facts and what may be said, `DESIGN.md` the design system, and `.impeccable/build-notes.md` the build history, the performance work and the traps met on the way.
