import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

const REALMS = { classic: '經典物理', theory: '理論物理', quantum: '量子力學' };
// 側欄分類的順序就是這裡的檔案順序＋各檔裡主題的順序
const MODS = ['mechanics', 'fluids', 'thermo', 'waves', 'optics', 'em', 'relativity', 'cosmology', 'analytic', 'quantum'];
const TOPICS = (await Promise.all(MODS.map(m => import(`./topics/${m}.js`)))).flatMap(m => m.default);

const $ = s => document.querySelector(s);
const el = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const tex = (s, display) => katex.renderToString(s, { displayMode: display, throwOnError: false });
// 說明文字裡的 \( ... \) 換成 KaTeX
const rich = html => html.replace(/\\\((.+?)\\\)/g, (_, s) => tex(s, false));

// ---------- 3D 基礎 ----------
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1408, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(6, 10, 7);
scene.add(sun);
const grid = new THREE.GridHelper(40, 40, 0x2b3140, 0x14171f);
scene.add(grid);

function resize() {
  const { clientWidth: w, clientHeight: h } = stage;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

// ---------- 給主題用的小工具 ----------
const Y = new THREE.Vector3(0, 1, 0);
const U = {
  V: (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z),
  mat: (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.45, metalness: o.metal ?? 0.1, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.opacity != null, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.opacity == null || o.opacity > 0.6 }),
  glow: (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }),
  mesh: (geo, mat) => new THREE.Mesh(geo, typeof mat === 'object' ? mat : U.mat(mat)),
  sphere: (r, mat) => U.mesh(new THREE.SphereGeometry(r, 32, 20), mat),
  box: (w, h, d, mat) => U.mesh(new THREE.BoxGeometry(w, h, d), mat),
  cyl: (rt, rb, h, mat, seg = 32, open = false) => U.mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat),
  // 粗箭頭：a.set(起點, 向量)
  arrow(color, thick = 0.05) {
    const g = new THREE.Group(), m = U.glow(color);
    const shaft = U.mesh(new THREE.CylinderGeometry(thick, thick, 1, 12), m);
    const head = U.mesh(new THREE.ConeGeometry(thick * 2.6, 1, 16), m);
    g.add(shaft, head);
    g.set = (o, v) => {
      const L = v.length();
      g.visible = L > 1e-4;
      if (!g.visible) return g;
      const h = Math.min(thick * 7, L * 0.45);
      g.position.copy(o);
      g.quaternion.setFromUnitVectors(Y, v.clone().divideScalar(L));
      shaft.scale.y = L - h; shaft.position.y = (L - h) / 2;
      head.scale.y = h; head.position.y = L - h / 2;
      return g;
    };
    return g;
  },
  // 兩點之間的光束／棒子：b.set(a, b)
  beam(color, r = 0.04, mat) {
    const m = U.mesh(new THREE.CylinderGeometry(r, r, 1, 12), mat || U.glow(color));
    m.set = (a, b) => {
      const d = b.clone().sub(a), L = d.length();
      m.visible = L > 1e-4;
      if (!m.visible) return m;
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(Y, d.divideScalar(L));
      m.scale.y = L;
      return m;
    };
    return m;
  },
  // 細線：l.set([Vector3...])，點數可變（上限 n）
  line(n, color, opacity = 1, dashed = false) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.2, gapSize: 0.12, transparent: true, opacity }) : new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    const l = new THREE.Line(geo, mat);
    l.frustumCulled = false;
    l.set = pts => {
      const a = geo.attributes.position.array, k = Math.min(n, pts.length);
      for (let i = 0; i < k; i++) { a[i * 3] = pts[i].x; a[i * 3 + 1] = pts[i].y; a[i * 3 + 2] = pts[i].z; }
      geo.setDrawRange(0, k);
      geo.attributes.position.needsUpdate = true;
      if (dashed) l.computeLineDistances();
      return l;
    };
    return l;
  },
  // 粒子群：p.pos 是 Float32Array，改完 p.flush()；colors 可選
  points(n, color, size = 0.08, vertexColors = false) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    let col;
    if (vertexColors) { col = new Float32Array(n * 3).fill(1); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: vertexColors ? 0xffffff : color, size, vertexColors, transparent: true, opacity: 0.95, depthWrite: false, map: DOT, alphaTest: 0.05 }));
    p.frustumCulled = false;
    p.pos = pos; p.col = col;
    p.flush = (count = n) => { geo.setDrawRange(0, count); geo.attributes.position.needsUpdate = true; if (col) geo.attributes.color.needsUpdate = true; };
    return p;
  },
  // 文字標籤（永遠面向鏡頭）：s.set('新文字')
  label(text, o = {}) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
    s.renderOrder = 10;
    const size = o.size ?? 0.42, color = o.color ?? '#e9edf5';
    s.set = t => {
      t = String(t);
      if (t === s._t) return s;
      s._t = t;
      const c = document.createElement('canvas'), g = c.getContext('2d'), fs = 64;
      const font = `500 ${fs}px Geist, "Noto Sans CJK TC", "PingFang TC", sans-serif`;
      g.font = font;
      c.width = Math.ceil(g.measureText(t).width) + 36; c.height = fs + 30;
      g.font = font; g.textBaseline = 'middle';
      if (o.bg) { g.fillStyle = o.bg; g.beginPath(); g.roundRect(0, 0, c.width, c.height, 22); g.fill(); }
      g.fillStyle = color; g.fillText(t, 18, c.height / 2 + 2);
      s.material.map?.dispose();
      s.material.map = new THREE.CanvasTexture(c);
      s.material.map.colorSpace = THREE.SRGBColorSpace;
      s.material.needsUpdate = true;
      s.scale.set(size * c.width / c.height, size, 1);
      return s;
    };
    return s.set(text);
  },
  lerp: (a, b, t) => a + (b - a) * t,
  clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
  // 給 vertex color 用：數值 0..1 → 藍到紅
  heat(t, out = new THREE.Color()) { return out.setHSL(0.66 - 0.66 * U.clamp(t, 0, 1), 0.9, 0.55); },
  // ---- 卡通裝飾（只是外觀，不影響物理） ----
  // 卡通臉：放在半徑 r 的頭／身體中心，臉朝 +z；f.mood('happy'|'shock'|'ouch'|'dizzy')；f.look() 讓臉轉向鏡頭
  face(r) {
    const g = new THREE.Group(), white = U.mat(0xffffff, { rough: 0.3 }), black = U.mat(0x111111, { rough: 0.3 });
    const eyes = [], pupils = [], xs = [];
    for (const s of [-1, 1]) {
      const e = U.sphere(0.24 * r, white); e.position.set(s * 0.34 * r, 0.18 * r, 0.8 * r); e.scale.z = 0.6;
      const p = U.sphere(0.12 * r, black); p.position.set(s * 0.34 * r, 0.18 * r, 0.93 * r);
      const x = new THREE.Group(); x.position.set(s * 0.34 * r, 0.18 * r, 0.95 * r);
      for (const a of [1, -1]) { const b = U.box(0.4 * r, 0.08 * r, 0.05 * r, black); b.rotation.z = a * Math.PI / 4; x.add(b); }
      eyes.push(e); pupils.push(p); xs.push(x); g.add(e, p, x);
    }
    const smile = U.mesh(new THREE.TorusGeometry(0.22 * r, 0.05 * r, 6, 16, Math.PI), black);
    smile.rotation.z = Math.PI; smile.position.set(0, -0.12 * r, 0.9 * r);
    const O = U.sphere(0.14 * r, black); O.scale.z = 0.5; O.position.set(0, -0.3 * r, 0.9 * r);
    g.add(smile, O);
    g.mood = m => {
      if (m === g._m) return g;
      g._m = m;
      const x = m === 'ouch' || m === 'dizzy';
      eyes.forEach(e => { e.visible = !x; e.scale.setScalar(m === 'shock' ? 1.3 : 1); e.scale.z *= 0.6; });
      pupils.forEach(p => { p.visible = !x; p.scale.setScalar(m === 'shock' ? 0.6 : 1); });
      xs.forEach(e => { e.visible = x; });
      smile.visible = m === 'happy' || m === 'dizzy'; O.visible = !smile.visible;
      return g;
    };
    g.look = () => { g.lookAt(camera.position); return g; };
    return g.mood('happy');
  },
  // 頭上轉圈的星星：s.tick(dt)
  stars(R = 0.5, n = 5) {
    const g = new THREE.Group(), m = U.glow(0xffe066);
    for (let i = 0; i < n; i++) { const s = U.mesh(new THREE.OctahedronGeometry(0.09), m); s.position.set(R * Math.cos(i / n * 6.283), 0, R * Math.sin(i / n * 6.283)); g.add(s); }
    g.tick = dt => { g.rotation.y += dt * 5; return g; };
    return g;
  },
  // 漫畫音效字（白底黑字）
  pop: (text, size = 0.5) => U.label(text, { bg: 'rgba(255,255,255,.92)', color: '#111', size }),
};
const DOT = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

