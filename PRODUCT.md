# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + three.js + GSAP (Luca's choice, 2026-09-23). GSAP is the single animation engine: its ticker drives Lenis smooth scroll and the WebGL render; nothing else runs its own requestAnimationFrame loop.

Served by a Cloudflare Worker (Luca's choice, 2026-09-24): the static build plus a small Worker (worker/, Hono, one KV namespace) that runs the admin at /admin/, keeps the telegram inbox and the portrait photo, and writes the admin's settings into every page as it is served. The build still runs on any static host, but only as the bare sheet: every optional part off, the placeholder email, and the telegram handed to the visitor's mail app.

## Users

Business owners, in Albania first, who need a graphic designer who also builds websites: someone to make their business look good in print and on the web, often including its first proper website, designed and coded. They judge within seconds whether this person can do that for them, and they need an obvious way to get in touch in their own language.

## Product Purpose

Stefano Doko's portfolio. It shows that he makes businesses look good, proves it with live work that real businesses use every day, and turns a visit into a message. Success is a business owner writing to him.

## Positioning

A graphic designer in Albania whose portfolio is running businesses (an online perfume shop, a beach bar), not concept pieces, and whose own site demonstrates the craft directly: the visitor handles the typography, colour and motion instead of reading claims about them.

## Operating Context

Visitors read in Albanian or English, and some in Italian, and arrive on phones as often as desktops. They compare him with whoever else they know who "does design"; the two live sites are the thing they can check.

## Capabilities and Constraints

- Three languages: English and Albanian, both complete, and since 2026-09-25 Italian (Luca's "do it all" after it was offered: Bar Martiri's own site speaks Italian, and Italian businesses are a likely market for a designer in Albania), with an EN/SQ/IT switch. Each language has its own address: the Albanian sheets live under /sq/ (since 2026-09-23) and the Italian under /it/, both written at build time by tools/build-sq.mjs, with hreflang and canonical links. Those links are root-relative until the domain is known; set SITE_URL for the build before launch, which also writes the sitemap. The Italian has not been read by a native speaker yet. Stefano is not said to speak Italian: the telegram still asks for Albanian or English, and the structured data lists only those two.
- Sheets (Luca's choice, 2026-09-23): the front page; a case edition for each live site (/work/elixir/, /work/bar-martiri/); how this sheet was made (/how-it-was-made/); and the telegraph counter (/contact/), a contact form. Since 2026-09-25 (Luca: "the homepage will be how it is but if people click something it should redirect") the front page's parts are also pages of their own: the work (/work/), about (/about/) and the websites (/services/). The front page keeps every part as it was; every menu word and link on it leads to the page.
- The contact form checks what it needs, then posts the telegram to the Worker, which keeps it for the admin's inbox (limited to 6 an hour from one address, with a honeypot line for bots); the page's privacy note says so. Served without the Worker, the form writes the telegram into the visitor's own mail app instead, addressed to the site's email, and nothing is stored.
- May state that Stefano is based in Albania (a live Albania-time clock is allowed). No city is confirmed. Since 2026-09-25 the engraving's sun follows the sun as it stands over the middle of Albania (computed, no city named), and the caption says so.
- Contact: `stefanodoko19@icloud.com` (given 2026-09-24), typed in the admin (Contact) before launch. Until then the site uses the placeholder `hello@example.invalid`, and the admin's overview marks it as not set.
- The admin (/admin/, English and Albanian, added 2026-09-24 at Luca's request): the email, the WhatsApp number, and fourteen optional parts, each off until switched on there: the WhatsApp button, availability (the month Stefano can take new work from, which only he can give), the rate card, the portrait, client quotes, Greta's visit link, the print edition, "your business on the front page" on the contact page, and the loupe on phones; and since 2026-09-25 his profile links (Instagram, Facebook, LinkedIn, Behance), "save to contacts" (his card and its QR code), the price calculator under the rate card, graphic work (pieces uploaded with the client's permission) and visit counts (Cloudflare Web Analytics, no cookies). A part shows only when it is on and has what it needs (a number, a priced rate, a photo, a quote or a piece with permission, a profile address, a site token, a link); the overview says which are live and what each is waiting for. Every text has a box per language; an empty Italian box shows the English. Sign-in is a password whose hash Luca sets himself (`npm run admin:password`, then `wrangler secret put ADMIN_PASSWORD_HASH`); it is never in the repository. On localhost a one-click local sign-in stands in for it.
- Confirmed by Luca on 2026-09-23: Stefano is also a website designer and developer, front end and back end. The site says so and has a websites sheet (Design, Front end, Back end).
- Coding languages: the site lists 27, from HTML, CSS, JavaScript, TypeScript, PHP, Python and SQL to Zig. Luca asked for "the coding languages Claude can do", so the list is that set, not a skills inventory from Stefano. Trim it if he will not take work in some of them.
- Not confirmed, so not stated: print services (identities, posters, books, menus, labels). Anything more specific needs Luca's confirmation first.
- No invented facts: no other clients, years, roles, metrics or awards. Client quotes, the portrait and its caption appear only as typed or uploaded in the admin, and a quote only with its permission box ticked; nothing in the code supplies them. Prices are the exception since 2026-09-26 ("i want a menu that has all of it inside"): the rate card starts on with the menu of the flyers (`shared/menu.js`, 24 starting prices in euros, in six groups, including design and marketing), and the admin can change any line or switch it off. Five of its prices are estimates not yet confirmed: fixing a site, the full identity, the flyer or poster, the posting calendar and the email campaign. Test data used to check the layout is never left in the settings.

## Brand Commitments

- Name: Stefano Doko. Descriptors: graphic designer; web designer and developer. The short form, where space is tight (toolbar lockup, intro stamp), is "Designer & developer" / "Dizajner & zhvillues".
- Earlier sites used "Stefano — graphic design" as the page title; the logo (chosen by Luca, 2026-09-23) is the SD speech bubble ("Say it"): a black S and a red D shaped like a speech bubble, which replaced the earlier red D with an S counter the same day; files and rules in brand/final/ (guide.png). It appears in the toolbar lockup, the pill and the favicon.

## Evidence on Hand

- **elixir.al**: an online perfume shop with designer, Arabic and niche fragrances, delivered across Albania (restates the site's own description). Screenshots, Sept 2026: `LC/claude-site/work/elixir-desktop.jpg`, `elixir-phone.jpg`.
- **barmartiri.com**: Bar Martiri in Spille, ice cream and sunbeds by the sea, in three languages (restates the site's own description). Screenshots, Sept 2026: `LC/claude-site/work/martiri-desktop.jpg`, `martiri-phone.jpg`.
- **The case editions' plates**, captured from both live sites on 2026-09-23 by tools/shoot-work.mjs with the sites' non-essential cookies declined (public/work/elixir-*.jpg, martiri-*.jpg, each carrying its provenance). What the case pages say about each site restates what the site itself showed that day (delivery terms, prices, hours, languages); they are dated on the page.
- **Dresses by Greta** (added 2026-09-24 at Luca's request, as Stefano's work): shown on the front page by name and preview only. Its site is live at a temporary Cloudflare Workers address and gets its own domain later, so the page carries no address, no link and no facts about it (its shop was not yet selling). Screenshots of 2026-09-24 by tools/shoot-work.mjs, taken as the page opens with nothing clicked: public/work/greta-home.jpg, greta-phone.jpg. Once the domain exists: type it in the admin (Greta) and switch her link on; facts only from what the live site says.
- Absent until someone enters them in the admin, and never to be fabricated: a portrait photo, client quotes (with the client's permission), the WhatsApp number, the real email, his graphic design work (each piece with its client's permission), his profile addresses, the Web Analytics token. Absent altogether: other projects beyond these three, years in practice.

## Product Principles

1. Show, don't claim. Every statement about Stefano is backed by the two live sites or confirmed by Luca.
2. The site is the audition. Its own craft is the first piece of evidence a business owner sees.
3. The way to write to him is never more than one gesture away, in every language the site speaks.
4. Albanian is first-class, never a translation afterthought.
