// 經典物理・電磁（單位取 ε₀ = 1，所以 E = q r̂ / 4πr²）
export const F = {
  MU0: 4 * Math.PI * 1e-7, C: 2.99792458e8,
  // 庫侖力（SI）：正＝排斥、負＝吸引
  coulomb: (q1, q2, r) => 8.9875e9 * q1 * q2 / (r * r),
  // 磁場中的帶電粒子：迴旋半徑與週期
  larmor: (m, vPerp, q, B) => m * vPerp / (Math.abs(q) * B),
  cyclotronT: (m, q, B) => 2 * Math.PI * m / (Math.abs(q) * B),
  // 長直導線的磁場 B = μ₀I / 2πr
  wireB: (I, r) => 4 * Math.PI * 1e-7 * I / (2 * Math.PI * r),
  // 軸上磁偶極通過線圈的磁通量形狀（x 是磁鐵到線圈中心的距離，a 是線圈半徑）
  coilFlux: (x, a) => 1 / (1 + (x / a) ** 2) ** 1.5,
  // 沿電場線追蹤：從 p 出發，步長 h，碰到負電荷或走出範圍就停
  trace(charges, p, h = 0.06, max = 400, R = 9) {
    const pts = [p.slice()];
    for (let i = 0; i < max; i++) {
      const E = F.field(charges, p), L = Math.hypot(...E) || 1;
      p = [p[0] + E[0] / L * h, p[1] + E[1] / L * h, p[2] + E[2] / L * h];
      pts.push(p);
      if (Math.hypot(...p) > R || charges.some(c => c.q < 0 && Math.hypot(p[0] - c.x, p[1] - c.y, p[2] - c.z) < 0.12)) break;
    }
    return pts;
  },
  field(charges, p) {
    let ex = 0, ey = 0, ez = 0;
    for (const c of charges) {
      const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z, r2 = dx * dx + dy * dy + dz * dz + 1e-6, k = c.q / (4 * Math.PI * r2 * Math.sqrt(r2));
      ex += k * dx; ey += k * dy; ez += k * dz;
    }
    return [ex, ey, ez];
  },
  // 曲面取樣：回傳 [{p, n, dA}]
  sphereSamples(R, N) {
    const out = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = ga * i, n = [r * Math.cos(th), y, r * Math.sin(th)];
      out.push({ p: n.map(v => v * R), n, dA: 4 * Math.PI * R * R / N });
    }
    return out;
  },
  cubeSamples(R, m) {
    const out = [], h = R, d = 2 * h / m;
    for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
      const u = -h + d * (i + 0.5), v = -h + d * (j + 0.5), p = [0, 0, 0], n = [0, 0, 0];
      p[ax] = s * h; p[(ax + 1) % 3] = u; p[(ax + 2) % 3] = v; n[ax] = s;
      out.push({ p, n, dA: d * d });
    }
    return out;
  },
  flux(charges, samples) {
    let f = 0;
    for (const s of samples) { const E = F.field(charges, s.p); f += (E[0] * s.n[0] + E[1] * s.n[1] + E[2] * s.n[2]) * s.dA; }
    return f;
  },
};

// 可見光波長 → 顏色（近似）
function wlColor(l, out) {
  let r = 0, g = 0, b = 0;
  if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = (510 - l) / 20; }
  else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = (645 - l) / 65; } else r = 1;
  const f = l < 420 ? 0.4 + 0.6 * (l - 380) / 40 : l > 700 ? 0.4 + 0.6 * (750 - l) / 50 : 1;
  return out.setRGB(r * f, g * f, b * f, 'srgb');
}
const colorName = l => l < 450 ? '紫' : l < 495 ? '藍' : l < 570 ? '綠' : l < 590 ? '黃' : l < 620 ? '橙' : '紅';