// ---------- 2D 圖表（疊在 3D 畫面左下） ----------
const chartBox = $('#chart'), chartCv = chartBox.querySelector('canvas'), cg = chartCv.getContext('2d');
let chartMin = matchMedia('(max-width: 900px)').matches;   // 手機預設收起，點一下展開
chartBox.onclick = () => chartBox.classList.toggle('min', chartMin = !chartMin);
function makeChart(o) {
  chartBox.hidden = false;
  chartBox.classList.toggle('min', chartMin);
  chartBox.querySelector('b').textContent = o.title || '';
  return {
    o,
    // series: [{pts:[[x,y]...], color, w, dash}]；marks: [{x, y, color, r, text}]
    draw(series = [], marks = []) {
      const dpr = Math.min(devicePixelRatio, 2), W = chartCv.clientWidth, H = chartCv.clientHeight;
      if (chartCv.width !== W * dpr) { chartCv.width = W * dpr; chartCv.height = H * dpr; }
      cg.setTransform(dpr, 0, 0, dpr, 0, 0);
      cg.clearRect(0, 0, W, H);
      const L = 34, B = 22, R = 10, T = 8;
      const [x0, x1] = this.o.x, [y0, y1] = this.o.y;
      const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Yp = y => H - B - U.clamp((y - y0) / (y1 - y0), -0.2, 1.2) * (H - B - T);
      cg.strokeStyle = 'rgba(255,255,255,.18)'; cg.lineWidth = 1;
      cg.beginPath(); cg.moveTo(L, T); cg.lineTo(L, H - B); cg.lineTo(W - R, H - B); cg.stroke();
      cg.fillStyle = 'rgba(233,237,245,.6)'; cg.font = '12px Geist, sans-serif';
      cg.fillText(this.o.xl || '', W - R - cg.measureText(this.o.xl || '').width, H - 5);
      cg.fillText(this.o.yl || '', L + 4, T + 11);
      cg.save(); cg.beginPath(); cg.rect(L, T - 4, W - L - R + 4, H - B - T + 4); cg.clip();
      for (const s of series) {
        cg.strokeStyle = s.color || ACC(); cg.lineWidth = s.w || 2; cg.setLineDash(s.dash || []);
        cg.beginPath();
        s.pts.forEach(([x, y], i) => i ? cg.lineTo(X(x), Yp(y)) : cg.moveTo(X(x), Yp(y)));
        if (s.fill) { cg.lineTo(X(s.pts.at(-1)[0]), Yp(y0)); cg.lineTo(X(s.pts[0][0]), Yp(y0)); cg.fillStyle = s.fill; cg.fill(); }
        cg.stroke();
      }
      cg.setLineDash([]);
      for (const m of marks) {
        cg.fillStyle = m.color || '#fff';
        if (m.vline) { cg.fillRect(X(m.x), T, 1, H - B - T); continue; }
        cg.beginPath(); cg.arc(X(m.x), Yp(m.y), m.r || 4, 0, 7); cg.fill();
        if (m.text) cg.fillText(m.text, X(m.x) + 7, Yp(m.y) - 6);
      }
      cg.restore();
    },
  };
}
const ACC = () => getComputedStyle(document.body).getPropertyValue('--acc').trim();

