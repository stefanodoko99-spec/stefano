# Flyer and Instagram "Menuja"

Print and social pieces carrying the SD speech-bubble mark from `../brand/final/logo/mark-tight.svg`, all three in the site's modern edition (`../DESIGN.md`, since 2026-09-25): Inter for what is read, Anybody for the heads, the labels and the prices, red asterisks before the heads, and the site's red contact sheet with its stamp. The two A5 flyers share `sheet.css`; all three load `sheet.js`, which fits the big lines to their width and turns on the bleed (`?bleed=1`).

| Source | Output | Render |
| --- | --- | --- |
| `flyer.html` | `flyer-print-bleed.pdf` (send this one to the printer: A5 plus 3 mm bleed), `flyer.pdf` (trim size) and `flyer.png` (300 dpi preview) | `node flyer/render.mjs` |
| `menuja.html` | `menuja-print-bleed.pdf` (send this one to the printer: A5 plus 3 mm bleed, two sides), `menuja.pdf` (trim size) and `menuja-1.png`, `menuja-2.png` (each side, 300 dpi preview) | `node flyer/render-menuja.mjs` |
| `instagram.html` | `instagram-1.png` … `instagram-7.png` (1080×1350 carousel: cover, websites, design, marketing, add-ons, monthly with the season, the work and contact) | `node flyer/render-instagram.mjs` |

Upload the slides in order, 1 to 7. The carousel holds the same 24 lines as the menu flyer, at the same prices.

- **Prices** are "from" prices for Albania, estimated on 2026-09-23. They are not confirmed rates; change them in the HTML before publishing. The website's menu starts from the same 24 lines (`../shared/menu.js`) and is changed in the admin: a price changed in one place is not changed in the other.
- **The menu flyer** holds the whole menu, 24 lines in six groups: the websites on the front; design, marketing, the season, the add-ons and the monthly care on the back. Nineteen lines are the carousel's, at its prices. Five are new, with prices estimated on 2026-09-25 and not confirmed: fixing an existing site (€80), a full identity (€250), a flyer or poster (€40), a posting calendar (€50 a month) and an email campaign (€40). The site's menu carries the same lines since 2026-09-26; confirm these five before printing.
- **Email:** `stefanodoko19@icloud.com`, on both flyers and on slide 7.
- **Bleed:** each flyer has its bleed file: the paper runs 3 mm past the trim on every side and everything set stays at least 6.5 mm inside it. Print the menu flyer both sides, turned on the long edge.