export default [
  {
    id: 'gauss', realm: 'classic', cat: '電磁', title: '高斯定律', en: "Gauss's Law", keys: '電通量 flux 馬克士威',
    tex: '\\oint_S \\vec E \\cdot d\\vec A = \\dfrac{Q_{\\text{enc}}}{\\varepsilon_0}',
    explain: '<p>用一個封閉曲面（<b>高斯面</b>）把空間包起來，穿出曲面的電場總量（電通量）只跟<b>裡面包了多少電荷</b>有關，跟曲面的大小、形狀、電荷放在裡面哪裡都無關。</p><p>外面的電荷產生的電場線「從一邊穿進、另一邊穿出」，進出相抵，對總通量沒有貢獻。這是馬克士威方程組的第一條。</p><p>右下的數值是真的把曲面切成幾千小塊、逐塊算 \\(\\vec E\\cdot d\\vec A\\) 加起來的結果（單位取 \\(\\varepsilon_0=1\\)）。</p>',
    watch: ['改變曲面大小或換成立方體：箭頭長短變了，總通量不變。', '把電荷推出曲面外：一半箭頭穿出（橘）、一半穿入（青），總通量歸零。', '打開「外部電荷」：曲面上的電場被扭曲，但通量還是只等於內部電荷。'],
    params: [
      { k: 'q', label: '電荷 q', min: -3, max: 3, step: 0.1, v: 2 },
      { k: 'R', label: '高斯面大小', min: 1.2, max: 3.5, step: 0.05, v: 2.2 },
      { k: 'off', label: '電荷位置（往右移）', min: 0, max: 5, step: 0.05, v: 0 },
      { k: 'shape', label: '高斯面形狀', options: [['sphere', '球面'], ['cube', '立方體']], v: 'sphere' },
      { k: 'ext', label: '外部電荷（−2，在左邊）', bool: true, v: false },
    ],
    grid: false, cam: [5, 4, 9], target: [0.6, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const ball = U.sphere(1, U.mat(0x111111, { emissive: 0xff5a5a }));
      const ext = U.sphere(0.3, U.mat(0x111111, { emissive: 0x4f8bff })); ext.position.set(-5, 0, 0);
      const sph = U.sphere(1, U.mat(0xa0b4ff, { opacity: 0.08, side: THREE.DoubleSide }));
      const sphW = U.mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: 0xa0b4ff, wireframe: true, transparent: true, opacity: 0.12 }));
      const cube = U.box(2, 2, 2, U.mat(0xa0b4ff, { opacity: 0.08, side: THREE.DoubleSide }));
      const cubeW = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), new THREE.LineBasicMaterial({ color: 0xa0b4ff, transparent: true, opacity: 0.5 }));
      cube.add(cubeW);
      const arrows = Array.from({ length: 150 }, () => U.arrow(0xffffff, 0.022));
      const qL = U.label('', { color: '#ffb3b3', size: 0.4 });
      root.add(ball, ext, sph, sphW, cube, qL, ...arrows);
      const OUTC = new THREE.Color(0xf5b544), INC = new THREE.Color(0x4fd1e8);
      let key = '', fine = [], coarse = [];
      return {
        update(dt, P, t) {
          const k = P.shape + P.R;
          if (k !== key) {
            key = k;
            fine = P.shape === 'sphere' ? F.sphereSamples(P.R, 3000) : F.cubeSamples(P.R, 24);
            coarse = P.shape === 'sphere' ? F.sphereSamples(P.R, 150) : F.cubeSamples(P.R, 5);
          }
          const charges = [{ q: P.q, x: P.off, y: 0, z: 0 }];
          if (P.ext) charges.push({ q: -2, x: -5, y: 0, z: 0 });
          ball.position.x = P.off; ball.scale.setScalar(0.12 + Math.abs(P.q) * 0.08);
          ball.material.emissive.set(P.q >= 0 ? 0xff5a5a : 0x4f8bff);
          qL.set(`q = ${P.q > 0 ? '+' : ''}${P.q.toFixed(1)}`); qL.position.set(P.off, 0.75, 0);
          ext.visible = P.ext;
          sph.visible = sphW.visible = P.shape === 'sphere'; cube.visible = P.shape === 'cube';
          sph.scale.setScalar(P.R); sphW.scale.setScalar(P.R); cube.scale.setScalar(P.R);
          sphW.rotation.y = t * 0.05;
          arrows.forEach((a, i) => {
            const s = coarse[i];
            if (!s) { a.visible = false; return; }
            const E = F.field(charges, s.p), En = E[0] * s.n[0] + E[1] * s.n[1] + E[2] * s.n[2];
            const v = U.V(...E), L = v.length(), Ld = Math.min(1.1, Math.sqrt(L) * 1.6);
            a.set(U.V(...s.p), v.multiplyScalar(Ld / (L || 1)));
            a.children[0].material.color.copy(En >= 0 ? OUTC : INC);
          });
          const inside = Math.abs(P.off) < P.R; // 球半徑與立方體半邊長都是 R，電荷只沿 x 移動
          const flux = F.flux(charges, fine);
          out({ '數值積分 ∮E·dA': flux.toFixed(3), 'Q_enc / ε₀': (inside ? P.q : 0).toFixed(3), '電荷在': inside ? '曲面內' : '曲面外' });
        },
      };
    },
  },
  {
    id: 'coulomb', realm: 'classic', cat: '電磁', title: '庫侖定律', en: "Coulomb's Law", keys: '庫倫 靜電力 電荷 平方反比',
    tex: 'F = k\\,\\dfrac{q_1 q_2}{r^2},\\quad k = 8.99\\times10^9\\ \\text{N}\\,\\text{m}^2/\\text{C}^2',
    explain: '<p>兩個電荷之間的力和電量乘積成正比、和距離<b>平方</b>成反比。同號相斥、異號相吸，而且兩邊受的力一樣大、方向相反（牛頓第三定律）。</p><p>它和萬有引力長得幾乎一樣，但強得多：兩個電子之間的電力是重力的 \\(10^{42}\\) 倍。地上灰色的小箭頭是兩個電荷合起來的電場方向。</p>',
    watch: ['距離拉成兩倍，力變成四分之一（看右下曲線）。', '把其中一個電荷改成負的：箭頭從互相推開變成互相拉近。', '兩個電荷不一樣大時，兩支力箭頭仍然一樣長。'],
    params: [
      { k: 'q1', label: '電荷 q₁', min: -5, max: 5, step: 0.1, v: 3, unit: 'μC' },
      { k: 'q2', label: '電荷 q₂', min: -5, max: 5, step: 0.1, v: -2, unit: 'μC' },
      { k: 'r', label: '距離 r', min: 0.1, max: 1, step: 0.01, v: 0.5, unit: 'm' },
    ],
    grid: false, cam: [0, 6, 10], target: [0, 0.6, 0],
    setup({ root, U, P, out, chart }) {
      const S = 7, Y = 1;
      const b1 = U.sphere(1, U.mat(0x111111, { emissive: 0xff5a5a })), b2 = U.sphere(1, U.mat(0x111111, { emissive: 0x4f8bff }));
      const a1 = U.arrow(0xffd27a, 0.07), a2 = U.arrow(0xffd27a, 0.07);
      const l1 = U.label('', { size: 0.38 }), l2 = U.label('', { size: 0.38 }), lr = U.label('', { color: 'rgba(233,237,245,.6)', size: 0.34 });
      const ruler = U.line(2, 0xffffff, 0.35, true);
      const grid = [];
      for (let i = -5; i <= 5; i++) for (let j = -3; j <= 3; j++) { const a = U.arrow(0x5b6478, 0.018); a.p = U.V(i, 0, j); grid.push(a); }
      root.add(b1, b2, a1, a2, l1, l2, lr, ruler, ...grid);
      const ch = chart({ title: '|F| 和距離 r 的關係（平方反比）', x: [0.05, 1], y: [0, 1], xl: 'r (m)', yl: 'F (N)' });
      const colOf = q => q > 0 ? 0xff5a5a : q < 0 ? 0x4f8bff : 0x888888;
      return {
        update() {
          const x1 = -P.r * S / 2, x2 = P.r * S / 2, Fn = F.coulomb(P.q1 * 1e-6, P.q2 * 1e-6, P.r);
          b1.position.set(x1, Y, 0); b2.position.set(x2, Y, 0);
          b1.scale.setScalar(0.14 + 0.06 * Math.abs(P.q1)); b2.scale.setScalar(0.14 + 0.06 * Math.abs(P.q2));
          b1.material.emissive.set(colOf(P.q1)); b2.material.emissive.set(colOf(P.q2));
          const L = Math.min(3.2, 0.6 * Math.sqrt(Math.abs(Fn))), s = Fn > 0 ? 1 : -1;   // 排斥時向外
          a1.set(U.V(x1, Y + 0.7, 0), U.V(-s * L, 0, 0)); a2.set(U.V(x2, Y + 0.7, 0), U.V(s * L, 0, 0));
          l1.set(`q₁ ${P.q1 > 0 ? '+' : ''}${P.q1.toFixed(1)} μC`); l1.position.set(x1, Y - 0.75, 0);
          l2.set(`q₂ ${P.q2 > 0 ? '+' : ''}${P.q2.toFixed(1)} μC`); l2.position.set(x2, Y - 0.75, 0);
          ruler.set([U.V(x1, Y, 0), U.V(x2, Y, 0)]); lr.set(`r = ${P.r.toFixed(2)} m`); lr.position.set(0, Y + 0.35, 0.6);
          const cs = [{ q: P.q1, x: x1, y: Y, z: 0 }, { q: P.q2, x: x2, y: Y, z: 0 }];
          for (const a of grid) {
            const E = F.field(cs, [a.p.x, Y, a.p.z]), v = U.V(E[0], 0, E[2]), n = v.length();
            const near = Math.hypot(a.p.x - x1, a.p.z) < 0.5 || Math.hypot(a.p.x - x2, a.p.z) < 0.5;
            a.visible = !near && n > 1e-6;
            if (a.visible) a.set(U.V(a.p.x, 0.02, a.p.z), v.multiplyScalar(0.55 / n));
          }
          const Fat = r => Math.abs(F.coulomb(P.q1 * 1e-6, P.q2 * 1e-6, r));
          ch.o.y = [0, Math.max(1e-3, Fat(0.1) * 1.05)];
          ch.draw([{ pts: Array.from({ length: 80 }, (_, i) => { const r = 0.08 + i * 0.92 / 79; return [r, Fat(r)]; }), color: '#f5b544' }], [{ x: P.r, y: Math.abs(Fn), color: '#fff', r: 5 }]);
          out({ '力的大小 |F|': Math.abs(Fn).toFixed(3) + ' N', '方向': Fn > 0 ? '互相排斥' : Fn < 0 ? '互相吸引' : '沒有力', '距離加倍時': (Math.abs(Fn) / 4).toFixed(3) + ' N', '兩力合計': '0（大小相等、方向相反）' });
        },
      };
    },
  },
  {
    id: 'dipole', realm: 'classic', cat: '電磁', title: '電場線與電偶極', en: 'Electric Field Lines · Dipole', keys: '電力線 電場 偶極 field lines',
    tex: ['\\vec E = \\dfrac{1}{4\\pi\\varepsilon_0}\\sum_i \\dfrac{q_i\\,\\hat r_i}{r_i^2}', '\\vec p = q\\,\\vec d'],
    explain: '<p><b>電場線</b>是把電場方向一路連起來的線：從正電荷出發、到負電荷結束，線上每一點的切線方向就是放一個正電荷在那裡會被推的方向。線越密，電場越強。</p><p>一正一負的組合叫<b>電偶極</b>，水分子、天線都是電偶極。兩個同號電荷的電場線互相排擠，中間會出現一個電場為零的點。</p>',
    watch: ['偶極：所有電場線都從紅色正電荷出發，彎過去落在藍色負電荷上。', '同號電荷：電場線在中間互相避開，那裡有一個電場為零的點。', '不等量（+2q, −q）：只有一半的線回到負電荷，另一半跑到遠方。'],
    params: [
      { k: 'cfg', label: '電荷組合', options: [['dip', '偶極 +q −q'], ['like', '同號 +q +q'], ['uneq', '+2q −q']], v: 'dip' },
      { k: 'd', label: '兩電荷距離 d', min: 1, max: 4, step: 0.1, v: 2.4 },
      { k: 'flow', label: '顯示流動的試驗電荷', bool: true, v: true },
    ],
    grid: false, cam: [0, 5, 10], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const MAXL = 64, NP = 401;
      const lines = Array.from({ length: MAXL }, () => U.line(NP, 0xf5b544, 0.55));
      const dots = U.points(MAXL, 0xffffff, 0.16);
      const balls = [0, 1].map(() => U.sphere(1, U.mat(0x111111, { emissive: 0xff5a5a })));
      const labs = [0, 1].map(() => U.label('', { size: 0.4 }));
      root.add(dots, ...lines, ...balls, ...labs);
      let traced = [], stats = { from: 0, end: 0 };
      const rebuild = () => {
        const a = P.d / 2, qs = { dip: [1, -1], like: [1, 1], uneq: [2, -1] }[P.cfg];
        const cs = [{ q: qs[0], x: -a, y: 0, z: 0 }, { q: qs[1], x: a, y: 0, z: 0 }];
        cs.forEach((c, i) => {
          balls[i].position.set(c.x, 0, 0); balls[i].scale.setScalar(0.16 + 0.07 * Math.abs(c.q));
          balls[i].material.emissive.set(c.q > 0 ? 0xff5a5a : 0x4f8bff);
          labs[i].set(`${c.q > 0 ? '+' : '−'}${Math.abs(c.q) > 1 ? Math.abs(c.q) : ''}q`); labs[i].position.set(c.x, 0.75, 0);
        });
        traced = []; stats = { from: 0, end: 0 };
        for (const c of cs.filter(c => c.q > 0)) {
          for (const s of F.sphereSamples(1, 16 * c.q)) {
            const pts = F.trace(cs, [c.x + s.n[0] * 0.15, s.n[1] * 0.15, s.n[2] * 0.15]);
            const last = pts.at(-1);
            stats.from++; if (cs.some(k => k.q < 0 && Math.hypot(last[0] - k.x, last[1], last[2]) < 0.2)) stats.end++;
            traced.push(pts.map(p => U.V(...p)));
          }
        }
        lines.forEach((l, i) => { l.visible = !!traced[i]; if (traced[i]) l.set(traced[i]); });
      };
      rebuild();
      return {
        onParam(k) { if (k !== 'flow') rebuild(); },
        update(dt, _, t) {
          dots.visible = !!P.flow;
          traced.forEach((pts, i) => { const p = pts[Math.floor((t * 40 + i * 37) % pts.length)]; p.toArray(dots.pos, i * 3); });
          dots.flush(traced.length);
          out({ '從正電荷出發': stats.from + ' 條', '落在負電荷': stats.end + ' 條', '跑到遠方': stats.from - stats.end + ' 條', '偶極矩 p = qd': P.cfg === 'dip' ? P.d.toFixed(1) + ' q·單位長' : '—' });
        },
      };
    },
  },
  {
    id: 'lorentz', realm: 'classic', cat: '電磁', title: '勞侖茲力', en: 'Lorentz Force · Charged Particle in B Field', keys: '洛倫茲 勞倫茲 迴旋 螺旋 cyclotron 磁場',
    tex: ['\\vec F = q\\left(\\vec E + \\vec v \\times \\vec B\\right)', 'r = \\dfrac{m v_\\perp}{|q|B}'],
    explain: '<p>磁場對運動電荷的力 \\(q\\vec v\\times\\vec B\\) 永遠和速度垂直，所以<b>只改變方向、不改變速率</b>，讓粒子繞圈；沿著磁場方向的速度不受影響，合起來就是<b>螺旋線</b>。極光就是太陽風的帶電粒子沿地球磁場螺旋下來撞到大氣。</p><p>再加上一個電場，粒子會一邊繞圈一邊往 \\(\\vec E\\times\\vec B\\) 方向漂移，速度 \\(E/B\\)，跟電荷正負無關。</p>',
    watch: ['磁場加倍，繞圈半徑變一半、轉一圈的時間也變一半。', '換成負電荷：繞圈方向相反。', '打開電場：圓圈變成往前滾的擺線，正負電荷都往同一邊漂。'],
    params: [
      { k: 'B', label: '磁場 B（往上）', min: 0.3, max: 2, step: 0.05, v: 1 },
      { k: 'ang', label: '速度和磁場的夾角', min: 0, max: 90, step: 1, v: 75, unit: '°' },
      { k: 'v', label: '速率 v', min: 1, max: 4, step: 0.1, v: 2 },
      { k: 'q', label: '電荷', options: [[1, '正電荷'], [-1, '負電荷']], v: 1 },
      { k: 'E', label: '加上電場（往右）', bool: true, v: false },
    ],
    grid: false, cam: [11, 5, 17], target: [0, 0, 0],
    setup({ root, U, P, out }) {
      const E0 = 0.6, TR = 1800, BOUND = 14;
      const bArrows = [];
      for (const x of [-6, -2, 2, 6]) for (const z of [-6, -2, 2, 6]) { const a = U.arrow(0x2b5f73, 0.025).set(U.V(x, -5, z), U.V(0, 11, 0)); bArrows.push(a); }
      const eArrows = [];
      for (const y of [-3, 0, 3]) for (const z of [-4, 0, 4]) eArrows.push(U.arrow(0x7a5a22, 0.025).set(U.V(-7, y, z), U.V(14, 0, 0)));
      const ball = U.sphere(0.2, U.mat(0x111111, { emissive: 0xff5a5a }));
      const trail = U.line(TR, 0xf5b544, 0.85), fA = U.arrow(0xff6b6b, 0.05), vA = U.arrow(0x4fd1e8, 0.05);
      const bl = U.label('B', { color: '#4fd1e8', size: 0.5 }); bl.position.set(6, 6.6, 6);
      root.add(...bArrows, ...eArrows, ball, trail, fA, vA, bl);
      let p, v, pts;
      const reset = () => {
        const a = P.ang * Math.PI / 180;
        p = U.V(0, -4, 0); v = U.V(P.v * Math.sin(a), P.v * Math.cos(a), 0); pts = [p.clone()];
      };
      reset();
      const vm = U.V(), tv = U.V(), vp = U.V(), sv = U.V();
      return {
        onParam: reset,
        actions: { '重新發射': reset },
        update(dt) {
          const q = P.q, E = P.E ? E0 : 0, n = 20, h = dt / n;
          eArrows.forEach(a => a.visible = !!P.E);
          for (let i = 0; i < n; i++) {   // Boris 推進法（m = 1）
            vm.copy(v); vm.x += q * E * h / 2;
            tv.set(0, q * P.B * h / 2, 0);
            vp.copy(vm).add(sv.copy(vm).cross(tv));
            const s2 = 2 / (1 + tv.lengthSq());
            vm.add(sv.copy(vp).cross(tv).multiplyScalar(s2));
            v.copy(vm); v.x += q * E * h / 2;
            p.addScaledVector(v, h);
          }
          if (dt > 0) { pts.push(p.clone()); if (pts.length > TR) pts.shift(); }
          if (Math.abs(p.x) > BOUND || Math.abs(p.z) > BOUND || p.y > 7) reset();
          trail.set(pts);
          ball.position.copy(p); ball.material.emissive.set(q > 0 ? 0xff5a5a : 0x4f8bff);
          const Fv = U.V(q * E, 0, 0).add(v.clone().cross(U.V(0, q * P.B, 0)));
          fA.set(p, Fv.multiplyScalar(0.7)); vA.set(p, v.clone().multiplyScalar(0.6));
          const a = P.ang * Math.PI / 180;
          out({ '迴旋半徑 r': F.larmor(1, P.v * Math.sin(a), q, P.B).toFixed(2), '繞一圈週期 T': F.cyclotronT(1, q, P.B).toFixed(2) + ' s', '螺距': (P.v * Math.cos(a) * F.cyclotronT(1, q, P.B)).toFixed(2), '漂移速度 E/B': P.E ? (E0 / P.B).toFixed(2) + '（往 E×B 方向）' : '— 沒有電場', '速率 |v|': v.length().toFixed(2) });
        },
      };
    },
  },
  {
    id: 'faraday', realm: 'classic', cat: '電磁', title: '法拉第電磁感應', en: "Faraday's Law of Induction · Lenz's Law", keys: '電磁感應 楞次 冷次 發電機 線圈 磁通量',
    tex: ['\\mathcal{E} = -N\\,\\dfrac{d\\Phi_B}{dt}', '\\Phi_B = \\int \\vec B \\cdot d\\vec A'],
    explain: '<p>穿過線圈的磁力線數量（<b>磁通量</b>）一改變，線圈就會產生電動勢、推動電流。磁鐵不動時，不管磁場多強都沒有電流；只有在「變化」的時候才有。</p><p>負號是<b>楞次定律</b>：感應電流產生的磁場總是在抵抗原本的變化——磁鐵靠近時線圈把它往外推，遠離時把它往回拉。發電機、變壓器、無線充電都是這個原理。</p>',
    watch: ['磁鐵進入線圈和離開線圈時，電流計往相反方向偏。', '磁鐵停在線圈正中央那一瞬間（磁通量最大）電動勢反而是 0。', '線圈圈數或磁鐵速度加倍，電動勢也加倍。'],
    params: [
      { k: 'w', label: '磁鐵來回速度', min: 0.3, max: 3, step: 0.05, v: 1.2 },
      { k: 'N', label: '線圈圈數 N', min: 5, max: 60, step: 1, v: 20 },
      { k: 's', label: '磁鐵強度', min: 0.5, max: 2, step: 0.05, v: 1 },
      { k: 'flip', label: '把磁鐵反過來（S 極朝線圈）', bool: true, v: false },
    ],
    grid: false, cam: [0, 4, 12], target: [-1.2, 0.8, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const A = 5, RA = 1.3, LEN = 2.4, NP = 1200;
      const coil = U.line(NP, 0xd98c4a);
      const helix = (u, turns) => U.V(-LEN / 2 + LEN * u, RA * Math.cos(u * turns * 2 * Math.PI), RA * Math.sin(u * turns * 2 * Math.PI));
      const buildCoil = () => { const tn = Math.max(4, Math.round(P.N / 2)); coil.set(Array.from({ length: NP }, (_, i) => helix(i / (NP - 1), tn))); };
      buildCoil();
      const mag = new THREE.Group();
      const nP = U.box(1.1, 0.55, 0.55, U.mat(0xe0484f, { rough: 0.4 })), sP = U.box(1.1, 0.55, 0.55, U.mat(0x3c6fe0, { rough: 0.4 }));
      nP.position.x = 0.55; sP.position.x = -0.55;
      const nL = U.label('N', { size: 0.4 }), sL = U.label('S', { size: 0.4 }); nL.position.set(0.55, 0.6, 0); sL.position.set(-0.55, 0.6, 0);
      mag.add(nP, sP, nL, sL);
      const dial = U.cyl(1.1, 1.1, 0.12, U.mat(0x1a1d26, { metal: 0.4 }), 48); dial.rotation.x = Math.PI / 2; dial.position.set(0, 3.6, 0);
      const arc = U.line(40, 0xffffff, 0.4).set(Array.from({ length: 40 }, (_, i) => { const a = -1.05 + 2.1 * i / 39; return U.V(0.9 * Math.sin(a), 3.6 + 0.9 * Math.cos(a) - 0.35, 0.08); }));
      const needle = U.beam(0xff6b6b, 0.03);
      const wires = [U.line(3, 0x9a6a3a), U.line(3, 0x9a6a3a)];
      wires[0].set([U.V(-LEN / 2, RA, 0), U.V(-LEN / 2, 3.6, 0), U.V(-1.1, 3.6, 0)]);
      wires[1].set([U.V(LEN / 2, RA, 0), U.V(LEN / 2, 3.6, 0), U.V(1.1, 3.6, 0)]);
      const ND = 40, cur = U.points(ND, 0xffe3a3, 0.14);
      const gL = U.label('電流計', { color: 'rgba(233,237,245,.6)', size: 0.32 }); gL.position.set(0, 4.95, 0);
      root.add(coil, mag, dial, arc, needle, cur, gL, ...wires);
      const ch = chart({ title: '感應電動勢 ℰ（相對單位）', x: [0, 8], y: [-1, 1], xl: 't (s)', yl: 'ℰ' });
      let ph = 0, prev = null, tt = 0, hist = [], flow = 0, emf = 0;
      return {
        onParam(k) { if (k === 'N') buildCoil(); if (k === 'flip') prev = null; },
        update(dt) {
          tt += dt; ph += P.w * dt;
          const xm = A * Math.sin(ph);
          mag.position.set(xm, 0, 0); mag.rotation.y = P.flip ? Math.PI : 0;
          const phi = (P.flip ? -1 : 1) * P.s * F.coilFlux(xm, RA);
          if (dt > 0) { emf = prev == null ? 0 : -P.N * (phi - prev) / dt; prev = phi; }
          const Emax = 0.7 * P.N * P.s * A * P.w;
          needle.set(U.V(0, 3.25, 0.1), U.V(0.9 * Math.sin(1.05 * Math.max(-1, Math.min(1, emf / Emax))), 3.25 + 0.9 * Math.cos(1.05 * Math.max(-1, Math.min(1, emf / Emax))), 0.1));
          flow += emf / Emax * dt * 0.6;
          const tn = Math.max(4, Math.round(P.N / 2));
          for (let i = 0; i < ND; i++) { const u = (((i / ND + flow) % 1) + 1) % 1; helix(u, tn).toArray(cur.pos, i * 3); }
          cur.flush();
          if (dt > 0 && (!hist.length || tt - hist.at(-1)[0] > 0.04)) hist.push([tt, emf]);
          while (hist.length && hist[0][0] < tt - 8) hist.shift();
          ch.o.x = [Math.max(0, tt - 8), Math.max(8, tt)]; ch.o.y = [-Emax * 1.1, Emax * 1.1];
          ch.draw([{ pts: [[ch.o.x[0], 0], [ch.o.x[1], 0]], color: 'rgba(255,255,255,.15)', w: 1 }, { pts: hist, color: '#f5b544' }], [{ x: tt, y: emf, color: '#fff' }]);
          const v = A * P.w * Math.cos(ph), approaching = xm * v < 0;
          out({ '磁通量 Φ（相對）': phi.toFixed(3), '電動勢 ℰ': emf.toFixed(2), '磁鐵': Math.abs(xm) < 0.3 ? '在線圈中間' : approaching ? '靠近中（線圈推它）' : '遠離中（線圈拉它）', '圈數 N': P.N });
        },
      };
    },
  },
  {
    id: 'ampere', realm: 'classic', cat: '電磁', title: '安培定律', en: "Ampère's Law · Magnetic Field of a Wire", keys: '安培 右手定則 電流磁效應 必歐沙伐 磁場',
    tex: ['\\oint \\vec B \\cdot d\\vec \\ell = \\mu_0 I_{\\text{enc}}', 'B = \\dfrac{\\mu_0 I}{2\\pi r}'],
    explain: '<p>電流會在周圍產生一圈一圈的磁場（厄斯特發現指南針會被電線轉動）。方向用<b>右手定則</b>：大拇指指電流方向，四指彎的方向就是磁場方向。</p><p>沿著任一個圍住電流的封閉迴路把 \\(\\vec B\\) 加起來，結果只等於 \\(\\mu_0\\) 乘上穿過迴路的電流——迴路取大取小都一樣，因為 \\(B\\propto 1/r\\) 剛好抵消了周長 \\(2\\pi r\\)。</p>',
    watch: ['地上的小指南針全部沿著圓圈排列，紅色那端指的是磁場方向。', '把電流反向：指南針全部掉頭，流動的光點也反著轉。', '改變安培迴路的半徑：B 變了，但 B × 2πr 永遠等於 μ₀I。'],
    params: [
      { k: 'I', label: '電流 I（正＝往上）', min: -20, max: 20, step: 0.5, v: 10, unit: 'A' },
      { k: 'r', label: '安培迴路半徑 r', min: 1, max: 5, step: 0.1, v: 3, unit: 'cm' },
    ],
    grid: false, cam: [7, 6, 9], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const wire = U.cyl(0.09, 0.09, 10, U.mat(0xd98c4a, { metal: 0.8, rough: 0.3 }));
      const iA = U.arrow(0xf5b544, 0.07), iL = U.label('I', { color: '#f5b544', size: 0.5 });
      const RS = [1, 2, 3, 4.5], YS = [-2.5, 0, 2.5];
      const rings = [];
      for (const y of YS) for (const r of RS) { const l = U.line(65, 0x4fd1e8, Math.min(0.9, 0.9 / r)); l.set(Array.from({ length: 65 }, (_, i) => U.V(r * Math.cos(i / 64 * 2 * Math.PI), y, r * Math.sin(i / 64 * 2 * Math.PI)))); rings.push(l); }
      const PER = 8, bd = U.points(RS.length * YS.length * PER, 0xbff4ff, 0.13);
      const ND = 50, cd = U.points(ND, 0xffe3a3, 0.12);
      const loop = U.line(97, 0xf5b544, 0.9, true), loopL = U.label('安培迴路', { color: '#f5b544', size: 0.34 });
      const needles = [];
      for (const r of [1.6, 3, 4.4]) for (let k = 0; k < 10; k++) {
        const ph = k / 10 * 2 * Math.PI, g = new THREE.Group();
        const red = U.box(0.3, 0.05, 0.08, U.mat(0xff5a5a, { emissive: 0xff5a5a, ei: 0.3 })), wh = U.box(0.3, 0.05, 0.08, U.mat(0xdfe3ea));
        red.position.x = 0.15; wh.position.x = -0.15; g.add(red, wh);
        g.position.set(r * Math.cos(ph), -4.3, r * Math.sin(ph)); g.ph = ph; needles.push(g);
      }
      const disc = U.mesh(new THREE.CircleGeometry(5.2, 64), U.mat(0x1a1d26, { opacity: 0.5, side: THREE.DoubleSide })); disc.rotation.x = -Math.PI / 2; disc.position.y = -4.36;
      root.add(wire, iA, iL, bd, cd, loop, loopL, disc, ...rings, ...needles);
      const angs = RS.map(() => 0);
      let cs = 0;
      return {
        update(dt) {
          const sg = Math.sign(P.I);
          iA.visible = iL.visible = sg !== 0;
          iA.set(U.V(0.5, -1.5 * sg, 0), U.V(0, 3 * sg, 0)); iL.position.set(0.85, 1.7 * sg, 0);
          // 磁場方向：Î × r̂ → 從上往下看，電流朝上時逆時針（φ 減少的方向）
          RS.forEach((r, i) => angs[i] -= sg * Math.abs(P.I) / 10 * 4 / (r * r) * dt); cs += P.I * dt * 0.08;
          let k = 0;
          for (const y of YS) RS.forEach((r, ri) => { for (let j = 0; j < PER; j++) {
            const a = angs[ri] + j / PER * 2 * Math.PI;
            bd.pos.set([r * Math.cos(a), y, r * Math.sin(a)], k++ * 3);
          } });
          bd.flush();
          for (let i = 0; i < ND; i++) cd.pos.set([0, -5 + ((((i / ND + cs) % 1) + 1) % 1) * 10, 0], i * 3);
          cd.flush();
          for (const g of needles) { g.visible = sg !== 0; g.rotation.y = Math.atan2(Math.cos(g.ph), Math.sin(g.ph)) + (sg < 0 ? Math.PI : 0); }
          loop.set(Array.from({ length: 97 }, (_, i) => U.V(P.r * Math.cos(i / 96 * 2 * Math.PI), 1.2, P.r * Math.sin(i / 96 * 2 * Math.PI))));
          loopL.position.set(P.r + 0.4, 1.6, 0);
          const rm = P.r / 100, B = F.wireB(P.I, rm);
          out({ 'B(r) = μ₀I / 2πr': (Math.abs(B) * 1e6).toFixed(1) + ' μT', '∮B·dℓ = B·2πr': (Math.abs(B) * 2 * Math.PI * rm).toExponential(3) + ' T·m', 'μ₀ I': (F.MU0 * Math.abs(P.I)).toExponential(3) + ' T·m', '磁場方向（從上看）': sg > 0 ? '逆時針' : sg < 0 ? '順時針' : '沒有電流' });
        },
      };
    },
  },
  {
    id: 'emwave', realm: 'classic', cat: '電磁', title: '電磁波', en: 'Electromagnetic Wave', keys: '光 電磁波 馬克士威 波長 頻率 光譜',
    tex: ['\\vec E = E_0 \\sin(kx - \\omega t)\\,\\hat y', '\\vec B = B_0 \\sin(kx - \\omega t)\\,\\hat z', 'c = \\lambda f = \\dfrac{1}{\\sqrt{\\mu_0\\varepsilon_0}},\\quad B_0 = \\dfrac{E_0}{c}'],
    explain: '<p>馬克士威發現：變化的電場會產生磁場，變化的磁場又會產生電場，兩者互相推著往前跑，不需要任何介質，這就是<b>電磁波</b>。他從方程式算出波速 \\(1/\\sqrt{\\mu_0\\varepsilon_0}\\)，剛好等於光速——光就是電磁波。</p><p>電場和磁場<b>互相垂直、也都垂直於前進方向</b>，而且同步達到最大。改變波長，就從無線電、紅外線、可見光一路變到 X 光；這裡只示範可見光的範圍。</p>',
    watch: ['橘／彩色是電場（上下振動）、青色是磁場（前後振動），兩者永遠同時到最大。', '波長變短，頻率變高、光子能量變大，顏色從紅往紫移動。', '真實的 B₀ 只有 E₀ 的 1/c，這裡為了看得到把它放大畫。'],
    params: [
      { k: 'lam', label: '波長 λ', min: 380, max: 750, step: 5, v: 550, unit: 'nm' },
      { k: 'A', label: '電場振幅', min: 0.5, max: 2, step: 0.05, v: 1.4 },
      { k: 'showB', label: '顯示磁場', bool: true, v: true },
    ],
    grid: false, cam: [6, 5, 11], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const X = 8, NP = 300, NS = 56;
      const axis = U.arrow(0xffffff, 0.02).set(U.V(-X, 0, 0), U.V(2 * X + 1, 0, 0));
      const eC = U.line(NP, 0xf5b544), bC = U.line(NP, 0x4fd1e8);
      const eS = Array.from({ length: NS }, () => U.beam(0xf5b544, 0.025)), bS = Array.from({ length: NS }, () => U.beam(0x4fd1e8, 0.02, U.glow(0x4fd1e8, 0.7)));
      const eL = U.label('E', { size: 0.5 }), bL = U.label('B', { color: '#4fd1e8', size: 0.5 }), cL = U.label('c →', { color: 'rgba(233,237,245,.7)', size: 0.45 });
      cL.position.set(X + 1.2, 0.5, 0);
      root.add(axis, eC, bC, eL, bL, cL, ...eS, ...bS);
      const ep = Array.from({ length: NP }, () => U.V()), bp = Array.from({ length: NP }, () => U.V());
      const col = new THREE.Color(), O = U.V(), T = U.V();
      return {
        update(dt, _, t) {
          const ls = P.lam / 100, k = 2 * Math.PI / ls, w = 2 * Math.PI * 0.6;
          wlColor(P.lam, col);
          eC.material.color.copy(col);
          eS.forEach(s => s.material.color.copy(col));
          for (let i = 0; i < NP; i++) { const x = -X + 2 * X * i / (NP - 1), s = P.A * Math.sin(k * x - w * t); ep[i].set(x, s, 0); bp[i].set(x, 0, s); }
          eC.set(ep); bC.set(bp);
          bC.visible = !!P.showB;
          for (let i = 0; i < NS; i++) {
            const x = -X + 2 * X * (i + 0.5) / NS, s = P.A * Math.sin(k * x - w * t);
            eS[i].set(O.set(x, 0, 0), T.set(x, s, 0));
            bS[i].visible = !!P.showB; if (P.showB) bS[i].set(O.set(x, 0, 0), T.set(x, 0, s));
          }
          eL.position.set(-X, P.A + 0.5, 0); bL.position.set(-X, 0.3, P.A + 0.5); bL.visible = !!P.showB;
          const f = F.C / (P.lam * 1e-9);
          out({ '頻率 f = c/λ': f.toExponential(2) + ' Hz', '光子能量 hf': (1239.84 / P.lam).toFixed(2) + ' eV', '顏色': colorName(P.lam), 'B₀ / E₀ = 1/c': (1 / F.C).toExponential(2) + ' s/m' });
        },
      };
    },
  },
];