// ---------- 主題切換 ----------
let cur = null, root = null, inst = null, P = {}, t = 0, playing = true, speed = 1, outs = {}, outEls = {};

function disposeTree(o) {
  o.traverse(n => {
    n.geometry?.dispose();
    for (const m of [].concat(n.material || [])) { m.map?.dispose(); m.dispose(); }
  });
}

// 主題的 cam 是照寬螢幕設計的；畫面窄（手機、iPad 直向）時沿視線往後拉，讓橫向內容放得下
function home() {
  controls.target.set(...(cur.target || [0, 0.5, 0]));
  const k = camera.aspect < 1.3 ? Math.min(2.2, 1.4 / camera.aspect) : 1;
  camera.position.set(...(cur.cam || [6, 4, 8])).sub(controls.target).multiplyScalar(k).add(controls.target);
  controls.update();
}

function load(topic) {
  if (root) { scene.remove(root); disposeTree(root); }
  cur = topic; t = 0; outs = {};
  root = new THREE.Group();
  scene.add(root);
  grid.visible = topic.grid !== false;
  chartBox.hidden = true;
  P = Object.fromEntries((topic.params || []).map(p => [p.k, p.v]));
  home();
  inst = topic.setup({ THREE, root, U, P, chart: makeChart, out: o => Object.assign(outs, o) }) || {};
  renderPanel(topic);
  markActive();
}

