---
name: Stefano Doko
description: The day's broadside, set as a modern daily. One black ink on warm paper, Inter for what is read, Anybody for the heads, alarm red for the flood, the marks and the van's road.
colors:
  newsprint: "#EFE6D2"
  aged-stock: "#E6DCC6"
  relief-ink: "#141414"
  ink-fade: "#5F584F"
  alarm-red: "#E23B2E"
  proof-paper: "#E4E2DA"
  proof-aged: "#D5D2C7"
  proof-ink: "#2A2825"
  proof-fade: "#57544D"
  night-paper: "#16140F"
  night-aged: "#26221B"
  night-ink: "#ECE3CE"
  night-fade: "#9C927F"
typography:
  display:
    fontFamily: "Anybody, 'Arial Narrow', sans-serif"
    fontSize: "fitted per line, 44px to 330px"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "normal"
    fontVariation: "'wdth' 50..100 used (face offers 50..150), fitted per line (prefers 70)"
  display-wide:
    fontFamily: "Anybody, 'Arial Black', sans-serif"
    fontSize: "fitted per line, 40px to 250px"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "normal"
    fontVariation: "'wdth' 118"
  headline:
    fontFamily: "Anybody, 'Arial Narrow', sans-serif"
    fontSize: "clamp(26px, 2.5vw, 38px)"
    fontWeight: 850
    lineHeight: 0.98
    letterSpacing: "0.005em"
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "Anybody, 'Arial Narrow', sans-serif"
    fontSize: "18px"
    fontWeight: 850
    lineHeight: 1.05
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 86"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.011em"
  lede:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.017em"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Anybody, 'Arial Narrow', sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 90"
  button:
    fontFamily: "Anybody, 'Arial Narrow', sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.05em"
    fontVariation: "'wdth' 92"
rounded:
  type: "4px"
  control: "999px"
  field: "14px"
  box: "20px"
  card: "26px"
  round: "99px"
spacing:
  page-margin: "clamp(16px, 3.2vw, 48px)"
  stack-sm: "10px"
  stack: "14px"
  stack-md: "18px"
  gutter: "30px"
  section: "44px"
components:
  button-ink:
    backgroundColor: "{colors.relief-ink}"
    textColor: "{colors.newsprint}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 20px 0 22px"
    height: "48px"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.relief-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 20px 0 22px"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.aged-stock}"
  button-sm:
    height: "38px"
    padding: "0 14px"
  button-lg:
    height: "58px"
    padding: "0 26px 0 28px"
  word:
    textColor: "{colors.relief-ink}"
    typography: "{typography.label}"
    padding: "6px 0"
  word-read:
    textColor: "{colors.ink-fade}"
  lang-toggle:
    rounded: "{rounded.control}"
    padding: "3px"
  lang-toggle-pressed:
    backgroundColor: "{colors.relief-ink}"
    textColor: "{colors.newsprint}"
    rounded: "{rounded.control}"
    height: "34px"
  plate:
    backgroundColor: "{colors.aged-stock}"
    rounded: "{rounded.box}"
    padding: "8px"
  fact-chip:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.relief-ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  pill:
    backgroundColor: "newsprint at 80%, frosted (blur 18px)"
    rounded: "{rounded.control}"
    height: "58px"
    padding: "0 8px 0 14px"
  tabbar:
    backgroundColor: "newsprint at 84%, frosted (blur 18px)"
    rounded: "22px"
    height: "60px"
    padding: "6px"
  lang-sheet:
    backgroundColor: "{colors.newsprint}"
    rounded: "22px"
    padding: "6px"
  card-code:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.relief-ink}"
    rounded: "18px"
    size: "176px"
    padding: "10px"
  input-sort:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.relief-ink}"
    typography: "{typography.display-wide}"
    rounded: "{rounded.field}"
    width: "56px"
    height: "48px"
  stamp:
    backgroundColor: "{colors.newsprint}"
    rounded: "{rounded.round}"
    size: "200px"
  type-case:
    backgroundColor: "{colors.newsprint}"
    rounded: "{rounded.box}"
    padding: "0"
  type-case-box:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.relief-ink}"
    typography: "{typography.display}"
    padding: "9px 10px 8px"
---

# Design System: Stefano Doko

## The modern edition (2026-09-25)

Luca asked for "the look more modern". The sheet is still a daily broadside (the dateline, the heads fitted to the measure, the engraving band, the red EXTRA sheet, the telegram), now set the way a newspaper is set today. Where this file describes the Victorian press below, this section wins:

