"""Instagram highlight covers: one icon per section, cream on Doko Red, no words.

Instagram prints the highlight's name under the circle, so the cover carries only the icon.
Each cover is 1080x1920 (story size). Instagram shows the centre as a circle, so every
icon stays inside a 420 px square at the centre (well within the circle).
Icons share one pen: 30 px strokes, round caps and joins, solid fills only where they help.

usage: python brand/final/highlights.py   (writes brand/final/logo/highlights/*.svg)
"""
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'logo' / 'highlights'
OUT.mkdir(parents=True, exist_ok=True)
_spec = importlib.util.spec_from_file_location('final', HERE / 'make.py')
final = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(final)
RED, CREAM = final.RED, final.CREAM

W, H = 1080, 1920
CX, CY = 540, 960
PEN = f'fill="none" stroke="{CREAM}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"'
FILL = f'fill="{CREAM}"'


def at(x, y):
    """Icon coordinates are drawn on a 420 box with (0, 0) at its top-left."""
    return CX - 210 + x, CY - 210 + y


def work():
    # a browser window: frame, top bar with three dots, a picture block and two lines of text
    x, y = at(20, 50)
    return (f'<rect x="{x}" y="{y}" width="380" height="320" rx="34" {PEN}/>'
            f'<path {PEN} d="M{x},{y + 78} H{x + 380}"/>'
            + ''.join(f'<circle cx="{x + 46 + i * 40}" cy="{y + 40}" r="11" {FILL}/>' for i in range(3))
            + f'<rect x="{x + 50}" y="{y + 120}" width="140" height="150" rx="14" {FILL}/>'
            f'<path {PEN} d="M{x + 236},{y + 150} H{x + 330} M{x + 236},{y + 220} H{x + 300}"/>')


def about():
    # who: the mark itself
    c = 420 / final.mark_w(1) * 0.92
    x = CX - final.mark_w(c) / 2
    y = CY - final.mark_h(c) / 2
    return final.mark(x, y, c, CREAM, CREAM)


def services():
    # what he does: a 2x2 grid of tiles, one filled
    x, y = at(40, 40)
    s, g = 150, 40
    out = ''
    for i in range(2):
        for j in range(2):
            tx, ty = x + i * (s + g), y + j * (s + g)
            attrs = FILL if (i, j) == (1, 0) else PEN
            out += f'<rect x="{tx}" y="{ty}" width="{s}" height="{s}" rx="26" {attrs}/>'
    return out


def prices():
    # a price tag with its hole and a euro sign
    x, y = at(0, 0)
    tag = (f'M{x + 60},{y + 150} L{x + 180},{y + 40} H{x + 390} V{y + 380} H{x + 180} L{x + 60},{y + 270} Z')
    euro_cx, euro_cy, r = x + 290, y + 210, 78
    euro = (f'M{euro_cx + r * 0.62},{euro_cy - r * 0.78} A{r},{r} 0 1 0 {euro_cx + r * 0.62},{euro_cy + r * 0.78} '
            f'M{euro_cx - r * 1.15},{euro_cy - 22} H{euro_cx + 12} M{euro_cx - r * 1.15},{euro_cy + 22} H{euro_cx + 12}')
    return (f'<path {PEN} d="{tag}"/><circle cx="{x + 150}" cy="{y + 210}" r="20" {FILL}/>'
            f'<path fill="none" stroke="{CREAM}" stroke-width="26" stroke-linecap="round" d="{euro}"/>')


def contact():
    # write to Stefano: the mark's speech bubble on its own
    c = 330
    sp, dp = final.mark_parts(0, 0, c)
    # the bubble's own box: from its tail to its bowl
    bx0, bx1 = final.mark_w(c) - 0.86 * c - 0.10 * c, final.mark_w(c)
    by0, by1 = 0, 1.22 * c
    ox = CX - (bx0 + bx1) / 2
    oy = CY - (by0 + by1) / 2
    return f'<g transform="translate({ox:.1f} {oy:.1f})"><path {FILL} d="{dp}"/></g>'


