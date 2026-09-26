// The engraving band: an allegory cut for this sheet. On the left a skyline
// of perfume bottles with an Elixir van on the road (an online shop that
// delivers across Albania); on the right Bar Martiri's beach at Spille, with
// umbrellas, sunbeds, an ice-cream cone, a palm, the sea and the sun.
// Everything is geometry; the engraving material turns it into line.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { engrave, outline, hull, shared } from './engrave.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const lathe = (pts, segs = 44) => new THREE.LatheGeometry(pts.map(([r, y]) => V2(r, y)), segs);

function textTexture(lines, w = 1024, h = 256) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach(({ text, font, y }) => { ctx.font = font; ctx.fillText(text, w / 2, y * h); });
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

const keepsOwnMesh = (mat) => {
  const u = mat.uniforms;
  return !u || u.uMode.value === 4 || u.uMode.value === 6 || u.uStripes.value > 0 || u.uWave.value > 0 || u.uFlatN.value > 0;
};

function bake(geometry, matrix) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.applyMatrix4(matrix);
  return g;
}

// Merge the static meshes under `root` by material, stopping at nested
// groups that animate on their own.
function consolidate(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const byMat = new Map();
  const byPx = new Map();
  const merged = [];
  root.traverse((o) => {
    if (o === root || !o.isMesh || o.userData.isHull) return;
    for (let p = o; p && p !== root; p = p.parent) if (p.userData.dynamic) return;
    if (keepsOwnMesh(o.material)) return;
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(bake(o.geometry, m));
    for (const h of o.children) {
      if (!h.userData.isHull) continue;
      const px = h.material.uniforms.uPx.value;
      if (!byPx.has(px)) byPx.set(px, []);
      byPx.get(px).push(bake(h.geometry, m));
    }
    merged.push(o);
  });
  if (merged.length < 2) return;
  merged.forEach((o) => {
    o.parent.remove(o);
    o.geometry.dispose();
    o.children.forEach((h) => { if (h.userData.isHull) { h.geometry.dispose(); h.material.dispose(); } });
  });
  for (const [mat, list] of byMat) {
    const g = mergeGeometries(list, false);
    list.forEach((x) => x.dispose());
    if (g) root.add(new THREE.Mesh(g, mat));
  }
  for (const [px, list] of byPx) {
    const g = mergeGeometries(list, false);
    list.forEach((x) => x.dispose());
    if (!g) continue;
    const h = new THREE.Mesh(g, hull(px));
    h.renderOrder = -1;
    h.userData.isHull = true;
    root.add(h);
  }
}