function renderPanel(tp) {
    document.body.dataset.realm = tp.realm;
  document.title = `${tp.title}・物理 3D 實驗室`;
  $('#eyebrow').textContent = `${REALMS[tp.realm]} · ${tp.cat}`;
  $('#title').textContent = tp.title;
  $('#en').textContent = tp.en || '';
  $('#mTitle').textContent = tp.title;
  $('#formula').innerHTML = [].concat(tp.tex).map(s => tex(s, true)).join('');
  $('#explain').innerHTML = rich(tp.explain || '');
  const w = $('#watch'); w.replaceChildren(...(tp.watch || []).map(s => { const li = el('li'); li.innerHTML = rich(s); return li; }));
  $('#watchBox').hidden = !tp.watch?.length;

  const box = $('#params');
  box.replaceChildren();
  for (const p of tp.params || []) {
    const row = el('label', null, 'param');
    const head = el('div', null, 'phead');
    head.append(el('span', p.label));
    const val = el('output');
    head.append(val);
    row.append(head);
    if (p.options) {
      const seg = el('div', null, 'seg');
      for (const [v, name] of p.options) {
        const b = el('button', name);
        b.type = 'button';
        b.onclick = () => { P[p.k] = v; seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); inst.onParam?.(p.k, v); };
        b.classList.toggle('on', v === p.v);
        seg.append(b);
      }
      row.append(seg);
    } else if (p.bool) {
      const b = el('button', null, 'toggle');
      b.type = 'button';
      const show = () => { b.classList.toggle('on', !!P[p.k]); b.setAttribute('aria-pressed', !!P[p.k]); };
      b.onclick = () => { P[p.k] = !P[p.k]; show(); inst.onParam?.(p.k, P[p.k]); };
      show(); head.append(b); row.classList.add('inline');
    } else {
      const r = el('input');
      Object.assign(r, { type: 'range', min: p.min, max: p.max, step: p.step ?? (p.max - p.min) / 100, value: p.v });
      const show = () => { val.textContent = fmt(P[p.k]) + (p.unit ? ' ' + p.unit : ''); r.style.setProperty('--f', (P[p.k] - p.min) / (p.max - p.min)); };
      r.oninput = () => { P[p.k] = +r.value; show(); inst.onParam?.(p.k, P[p.k]); };
      show(); row.append(r);
    }
    box.append(row);
  }
  for (const [name, fn] of Object.entries(inst.actions || {})) {
    const b = el('button', name, 'act'); b.type = 'button'; b.onclick = fn; box.append(b);
  }
  $('#paramBox').hidden = !box.children.length;
  $('#outs').replaceChildren(); outEls = {};
  $('#outBox').hidden = true;
}