def elixir():
    # a perfume bottle: cap, neck, body, a label band
    x, y = at(0, 0)
    return (f'<rect x="{x + 160}" y="{y + 10}" width="100" height="70" rx="12" {FILL}/>'
            f'<path {PEN} d="M{x + 180},{y + 80} V{y + 120} M{x + 240},{y + 80} V{y + 120}"/>'
            f'<rect x="{x + 80}" y="{y + 120}" width="260" height="280" rx="60" {PEN}/>'
            f'<rect x="{x + 130}" y="{y + 225}" width="160" height="80" rx="10" {FILL}/>')


def martiri():
    # a beach umbrella over the sea: canopy, pole, two waves
    x, y = at(0, 0)
    canopy = f'M{x + 30},{y + 190} A180,150 0 0 1 {x + 390},{y + 190} Z'
    waves = ''.join(
        f'<path {PEN} d="M{x + 40},{y + yy} q45,-28 90,0 t90,0 t90,0 t90,0"/>' for yy in (330, 395))
    return (f'<path {FILL} d="{canopy}"/>'
            f'<path {PEN} d="M{x + 210},{y + 190} V{y + 300}"/>' + waves)


def websites():
    # the websites: a page's code, two angle brackets and the slash between them
    x, y = at(0, 0)
    return (f'<path {PEN} d="M{x + 130},{y + 90} L{x + 25},{y + 210} L{x + 130},{y + 330}"/>'
            f'<path {PEN} d="M{x + 290},{y + 90} L{x + 395},{y + 210} L{x + 290},{y + 330}"/>'
            f'<path {PEN} d="M{x + 245},{y + 55} L{x + 175},{y + 365}"/>')


def design():
    # the design: a pen's nib, its slit and its breather hole, on its holder
    x, y = at(0, 0)
    nib = (f'M{x + 210},{y + 25} L{x + 335},{y + 195} Q{x + 300},{y + 285} {x + 268},{y + 335} '
           f'H{x + 152} Q{x + 120},{y + 285} {x + 85},{y + 195} Z')
    return (f'<path {PEN} d="{nib}"/>'
            f'<path {PEN} d="M{x + 210},{y + 90} V{y + 175}"/>'
            f'<circle cx="{x + 210}" cy="{y + 212}" r="24" {FILL}/>'
            f'<rect x="{x + 132}" y="{y + 350}" width="156" height="52" rx="14" {FILL}/>')


def marketing():
    # the marketing: a loudhailer with its handle, and the sound going out of it
    x, y = at(0, 0)
    return (f'<rect x="{x + 20}" y="{y + 165}" width="58" height="96" rx="12" {FILL}/>'
            f'<path {PEN} d="M{x + 92},{y + 160} L{x + 285},{y + 80} V{y + 345} L{x + 92},{y + 266} Z"/>'
            f'<path {PEN} d="M{x + 140},{y + 285} L{x + 168},{y + 385}"/>'
            f'<path {PEN} d="M{x + 330},{y + 165} Q{x + 358},{y + 212} {x + 330},{y + 260}"/>'
            f'<path {PEN} d="M{x + 372},{y + 118} Q{x + 425},{y + 212} {x + 372},{y + 307}"/>')


COVERS = {
    'puna': work, 'rreth': about, 'sherbime': services, 'cmimet': prices,
    'kontakt': contact, 'elixir': elixir, 'bar-martiri': martiri,
    # the menu's groups, for @sdesign.al (2026-09-26)
    'faqe': websites, 'dizajn': design, 'marketing': marketing,
}
for name, fn in COVERS.items():
    (OUT / f'{name}.svg').write_text(final.svg(W, H, fn(), RED), encoding='utf-8')
print('wrote', len(COVERS), 'highlight covers')