export function createBand() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(18, 4, 1, 220);
  const world = new THREE.Group();
  scene.add(world);
  const anim = [];
  // the wind over Albania (setWeather): how far the umbrellas and the palm
  // sway and how fast, and how fast the clouds cross (+x blows to the west, the sea's side)
  const wx = { sway: 0.012, pace: 0, drift: 0 };

  const add = (geo, mat, [x, y, z] = [0, 0, 0], { rot = [0, 0, 0], scale, line = 1.7, parent = world } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(...rot);
    if (scale) m.scale.set(...scale);
    if (line) outline(m, line);
    parent.add(m);
    return m;
  };

  // ---------- materials ----------
  const M = {
    glass: engrave({ mode: 0, freq: 7, dir: [0, 1, 0], cross: 7, crossDir: [1, 0.35, 0.2], rim: 0.55, ambient: 0.28 }),
    flute: engrave({ mode: 1, freq: 44, rim: 0.4, ambient: 0.26, tone: 0.05 }),
    cap: engrave({ mode: 0, freq: 13, dir: [0, 1, 0], cross: 10, crossDir: [1, -0.4, 0.3], tone: 0.18, rim: 0.6 }),
    label: engrave({ mode: 0, freq: 11, dir: [1, 1, 0], cross: 11, crossDir: [1, -1, 0], tone: 0.42, ambient: 0.5, rim: 0 }),
    land: engrave({ mode: 0, freq: 2.4, dir: [0, 0, 1], base: 1, ambient: 0.1, rim: 0 }),
    road: engrave({ mode: 0, freq: 3, dir: [1, 0, 0], tone: -1, rim: 0, ambient: 1 }),
    ink: engrave({ solid: 1 }),
    sand: engrave({ mode: 5, freq: 5.5, tone: -0.12, rim: 0, ambient: 0.6 }),
    sea: engrave({ mode: 3, freq: 5, base: 2, flat: 1, wave: 1, tone: 0.08, rim: 0, ambient: 0.1 }),
    van: engrave({ mode: 0, freq: 8, dir: [0, 1, 0], cross: 8, crossDir: [1, 0.1, 0.4], rim: 0.4, ambient: 0.32 }),
    window: engrave({ mode: 0, freq: 6, dir: [1, 1, 0], base: 1, ambient: 0.2, rim: 0 }),
    tyre: engrave({ mode: 1, freq: 22, base: 1, ambient: 0.1, rim: 0 }),
    hub: engrave({ mode: 4, freq: 14, ambient: 0.5, rim: 0.2 }),
    pole: engrave({ mode: 0, freq: 16, dir: [0, 1, 0], tone: 0.28, rim: 0.4 }),
    canopy: engrave({ mode: 6, freq: 72, stripes: 8, rim: 0.2, ambient: 0.3, side: THREE.DoubleSide }),
    bed: engrave({ mode: 0, freq: 7, dir: [1, 0, 0], cross: 9, crossDir: [0, 1, 0], tone: 0.06, rim: 0.3 }),
    kiosk: engrave({ mode: 0, freq: 8, dir: [0, 1, 0], cross: 8, crossDir: [1, 0.2, 0.5], tone: 0.02, rim: 0.3 }),
    roof: engrave({ mode: 0, freq: 5, dir: [1, 0, 0.3], base: 1, ambient: 0.2, rim: 0 }),
    awning: engrave({ mode: 0, freq: 2.6, dir: [1, 0, 0], tone: 0.5, ambient: 1, rim: 0 }),
    cone: engrave({ mode: 0, freq: 6.5, dir: [1, 1, 0], cross: 6.5, crossDir: [1, -1, 0], tone: 0.22, rim: 0.4 }),
    scoop: engrave({ mode: 0, freq: 9, dir: [0, 1, 0.25], rim: 0.55, ambient: 0.3 }),
    trunk: engrave({ mode: 0, freq: 8, dir: [0, 1, 0], tone: 0.16, rim: 0.5 }),
    frond: engrave({ mode: 1, freq: 30, tone: 0.12, rim: 0.2, ambient: 0.35, side: THREE.DoubleSide }),
    sun: engrave({ mode: 4, freq: 3.4, ambient: 1, tone: 0.18, rim: 0, far: 0 }),
    moon: engrave({ mode: 0, freq: 5.2, dir: [0.25, 1, 0], ambient: 1, tone: 0.24, rim: 0, far: 0 }),
    cloud: engrave({ mode: 0, freq: 10, dir: [0, 1, 0], ambient: 0.45, rim: 0.45 }),
  };

  // ---------- land, road, sand, sea ----------
  add(new THREE.PlaneGeometry(12.6, 13), M.land, [-8.0, 0, -3.3], { rot: [-Math.PI / 2, 0, 0], line: 0 });
  add(new THREE.PlaneGeometry(34, 1.3), M.road, [0, 0.012, 2.1], { rot: [-Math.PI / 2, 0, 0], line: 0 });
  add(new THREE.BoxGeometry(34, 0.03, 0.05), M.ink, [0, 0.03, 1.44], { line: 0 });
  add(new THREE.BoxGeometry(34, 0.03, 0.05), M.ink, [0, 0.03, 2.76], { line: 0 });
  for (let i = -8; i <= 8; i++) add(new THREE.BoxGeometry(0.75, 0.02, 0.07), M.ink, [i * 2.05, 0.03, 2.1], { line: 0 });
  add(new THREE.PlaneGeometry(16.6, 5.3), M.sand, [6.6, 0.006, -0.8], { rot: [-Math.PI / 2, 0, 0], line: 0 });
  const sea = add(new THREE.PlaneGeometry(17.2, 15, 140, 44), M.sea, [6.9, 0, -11], { rot: [-Math.PI / 2, 0, 0], line: 0 });
  // the coast where the land ends: a black edge running back to the horizon
  add(new THREE.BoxGeometry(0.06, 0.05, 21), M.ink, [-1.7, 0.02, -7.9], { line: 0 });
  sea.renderOrder = -2;
  add(new THREE.BoxGeometry(20, 0.05, 0.05), M.ink, [7, 0.12, -18.4], { line: 0 });
  // the shore: a wavering line where the sand meets the sea
  const shore = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => new THREE.Vector3(-1.7 + i * 1.3, 0.05, -3.45 + Math.sin(i * 1.7) * 0.18)));
  add(new THREE.TubeGeometry(shore, 90, 0.05, 5), M.ink, [0, 0, 0], { line: 0 });

  // ---------- perfume skyline ----------
  const bottle = (x, z, parts) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    world.add(g);
    parts.forEach(([geo, mat, pos, opts]) => add(geo, mat, pos, { ...opts, parent: g }));
    return g;
  };
  // far row: tall flacons as towers
  bottle(-12.4, -8, [[lathe([[0, 0], [0.8, 0], [0.85, 0.1], [0.85, 4.6], [0.5, 5.0], [0.25, 5.1], [0.25, 5.5], [0, 5.5]]), M.glass], [new THREE.SphereGeometry(0.42, 24, 16), M.cap, [0, 5.85, 0]]]);
  bottle(-7.4, -8.5, [[new RoundedBoxGeometry(1.5, 5.6, 1.0, 4, 0.14), M.glass, [0, 2.8, 0]], [new RoundedBoxGeometry(0.7, 0.8, 0.7, 3, 0.06), M.cap, [0, 6.05, 0]]]);
  bottle(-2.9, -7.5, [[lathe([[0, 0], [1.0, 0], [1.05, 0.2], [0.9, 2.2], [0.55, 3.8], [0.2, 4.3], [0.2, 4.6], [0, 4.6]], 8), M.flute], [lathe([[0, 4.6], [0.35, 4.8], [0.4, 5.3], [0, 5.9]], 8), M.cap]]);
  // back row
  bottle(-10.3, -2.7, [[lathe([[0, 0], [0.62, 0], [0.66, 0.08], [0.66, 3.3], [0.48, 3.55], [0.22, 3.66], [0.22, 3.9], [0, 3.9]]), M.glass], [new THREE.SphereGeometry(0.36, 24, 16), M.cap, [0, 4.22, 0]]]);
  bottle(-8.05, -2.9, [[new RoundedBoxGeometry(1.15, 4.3, 0.8, 4, 0.12), M.glass, [0, 2.15, 0]], [new THREE.BoxGeometry(0.46, 0.5, 0.46), M.cap, [0, 4.55, 0]], [new THREE.BoxGeometry(0.7, 1.1, 0.03), M.label, [0, 2.3, 0.41], { line: 1 }]]);
  bottle(-5.9, -2.5, [[lathe([[0, 0], [0.92, 0], [1.02, 0.2], [1.02, 1.05], [0.72, 1.32], [0.26, 1.42], [0.26, 1.62], [0, 1.62]]), M.glass], [new THREE.CylinderGeometry(0.36, 0.36, 0.45, 28), M.cap, [0, 1.85, 0]]]);
  bottle(-3.8, -2.6, [[new THREE.CylinderGeometry(0.44, 0.44, 3.3, 32), M.glass, [0, 1.65, 0]], [new THREE.CylinderGeometry(0.2, 0.26, 0.35, 20), M.cap, [0, 3.48, 0]], [new THREE.BoxGeometry(0.42, 0.14, 0.14), M.cap, [0.22, 3.72, 0]]]);
  // front row: the square flacon
  bottle(-11.2, 0.55, [
    [new RoundedBoxGeometry(1.55, 2.35, 1.0, 4, 0.16), M.glass, [0, 1.18, 0]],
    [new THREE.CylinderGeometry(0.2, 0.2, 0.2, 20), M.cap, [0, 2.44, 0], { line: 1.2 }],
    [new RoundedBoxGeometry(0.98, 0.9, 0.98, 3, 0.07), M.cap, [0, 2.98, 0]],
    [new THREE.BoxGeometry(1.0, 0.98, 0.03), M.label, [0, 1.12, 0.515], { line: 1.1 }],
  ]);
  // the atomizer flask with its bulb and tassel
  const tube = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.46, 0), new THREE.Vector3(-0.4, 2.7, 0), new THREE.Vector3(-0.95, 2.62, 0), new THREE.Vector3(-1.22, 2.42, 0)]);
  bottle(-8.9, 0.7, [
    [lathe([[0, 0], [0.45, 0], [0.62, 0.08], [0.95, 0.5], [1.08, 1.0], [1.0, 1.45], [0.72, 1.82], [0.3, 2.02], [0.2, 2.1], [0.2, 2.3], [0.3, 2.34], [0.3, 2.5], [0, 2.5]]), M.glass],
    [new THREE.TubeGeometry(tube, 24, 0.05, 6), M.ink, [0, 0, 0], { line: 0 }],
    [new THREE.SphereGeometry(0.3, 24, 16), M.cap, [-1.25, 2.16, 0], { scale: [1, 1.3, 1] }],
    [new THREE.ConeGeometry(0.15, 0.55, 12), M.cap, [-1.25, 1.6, 0], { rot: [Math.PI, 0, 0] }],
  ]);
  // the attar bottle with its domed cap
  bottle(-6.85, 0.5, [
    [lathe([[0, 0], [0.5, 0], [0.56, 0.1], [0.42, 0.22], [0.36, 0.45], [0.58, 0.95], [0.66, 1.5], [0.56, 2.05], [0.3, 2.4], [0.16, 2.6], [0.16, 2.95], [0.26, 3.02], [0.26, 3.1], [0, 3.1]]), M.glass],
    [lathe([[0, 3.1], [0.28, 3.12], [0.44, 3.35], [0.46, 3.6], [0.32, 3.9], [0.14, 4.1], [0.06, 4.35], [0.05, 4.62], [0, 4.72]]), M.cap],
  ]);
  // the cut-crystal bottle
  bottle(-4.9, 0.6, [
    [lathe([[0, 0], [0.85, 0], [0.95, 0.25], [0.95, 1.55], [0.66, 2.0], [0.26, 2.18], [0.26, 2.4], [0, 2.4]], 8), M.flute],
    [lathe([[0, 2.4], [0.4, 2.55], [0.52, 2.9], [0.3, 3.3], [0, 3.5]], 8), M.cap, [0, 0, 0], { rot: [0, Math.PI / 8, 0] }],
  ]);
  // a gift box with a bow
  bottle(-3.25, 1.05, [
    [new THREE.BoxGeometry(1.3, 0.85, 1.0), M.kiosk, [0, 0.425, 0]],
    [new THREE.BoxGeometry(0.2, 0.87, 1.02), M.label, [0, 0.425, 0], { line: 0.8 }],
    [new THREE.BoxGeometry(1.32, 0.87, 0.2), M.label, [0, 0.425, 0], { line: 0.8 }],
    [new THREE.TorusGeometry(0.2, 0.05, 8, 20), M.cap, [-0.18, 0.98, 0], { rot: [0, 0, 0.5] }],
    [new THREE.TorusGeometry(0.2, 0.05, 8, 20), M.cap, [0.18, 0.98, 0], { rot: [0, 0, -0.5] }],
  ]);

  // ---------- the Elixir van on the road ----------
  const van = new THREE.Group();
  van.userData.dynamic = true;
  van.position.set(-8, 0, 2.05);
  world.add(van);
  const s = new THREE.Shape();
  s.moveTo(0, 0.24); s.lineTo(3.4, 0.24); s.lineTo(3.4, 1.02); s.quadraticCurveTo(3.36, 1.2, 3.12, 1.24);
  s.lineTo(2.78, 1.3); s.lineTo(2.34, 1.66); s.lineTo(0.16, 1.66); s.quadraticCurveTo(0, 1.66, 0, 1.48); s.lineTo(0, 0.24);
  const body = new THREE.ExtrudeGeometry(s, { depth: 1.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 10 });
  body.translate(-1.7, 0, -0.65);
  add(body, M.van, [0, 0, 0], { parent: van });
  const win = new THREE.Shape();
  win.moveTo(2.08, 1.06); win.lineTo(2.72, 1.06); win.lineTo(2.72, 1.24); win.lineTo(2.36, 1.52); win.lineTo(2.08, 1.52); win.lineTo(2.08, 1.06);
  const winGeo = new THREE.ShapeGeometry(win);
  winGeo.translate(-1.7, 0, 0);
  add(winGeo, M.window, [0, 0, 0.71], { parent: van, line: 0 });
  const vanText = textTexture([{ text: 'ELIXIR', font: '900 150px Anybody', y: 0.45 }, { text: 'PARFUME', font: '700 52px Anybody', y: 0.86 }], 1024, 320);
  const decal = engrave({ mode: 0, freq: 30, tone: -1, ambient: 1, rim: 0, map: vanText });
  add(new THREE.PlaneGeometry(1.95, 0.62), decal, [-0.62, 0.78, 0.705], { parent: van, line: 0 });
  const wheels = [];
  [[-0.95, 0.72], [-0.95, -0.72], [1.05, 0.72], [1.05, -0.72]].forEach(([x, z]) => {
    const w = add(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 28), M.tyre, [x, 0.34, z], { rot: [Math.PI / 2, 0, 0], parent: van, line: 1.2 });
    w.userData.dynamic = true;
    add(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 18), M.hub, [0, 0, 0], { parent: w, line: 0 });
    wheels.push(w);
  });
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), M.hub, [1.72, 0.82, 0.45], { rot: [0, 0, Math.PI / 2], parent: van, line: 0.8 });
  anim.push((t, dt) => {
    van.position.x += dt * 1.15;
    if (van.position.x > 17) van.position.x = -17;
    wheels.forEach((w) => { w.rotation.y -= dt * 1.15 / 0.34; });
    van.position.y = Math.abs(Math.sin(t * 9.0)) * 0.012;
  });

  // ---------- the ice-cream cone ----------
  const cone = new THREE.Group();
  cone.position.set(1.75, 0, 0.55);
  world.add(cone);
  add(new THREE.CylinderGeometry(0.28, 0.38, 0.3, 24), M.kiosk, [0, 0.15, 0], { parent: cone });
  add(new THREE.ConeGeometry(0.64, 2.1, 36, 1, true), M.cone, [0, 1.36, 0], { rot: [Math.PI, 0, 0], parent: cone });
  const scoopGeo = new THREE.SphereGeometry(0.74, 40, 28);
  const sp = scoopGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i);
    const bump = 1 + 0.06 * Math.sin(x * 9 + z * 5) * Math.cos(y * 7) + (y < -0.25 ? -0.05 * Math.sin(Math.atan2(z, x) * 7) : 0);
    sp.setXYZ(i, x * bump, y * bump, z * bump);
  }
  scoopGeo.computeVertexNormals();
  add(scoopGeo, M.scoop, [0, 2.5, 0], { parent: cone });
  add(new THREE.SphereGeometry(0.56, 32, 22), M.scoop, [0.05, 3.2, 0.02], { parent: cone });
  [[0.55, 2.1, 0.35, 0.1], [-0.4, 2.0, 0.5, 0.08], [0.1, 1.95, 0.66, 0.09]].forEach(([x, y, z, r]) => add(new THREE.CapsuleGeometry(r, 0.26, 4, 10), M.scoop, [x, y, z], { parent: cone, line: 1 }));

  // ---------- umbrellas and sunbeds ----------
  const umbrella = (x, z, tilt) => {
    const u = new THREE.Group();
    u.userData.dynamic = true;
    u.position.set(x, 0, z);
    u.rotation.z = tilt;
    world.add(u);
    add(new THREE.CylinderGeometry(0.05, 0.05, 2.95, 10), M.pole, [0, 1.47, 0], { parent: u, line: 1 });
    const segs = 32, R = 1.48;
    const canopyGeo = lathe([[0.02, 2.98], [0.55, 2.9], [1.1, 2.7], [R, 2.44]], segs);
    const cp = canopyGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const cx = cp.getX(i), cz = cp.getZ(i);
      const r = Math.hypot(cx, cz);
      const a = Math.atan2(cz, cx);
      const sag = 0.16 * (0.5 - 0.5 * Math.cos(a * 8)) * Math.pow(r / R, 2);
      cp.setY(i, cp.getY(i) - sag);
    }
    canopyGeo.computeVertexNormals();
    add(canopyGeo, M.canopy, [0, 0, 0], { parent: u, line: 0 });
    const rim = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const sag = 0.16 * (0.5 - 0.5 * Math.cos(a * 8));
      rim.push(new THREE.Vector3(Math.cos(a) * R, 2.44 - sag, Math.sin(a) * R));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 128, 0.035, 5, true), M.ink, [0, 0, 0], { parent: u, line: 0 });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const rib = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.99, 0), new THREE.Vector3(Math.cos(a) * 0.55, 2.91, Math.sin(a) * 0.55), new THREE.Vector3(Math.cos(a) * 1.1, 2.71, Math.sin(a) * 1.1), new THREE.Vector3(Math.cos(a) * R, 2.44, Math.sin(a) * R)]);
      add(new THREE.TubeGeometry(rib, 12, 0.022, 4), M.ink, [0, 0, 0], { parent: u, line: 0 });
    }
    add(new THREE.SphereGeometry(0.09, 12, 8), M.cap, [0, 3.05, 0], { parent: u, line: 1 });
    anim.push((t) => { u.rotation.z = tilt + Math.sin(t * (0.9 + wx.pace) + x) * wx.sway; });
    return u;
  };
  const bed = (x, z, flip) => {
    const b = new THREE.Group();
    b.position.set(x, 0, z);
    b.scale.x = flip ? -1 : 1;
    world.add(b);
    add(new THREE.BoxGeometry(1.95, 0.1, 0.64), M.bed, [0, 0.44, 0], { parent: b, line: 1.2 });
    [[-0.85, 0.26], [-0.85, -0.26], [0.85, 0.26], [0.85, -0.26]].forEach(([lx, lz]) => add(new THREE.BoxGeometry(0.06, 0.42, 0.06), M.pole, [lx, 0.21, lz], { parent: b, line: 0.8 }));
    add(new THREE.BoxGeometry(0.8, 0.08, 0.64), M.bed, [0.9, 0.72, 0], { rot: [0, 0, 0.62], parent: b, line: 1.2 });
    return b;
  };
  umbrella(3.55, -0.2, 0.03);
  bed(2.75, 0.85, false); bed(4.45, 0.85, true);
  umbrella(8.75, -1.5, -0.04);
  bed(7.85, -0.45, false); bed(9.65, -0.45, true);
  umbrella(11.2, 0.55, 0.05);
  bed(10.35, 1.45, false);

  // ---------- the bar ----------
  const kiosk = new THREE.Group();
  kiosk.position.set(6.95, 0, -3.9);
  world.add(kiosk);
  add(new THREE.BoxGeometry(2.8, 1.5, 1.5), M.kiosk, [0, 0.75, 0], { parent: kiosk });
  add(new THREE.BoxGeometry(3.3, 0.18, 2.1), M.roof, [0, 1.6, 0.05], { parent: kiosk });
  add(new THREE.BoxGeometry(3.0, 0.07, 0.72), M.awning, [0, 1.36, 1.02], { rot: [0.38, 0, 0], parent: kiosk, line: 1.2 });
  add(new THREE.BoxGeometry(2.4, 0.08, 0.3), M.cap, [0, 0.95, 0.9], { parent: kiosk, line: 1 });
  const signText = textTexture([{ text: 'BAR MARTIRI', font: '900 138px Anybody', y: 0.55 }], 1400, 260);
  const signMat = engrave({ mode: 0, freq: 30, tone: -1, ambient: 1, rim: 0, map: signText });
  add(new THREE.BoxGeometry(2.7, 0.52, 0.06), signMat, [0, 2.3, 0.2], { parent: kiosk });
  add(new THREE.BoxGeometry(0.05, 0.64, 0.05), M.pole, [-1.1, 1.86, 0.2], { parent: kiosk, line: 0.8 });
  add(new THREE.BoxGeometry(0.05, 0.64, 0.05), M.pole, [1.1, 1.86, 0.2], { parent: kiosk, line: 0.8 });

  // ---------- the palm ----------
  const palm = new THREE.Group();
  palm.userData.dynamic = true;
  palm.position.set(12.9, 0, -2.2);
  world.add(palm);
  const trunkPts = [[0, 0], [-0.25, 1.3], [-0.6, 2.6], [-1.1, 3.7], [-1.7, 4.5], [-2.35, 5.05]];
  for (let i = 0; i < trunkPts.length - 1; i++) {
    const [x0, y0] = trunkPts[i], [x1, y1] = trunkPts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const r0 = 0.3 - i * 0.025, r1 = 0.3 - (i + 1) * 0.025;
    const seg = add(new THREE.CylinderGeometry(r1, r0 * 1.06, len, 18), M.trunk, [(x0 + x1) / 2, (y0 + y1) / 2, 0], { parent: palm, line: 1.2 });
    seg.rotation.z = -Math.atan2(x1 - x0, y1 - y0);
  }
  const crown = new THREE.Vector3(-2.35, 5.05, 0);
  const fronds = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.3;
    const L = 2.3 + (k % 3) * 0.35;
    const n = 26;
    const pos = [], uv = [], idx = [];
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const c = crown.clone().addScaledVector(dir, L * t).add(new THREE.Vector3(0, L * (0.5 * t - 1.15 * t * t), 0));
      const w = 0.2 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.8) * (1 + 0.55 * (((i % 2) === 0) ? 1 : -0.7));
      const l = c.clone().addScaledVector(side, w).add(new THREE.Vector3(0, -w * 0.4, 0));
      const r = c.clone().addScaledVector(side, -w).add(new THREE.Vector3(0, -w * 0.4, 0));
      pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
      uv.push(t, 0, t, 1);
      if (i < n) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const f = add(g, M.frond, [0, 0, 0], { parent: palm, line: 0 });
    const mid = new THREE.CatmullRomCurve3(Array.from({ length: 8 }, (_, i) => { const t = i / 7; return crown.clone().addScaledVector(dir, L * t).add(new THREE.Vector3(0, L * (0.5 * t - 1.15 * t * t) + 0.01, 0)); }));
    add(new THREE.TubeGeometry(mid, 24, 0.028, 4), M.ink, [0, 0, 0], { parent: palm, line: 0 });
    fronds.push(f);
  }
  anim.push((t) => { palm.rotation.z = Math.sin(t * (0.7 + wx.pace * 0.7)) * wx.sway; });

  // ---------- sky: sun, gulls, clouds ----------
  // The sun stands where the sun stands over Albania (setSun): it rises over
  // the perfumes in the east and sets into the sea by Bar Martiri in the west.
  const sun = new THREE.Group();
  sun.userData.dynamic = true;
  sun.position.set(6.2, 6.5, -22);
  world.add(sun);
  add(new THREE.CircleGeometry(1.7, 56), M.sun, [0, 0, 0], { parent: sun, line: 0 });
  add(new THREE.RingGeometry(1.7, 1.8, 56), M.ink, [0, 0, 0.01], { parent: sun, line: 0 });
  const rays = new THREE.Group();
  rays.userData.dynamic = true;
  sun.add(rays);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const long = i % 2 === 0;
    const r0 = 2.05, r1 = long ? 3.2 : 2.65, hw = long ? 0.13 : 0.09;
    const g = new THREE.BufferGeometry();
    const c = Math.cos(a), sn = Math.sin(a), px = -sn, py = c;
    g.setAttribute('position', new THREE.Float32BufferAttribute([c * r0 + px * hw, sn * r0 + py * hw, 0, c * r0 - px * hw, sn * r0 - py * hw, 0, c * r1, sn * r1, 0], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
    add(g, M.ink, [0, 0, 0], { parent: rays, line: 0 });
  }
  anim.push((t) => { rays.rotation.z = t * 0.05; });

  // The moon: a crescent cut like the sun's disc, a paper face finely lined
  // and an ink edge. It stands in the sun's place in the night edition, and
  // over the sea after dark (setSun).
  const crescent = (ro, ri, d) => {
    // the outer circle (ro, at the centre) less an inner one (ri, d to the right)
    const x = (d * d + ro * ro - ri * ri) / (2 * d), y = Math.sqrt(Math.max(0, ro * ro - x * x));
    const a = Math.atan2(y, x), b = Math.atan2(y, x - d);
    const s = new THREE.Shape();
    s.absarc(0, 0, ro, a, Math.PI * 2 - a, false);
    s.absarc(d, 0, ri, Math.PI * 2 - b, b, true);
    return new THREE.ShapeGeometry(s, 48);
  };
  const moon = new THREE.Group();
  moon.userData.dynamic = true;
  moon.position.set(7, 4.2, -22);
  moon.rotation.z = -0.55;
  moon.visible = false;
  world.add(moon);
  add(crescent(1.62, 1.62, 1.05), M.moon, [0, 0, 0], { parent: moon, line: 0 });
  add(crescent(1.74, 1.5, 1.05), M.ink, [0, 0, -0.02], { parent: moon, line: 0 });

  const gulls = [];
  const gull = (x, y, z, sc, ph) => {
    const g = new THREE.Group();
    g.userData.dynamic = true;
    g.position.set(x, y, z);
    g.scale.setScalar(sc);
    world.add(g);
    gulls.push(g);
    const wing = (sgn) => {
      const w = new THREE.Group();
      w.userData.dynamic = true;
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(sgn * 0.35, 0.28, 0), new THREE.Vector3(sgn * 0.8, 0.02, 0));
      add(new THREE.TubeGeometry(c, 14, 0.035, 5), M.ink, [0, 0, 0], { parent: w, line: 0 });
      g.add(w);
      return w;
    };
    const l = wing(-1), r = wing(1);
    anim.push((t) => { const f = Math.sin(t * 3.2 + ph) * 0.35; l.rotation.z = -f; r.rotation.z = f; g.position.x = x + Math.sin(t * 0.2 + ph) * 0.4; });
  };
  gull(3.2, 5.7, -7, 1.1, 0);
  gull(4.6, 6.0, -9, 0.9, 1.4);
  gull(9.8, 5.6, -6, 1.0, 2.6);

  // The clouds: three as the sky was cut, two more for a partly cloudy sky
  // (fill 1) and four more overcast (fill 2), all darker as the sky closes in
  // (setWeather). In a wind they cross the sky and come round again, out of
  // sight at either end (the sky at their distance is some 54 units wide).
  const clouds = [];
  const cloud = (x, y, z, sc, fill = 0) => {
    const c = new THREE.Group();
    c.userData.dynamic = true;
    c.position.set(x, y, z);
    c.scale.set(sc * 1.6, sc * 0.62, sc);
    c.visible = fill === 0;
    world.add(c);
    [[0, 0, 0, 1], [0.9, -0.12, 0.1, 0.72], [-0.85, -0.18, 0.05, 0.66], [0.35, 0.36, -0.1, 0.62]].forEach(([cx, cy, cz, r]) => add(new THREE.SphereGeometry(r, 28, 18), M.cloud, [cx, cy, cz], { parent: c, line: 1.3 }));
    clouds.push({ c, x, fill });
    return c;
  };
  cloud(-9.2, 6.3, -14, 1.2);
  cloud(-2.8, 6.9, -18, 1.0);
  cloud(11.8, 7.0, -20, 0.8);
  cloud(4.6, 7.3, -19, 1.05, 1);
  cloud(-13.6, 7.5, -21, 0.95, 1);
  cloud(1.2, 6.1, -16, 1.35, 2);
  cloud(8.6, 6.5, -17, 1.25, 2);
  cloud(-6.4, 7.7, -22, 1.45, 2);
  cloud(15.0, 6.0, -18, 1.1, 2);
  const wrapSky = (v) => ((((v + 31) % 62) + 62) % 62) - 31;
  anim.push((t) => { for (const k of clouds) k.c.position.x = wrapSky(k.x + Math.sin(t * 0.05 + k.x) * 0.6 + t * wx.drift); });
  // and, overcast, one across the lower half of the sun (or the moon), which
  // still shows above it and can still be pressed
  const veil = new THREE.Group();
  veil.userData.dynamic = true;
  veil.scale.set(0.95 * 1.6, 0.95 * 0.62, 0.95);
  veil.visible = false;
  world.add(veil);
  [[0, 0, 0, 1], [0.9, -0.12, 0.1, 0.72], [-0.85, -0.18, 0.05, 0.66], [0.35, 0.36, -0.1, 0.62]].forEach(([cx, cy, cz, r]) => add(new THREE.SphereGeometry(r, 28, 18), M.cloud, [cx, cy, cz], { parent: veil, line: 1.3 }));

  // ---------- fewer draw calls ----------
  // Everything that moves together and shares a material is merged into one
  // mesh (and its outlines into one hull per width): about 370 draws become
  // about 75. Materials that read object-space position (the sun's rings,
  // the striped canopies, the hubs) and the waving sea keep their own meshes.
  const dynamicRoots = [];
  world.traverse((o) => { if (o.userData.dynamic) dynamicRoots.push(o); });
  dynamicRoots.reverse().forEach(consolidate);
  consolidate(world);

  // ---------- the weather over Albania (setWeather) ----------
  // What falls: rain as the engraver cuts it, thin strokes slanting with the
  // wind; snow as paper flakes ringed in ink. Each stroke or flake falls
  // through a box of air before the sky, placed and moved on the GPU from its
  // own seed and the time, so nothing is written per frame. A share of them
  // show (uCount): a light shower is part of a heavy one.
  const fallVert = /* glsl */ `
    uniform float uTime;
    uniform vec2 uRes;
    uniform float uLineScale;
    uniform float uCount;
    uniform float uSpeed;
    uniform float uLen;
    uniform float uSlant;
    uniform float uWidth;
    uniform float uFlake;
    attribute vec4 aSeed;
    attribute vec2 aCorner;
    varying vec2 vCorner;
    void main() {
      vCorner = aCorner;
      if (aSeed.w > uCount) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
      float h = 11.0;
      float y = 9.8 - mod(aSeed.z * h + uTime * uSpeed * (0.75 + 0.5 * aSeed.z), h);
      float x = mix(-30.0, 30.0, aSeed.x) + uSlant * (9.8 - y) + uFlake * sin(uTime * (0.5 + aSeed.w) + aSeed.x * 40.0) * 0.4;
      vec3 head = vec3(x, y, mix(-16.0, 5.0, aSeed.y));
      vec4 ch = projectionMatrix * viewMatrix * vec4(head, 1.0);
      float px = uWidth * uLineScale;
      if (uFlake > 0.5) {
        // a flake: a square about its centre, cut round below; nearer is larger
        vec4 c = ch;
        c.xy += (aCorner * 2.0 - 1.0) * px * clamp(30.0 / ch.w, 0.6, 1.5) / uRes * c.w;
        gl_Position = c;
        return;
      }
      vec3 tail = head - normalize(vec3(uSlant, -1.0, 0.0)) * uLen * (0.7 + 0.6 * aSeed.w);
      vec4 ct = projectionMatrix * viewMatrix * vec4(tail, 1.0);
      vec2 d = (ct.xy / ct.w - ch.xy / ch.w) * uRes;
      vec2 n = normalize(vec2(-d.y, d.x) + 1e-5);
      vec4 c = mix(ch, ct, aCorner.x);
      c.xy += n * (aCorner.y * 2.0 - 1.0) * px / uRes * c.w;
      gl_Position = c;
    }
  `;
  const fallFrag = /* glsl */ `
    uniform float uFlake;
    varying vec2 vCorner;
    void main() {
      float ink = 1.0;
      if (uFlake > 0.5) {
        float r = length(vCorner * 2.0 - 1.0);
        if (r > 1.0) discard;
        ink = step(0.6, r); // paper inside, an ink rim
      }
      gl_FragColor = vec4(ink, 0.0, 0.0, 1.0);
    }
  `;
  // a seeded order, so a still of the rain is the same rain every time
  let seedState = 7;
  const rand = () => { seedState = (seedState + 0x6D2B79F5) | 0; let r = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  const falling = (n, flake) => {
    const seed = new Float32Array(n * 16), corner = new Float32Array(n * 8), index = [];
    for (let i = 0; i < n; i++) {
      const s = [rand(), rand(), rand(), (i + 0.5) / n];
      for (let k = 0; k < 4; k++) {
        seed.set(s, (i * 4 + k) * 4);
        corner.set([k & 1, k >> 1], (i * 4 + k) * 2);
      }
      const b = i * 4;
      index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 12), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
    g.setIndex(index);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      vertexShader: fallVert,
      fragmentShader: fallFrag,
      depthWrite: false,
      blending: THREE.NoBlending,
      uniforms: {
        uTime: shared.uTime, uRes: shared.uRes, uLineScale: shared.uLineScale,
        uCount: { value: 0 }, uSpeed: { value: flake ? 0.85 : 13 }, uLen: { value: 0.9 },
        uSlant: { value: 0 }, uWidth: { value: flake ? 4.2 : 1.1 }, uFlake: { value: flake ? 1 : 0 },
      },
    }));
    m.frustumCulled = false;
    m.renderOrder = 5;
    m.visible = false;
    world.add(m);
    return m;
  };
  const rain = falling(900, false);
  const snow = falling(640, true);
  // thunder: a jagged bolt with a fork, down to the far sea where the sky is
  // open (between the sun and the cone, past the cone, over the bar), a flash
  // and a flicker
  const bolt = new THREE.Group();
  bolt.visible = false;
  world.add(bolt);
  const jag = (pts, r) => {
    const path = new THREE.CurvePath();
    const v = pts.map(([x, y]) => new THREE.Vector3(x, y, 0));
    for (let i = 0; i < v.length - 1; i++) path.add(new THREE.LineCurve3(v[i], v[i + 1]));
    add(new THREE.TubeGeometry(path, 16 * v.length, r, 5, false), M.ink, [0, 0, 0], { parent: bolt, line: 0 });
  };
  jag([[0, 7.4], [-0.6, 6.0], [0.4, 5.3], [-0.4, 3.9], [0.5, 3.0], [-0.1, 1.6], [0.35, 0.1]], 0.11);
  jag([[0.4, 5.3], [1.2, 4.6], [1.0, 3.9], [1.6, 3.2]], 0.07);
  const BOLT_AT = [[1.8, -20], [6.3, -20], [9.6, -20]];
  const storm = { on: false, next: 0, until: 0, again: 0, againUntil: 0 };
  // one fog for the engraving's materials and their outlines, none for anything else drawn
  const fogU = { value: 0 };
  scene.traverse((o) => { if (o.material?.uniforms?.uFog) o.material.uniforms.uFog = fogU; });

  const weather = { fill: 0, veil: false, gulls: true, rain: 0, snow: 0, thunder: false };
  function setWeather(w) {
    // no reading: the sky as it was cut, and not a breath of wind
    const s = w || { sky: 'fair', fall: null, amount: 0, thunder: false, fog: false, wind: 0, from: 270 };
    const overcast = s.sky === 'overcast';
    weather.fill = overcast ? 2 : s.sky === 'partly' || s.sky === 'fog' ? 1 : 0;
    weather.veil = overcast;
    weather.thunder = !!s.thunder;
    weather.gulls = !s.fall && !s.thunder && !s.fog;
    const k = [0, 0.28, 0.6, 1][s.amount] || 0;
    weather.rain = s.fall === 'rain' ? Math.max(k, s.thunder ? 0.6 : 0) : s.fall === 'sleet' ? 0.4 : s.thunder && !s.fall ? 0.5 : 0;
    weather.snow = s.fall === 'snow' ? k : s.fall === 'sleet' ? 0.25 : 0;
    rain.material.uniforms.uCount.value = weather.rain;
    snow.material.uniforms.uCount.value = weather.snow;
    rain.material.uniforms.uLen.value = s.amount === 3 ? 1.25 : s.fall === 'sleet' ? 0.55 : 0.9;
    // the wind: east-west as seen from the beach (+x is west, the sea's side)
    const wind = Math.min(22, Math.max(0, s.wind));
    const west = Math.sin(((s.from ?? 270) * Math.PI) / 180);
    rain.material.uniforms.uSlant.value = Math.max(-0.6, Math.min(0.6, (wind * west) / 16));
    snow.material.uniforms.uSlant.value = Math.max(-0.4, Math.min(0.4, (wind * west) / 24));
    wx.sway = 0.012 + (wind / 22) * 0.055;
    wx.pace = (wind / 22) * 1.6;
    wx.drift = wind > 3.5 ? west * wind * 0.03 : 0;
    M.sea.uniforms.uWave.value = 1 + (wind / 22) * 0.9;
    M.cloud.uniforms.uTone.value = s.thunder ? 0.3 : overcast ? 0.16 : s.sky === 'partly' || s.fog ? 0.06 : 0;
    // fog, or the haze of a heavy fall, fades the distance toward the paper
    fogU.value = s.fog ? 0.85 : s.amount === 3 ? 0.3 : s.fall ? 0.12 : 0;
  }
  setWeather(null);

  // ---------- the sun over Albania ----------
  // Its bearing runs across the sky, east on the left and west on the right
  // (60 to 300 degrees across 28 units at the sun's distance); its height runs
  // from the sea's edge (at noon at midsummer, 72 degrees, it nears the top of
  // the band). Near the horizon it is drawn as the engraver would, a disc
  // half sunk into the sea, and below a degree it has set.
  const SKY = { x: 14, top: 6, maxEl: 72, r: 1.8 };
  // the horizon at the sun's distance: the sea's far edge on the beach's side,
  // the nearer end of the land on the perfumes' (which hides a sun below it)
  const horizonAt = (x) => (x >= 0.5 ? -0.26 : x <= -2.5 ? -1.65 : -1.65 + ((x + 2.5) / 3) * 1.39);
  let sunUp = true;
  const sunLamp = new THREE.Vector3(-0.55, 0.75, 0.5);
  // the moon after dark: high over the sea
  const NIGHT_MOON = new THREE.Vector3(7, 4.2, -22);
  function setSun({ azimuth, elevation }) {
    const k = Math.max(-1, Math.min(1, (azimuth - 180) / 120));
    const horizon = horizonAt(k * SKY.x);
    const y = elevation >= 2
      ? horizon + SKY.r + ((elevation - 2) / (SKY.maxEl - 2)) * (SKY.top - horizon - SKY.r)
      : horizon + (SKY.r * (elevation - 0.5)) / 1.5;
    sun.position.set(k * SKY.x, Math.min(SKY.top, y), -22);
    sunUp = elevation > -1;
    moon.position.copy(sunUp ? sun.position : NIGHT_MOON);
    // the light comes from the sun's side: the east in the morning, over the
    // sea in the evening, from high up at noon; after dark, a lamp from the front
    if (sunUp) sunLamp.set(k * 1.1, 0.35 + 0.55 * Math.min(1, Math.max(0, elevation) / 60), 0.5);
    else sunLamp.set(0.1, 0.9, 0.62);
  }

  // The sky's one body: the sun, or the moon in the night edition and after
  // dark. Pressing it turns the one into the other (skyK 0 to 1 over 0.8s):
  // the sun shrinks away with its rays, then the moon grows in its place.
  let skyK = -1;
  const smooth = (x) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
  function turnSky(dt, night, still) {
    const target = night || !sunUp ? 1 : 0;
    if (skyK < 0 || still) skyK = target;
    else if (skyK < target) skyK = Math.min(target, skyK + dt / 0.8);
    else if (skyK > target) skyK = Math.max(target, skyK - dt / 0.8);
    sun.scale.setScalar(Math.max(0.001, 1 - smooth(skyK / 0.5)));
    moon.scale.setScalar(Math.max(0.001, smooth((skyK - 0.5) / 0.5)));
    api.morphing = skyK !== target;
  }
  const skyBody = () => (skyK > 0.5 ? moon : sun);

  // ---------- per-frame ----------
  const look = new THREE.Vector3();
  const lampTarget = new THREE.Vector3(-0.55, 0.75, 0.5);
  const lamp = new THREE.Vector3(-0.55, 0.75, 0.5);
  let par = { x: 0, y: 0 };
  // tilt: a phone's lean, -1..1 each way (stage.js), or null; night: the night edition
  function update(t, dt, { px, py, inside, still, tilt = null, night = false }) {
    if (!still) anim.forEach((f) => f(t, dt));
    turnSky(dt, night, still);
    // the weather: the clouds the sky holds, the gulls (gone to shelter in a
    // fall, a storm or fog), what falls (still, with the press stopped), and
    // thunder: a flash and a flicker every 4 to 12 seconds, none when still
    for (const k of clouds) k.c.visible = k.fill <= weather.fill;
    for (const g of gulls) g.visible = weather.gulls;
    rain.visible = weather.rain > 0;
    snow.visible = weather.snow > 0;
    const body = skyBody().position;
    veil.position.set(body.x + 0.95, Math.max(0.6, body.y - 1.3), body.z + 1.6);
    if (weather.thunder && !still) {
      if (!storm.on) { storm.on = true; storm.next = t + 1.5 + rand() * 3; }
      if (t >= storm.next) {
        const [bx, bz] = BOLT_AT[Math.floor(rand() * BOLT_AT.length)];
        bolt.position.set(bx, 0, bz);
        bolt.scale.x = rand() < 0.5 ? -1 : 1;
        storm.until = t + 0.12;
        storm.again = t + 0.2;
        storm.againUntil = t + 0.27;
        storm.next = t + 4 + rand() * 8;
      }
      bolt.visible = t < storm.until || (t > storm.again && t < storm.againUntil);
    } else {
      storm.on = false;
      bolt.visible = false;
    }
    // the view leans a little with the pointer, or with the phone
    const lean = inside ? { x: px, y: py } : tilt ? { x: tilt.x * 0.7, y: tilt.y * 0.7 } : null;
    par = lean ? { x: lean.x * 0.55, y: lean.y * 0.22 } : { x: 0, y: 0 };
    // the lamp follows the pointer, or leans off the sun with the phone; the hatching re-cuts itself to match
    if (inside) lampTarget.set(px * 1.25, 0.8 - py * 0.35, 0.55);
    else if (tilt) lampTarget.set(sunLamp.x + tilt.x * 0.9, sunLamp.y - tilt.y * 0.35, sunLamp.z);
    else lampTarget.set(sunLamp.x + Math.sin(t * 0.25) * 0.18, sunLamp.y, sunLamp.z);
    lamp.lerp(lampTarget, Math.min(1, dt * 4));
    shared.uLight.value.copy(lamp).normalize();
  }

  // Aim the camera for one panel. A wide band shows the whole cut; a narrow
  // one is printed as two panels, the perfumes over Bar Martiri's beach.
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  function aim(aspect, panel = 'full') {
    camera.aspect = aspect;
    const halfW = panel === 'full' ? 13.4 : 6.9;
    const cx = panel === 'left' ? -6.6 : panel === 'right' ? 6.75 : 0;
    const dist = halfW / (aspect * tanHalf);
    camera.position.set(cx + par.x, 4.2 + par.y, dist + 1.2);
    look.set(cx + par.x * 0.4, 2.6, 0);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    // printed as two panels, the sun (or the moon) is drawn in one: the
    // perfumes' sky before noon, the beach's after (both see the middle of the sky)
    const inPanel = (o) => panel === 'full' || (panel === 'left') === (o.position.x < 0);
    sun.visible = sunUp && skyK < 0.5 && inPanel(sun);
    moon.visible = skyK > 0.5 && inPanel(moon);
    veil.visible = weather.veil && (sun.visible || moon.visible);
  }

  // Where the sky's body stands in a panel's view, for the button over it
  // (stage.js): its centre in the panel's -1..1 coordinates and its radius as
  // a share of the panel's width. Null when there is nothing in the sky.
  const pc = new THREE.Vector3(), pe = new THREE.Vector3();
  const skyPanel = () => (skyBody().position.x < 0 ? 'left' : 'right');
  function project(aspect, panel) {
    const o = skyBody();
    if (o === sun && !sunUp) return null;
    aim(aspect, panel);
    camera.updateMatrixWorld();
    o.updateMatrixWorld();
    pc.setFromMatrixPosition(o.matrixWorld);
    pe.copy(pc);
    pe.x += SKY.r;
    pc.project(camera);
    pe.project(camera);
    return { x: pc.x, y: pc.y, r: Math.abs(pe.x - pc.x) / 2 };
  }

  let draws = 0;
  scene.traverse((o) => { if (o.isMesh) draws++; });

  // for the warm-up: both bodies and every piece of weather shown, so their
  // programs link with the rest (the next update puts the weather back)
  const revealSky = () => {
    sun.visible = true;
    moon.visible = true;
    veil.visible = true;
    rain.visible = true;
    snow.visible = true;
    bolt.visible = true;
    for (const k of clouds) k.c.visible = true;
  };

  // The van alone, parked in the middle of the world, for the picture of it
  // that drives across the page's clear strips (stage.js vanSprite, and
  // src/ui/road.js). Returns what puts everything back as it was.
  function soloVan() {
    const hidden = [];
    const hide = (o) => { if (o.visible) { o.visible = false; hidden.push(o); } };
    scene.children.forEach((o) => { if (o !== world) hide(o); });
    world.children.forEach((o) => { if (o !== van) hide(o); });
    const at = van.position.clone();
    van.position.set(0, 0, 0);
    return () => { hidden.forEach((o) => { o.visible = true; }); van.position.copy(at); };
  }

  const api = { scene, camera, update, aim, setSun, setWeather, project, skyPanel, revealSky, soloVan, morphing: false, draws, setLineSpacing: (px) => { M.sea.uniforms.uFreq.value = px; } };
  if (import.meta.env.DEV) api.debugWeather = () => ({ weather: { ...weather }, storm: { ...storm }, bolt: bolt.visible, boltAt: bolt.position.toArray(), rain: rain.visible });
  return api;
}