const fmt = v => typeof v !== 'number' ? String(v) : Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v) ? v.toExponential(2) : +v.toFixed(Math.abs(v) < 1 ? 3 : Math.abs(v) < 10 ? 2 : 1) + '';

function flushOuts() {
  const keys = Object.keys(outs);
  if (!keys.length) return;
  $('#outBox').hidden = false;
  for (const k of keys) {
    if (!outEls[k]) {
      const d = el('div', null, 'out'), name = el('span'), v = el('b');
      name.innerHTML = rich(k); d.append(name, v); $('#outs').append(d); outEls[k] = v;
    }
    outEls[k].textContent = typeof outs[k] === 'number' ? fmt(outs[k]) : outs[k];
  }
}

// ---------- 側欄 ----------
let realm = 'classic';
function renderList() {
  const q = $('#q').value.trim().toLowerCase();
  const list = $('#list');
  list.replaceChildren();
  document.querySelectorAll('#realms button').forEach(b => b.classList.toggle('on', b.dataset.r === realm && !q));
  const shown = TOPICS.filter(tp => q ? (tp.title + tp.en + tp.cat + (tp.keys || '')).toLowerCase().includes(q) : tp.realm === realm);
  const groups = {};
  for (const tp of shown) (groups[(q ? REALMS[tp.realm] + ' · ' : '') + tp.cat] ??= []).push(tp);
  for (const g in groups) {
    list.append(el('h3', g));
    for (const tp of groups[g]) {
      const a = el('a', null, 'item');
      a.href = '#' + tp.id; a.dataset.id = tp.id; a.dataset.r = tp.realm;
      a.append(el('span', tp.title), el('small', tp.en));
      list.append(a);
    }
  }
  if (!shown.length) list.append(el('p', '找不到符合的主題', 'empty'));
  markActive();
}
function markActive() { document.querySelectorAll('#list .item').forEach(a => a.classList.toggle('on', a.dataset.id === cur?.id)); }

$('#realms').onclick = e => { const b = e.target.closest('button'); if (!b) return; realm = b.dataset.r; $('#q').value = ''; renderList(); };
$('#q').oninput = renderList;
$('#count').textContent = TOPICS.length;
for (const k in REALMS) $(`#realms [data-r=${k}] small`).textContent = TOPICS.filter(t => t.realm === k).length;

function route() {
  const tp = TOPICS.find(x => x.id === location.hash.slice(1)) || TOPICS[0];
  if (tp.realm !== realm && !$('#q').value) { realm = tp.realm; renderList(); }
  load(tp);
  document.body.classList.remove('nav-open');
  scrollTo(0, 0);
  playBtn();
}
addEventListener('hashchange', route);

// ---------- 播放控制 ----------
const playBtn = () => { $('#play').innerHTML = playing ? ICON.pause : ICON.play; $('#play').setAttribute('aria-label', playing ? '暫停' : '播放'); };
const ICON = {
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>',
};
$('#play').onclick = () => { playing = !playing; playBtn(); };
$('#reset').onclick = () => load(cur);
$('#view').onclick = home;
$('#speed').onclick = e => { const b = e.target.closest('button'); if (!b) return; speed = +b.dataset.s; $('#speed').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
$('#menu').onclick = () => document.body.classList.toggle('nav-open');
$('#scrim').onclick = () => document.body.classList.remove('nav-open');
for (const b of ['#helpBtn', '#mHelp']) $(b).onclick = () => $('#help').showModal();
addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); $('#play').click(); } });

// ---------- 主迴圈 ----------
const clock = new THREE.Clock();
let lastOut = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 1 / 20) * (playing ? speed : 0);
  t += dt;
  try { inst.update?.(dt, P, t); } catch (err) { console.error(err); inst.update = null; }
  controls.update();
  renderer.render(scene, camera);
  if (performance.now() - lastOut > 120) { flushOuts(); lastOut = performance.now(); }
});

renderList();
route();
window.__physics = { TOPICS, load, P: () => P };
