# Instagram: @sdesign.al

The launch set for the design account: a profile picture, six highlight covers and six posts, in the site's modern edition (Inter for what is read, Anybody for the heads, one ink on newsprint, red for the flood and the marks). The covers alternate red and paper, so the grid reads as a checkerboard.

| Source | Output | Render |
| --- | --- | --- |
| `posts.html` | `post1-1.png` … `post6-7.png` (1080×1350; post 5 is the "Menuja" carousel, `../flyer/instagram-1.png` … `-7.png`) | `node social/render.mjs` |
| `../brand/final/highlights.py` | the covers' SVGs in `../brand/final/logo/highlights/`, their PNGs in `../brand/final/export/instagram/highlights/`, and `highlights.png` (the six as the profile shows them) | `python brand/final/highlights.py`, then `node social/render.mjs` |
| `../brand/final/export/instagram/profile-picture.png` | the profile picture: the SD mark on cream (SDESIGN reads in it) | `node brand/final/render.mjs` |

## Profile

- **Name:** SDESIGN · Stefano Doko
- **Bio:** Dizajner grafik & zhvillues uebi 🇦🇱 / Faqe interneti, logo, menu dhe marketing për biznese. / 📩 Shkruaj për ofertë ↓
- **Link:** the site (https://sdesign.stefanodoko-radari.workers.dev until the domain is set)

## Highlights

In this order, each with its cover from `../brand/final/export/instagram/highlights/`: **Punët** (`puna.png`), **Faqe** (`faqe.png`), **Dizajn** (`dizajn.png`), **Marketing** (`marketing.png`), **Çmimet** (`cmimet.png`), **Kontakt** (`kontakt.png`). Instagram's website cannot post stories, so highlights are made on the phone: put a cover up as a story, add it to a new highlight with the name above, and choose the same picture as the highlight's cover. The covers are 1080×1920 and keep their icon inside the circle Instagram cuts.

## Posts, in the order to post them

Posted in this order, the last one stands first on the grid: post 6 (red), 5 (paper), 4 (red) on the top row; 3 (paper), 2 (red), 1 (paper) under them.

1. **Faqe interneti për bizneset që janë të hapura sot.** One slide: `post1-1.png`.
   > Faqe interneti për bizneset që janë të hapura sot.
   >
   > Jam Stefano Doko, dizajner grafik dhe zhvillues uebi në Shqipëri. Bëj faqe interneti, logo, menu dhe postime për bizneset që duan të duken mirë, në telefon dhe në Google.
   >
   > Punë e gjallë, jo premtime: elixir.al dhe barmartiri.com janë online sot.
   >
   > 📩 Shkruaj për ofertë, në shqip ose në anglisht. Link në bio.
   >
   > #sdesign #faqeinterneti #webdesign #dizajngrafik #shqiperi #tirana #biznes #albania
2. **Menuja jote po humb klientë?** Five slides: `post2-1.png` … `post2-5.png`.
   > Menuja jote po humb klientë? 🍽️
   >
   > Tri gabime që bëjnë restorantet dhe barët me menunë online:
   > 1. Menuja është një foto e turbullt.
   > 2. Nuk ka çmime.
   > 3. Është vetëm në shqip.
   >
   > Rrëshqit për zgjidhjen. Ruaje për më vonë dhe dërgoja një restoranti që njeh.
   >
   > #restorant #menu #bar #turizem #shqiperi #tirana #durres #sarande #webdesign
3. **5 gjëra që i duhen çdo faqe biznesi.** Seven slides: `post3-1.png` … `post3-7.png`.
   > 5 gjëra që i duhen çdo faqe biznesi ✅
   >
   > 1. Butoni i WhatsApp
   > 2. Harta në Google
   > 3. Çmimet ose menuja
   > 4. Punon në telefon
   > 5. Në dy gjuhë
   >
   > Ruaje këtë listë: do të të duhet kur të bësh faqen.
   >
   > #faqeinterneti #biznes #whatsapp #googlemaps #marketingdigjital #shqiperi #webdesign #sdesign
4. **Punë e gjallë, jo premtime.** Five slides: `post4-1.png` … `post4-5.png`.
   > Punë e gjallë, jo premtime.
   >
   > elixir.al: parfumeri online, me dërgesë në gjithë Shqipërinë.
   > barmartiri.com: bar plazhi në Spille, në tri gjuhë.
   > Dresses by Greta.
   >
   > Biznesi yt është i radhës? 📩 Shkruaj për ofertë, link në bio.
   >
   > #portofolio #webdesign #dyqanonline #ecommerce #shqiperi #albania #sdesign
5. **Menuja.** The seven slides of `../flyer/instagram-1.png` … `-7.png`.
   > Menuja: çdo shërbim me çmimin nga nis 📋
   >
   > Faqet e internetit, dizajn, marketing, shtesat, kujdesi çdo muaj dhe paketa e sezonit. Rrëshqit dhe zgjidh.
   >
   > Çmimi i saktë vjen me ofertën. Shkruaj për ofertë, link në bio.
   >
   > #menuja #cmimet #faqeinterneti #logo #marketing #shqiperi #sdesign
6. **Sa kushton një faqe interneti?** Seven slides: `post6-1.png` … `post6-7.png`.
   > Sa kushton një faqe interneti? 💶
   >
   > Pesë paketat, me çmimet e tyre:
   > • Faqja e parë, nga €150
   > • Biznesi, nga €400
   > • Premium, nga €1.000
   > • Dyqani online, nga €1.200
   > • Dyqani me panel, nga €2.500
   >
   > Çmimi i saktë vjen me ofertën. Ruaje, dhe dërgoja dikujt që ka biznes.
   >
   > #sakushton #faqeinterneti #webdesign #biznes #shqiperi #tirana #albania #sdesign

## What the posts may say

The same as the site (`../PRODUCT.md`): the work is Elixir and Bar Martiri, told as their own sites tell them, and Dresses by Greta by name and picture only; no invented clients, numbers or results. The prices are the menu's (`../shared/menu.js`), starting prices in euros.
