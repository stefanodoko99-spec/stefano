# Flyer and Instagram "Menuja"

Print and social pieces in the site's broadside style (Anybody, Ultra and Old Standard; newsprint, ink and alarm red), carrying the SD speech-bubble mark from `../brand/final/logo/mark-tight.svg`.

| Source | Output | Render |
| --- | --- | --- |
| `flyer.html` | `flyer.pdf` (A5 print) and `flyer.png` (300 dpi preview) | `node flyer/render.mjs` |
| `instagram.html` | `instagram-1.png` … `instagram-5.png` (1080×1350 carousel: cover, websites, add-ons, monthly, contact) | `node flyer/render-instagram.mjs` |

Upload the slides in order, 1 to 5.

- **Prices** are "from" prices for Albania, estimated on 2026-09-23. They are not confirmed rates; change them in the HTML before publishing. The website's rate card takes its prices from the admin, not from here.
- **Email:** `stefanodoko19@icloud.com`, on the flyer and on slide 5.
- **Bleed:** the flyer PDF is exact A5 with no bleed. If the print shop trims, ask whether they need 3 mm added.