- **Type.** Everything that is read is **Inter** (the brand's face, brand/final; 400, 13 to 23.5px, slightly tightened, upright: no italics anywhere, and a caption is told from the text by size and the ink-fade colour, not by slant). **Anybody** keeps the heads, the labels, the words and the buttons. The fat face (Ultra) is gone: the names that wore it (the cases, the case editions' mastheads, EXTRA!, TELEGRAM and TARIFF, the 404, the key letters) are Anybody 900 set wide (`--fat-w`, 118% on the width axis), fitted by size alone (src/ui/fit.js `FAT_W`). Old Standard is gone from the site and the admin; its and Ultra's files stay in public/fonts for the brand set's templates only.
- **Rules.** One hairline where there were two: no 6px plus 1.5px double rules, no 4px bars, no inner rules; blocks are closed by 1px ink, and lines inside a block (a list, a table, a form's fields) by a 17% ink hairline (`--line`).
- **Shapes.** Controls are pills (999px: buttons, the language keys, the setline field, the index search, the skip link); fields and sorts 14px; plates, cards, boxes 20px, with the picture 12px inside its mount (the stage rounds the engraved picture to the same corner: src/gl/plates.js `uRadius`); the telegram blank and the rate card 26px; case sheets come up the screen as cards with 28px top corners (24px on phones); the engraving band is a 22px-cornered cut on wider screens (the stage rounds it too: src/gl/stage.js), full-bleed and square on phones. No chamfered plates and no double-ringed boxes: an edge is one 1px ring (`--line`, or ink where it must read as a control).
- **Marks.** The star is an asterisk and the manicule an arrow (the same symbol ids in partials/defs.html, so every use follows): asterisks in alarm red before column heads, in the running line and on the availability line; the arrow on buttons, contents lines, the index, the fan's steps, the next sheet and the stamp. The masthead's hand, its stars and its vertical rules, the fleurons under the running line and the verse, and the speckle on inked heads are gone (the rubber stamp keeps its speckle).
- **Paper.** A finer, lighter grain; no mottle. Loose surfaces are plain paper.
- **Bars.** The pinned bar and the phone's tab bar are frosted glass (paper at 80 to 84%, blur 18px, saturate 1.3, a 1px hairline ring), plain paper under `prefers-reduced-transparency`. Their reading progress is a 2px alarm-red line.
- **The road.** See Components, "The road": the Elixir van drives down the sheet as it is read, painting its road red.

## Overview

**Creative North Star: "The Penny Broadside"**

The site is the day's broadside, printed while you watch. Every surface is a sheet of coarse newsprint carrying one black relief ink; each sheet feeds in through a slit, settles under the platen with a small judder, and is replaced by the next. Type is set, not styled: a condensed wood gothic is fitted line by line to the measure on its width axis, a heavy fat-face carries the case titles and the EXTRA, and a nineteenth-century newspaper serif carries everything that is read. Headlines arrive uninked, as outlines, and take ink where a 3D brayer rolls across them with the scroll.

Density is that of a front page: double rules, column rules, datelines, a contents column, captions under every cut. Structure is drawn with rules rather than filled panels. Colour is almost absent by discipline; alarm red is a flood reserved for two places and a marking colour for the press's own marks. Imagery is either a live WebGL relief engraving (tone becomes parallel line, crossed in shadow) or real screenshots of the two live businesses, mounted as plates and shown true-colour only under the loupe.

A second state, PROOF, re-inks the whole sheet as a correction proof: cooler stock, softer ink, red proof-reader's marks and ruled lines, the heads left uninked. It is a cross-fade of registered colour properties, not a separate theme.

**Key Characteristics:**
- One ink on newsprint; red is flood or mark, never decoration.
- Display type is fitted to the measure per line, never stretched and never a fixed size.
- Rules do the structural work: double rules at sheet heads, single rules between columns, star-capped rules at the ends of a measure.
- Boxes are double-bordered with small radii; round shapes belong only to the stamp, the loupe and a key's lettered rings.
- Motion is mechanical: judder, slit feed, rolling ink, type-case tiles. One GSAP ticker drives all of it.
- Reduced motion shows every finished state at once.

## Colors

A single black relief ink on warm, grained newsprint, with one alarm red used as a flooded plate and as a proof-reader's marking colour.

### Primary
- **Relief Ink** (`relief-ink`): all type, every rule, every box border, the solid button, the intro field. It is the only colour that carries structure.

### Secondary
- **Alarm Red** (`alarm-red`): flooded behind the engraving band on the front sheet and across the whole EXTRA contact sheet. As a mark it also appears where the press itself speaks: the outer focus ring, the text caret, the intro stamp and percentage, the red under-plate of the type-case tiles, and the correction marks of PROOF mode (arrows, ruling, strike-throughs).

### Neutral
- **Newsprint** (`newsprint`): the page stock, always under the grain and mottle textures (256px and 640px tiles). Also the fill of floating paper objects (pill, tab bar, fact boxes, index sheets, specimen cards) so they read as loose sheets.
- **Aged Stock** (`aged-stock`): the mount behind plates and thumbnails, the tray of the type case, the hover fill of line buttons and index sheets, the scrollbar track, the game field.
- **Ink Fade** (`ink-fade`): what is not yet pressed or already read: verse words before the scroll reaches them, visited contents entries and words, struck-through proof deletions.

### PROOF mode
Registered as `<color>` custom properties so the swap cross-fades over 0.8s on the in-out ease: newsprint becomes **Proof Paper** (`proof-paper`), aged stock **Proof Aged** (`proof-aged`), ink **Proof Ink** (`proof-ink`), fade **Proof Fade** (`proof-fade`). Alarm red does not change.

### The night edition
The reader's dark mode, the same cross-fade: the sheet printed in newsprint ink on a dark stock. Newsprint becomes **Night Paper** (`night-paper`, a warm black), aged stock **Night Aged** (`night-aged`), ink **Night Ink** (`night-ink`, a softened newsprint, 14:1 on the paper), fade **Night Fade** (`night-fade`, 5.9:1). Alarm red does not change. What is drawn in WebGL prints as by lamplight in step with it: the engraving's paper dims to `#B4AA95` under the same black, and its red flood deepens to `#8A271D`. The red EXTRA sheet keeps the day's inks (black type on red), a QR code stays dark on light, and print is always the day's. With PROOF on, the proof's paper wins.

### Named Rules
**The One Ink Rule.** Everything structural is Relief Ink on Newsprint. A second colour never appears as a fill for panels, cards, or buttons outside the EXTRA sheet.

**The Flood-or-Mark Rule.** Alarm Red is either a full flood (the engraving band, the EXTRA sheet) or a mark: the focus ring, the caret, proof marks, the tiles, the intro stamp, and since the modern edition the asterisks, the reading-progress lines and the van's road. It is never a tint, a gradient, a hover colour, or a text colour for reading copy.

**The Registered Colour Rule.** Theme colours are `@property`-registered so PRINT and PROOF cross-fade as colours. A new colour role that must follow the mode is registered the same way.

## Typography

**Display Font:** Anybody, variable wdth 50 to 150 and wght 100 to 900 (with Arial Narrow)
**Fat Face:** Ultra (with Anybody)
**Body Font:** Old Standard regular, italic, bold (with Times New Roman)

**Character:** A condensed wood gothic that is set to the measure like a compositor fills a line, a fat-face for the loudest titles, and a Victorian newspaper serif with old-style figures for everything that is read. All three are self-hosted.

### Hierarchy
- **Display** (Anybody 900, fitted 44 to 330px, line-height 0.8, uppercase): the masthead name, sheet heads (THE WORK, ABOUT, WEBSITES, AMUSEMENTS), the marquee's gothic half. Size and width axis are chosen per line at runtime so each line fills its track; the width axis prefers about 70 and never widens past 100, so a line that reaches its size cap falls short rather than turning into an extended face. On phones a sheet head takes another line whenever that sets its smallest line a third larger, so heads break into big lines instead of setting one small one.
- **Display Fat** (Ultra 400, fitted 40 to 250px, line-height 0.8 to 0.82, uppercase): case titles (ELIXIR, BAR MARTIRI), the EXTRA head (sliced into three bands), the 404 code, the pied-type sorts.
- **Headline** (Anybody 850, clamp(26px, 2.5vw, 38px), line-height 0.98, wdth 78, uppercase, balanced): the centre-column stand head.
- **Title** (Anybody 850, 17 to 20px, wdth 84 to 96, uppercase): column heads, contents entries, index sheets, fact boxes (15px).
- **Body** (Old Standard 400, 18px, line-height 1.5, old-style proportional figures; 17px on phones): running copy, max 42 to 72ch. The verse runs larger, clamp(20px, 1.78vw, 27px)/1.45, justified in two columns. On phones running text reads at one size, 18px/1.5 (the colophon's articles, privacy and terms, what the site does, the card line, the questions' answers), letters to the editor at 19px and the verse at clamp(18px, 5vw, 21px); below 30 letters a line a phone's text is too large for its measure.
- **Lede** (Old Standard italic, 22 to 27px, line-height 1.35 to 1.4): sheet ledes, case lines, the EXTRA line.
- **Caption** (Old Standard italic, 14 to 15px, line-height 1.3): cuts, plates, callouts, contents sub-lines, proof notes.
- **Label** (Anybody 800, 12 to 14px, 0.06 to 0.12em, uppercase): words (links), dateline, scores. Clocks use tabular lining figures.

### Named Rules
**The Fitted Line Rule.** Display type fills its track by choosing size and width per line (Anybody's wdth axis, or size alone for Ultra). It is never scaled with `transform`, never letter-spaced to fit, and its grid tracks are `minmax(0, 1fr)` so unfitted text cannot widen the layout before fitting runs.

**The Uninked Head Rule.** A display head starts as an outline of the ink colour (1.4px stroke) and fills as the brayer passes, in solid ink (the speckled mask went with the modern edition). The ink reaches half an em above the line so accents (the dots of Albanian Ë) take ink with their letters. Without motion, or before scripts run, heads show fully inked.

**The Inter Reads Rule.** Anything longer than a label is set in Inter, upright. Anybody is for heads, labels, names and controls only.

## Layout

A front page on a single page margin, clamp(16px, 3.2vw, 48px), shared by every sheet. The front sheet stacks: toolbar strip (78px, 6px top rule plus a 1.5px inner rule, 2px bottom), dateline strip (38px, cells divided by 1px rules), masthead (name about 60% of the measure beside a stacked two-line side block and a manicule, a star-capped vertical rule at each end), the engraving band (clamp(230px, 35vh, 360px)) with its caption under it in the serif italic, set to its right edge (in the flow, so a longer caption pushes the columns down), then three columns (1fr / 1.3fr / 1fr) divided by 1px rules with 30px inner padding and closed by 2px rules above and below.

Work cases are sticky full-height sheets that stack over one another (100dvh, min 680px), each with a 2px top rule plus inner rule and a soft upward shadow, laying out a wide plate, a column of tilted fact boxes and a tall phone plate (6.2 / 2.5 / 2.1). Its key queues down the column between the plates: lettered labels at least 32px apart, each level with its ring where there is room. A label keeps to its room (that column, or on a stacked portrait tablet the measure on its own plate's side); one longer than its room wraps onto balanced lines, set flush toward its plate, and its rule meets the first line. A case shown by name and preview only (`case--preview`, Dresses by Greta: no facts, key or address until its domain exists) sets its name across the whole measure and its two plates side by side at one height, the height that fits both the held sheet and its width. The about verse is two justified columns split by a star-capped rule that draws itself. The websites sheet follows it: three equal columns (Design, Front end, Back end) divided like the front page's, 1px rules between and 2px rules above and below, then the type case of languages. The EXTRA sheet feeds in through a slit.

The other sheets open under the same toolbar and dateline (shared partials) and close with the same foot. **Case editions** (Elixir, Bar Martiri): a masthead with the name in the fat face fitted across about 60% of the measure beside three fact lines, a lede with the live link, then six figures 84px apart and a two-column list of what the site does. Each figure pairs a plate with its key: wide plates 7fr against a 3fr key; two phone plates share a row at 250px, set plate, key, plate, key (or key, plate, key, plate), so no hole opens between them; a phone plate on its own is set with its key as one 720px cut on the sheet's axis. The key goes on the side where every rule can leave the plate without crossing a word. **The colophon at length**: the fitted head, then its articles in two columns under a 1px column rule, a table of measurements and the set-your-own-line block. **The telegraph counter**: the fitted head, the telegram blank as a loose sheet (max 980px), and a privacy note. Every sheet but the front ends with the next sheet's name fitted across the measure under a 6px plus 1.5px double rule.

Spacing is rule-led rather than scale-led: stacks at 10, 14, 18px, column padding 30px, sheet sections 44px apart, sheet tops 96 to 136px. **On phones the sheets keep one measure between them:** every sheet opens 56px under the last and closes 48px after its last line (104px from sheet to sheet; the running line 48px under the front, the next sheet's name 56px down, the foot 48px); a phone held sideways keeps 64/56. The side margin is never less than the screen's safe area, so a phone held sideways keeps its words clear of the notch and the rounded corners.

**Breakpoints.** Phones up to 767px: one column everywhere, the toolbar drops its nav, its language control and its ink button (the tab bar carries the ink "Write" slot), the pill is replaced by a bottom tab bar (5 slots, 60px), column rules turn into top rules, the band goes full-bleed at max(320px, 92vw), cases unstick and the verse goes to one ragged column. 768 to 1100px: the front goes two columns with contents spanning below, and a case sheet deals its facts beside the name only (14px, one line per card) and runs its line, button and link across the measure under both: in one row on a landscape screen, where the sheet is short, and on a portrait one as the line above the button and the link. On a portrait tablet whose held sheet is tall enough (its plate area no more than 1.2 times as wide as it is tall; 0.98 for a preview case), a case's plates are stacked and sized from the height left under the head, so they fill the sheet to its foot: the desktop plate at the left with its key beside it, and the phone plate under it, a fifth taller, set with its key as one cut on the sheet's axis; a preview case sets both plates on the axis at one height. A shorter sheet keeps them side by side. Up to 1100px a figure's key becomes a lettered list under its plate, the same letters are pinned on the plate, and no rules are drawn. Also up to 1100px the two amusements stand one under the other and a case edition's lede stands over its buttons; up to 1250px the red sheet's line stands over its three buttons (beside them it had no room: 0px at 768 and 820px); up to 900px the colophon at length runs in one column; from 768 to 819px a case edition's masthead drops its manicule, so the fat name keeps its column at its 44px floor. Wherever the letter-cutting box's own column is under 480px, the box stands over its words (a container query).

**A phone held sideways** (a touch screen at least 768px wide and under 560px tall; `state.short` in the scripts): the tablet sheet, but a case sheet is no longer held on screen, which would make it 680px tall on a 390px screen with its plates never in view. The case sheets are laid one after another and each is read as it passes (the plates develop, the key's rules draw and the facts are dealt as its body crosses the screen, 85% to 60%). The pinned bar is 50px tall at 8px from the top, the index scrolls inside the screen, and its search goes, as on a phone: the keyboard would cover the rest. Turning the phone reloads the sheet, as crossing the phone width always has.

**Layers.** Sheets 0 to 2; the WebGL canvas 30 (fixed to the screen under a mouse, part of the page on phones and tablets; on a tablet each case sheet also draws its plates on a canvas of its own at 7 inside the sheet, over its veil); the lettered pins of a compact key 31; proof notes 35; pill and tab bar 40; index 50; type-case tiles 60; intro 70; skip link 80. Anything that must sit over a WebGL plate is drawn in the plate shader, not the DOM, except those pins: they sit in the figure, outside the plate mount, whose clip-path would hold them under the canvas.

### Named Rules
**The Rule-Not-Panel Rule.** Columns, strips and sections are separated by ink rules (1px between columns, 2px closing a block, a 6px plus 1.5px double rule opening and closing a sheet). Background fills are not used to separate content.

## Elevation & Depth

The page is flat print; depth comes from loose sheets of paper lying on it. Objects that float (the pill, tab bar, fact boxes, fan cards, index sheets, specimen cards, the stamp, pied sorts, stacked case sheets) carry one soft, negatively spread ink shadow falling downward, as paper casts on paper. Boxes that sit in the page carry no shadow; their edge is drawn by inset ink rings. Hover lifts a fan card 28px and deepens its shadow; nothing else lifts.

### Shadow Vocabulary
- **Loose sheet** (`box-shadow: 0 10px 24px -12px rgb(20 20 20 / 0.45)` to `0 14px 26px -14px rgb(20 20 20 / 0.55)`): pill, tab bar, index sheets, fact boxes, the stamp.
- **Held card** (`box-shadow: 0 22px 40px -22px rgb(20 20 20 / 0.55)`, lifted `0 34px 50px -24px rgb(20 20 20 / 0.6)`): fan cards.
- **Sheet overlap** (`box-shadow: 0 -26px 48px -30px rgb(20 20 20 / 0.5)`): a case sheet sliding over the previous one.
- **Double ring** (`box-shadow: inset 0 0 0 2px ink, inset 0 0 0 4px paper, inset 0 0 0 5px ink`): the double-bordered box edge. Not a shadow; the border of the system.

### Named Rules
**The Paper-on-Paper Rule.** A shadow means a loose sheet. It is always soft, downward, ink-tinted and negatively spread; never offset hard, never coloured, never used on in-page boxes.

## Shapes

Small radii only: 6px on controls, thumbnails, focus rings and inset images; 10px on boxes, plates, cards, the type case tray and the floating bars; 4px on the inner language buttons, callouts and type sorts; square corners on the type case's compartments; round only for the EXTRA stamp (99px on its 200px box, which reads as a circle but keeps Chrome off its circle-only shaders) and the loupe. Work plates are additionally chamfered with a 14px octagonal clip on top of the 10px radius, and double-ringed (2px ink, 5px stock, 1px ink).

Borders are drawn as inset box-shadow rings rather than CSS borders, so double rules stay crisp at any width. Ornaments are SVG: a five-point star capping rules and column heads, the manicule (pointing hand) on primary actions and contents entries, a self-drawing fleuron closing the marquee and the verse.

### Named Rules
**The Shape Rule** (modern edition, replacing "Round-Is-Rare"). Controls are pills; fields and sorts 14px; plates, cards and boxes 20px; the blank and the tariff 26px; circles only for the stamp, the loupe, a key's lettered rings, the engraving's sun and moon and the road's two ends. A near-square control (the fan's steps) takes 14px, never a pill.

## Components

### Buttons
Two presses: a solid block of ink, or a double-ruled line.
- **Shape:** gently cornered (6px), 48px tall; small 38px, large 58px.
- **Ink button:** relief-ink fill, newsprint type, with an inner hairline ring (3px ink, then 1px of 60% paper) so it reads as a cut block. Carries the manicule on the primary action.
- **Line button:** transparent, double-ruled by inset rings (2px ink, 2px paper, 1px ink). Hover fills with aged stock and thickens the rings. On the EXTRA sheet it sits on newsprint.
- **Press:** `translateY(1px) scale(0.97)` over 160ms on the out ease. Disabled at 45% opacity with no press.
- **On phones** a button's words may take a second line (line-height 1.1, 8px above and below, never less than its height) rather than run off a narrow screen: the Italian "Manda il telegramma" at 320px ran 24px past it.
- **Focus:** 2px ink outline at 3px offset plus a 5px alarm-red ring (a paper ring on the EXTRA sheet), 6px radius.

### Words (links)
Wood-type words are the link and toggle style: Anybody 800, uppercase, 14px, underlined 2px at 6px offset in 30% ink. Hover (fine pointers) inks the rule fully at 3px; pressed or current inks it at 4px. Read links fade to ink-fade. A word is small type but not a small target: it takes a press over 24px (44px under a finger), grown with padding that an equal negative margin takes back out of the layout.

The date line's words are the sheet's own controls: Sound off, Proof, Print a copy (with the print edition on), and **Stop the press**. Stop the press gives anyone the still sheet a reduced-motion setting gives: the running line, the stamp, the engraving and the brayer stop where they are, every head is inked, the clock keeps the minute, the scroll loses its glide, and the choice holds on every sheet until it is pressed again ("Press stopped").

### Language control
A double-width 6px frame with a 2px inset ring holding EN, SQ and IT; the pressed one is solid ink. Switching re-sets the page under type-case tiles: a grid of ink blocks over offset red under-plates (4px, 3px misregistration) that close and reopen. On phones the tab bar's language slot shows the current code and raises a small sheet of the three names over the bar, at its right: newsprint, double-ringed, 10px, loose-sheet shadow, 44px rows in Anybody 850 caps, the current one solid ink. It rises 8px as it fades in over 160ms on the out ease (none with reduced motion) and takes the focus to the current name.

### Plates and boxes
- **Plate:** aged-stock mount, 7px padding, double-ringed, 10px radius with a 14px chamfer; the screenshot inside at 3px radius. Captions in serif italic below. On capable devices the plate is redrawn in WebGL as an engraving and the loupe shows true colour.
- **Fact box:** newsprint, double-ringed, 10px, loose-sheet shadow, Anybody 850 uppercase 15px, each set at a slight tilt (-2.2, 1.6, -0.8 degrees).
- **Feature plate / thumbnails:** aged stock with a single 2px or 1.5px inset ring, 10px and 6px.

### Navigation
- **Toolbar:** a strip under a double rule; lockup left (name in fitted Anybody 900, descriptor tracked 0.28em between stars), words centred, language control and ink button right, cells divided by 1px rules. It keeps one line and the lockup its two: from 768 to 1250px the parts close up (16px apart, words 18px apart); up to 1136px the descriptor is tracked 0.14em at 9.5px (on phones 0.14em at 10.5px, and 10px under 341px, where the Italian needs it), and the ink button drops its hand; up to 1030px the toolbar drops the ink button, which the pill carries once the head has gone by; up to 850px the parts close to 12px, the mark shrinks to 46px and the descriptor is tracked 0.1em. Albanian, whose words are longer, takes the first three steps about 45px sooner and closes its words to 10px up to 790px. A section word never breaks, even where it is two ("Chi è").
- **Where a word leads:** every section word, in the toolbar, the pill, the tab bar and the index, opens a page: the work, about, the websites, the telegraph counter. The front page keeps all its parts, and there its words still ink the part being read (4px rule) and fade once it is read; on a part's own page, the word of that page stays inked as the page (`aria-current="page"`, the same 4px rule; 3px on the tab bar). A part leading its own page opens straight under the dateline with its head as the page head (30px below the dateline, inked as the page opens), and ends with the next sheet: the work, then about, then the websites, then the telegraph counter.
- **Pill:** one navigation landmark of its own, named apart from the toolbar's ("Sections (pinned bar)"), so its mark and its ink button sit inside it. It appears after the masthead leaves: a newsprint sheet, double-ringed, 10px, 58px tall, with an ink mark and words; a 2px ink rule along its foot fills with reading progress. Slides down on the out ease over 320ms.
- **Tab bar (phones):** fixed bottom, five slots, double-ringed newsprint, 10px; current item underlined 3px; the write slot is solid ink; press scales 0.96. It stands 10px up, or on an iPhone's home bar's safe area where that is taller, and the page keeps the bar's 60px, where it stands and 16px of paper under its last line; the index rises 14px over the bar wherever the bar stands.
- **Foot (phones):** the pages two to a row, each word on a 44px line of its own (wrapped on 24px lines, a finger's reach on one word ran over the words above and below); the foot's other lines 20px apart.
- **Index:** stacked paper sheets (10px, 2px ring, loose-sheet shadow) overlapping by 6px, each a title and an italic line with a manicule. On phones it stands at the foot of the screen under a short double-rule handle, and it can be pulled down to put it away: it follows the finger down (upward it gives only a little), a pull past 70px or a flick faster than 0.11px/ms carries it on down and away, anything less springs back (300ms, out ease). A pull never opens the sheet under the finger.
- **Fan of proofs (the work sheet):** five loose proofs dealt from a pile into an arch as the sheet arrives, two per live site and the preview's phone in the middle. Under a fine pointer they spread apart around the one under it. On phones the arch becomes a deck: one proof at the front, upright and at 1.22 scale, the others fanned behind it. Drag it sideways and it follows the finger; a quick flick deals the next proof forward even when the drag was short; past either end it gives, less the further it is pulled, and settles back. A tap on the front proof opens its sheet, a tap on one behind brings it forward. Two manicules under the fan deal for anyone who does not swipe, with a count (3 / 5) between them. Only a sideways drag belongs to the fan (`touch-action: pan-y`), so the page still scrolls through it. The deck's box is the room the dealt proofs take on the screen, whichever is in front: `calc(152px + 45.5vw)` tall with the proofs standing on a floor 40px up it (hit-tested in the three languages from 320 to 430px: what shows rises at most 254-304px over the floor and hangs 40px under it), so there is no bare paper over the deck and the manicules stand clear under it. Captions on the deck are 11px.

### Inputs
The letter field is a single type sort: 56 by 48px, newsprint, 2px inset ink ring, 6px, set in Ultra 26px. The caret is alarm red.

### Type case (the languages)
Not the type-case tiles of the language switch: the languages he writes, set out like a compositor's case. An aged-stock tray, double-ringed like a plate mount (2px ink, 3px stock, 1px ink, 10px radius, 8px padding), holds one sheet of newsprint ruled into square compartments by 1px ink rules. Box size follows what the web uses most: 3 by 2 for HTML, CSS, JavaScript, TypeScript, PHP, Python and SQL, each with an italic line on what it is for; 2 by 1 and 1 by 1 for the rest. In page order the boxes tile the grid exactly, 12 columns by 6 rows, or 6 by 12 at 1100px and below. Names are Anybody caps (900 at 72% in the big boxes, 850 at 80 to 84% in the others), bottom-left, the italic line top-left. The first time the case comes into view the sorts drop into their boxes one after another (translateY from -0.5em and opacity, 460ms on the out ease, 22ms apart); reduced motion shows them set.

### Figure with key (case editions)
A plate of the live site and its key. The plate prints as the WebGL engraving and develops into colour as it comes up the sheet (start at 82% of the viewport, develop over the first 55% of the travel); then a lettered ring is drawn beside each detail and its rule runs out of the plate's edge, and the key labels (Ultra letter, italic serif line, on paper) fade in level with their rings, stacked at least 34px apart.

A ring never sits on what it names, and a rule never crosses a word. Where they go is worked out on the live page when the screenshot is taken (tools/shoot-work.mjs): the tool measures the detail's box (the control it sits in, its chip, or the ink of its text) and every visible line of text, control and picture on the screen, then sets the ring just outside the detail on the side facing the key, at the height where a straight rule to the plate's edge crosses nothing. A rule may graze the leading of a line or the padding of a button, never the letters; rules keep at least 18px of the shot apart (about 11px on the page) and in key order, so the letters read A, B, C down the column. Where nothing beside a detail is clear, the ring is pinned on the detail's edge. Both sides are stored (src/data/plates.json, `r` and `l`, each ring with the way out from its detail); the figure's `folio--flip` picks the left.

Up to 1100px the key is a list under the plate, each line led by its letter in a 20px ink ring, and the same letters are pinned on the plate where the rings would be (20px, 16px on phones); no rules are drawn. A desktop shot shrunk onto a phone makes a pinned letter several times the ring it stands for, so each pin steps out from its detail by the difference and never covers what it names.

### What the site does
A 2px rule, a star column head, then short factual lines in two columns under a 1px column rule, each line closed by a 1px rule; a dated italic note says when the site said so. One column on phones.

### The next sheet
The way on at the foot of each sheet: the next sheet's name ("Next: Bar Martiri") set in the display face and fitted across the measure, with a manicule that moves 10px on hover. It sits under a 6px plus 1.5px double rule like a sheet's head.

### Telegram blank (contact)
A loose sheet of newsprint (double ring, 10px, loose-sheet shadow) printed like a telegraph form: a strip under a 2px rule with TELEGRAM in the fat face, the addressee and a running word count (telegrams were paid by the word); fields as ruled lines, labels in Anybody 800 caps, entries in the serif at 21px, the message on ruled paper. A line that still needs filling carries the proof-reader's red underline (a mark, never red text); the message under it is ink. Sending checks the name, a few words and an email or phone, then posts the telegram to the site's inbox (read in the admin), or, on a page served without the Worker, hands it to the visitor's mail app; the status line says which, and offers to copy the telegram if no mail app opens. The send button holds still while a telegram is on its way. With WhatsApp on, an italic line under the send button gives the number as a word.

Once it has gone, the counter's stamp comes down on the blank: HANDED IN (or RECEIVED, when the inbox takes it; DORËZUAR / PRANUAR in Albanian) over the Albanian time and date it went. It is a rectangle in ink (a 2.5px ring and an inner 1.5px ring, 6px corners, turned -6 degrees), printed unevenly through the same speckle mask as the inked heads, never red and never round (rings on an exact circle cost Chrome a shader compile on first sight). It gathers speed on the way down (scale 1.32 to 1 and -12 to -6 degrees over 170ms, ease-in) and stops dead; the blank judders, the press sounds if sound is on, and phones that can buzz give one 12ms knock, also only with sound on. The mail app opens once the stamp has landed, since on a phone it takes the whole screen. It sits across the strip's rule on a phone and just below it on a wide blank, clear of the addressee and the word count. It is decoration (aria-hidden): the status line says the same in words. Reduced motion fades it in.

### Set your own line (colophon)
A single field; whatever is typed is fitted across the measure in the display face as it is typed, width axis first and then size, the way every head on the sheet is set. The line keeps 0.13em above its capitals and 0.14em below them, so Albanian's Ë and Ç print whole.

**The poster press.** Under the line, an ink button ("Print it as a poster") prints it: the line judders under the platen and the press sounds (if sound is on), then the poster comes off in a plate's mount (340px wide; the whole measure on phones), rising 16px as it fades in (320ms, out ease), with line buttons to save it and, where the phone can share a picture, to share it. The poster is 1080 × 1350 on the site's newsprint with its grain: a 7px and 2px double rule, a dateline in Anybody 800 caps (Albania's date in the page's language, and the country), the line in the wood face fitted to the 936px measure and broken into one, two or three lines (whichever prints the smallest line largest), the engraving between a 3px rule and a 10px ground, an italic line saying where it was set, and a foot with the SD mark, STEFANO DOKO, the trade and a code to the site's front page in that language. It is always the day's inks, in the night edition too.

### The optional parts (switched on in the admin)
Each is built into the page hidden and shown by the admin's settings, which the Worker writes into the page as it is served; what each shows is only what was typed or uploaded there. A hidden part is `display: none !important`, whatever display its own classes set. Off, the sheet is exactly the sheet without it.

- **WhatsApp:** a line button, "Write on WhatsApp", beside the email buttons on the front page and the red EXTRA sheet (where the four buttons then go two by two, so the line beside them keeps its measure); on the contact page, an italic line under the send button with the number as a word. It opens a chat with a greeting in the sheet's language.
- **Availability:** one line of the CV in the words' type (Anybody 800, 13px, tracked 0.1em, caps) after a star hung on its first line: "Available for new work from November 2026", or "now" once that month has come in Albania. Under the front page's lede, above its buttons; under the contact page's lede; in the print edition's "Write to Stefano" column.
- **Readers write (client quotes):** a sheet between the work and About: fitted head, then letters to the editor in two columns under a 2px rule, with a 1px column rule; each letter is the quote in the serif at 21px, then its signature in Anybody 800 caps (13px, tracked 0.08em) after an em dash, closed by a 1px rule. A quote in the other language shows its translation, marked in italic ("translated from Albanian"). One column on phones. Only quotes with their permission box ticked reach the page.
- **Profile links:** "Also on" in the serif italic, then each profile (Instagram, Facebook, LinkedIn, Behance) as a word, on a line of its own at the foot of every sheet, and on the contact page's telegram, at the right of its last line. They carry `rel="me"`, and the Person in the structured data lists them.
- **Save to contacts (contact page):** a section after the telegram, under a star column head and a 2px rule: an italic line, a line button that downloads his card in the sheet's language, and, where the screen is not a phone's (a phone cannot scan itself), the card's QR code at 176px: ink squares on newsprint in a 2px ring (8px padding, 6px corners), with "Or point a phone at the code." in italic under it. The code holds the whole card, so a phone saves it without a network.
- **The price calculator:** under the rate card, a star head ("What would it cost?") and an italic line, then the card's rates as ruled lines to tick: a 20px box in ink, the name in Anybody 850 caps at 17px, a 2px dotted leader and the price in Anybody 900 at 78% with tabular figures. The estimate closes under a 6px double rule, like a tariff's total: ESTIMATE in the label face, the sum in Anybody 900 at 34px ("from 33,000 ALL", with "from" when any ticked line is a starting price), an italic note that it is an estimate from the card and not an offer, and an ink button that opens the telegram with the ticked lines and the sum written in, for the visitor to finish. With nothing ticked the sum reads "Tick a line" and the button is gone. The lines are grouped as on the card, each group a set named by its head; the care each month is added up apart ("from €1,350 + from €40 / month"), and a line priced per photo or per product counts once, as a starting price. On phones the leader goes and the price is 19px.
- **Graphic work:** a sheet of its own after the websites: the fitted head ("Graphic work."), an italic lede, then the pieces as plates in three columns (two up to 1100px, one on phones) that start level, each in its own shape (a poster tall, a mark square), numbered on from the front page's figures (Fig. 7, Fig. 8…) with the title in bold and the client and year in italic. The stage prints each as an engraving that develops into colour as it comes up the sheet, and the loupe reads it.
- **Visit counts:** nothing shows on the sheet; the privacy notes change their wording to say the visits are counted, with no cookies.
- **The rates (rate card):** a sheet after the websites, set as a telegraph office's tariff, a loose sheet like the telegram blank (double ring, 10px, loose-sheet shadow): a strip with TARIFF in the fat face and the sender, then one row per price, the name in Anybody 850 caps, a 2px dotted leader, the price in Anybody 900 at 78% with tabular figures ("from 25,000 ALL"; "nga 25.000 lekë"); an italic line under a row says what it includes; an italic note may close the card. Rates may stand in groups (Websites, Add-ons, Every month, Once a season), each under its head in the label face over a hairline, after any rates in no group; a price can be per something, set after it quieter, in the text face ("/ month", which the monthly group says by itself, "/ photo"). On phones the name takes its own line and the leader runs to the price under it.
- **Portrait:** a plate like the work plates on the About sheet: floated right of the verse (300px) on wide screens, heading the verse below 1100px. The stage prints it as a line engraving and the loupe shows the photograph; it never develops into colour. The admin shrinks the photo to 1400px before it is sent.
- **Greta's visit link:** a line button with the manicule beside her name, level with the head's foot, so the held sheet keeps its height; under the name on phones.
- **Your business on the front page (contact page):** a field, then a small front page under the 6px plus 1.5px double rule: a dateline strip (the Albanian date, ALBANIA), the typed name fitted across the measure in Anybody 900 (at most 190px, 110px on phones) with room above for Albanian capitals, and an italic note. Empty, the placeholder name is an outline in ink-fade. Once the typing pauses (420ms), ink goes on from the left: a plain inset clip-path over 620ms on the out ease, never a rounded one. Then an ink button carries the name into the telegram's business line and moves to the message.
- **The loupe on phones:** a finger held still on a plate for 300ms brings the loupe up 76px above the fingertip, and it follows the finger until it lifts; while it is up the page does not scroll. The lens is larger than the pointer's (at most 124px, 36% of the plate's width, 46% of its height) and is kept on the plate. On a case page a tap on a letter of the key opens the lens on that detail for 1.6 seconds while the pinned letters step aside.
- **The print edition:** "Print a copy" in the dateline (front page only, not on phones; not "Print", which is the proof word's other state beside it) prints one A4 broadside, black on white, 12mm margins, one page: a 4pt and 1pt rule, a dateline (date, address, THE PRINTED EDITION), the name fitted to the 186mm measure, the descriptor line, the engraving band, the front page's lead (head and paragraph side by side), three ruled columns (the work, the websites, how to write, with a QR code to the site in its language), the rates in two columns, and the imprint at the foot of the page. Printed without it, the sheet prints as it reads, minus the screen's chrome.

### The admin
The same paper, ink and type, in Operate mode: a tool, not a sheet. A double rule under a top bar (lockup, EN/SQ, view the site, sign out); section words in a left column, a scrolling strip on phones that keeps the open section in view. Each optional part is a row: its name and what it does, a chip (ON THE SITE in solid ink, or NEEDS and what is missing, ringed with a red foot), an Off/On switch in the language control's frame, and a word to edit it; the switches line up down the list, and a part that is off shows no chip. Changes collect in a save bar at the foot of the screen; leaving with unsaved changes asks first. Fields are the site's inputs (newsprint, 2px ring, 6px), side by side in threes, EN, SQ and IT, where text shows in the site's languages, each marked with its code on a small chip of aged stock; the Italian box has a lighter ring, since it may stay empty (the Italian pages then show the English), and the overview says so. On a narrow screen they go two to a row, then one. Graphic work is a list of cards, each with its photo, its title in the three languages, the client, the year, the permission box, and words to move it up, down or off the list; a photo is kept as soon as it is chosen, the words with Save. The admin barely moves: fills and rules change over 120 to 160ms and buttons dip when pressed; with reduced motion, not even that.

### The road (signature, 2026-09-25)
Luca: "when scrolling, a red path for the car, and it follows the path, on PC and mobile". The Elixir van from the engraving drives down every sheet as it is read (src/ui/road.js). Seen from above (paper body, ink windscreen and mirrors, a red stripe on the roof; 14 to 20px wide with the margin), it keeps to a reading line on the screen (60% down, 56% on phones) and drives down the lane in the middle of a side margin; the road it has driven is painted behind it in alarm red (3px, 2.4px on phones) over a paper casing (7px, 5.5px), and the way still ahead is dotted in ink at 30%, with a paper ring where it sets out (under the engraving on the front page, under the date line elsewhere) and a red disc where it arrives (the foot). It never runs over a word: it crosses the page only in a clear strip, where nothing is set across the whole width for at least 48px (36px on phones), at most once a screen and a third, as an S from one margin's lane to the other's. Over a crossing the van slows (a crossing takes 42% of a screen's scroll, 260 to 440px), turns with the road (up to 90 degrees) and drives across, rising up the screen with the page, then catches up with the reading line. On the front page it waits under the engraving until the reader reaches it, parks on the red disc at the foot, and sets out again when the sheet runs on into the next edition. The running line is a bridge: the road and the van pass under it. It is laid out from the page as it stands (again whenever the page changes its size or its words) and given to the browser as keyframes on a ScrollTimeline, so the van and the paint move on the compositor with the scroll itself, never trailing a phone's own scroll; where there is no ScrollTimeline, the one clock moves them. On a phone the van steps aside while the keyboard is up. With the press stopped the road lies whole on the sheet and there is no van; printed, there is neither.

### The Stamp (signature)
The EXTRA sheet's round stamp: newsprint disc with a 3px ink ring, a 38px paper band carrying text on a circle, an inner 1px ring and a manicule; press scales 0.97. It sits on its own compositor layer, and its radius is 99px rather than 50%, so its rings and shadow use the same GPU shaders as every other box. Its ring of words turns 7 degrees a second as a compositor animation (WAAPI), faster with a fast scroll: the scroll's pace sets the animation's rate in half steps, and only when it changes. Written from script every frame, the turn cost a full compositor update on each frame the sheet was on screen, and a phone at a quarter speed dropped every other frame there. It stands still while the sheet is off screen and with the press stopped.

### The Press (signature motion)
One GSAP ticker drives everything, including Lenis smooth scroll and the WebGL render. State changes land with a judder (45ms steps then an 80ms settle). Sheets marked to feed open from a horizontal slit (`clip-path` inset from 50% to 0 over 760ms). The verse's inline cuts open from a thin line by transform (scaleY from 0.12, 520ms), never by a rounded clip-path. The brayer inks heads as a pure function of scroll; the head of a sheet without the proof counter (or on a return to the front page, once the counter has been seen that visit) is inked as the sheet opens. Moving from sheet to sheet, the new sheet feeds in over the old one through a horizontal slit (a cross-document view transition, `clip-path` inset from 50% to 0 over 620ms on the out ease; the opt-in is written inline in each page's head so the new sheet has it before anything loads). Easing tokens: out `cubic-bezier(0.23, 1, 0.32, 1)` for arrivals, in-out `cubic-bezier(0.77, 0, 0.175, 1)` for mode swaps. Under reduced motion there is no intro, no judder or feed, and every head, verse word, cut and rule shows finished.

**Under a finger.** A phone has no hover, so every pressable thing answers the press itself, on the `scale` property (it composes with the element's own transform) over 160ms on the out ease: fan proofs 0.97, the contents' thumbnails 0.92 (and their manicule points), index sheets 0.98, the fan's manicules 0.92; a word inks its rule at 4px while pressed, and the next sheet's line dips 2px while its manicule moves on. iOS Safari shows these only on a page that listens for touches, so the page registers an empty passive `touchstart` listener. With no pointer to stir it, the engraving band answers a tap: the wet ink is flicked outward from the fingertip in a ring of pushes over four frames, fading, and the plates slip out of register around it, then settle within about a second. The tap is only noted by the event; the splats are made in the frame, so the one clock still does all the drawing. Swipes over the band stay the page's scroll.

**The sun over Albania.** The engraving's sun stands where the sun stands over the middle of Albania at that moment (src/sun.js, no city named): it rises behind the perfume bottles in the east, crosses the sky, and sets into the sea by Bar Martiri, sinking half into the water as it goes; after dark it is gone. Its bearing runs it across the sky and its height lifts it from the horizon, the sea's far edge on the beach's side and the nearer end of the land on the perfumes'. The engraving's light comes from the sun's side (the east in the morning, over the sea in the evening, from high up at noon; after dark a low lamp from the front), so the hatching re-cuts itself through the day. Printed as two panels on a narrow screen, the sun is drawn in one: the perfumes' before noon, the beach's after. A second sentence of the caption says so, or that it has set; it shows only where the engraving is drawn. The sun is set again every half minute, so it moves no faster than the sun does.

**The sun turns to the moon.** The engraving's sun is the switch for the night edition: pressed, it shrinks away with its rays and a crescent moon grows in its place (0.8s, while the colours cross-fade); pressed again, the moon gives way to the sun. The moon is a crescent cut like the sun's disc, a paper face finely lined and an ink edge, turned with its hollow to the upper right; after dark it stands high over the sea in either edition, and it is the switch then. A caption sentence says what pressing does ("Press the sun for the night edition", "Press the moon for the day edition"). The date line carries the same switch as an 18px sun or moon among its words, on every sheet. With the press stopped, the swap is at once.

**Tilt (phones and tablets).** Tilting the phone leans the light off the sun and the view with it (up to 0.7 of the pointer's lean), and held still both settle back over about four seconds. iPhones and iPads ask for the phone's motion first, so a word under the caption asks ("Tilt to move the light"), a 46px press target, and nothing is asked until it is pressed; it goes once answered. Nothing leans with the press stopped.

**The weather over Albania (the engraving's sky).** The sky takes the weather over Tirana now, MET Norway's reading for the hour under way, asked by the site's Worker every half hour (a visitor's browser asks only the site), and the caption says it after the sun's line: "Its sky is Tirana's right now: clear, 18°C (MET Norway)." Tirana at Luca's asking: the middle of the country, where the sun is reckoned, can differ (that afternoon it had showers while Tirana was clear). Since 2026-09-25 the caption names Tirana, as Luca asked; it says where the weather is read, not where Stefano lives (the site still names no city for him). Everything is cut as the rest of the engraving is, in the same ink:
- **Clouds:** three as cut; two more partly cloudy; four more overcast, their hatching darker as the sky closes in (tone 0.06, 0.16, 0.3 in a storm), and overcast one crosses the lower third of the sun or the moon, which still shows above it and can still be pressed.
- **Rain:** thin ink strokes of one tool width (1.1px), falling fast through the air before the sky and slanting with the wind (east or west as it blows); light, steady and heavy are 28%, 60% and all of 900 strokes, and a heavy fall hazes the distance. **Snow:** paper flakes ringed in ink, falling slowly and swaying, 640 at most. **Sleet:** short strokes and a few flakes.
- **Fog:** the distance fades to paper and far outlines break up like a thinning burin line; the gulls shelter in fog, rain, snow or a storm.
- **Thunder:** a jagged bolt with a fork, cut in ink over the far sea where the sky is open (between the sun and the cone, past the cone, over the bar): a 0.12s flash and a flicker every 4 to 12 seconds. None with the press stopped, when the rain stands still in its strokes.
- **Wind:** the umbrellas and the palm sway further and faster (up to 0.067 rad), the sea swells, and above 3.5 m/s the clouds cross the sky with it.
Without a reading (a static server, no network) the sky is as it was cut. `?weather=<MET symbol>` (and `&wind=`) sets it by hand.

## Do's and Don'ts

### Do:
- **Do** separate content with ink rules (1px, 2px, and the 6px plus 1.5px double rule) instead of filled panels.
- **Do** fit display type per line on Anybody's width axis or Ultra's size, and hold it in `minmax(0, 1fr)` tracks.
- **Do** draw a box's edge as one 1px ring (the `--line` hairline, or ink for a control) on the shape scale: pills, 14, 20, 26px.
- **Do** keep Alarm Red to its flood (engraving band, EXTRA sheet) and its marks (focus ring, caret, proof marks, tiles, intro stamp, asterisks, progress lines, the road).
- **Do** register any new mode-dependent colour with `@property` so PRINT and PROOF cross-fade.
- **Do** give every state change the press judder, and let reduced motion show the finished state.
- **Do** keep all motion on the one GSAP ticker; nothing gets its own requestAnimationFrame loop.

### Don't:
- **Don't** use a second hue, gradients, or tinted panels; the world has one ink and one red.
- **Don't** set Alarm Red as the colour of reading-size text on newsprint.
- **Don't** mix shapes off the scale, or make a near-square control a pill.
- **Don't** set a callout ring on the detail it names, or run its rule through a word: the ring goes beside the detail and the rule through clear space.
- **Don't** give in-page boxes shadows, or give floating sheets a hard offset shadow.
- **Don't** stretch display type with transforms or letter-spacing to fill a measure.
- **Don't** set running copy in Anybody, or anything in italics.
- **Don't** animate a clip-path with rounded corners, or give an exact circle rings and a soft shadow: Chrome compiles GPU shaders for them the first time they are drawn, mid-scroll. Open by transform, and keep round shapes at 99px on 200px.
