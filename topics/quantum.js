// 量子力學（波函數類主題用 ħ = m = 1 的自然單位）
const H = 6.62607015e-34, C = 2.99792458e8, KB = 1.380649e-23, HEV = 4.135667696e-15, HC_EVNM = 1239.84198;
const D = Math.PI / 180;

const lnFact = n => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
// 廣義拉蓋爾多項式 L_k^α(x)
const laguerre = (k, a, x) => { let l0 = 1, l1 = 1 + a - x; if (k === 0) return l0; for (let i = 1; i < k; i++) [l0, l1] = [l1, ((2 * i + 1 + a - x) * l1 - (i + a) * l0) / (i + 1)]; return l1; };
// 締合勒讓德 P_l^m(x)，m ≥ 0
const legendre = (l, m, x) => {
  let pmm = 1;
  if (m > 0) { const s = Math.sqrt((1 - x) * (1 + x)); let f = 1; for (let i = 1; i <= m; i++) { pmm *= -f * s; f += 2; } }
  if (l === m) return pmm;
  let pm1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pm1;
  for (let ll = m + 2; ll <= l; ll++) [pmm, pm1] = [pm1, (x * (2 * ll - 1) * pm1 - (ll + m - 1) * pmm) / (ll - m)];
  return pm1;
};

export const F = {
  planck: (lam, T) => 2 * H * C * C / lam ** 5 / Math.expm1(H * C / (lam * KB * T)),
  rayleighJeans: (lam, T) => 2 * C * KB * T / lam ** 4,
  wien: T => 2.897771955e-3 / T,
  // 光電效應：最大動能（eV），λ 單位 nm
  photoKE: (nm, phi) => HC_EVNM / nm - phi,
  // 雙狹縫強度（d、a、λ 同單位），沒觀測時有干涉項
  slitI: (s, d, a, lam, watched) => { const b = Math.PI * a * s / lam, env = b ? (Math.sin(b) / b) ** 2 : 1; return watched ? env : env * Math.cos(Math.PI * d * s / lam) ** 2; },
  // 自由高斯波包的寬度
  sigmaX: (s, t) => s * Math.hypot(1, t / (2 * s * s)),
  sigmaP: s => 1 / (2 * s),
  wellE: (n, L) => n * n * Math.PI * Math.PI / (2 * L * L),
  wellPsi: (n, L, x) => (x < 0 || x > L) ? 0 : Math.sqrt(2 / L) * Math.sin(n * Math.PI * x / L),
  // 諧振子本徵函數（遞迴，數值穩定）
  qhoPsi(n, x) {
    let p0 = Math.PI ** -0.25 * Math.exp(-x * x / 2);
    if (n === 0) return p0;
    let p1 = Math.SQRT2 * x * p0;
    for (let k = 1; k < n; k++) [p0, p1] = [p1, Math.sqrt(2 / (k + 1)) * x * p1 - Math.sqrt(k / (k + 1)) * p0];
    return p1;
  },
  qhoE: n => n + 0.5,
  // 矩形位障穿透率
  barrierT(E, V0, a) {
    if (Math.abs(E - V0) < 1e-9) return 1 / (1 + V0 * a * a / 2);
    if (E < V0) { const k = Math.sqrt(2 * (V0 - E)); return 1 / (1 + V0 * V0 * Math.sinh(k * a) ** 2 / (4 * E * (V0 - E))); }
    const k = Math.sqrt(2 * (E - V0)); return 1 / (1 + V0 * V0 * Math.sin(k * a) ** 2 / (4 * E * (E - V0)));
  },
  // 氫原子徑向波函數（a₀ = 1）
  hydrogenR(n, l, r) {
    const rho = 2 * r / n;
    const norm = Math.sqrt((2 / n) ** 3 * Math.exp(lnFact(n - l - 1) - lnFact(n + l)) / (2 * n));
    return norm * Math.exp(-rho / 2) * rho ** l * laguerre(n - l - 1, 2 * l + 1, rho);
  },
  // 實球諧函數（沒歸一化，只用來取樣與看正負號）
  realY: (l, m, ct, ph) => legendre(l, Math.abs(m), ct) * (m > 0 ? Math.cos(m * ph) : m < 0 ? Math.sin(-m * ph) : 1),
  hydrogenE: n => -13.6057 / (n * n),
  // 自旋單態的關聯 E(a,b) = −cos(a−b)
  corr: (a, b) => -Math.cos(a - b),
  chsh: (a, a2, b, b2) => Math.abs(F.corr(a, b) - F.corr(a, b2) + F.corr(a2, b) + F.corr(a2, b2)),
};

// 可見光波長 → RGB（0..1）；範圍外回傳暗色
function nmRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else if (nm <= 780) r = 1;
  if (nm < 380) return [0.55, 0.35, 1];           // 紫外線：畫成淡紫
  if (nm > 780) return [0.45, 0.08, 0.05];        // 紅外線：暗紅
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
  return [r * f, g * f, b * f];
}
// 黑體顏色（Tanner Helland 近似），回傳 0..1
function bbRGB(T) {
  const t = T / 100;
  const r = t <= 66 ? 255 : 329.7 * (t - 60) ** -0.1332;
  const g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * (t - 60) ** -0.0755;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  return [r, g, b].map(v => Math.min(255, Math.max(0, v)) / 255);
}
const vecs = (U, n) => Array.from({ length: n }, () => U.V());
// 卡通裝飾用：整個物件變透明（a = 1 不透明）
const fade = (o, a) => o.traverse(m => { if (m.material) { m.material.transparent = true; m.material.opacity = a; m.material.depthWrite = a > 0.95; } });
// 每 sec 秒換一句
const cycle = (arr, t, sec = 4) => arr[Math.floor(t / sec) % arr.length];

// 位能井／諧振子共用：能階線、本徵函數的螺旋（實部→y、虛部→z）與機率密度
function levelScene({ root, U, P, out }, o) {
  const NP = 240, pot = U.line(200, 0xffffff, 0.5), levels = [];
  pot.set(Array.from({ length: 200 }, (_, i) => { const x = o.x0 + (o.x1 - o.x0) * i / 199; return U.V(x * o.sx, Math.min(o.vy(x), o.top), 0); }));
  for (let n = o.n0; n <= o.nmax; n++) {
    const y = o.Y(n), [a, b] = o.span(n);
    const l = U.line(2, 0x4fd1e8, 0.22).set([U.V(a * o.sx, y, 0), U.V(b * o.sx, y, 0)]);
    const lab = U.label(`n=${n}`, { color: 'rgba(233,237,245,.45)', size: 0.3 }); lab.position.set(b * o.sx + 0.6, y, 0);
    levels.push(l, lab);
  }
  const helix = U.line(NP, 0x4fd1e8), dens = U.line(NP, 0xf5f7ff), base = U.line(2, 0x4fd1e8, 0.8);
  const pts = vecs(U, NP), dp = vecs(U, NP);
  root.add(pot, ...levels, helix, dens, base);
  return {
    update(dt, P, t) {
      const n = P.n, m = n === o.n0 ? n + 1 : o.n0, sup = P.sup;
      const En = o.E(n), Em = o.E(m), y0 = sup ? (o.Y(n) + o.Y(m)) / 2 : o.Y(n);
      const w = o.w;
      const [a, b] = o.span(sup ? Math.max(n, m) : n);
      let mx = 0;
      for (let i = 0; i < NP; i++) {
        const x = a + (b - a) * i / (NP - 1);
        let re = o.psi(n, x) * Math.cos(-En * w * t), im = o.psi(n, x) * Math.sin(-En * w * t);
        if (sup) { const pm = o.psi(m, x); re = (re + pm * Math.cos(-Em * w * t)) / Math.SQRT2; im = (im + pm * Math.sin(-Em * w * t)) / Math.SQRT2; }
        const p2 = re * re + im * im;
        mx = Math.max(mx, p2);
        pts[i].set(x * o.sx, y0 + re * o.amp, im * o.amp);
        dp[i].set(x * o.sx, y0 + p2 * o.damp, 0);
      }
      helix.set(pts); dens.set(dp);
      base.set([U.V(a * o.sx, y0, 0), U.V(b * o.sx, y0, 0)]);
      out(o.readout(n, m, sup));
    },
  };
}

export default [
  {
    id: 'blackbody', realm: 'quantum', cat: '量子起源', title: '黑體輻射與普朗克常數', en: "Blackbody Radiation · Planck's Law", keys: '普朗克 planck 紫外災難 維恩 wien 黑體',
    tex: ['B_\\lambda(T) = \\dfrac{2hc^2}{\\lambda^5}\\,\\dfrac{1}{e^{hc/\\lambda k_B T}-1}', 'E = hf,\\qquad \\lambda_{\\max} T = 2.898\\times10^{-3}\\ \\text{m·K}'],
    explain: '<p>任何有溫度的物體都會發光。古典物理（瑞立–金斯公式，左下虛線）預測波長越短光越強，短波長會衝到無限大——這叫<b>紫外災難</b>。</p><p>1900 年普朗克假設光的能量只能一份一份地交換，每份 \\(E = hf\\)。高頻光的一份能量太大、很難被激發，曲線就在短波長端掉下來，和實驗完全吻合。這是<b>量子力學的起點</b>。</p><p>溫度越高，峰值往短波長移（維恩位移定律）：鐵塊從暗紅、橘、黃白一路變成藍白。</p>',
    watch: ['把溫度從 1000 K 拉到 10000 K：球的顏色從暗紅變藍白，峰值往左移。', '虛線（古典預測）在短波長往上衝，實線（普朗克）乖乖掉回 0。', '飛出的光子按普朗克分布抽樣，溫度低時大多是看不見的紅外線（暗紅點）。'],
    params: [{ k: 'T', label: '溫度 T', min: 1000, max: 10000, step: 50, v: 5800, unit: 'K' }],
    grid: false, cam: [0, 1, 15], target: [-2, 0, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const ball = U.sphere(1.6, U.mat(0x000000, { emissive: 0xffffff, rough: 0.9 }));
      const halo = U.sphere(2.1, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      const N = 900, ph = U.points(N, 0xffffff, 0.16, true);
      const ps = Array.from({ length: N }, () => ({ life: -1, d: U.V(), r: 0 }));
      const face = U.face(1.6), say = U.pop('', 0.5); say.position.set(0, 2.9, 0);
      root.add(ball, halo, ph, face, say);
      const ch = chart({ title: '光譜：普朗克（實線）vs 古典（虛線）', x: [0, 3000], y: [0, 1.6], xl: 'λ (nm)', yl: '' });
      let acc = 0, next = 0;
      // 光子個數的分布 ∝ λ·B_λ（B_λ 是能量分布，除以每顆光子的能量 hc/λ）
      let pkT = 0, pk = 0;
      const sample = T => {
        if (T !== pkT) { pkT = T; pk = 0; for (let nm = 100; nm <= 3000; nm += 10) pk = Math.max(pk, nm * F.planck(nm * 1e-9, T)); pk *= 1.02; }
        for (;;) { const nm = 100 + Math.random() * 2900; if (Math.random() * pk < nm * F.planck(nm * 1e-9, T)) return nm; }
      };
      return {
        update(dt, P, t) {
          face.look().mood(P.T > 7000 ? 'shock' : 'happy');
          say.set(cycle([P.T < 3000 ? '好冷…只發得出紅外線' : P.T > 7000 ? '好燙！我燒成藍色了！' : '剛剛好，跟太陽差不多～', '古典物理：短波長衝到無限大！（紫外災難）', '普朗克：能量要一份一份給啦！'], t));
          const T = P.T, col = bbRGB(T), bright = Math.min(1, (T / 5000) ** 1.5);
          ball.material.emissive.setRGB(col[0] * bright, col[1] * bright, col[2] * bright);
          halo.material.color.setRGB(...col); halo.material.opacity = 0.05 + 0.15 * bright;
          acc += dt * 120 * (T / 5800) ** 3;   // 每秒光子數 ∝ T³
          for (; acc >= 1; acc--) {
            const k = next++ % N, p = ps[k];
            p.d.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            p.r = 1.6; p.life = 1;
            ph.col.set(nmRGB(sample(T)), k * 3);
          }
          ps.forEach((p, i) => {
            if (p.life <= 0) { ph.pos[i * 3 + 1] = 1e4; return; }
            p.r += dt * 4; p.life = p.r < 9 ? 1 : 0;
            ph.pos[i * 3] = p.d.x * p.r; ph.pos[i * 3 + 1] = p.d.y * p.r; ph.pos[i * 3 + 2] = p.d.z * p.r;
          });
          ph.flush();
          const lm = F.wien(T), peak = F.planck(lm, T), xs = Array.from({ length: 120 }, (_, i) => 50 + i * 25);
          ch.draw([
            { pts: xs.map(nm => [nm, Math.min(2, F.rayleighJeans(nm * 1e-9, T) / peak)]), color: 'rgba(255,255,255,.45)', dash: [5, 4], w: 1.5 },
            { pts: xs.map(nm => [nm, F.planck(nm * 1e-9, T) / peak]), color: '#4fd1e8', fill: 'rgba(79,209,232,.12)' },
          ], [{ x: 380, vline: true, color: 'rgba(167,139,250,.5)' }, { x: 750, vline: true, color: 'rgba(255,107,107,.5)' }, { x: lm * 1e9, y: 1, color: '#fff', text: `峰值 ${Math.round(lm * 1e9)} nm` }]);
          out({ '峰值波長 λmax': Math.round(lm * 1e9) + ' nm', '峰值落在': lm * 1e9 < 380 ? '紫外線' : lm * 1e9 <= 750 ? '可見光' : '紅外線', '總輻射 ∝ T⁴': ((T / 5800) ** 4).toFixed(2) + ' × 太陽', '峰值光子能量 hf': (HC_EVNM / (lm * 1e9)).toFixed(2) + ' eV' });
        },
      };
    },
  },
  {
    id: 'photoelectric', realm: 'quantum', cat: '量子起源', title: '光電效應', en: 'Photoelectric Effect', keys: '愛因斯坦 einstein 光子 功函數 work function',
    tex: ['K_{\\max} = hf - \\phi', 'f_0 = \\phi / h'],
    explain: '<p>光照到金屬上會把電子打出來，但有怪事：<b>光不夠「藍」（頻率不夠高）時，再亮都打不出任何電子</b>；頻率夠高時，再暗也立刻有電子飛出。</p><p>愛因斯坦的解釋：光是一顆一顆的<b>光子</b>，每顆能量 \\(hf\\)。一顆光子只能把能量交給一個電子，扣掉逃出金屬需要的<b>功函數</b> \\(\\phi\\)，剩下的變成電子的動能。他因此拿到諾貝爾獎（不是因為相對論）。</p>',
    watch: ['把波長拉長（往紅光）：越過臨界波長後，電子完全不出來。', '只調強度：電子數量變多，但每顆飛的速度不變。', '左下圖的斜率就是普朗克常數 h，和金屬種類無關。'],
    params: [
      { k: 'nm', label: '光的波長 λ', min: 150, max: 700, step: 1, v: 400, unit: 'nm' },
      { k: 'I', label: '光的強度', min: 1, max: 10, step: 0.5, v: 4 },
      { k: 'phi', label: '金屬', options: [[2.28, '鈉 2.28 eV'], [2.87, '鈣 2.87 eV'], [4.33, '鋅 4.33 eV'], [5.65, '鉑 5.65 eV']], v: 2.28 },
    ],
    cam: [4, 6, 20], target: [-1.5, 2, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const plate = U.box(0.4, 5, 5, U.mat(0x9aa3b5, { metal: 0.9, rough: 0.25 })); plate.position.set(0, 2.5, 0);
      const lamp = U.cyl(0.6, 0.9, 1.4, U.mat(0x2a2d36, { metal: 0.7 })); lamp.position.set(-8, 6, 0);
      const cone = U.mesh(new THREE.ConeGeometry(2.4, 8.7, 32, 1, true), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
      const LS = U.V(-8, 6, 0), TG = U.V(0, 2.5, 0);
      cone.position.copy(LS).lerp(TG, 0.5); cone.quaternion.setFromUnitVectors(U.V(0, -1, 0), TG.clone().sub(LS).normalize());
      lamp.quaternion.copy(cone.quaternion);
      const NPH = 300, NE = 300, phP = U.points(NPH, 0xffffff, 0.2), eP = U.points(NE, 0xf5f7ff, 0.18);
      const phs = Array.from({ length: NPH }, () => ({ s: 2, to: U.V() })), es = Array.from({ length: NE }, () => ({ on: false, p: U.V(), v: U.V() }));
      const lab = U.label('', { color: '#4fd1e8', size: 0.45 }); lab.position.set(0, 5.8, 0);
      const face = U.face(0.9), say = U.pop('', 0.7), ein = U.pop('', 0.6);
      face.position.set(-0.3, 3.3, 0); say.position.set(0, 7, 0); ein.position.set(-8, 7.6, 0);
      root.add(plate, lamp, cone, phP, eP, lab, face, say, ein);
      const ch = chart({ title: '電子最大動能 vs 光的頻率', x: [0, 20], y: [0, 6], xl: 'f (10¹⁴ Hz)', yl: 'K (eV)' });
      let acc = 0, ip = 0, ie = 0;
      return {
        update(dt, P) {
          const [r, g, b] = nmRGB(P.nm), KE = F.photoKE(P.nm, P.phi);
          phP.material.color.setRGB(r, g, b); cone.material.color.setRGB(r, g, b);
          acc += dt * P.I * 8;
          for (; acc >= 1; acc--) { const p = phs[ip++ % NPH]; p.s = 0; p.to.set(-0.2, 2.5 + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4); }
          phs.forEach((p, i) => {
            if (p.s >= 1) { phP.pos[i * 3 + 1] = 1e4; return; }
            p.s += dt * 0.9;
            if (p.s >= 1 && KE > 0) { const e = es[ie++ % NE]; e.on = true; e.p.copy(p.to).setX(-0.25); const sp = Math.sqrt(KE) * 2.2; e.v.set(-(Math.random() * 0.6 + 0.6), Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(sp); }
            const q = U.V().lerpVectors(LS, p.to, Math.min(1, p.s));
            phP.pos[i * 3] = q.x; phP.pos[i * 3 + 1] = q.y; phP.pos[i * 3 + 2] = q.z;
          });
          es.forEach((e, i) => {
            if (e.on) { e.p.addScaledVector(e.v, dt); if (e.p.x < -12) e.on = false; }
            eP.pos[i * 3] = e.p.x; eP.pos[i * 3 + 1] = e.on ? e.p.y : 1e4; eP.pos[i * 3 + 2] = e.p.z;
          });
          phP.flush(); eP.flush();
          face.look().mood(KE > 0 ? 'shock' : 'happy');
          say.set(KE > 0 ? '金屬：電子被打飛了啦！' : P.I > 7 ? '金屬：再亮也沒用～顏色不對！' : '金屬：哼，打不動我～');
          ein.set(KE > 0 ? '愛因斯坦：看吧，光是一顆一顆的！' : '愛因斯坦：換藍一點的光試試？');
          lab.set(KE > 0 ? `電子動能 ${KE.toFixed(2)} eV` : '沒有電子（能量不夠）');
          const f14 = C / (P.nm * 1e-9) / 1e14, f0 = P.phi / HEV / 1e14;
          ch.draw([{ pts: [[f0, 0], [20, HEV * 2e15 - P.phi]], color: '#4fd1e8' }, { pts: [[0, 0], [f0, 0]], color: 'rgba(255,255,255,.3)' }], [{ x: f14, y: Math.max(0, KE), color: KE > 0 ? '#fff' : '#ff6b6b', r: 5 }, { x: f0, y: 0, color: '#f5b544', text: 'f₀' }]);
          out({ '光子能量 hf': (HC_EVNM / P.nm).toFixed(2) + ' eV', '最大動能 K': KE > 0 ? KE.toFixed(2) + ' eV' : '0（不會射出）', '臨界波長 λ₀': Math.round(HC_EVNM / P.phi) + ' nm', '截止電壓': KE > 0 ? KE.toFixed(2) + ' V' : '—' });
        },
      };
    },
  },
  {
    id: 'debroglie', realm: 'quantum', cat: '量子起源', title: '德布羅意物質波', en: 'de Broglie Matter Waves', keys: '物質波 波粒二象性 波耳 bohr',
    tex: ['\\lambda = \\dfrac{h}{p}', '2\\pi r = n\\lambda \\;\\Rightarrow\\; L = n\\hbar'],
    explain: '<p>德布羅意大膽猜測：既然光有粒子性，那電子這種粒子也該有<b>波動性</b>，波長 \\(\\lambda = h/p\\)。後來電子繞射實驗證實了這件事。</p><p>這也解釋了波耳氫原子模型為什麼軌道只能是特定幾個：電子波繞原子核一圈後必須<b>首尾接得起來</b>，形成駐波；繞一圈剛好是整數個波長才行，否則繞幾圈後就自己抵消掉了。</p>',
    watch: ['把「波長數」拉到非整數（例如 3.5）：第二、三圈的波（較淡）和第一圈對不上，會互相抵消。', '剛好是整數時三圈完全重疊，形成穩定的駐波——這就是允許的能階。'],
    params: [{ k: 'N', label: '繞一圈的波長數 n', min: 1, max: 8, step: 0.05, v: 4 }],
    grid: false, cam: [0, 10, 12], target: [0, 0, 0],
    setup({ root, U, P, out }) {
      const R = 4, NP = 400;
      const nuc = U.sphere(0.35, U.mat(0x111111, { emissive: 0xff6b6b }));
      const orbit = U.line(97, 0xffffff, 0.15).set(Array.from({ length: 97 }, (_, i) => U.V(R * Math.cos(i / 96 * 6.2832), 0, R * Math.sin(i / 96 * 6.2832))));
      const laps = [1, 0.45, 0.2].map(o => U.line(NP, 0x4fd1e8, o));
      const pts = vecs(U, NP), e = U.sphere(0.14, U.glow(0xf5f7ff));
      const face = U.face(0.35), say = U.pop('', 0.45); say.position.set(0, 2.4, 0);
      root.add(nuc, orbit, ...laps, e, face, say);
      return {
        update(dt, P, t) {
          const N = P.N, A = 0.7 * Math.cos(t * 3);
          laps.forEach((l, k) => {
            for (let i = 0; i < NP; i++) {
              const ph = i / (NP - 1) * 2 * Math.PI, r = R + A * Math.sin(N * (ph + 2 * Math.PI * k));
              pts[i].set(r * Math.cos(ph), A * 0.4 * Math.sin(N * (ph + 2 * Math.PI * k)), r * Math.sin(ph));
            }
            l.set(pts);
          });
          e.position.set(R * Math.cos(t * 1.2), 0, R * Math.sin(t * 1.2));
          const n = Math.round(N), ok = Math.abs(N - n) < 0.03;
          face.look().mood(ok ? 'happy' : 'dizzy');
          say.set(ok ? '電子：首尾接起來了～穩定！' : '電子：接不起來…我自己把自己抵消掉了');
          out({ '波長 λ = 2πr/n': (2 * Math.PI * R / N).toFixed(2), '首尾接得起來': ok ? '是（駐波）' : '否（會抵消）', '對應能階': ok ? `n = ${n}，E = ${F.hydrogenE(n).toFixed(2)} eV` : '不允許', '角動量 L': ok ? `${n} ħ` : '—' });
        },
      };
    },
  },
  {
    id: 'doubleslit', realm: 'quantum', cat: '波函數', title: '雙狹縫實驗', en: 'Double-Slit Experiment', keys: '干涉 interference 波粒二象性 觀測 測量 塌縮',
    tex: ['P(y) \\propto \\left|\\psi_1(y) + \\psi_2(y)\\right|^2', 'I(\\theta) \\propto \\cos^2\\!\\left(\\dfrac{\\pi d\\sin\\theta}{\\lambda}\\right)\\operatorname{sinc}^2\\!\\left(\\dfrac{\\pi a\\sin\\theta}{\\lambda}\\right)'],
    explain: '<p>費曼說這是「量子力學唯一的謎」。電子<b>一顆一顆</b>射過去，每顆只在螢幕上留下一個點；但累積幾千顆之後，點的分布出現了<b>干涉條紋</b>——好像每顆電子同時穿過兩條縫、自己跟自己干涉。</p><p>如果在縫旁邊放偵測器<b>觀測</b>電子走哪一條縫，條紋立刻消失，變成兩條縫各自的分布加起來。量子世界裡「知道路徑」和「干涉」不能同時存在。</p>',
    watch: ['沒觀測時，每顆粒子在縫前分成兩份、同時穿過兩條縫，到螢幕才合成一個點。', '剛開始只看到亂點，等幾秒條紋才慢慢浮現。', '打開「觀測走哪條縫」再按清空：條紋不見了。', '縫距 d 越大或波長越短，條紋越密。'],
    params: [
      { k: 'd', label: '雙縫間距 d', min: 0.6, max: 3, step: 0.05, v: 1.4 },
      { k: 'lam', label: '物質波波長 λ', min: 0.15, max: 0.6, step: 0.01, v: 0.3 },
      { k: 'rate', label: '每秒粒子數', min: 10, max: 400, step: 10, v: 150 },
      { k: 'watch', label: '觀測走哪條縫', bool: true, v: false },
    ],
    grid: false, cam: [-17, 8, 8], target: [3, -0.5, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const L = 10, A = 0.22, W = 8, MAXH = 6000, NF = 80;
      const src = U.cyl(0.4, 0.4, 1.2, U.mat(0x2a2d36, { metal: 0.7 })); src.rotation.z = Math.PI / 2; src.position.set(-9, 0, 0);
      const wallMat = U.mat(0x30343f, { metal: 0.5, rough: 0.4 }), walls = [U.box(0.2, 5, 1, wallMat), U.box(0.2, 5, 1, wallMat), U.box(0.2, 5, 1, wallMat)];
      const screen = U.box(0.1, 5, 2 * W, U.mat(0x0c0d12, { rough: 0.9 })); screen.position.set(L + 0.1, 0, 0);
      const hits = U.points(MAXH, 0x4fd1e8, 0.07), fly = U.points(NF, 0xffffff, 0.16), fly2 = U.points(NF, 0xffffff, 0.16);
      const dets = [0, 1].map(() => U.mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 24), U.glow(0xf5b544)));
      dets.forEach(d => { d.rotation.y = Math.PI / 2; });
      // 觀測者（JoJo 的空條承太郎）：打開「觀測」才出現
      const jo = new THREE.Group(), coat = U.mat(0x1a1d2a, { rough: 0.7 });
      const jb = U.cyl(0.38, 0.5, 1.9, coat); jb.position.y = 0.95;
      const jh = U.sphere(0.36, U.mat(0xf1d2b3, { rough: 0.6 })); jh.position.y = 2.2;
      const jf = U.face(0.36); jf.position.y = 2.2;
      const cap = U.cyl(0.38, 0.38, 0.3, coat); cap.position.y = 2.48;
      const brim = U.cyl(0.5, 0.5, 0.04, coat); brim.position.set(0, 2.36, 0.12);
      const chain = U.box(0.04, 0.8, 0.04, U.mat(0xf2c230, { metal: 0.8 })); chain.position.set(0.3, 1.4, 0.36);
      jo.add(jb, jh, jf, cap, brim, chain); jo.position.set(-2.2, -2.5, 2.8);
      const joName = U.label('空條承太郎（觀測者）', { size: 0.45, color: '#c58bff' }), joSay = U.pop('', 0.55), menacing = U.label('ゴ ゴ ゴ ゴ', { size: 0.6, color: '#c58bff' });
      joName.position.set(-2.2, 0.55, 2.8); joSay.position.set(-2.2, 1.25, 2.8); menacing.position.set(2, 3.2, -3);
      const eSay = U.pop('', 0.5); eSay.position.set(-9, 1.4, 0);
      root.add(src, ...walls, screen, hits, fly, fly2, ...dets, jo, joName, joSay, menacing, eSay);
      const ch = chart({ title: '螢幕上的分布：累積（點）vs 理論（線）', x: [-W, W], y: [0, 1.15], xl: '螢幕位置', yl: '' });
      const bins = new Float32Array(64);
      let nh = 0, acc = 0, fl = Array.from({ length: NF }, () => ({ s: 2, z: 0, slit: 0 }));
      const clear = () => { nh = 0; bins.fill(0); hits.flush(0); };
      const layout = () => {
        const d = P.d, w2 = d / 2 - A / 2;
        walls[0].scale.z = W - d / 2 - A / 2; walls[0].position.set(0, 0, (d / 2 + A / 2 + W) / 2);
        walls[1].scale.z = walls[0].scale.z; walls[1].position.set(0, 0, -walls[0].position.z);
        walls[2].scale.z = Math.max(0.01, 2 * w2); walls[2].position.set(0, 0, 0);
        dets[0].position.set(0.3, 0, d / 2); dets[1].position.set(0.3, 0, -d / 2);
      };
      const sampleZ = () => { for (;;) { const z = (Math.random() * 2 - 1) * W, s = z / Math.hypot(z, L); if (Math.random() < F.slitI(s, P.d, A, P.lam, P.watch)) return z; } };
      layout();
      return {
        actions: { '清空螢幕': clear },
        onParam(k) { if (k === 'd') layout(); if (k !== 'rate') clear(); },
        update(dt, P, t) {
          dets.forEach(d => { d.visible = P.watch; d.material.color.set(0xf5b544); });
          jo.visible = joName.visible = joSay.visible = menacing.visible = P.watch;
          jf.look();
          joSay.set(cycle(['やれやれだぜ…', '被我看著，你只能走一條縫。', '條紋？已經沒了。'], t, 3));
          eSay.set(P.watch ? '電子：被盯上了…只好乖乖走一條縫' : nh < 300 ? '電子：沒人在看～我兩條縫一起走！' : '電子：看吧，條紋出來了～');
          acc += dt * P.rate;
          for (; acc >= 1; acc--) { const f = fl.find(f => f.s >= 2); if (!f) break; f.s = 0; f.z = sampleZ(); f.slit = Math.random() < 0.5 ? 1 : -1; f.y = (Math.random() - 0.5) * 4.6; }
          fl.forEach((f, i) => {
            if (f.s >= 2) { fly.pos[i * 3 + 1] = fly2.pos[i * 3 + 1] = 1e4; return; }
            f.s += dt * 4;
            if (f.s >= 2) {
              if (nh < MAXH) { hits.pos.set([L, f.y, f.z], nh * 3); nh++; hits.flush(nh); }
              bins[Math.min(63, Math.floor((f.z + W) / (2 * W) * 64))]++;
              return;
            }
            // 沒觀測：分成兩份同時穿過兩條縫，到螢幕再合成一個點；有觀測：只走被看到的那條縫（fly2 藏起來）
            const zs = P.watch ? f.slit * P.d / 2 : P.d / 2;
            const put = (pt, z0) => {
              if (f.s < 1) { pt.pos[i * 3] = -9 + 9 * f.s; pt.pos[i * 3 + 1] = f.y * f.s * 0.1; pt.pos[i * 3 + 2] = z0 * f.s; }
              else { const u = f.s - 1; pt.pos[i * 3] = L * u; pt.pos[i * 3 + 1] = U.lerp(f.y * 0.1, f.y, u); pt.pos[i * 3 + 2] = U.lerp(z0, f.z, u); }
            };
            put(fly, zs);
            if (P.watch) fly2.pos[i * 3 + 1] = 1e4; else put(fly2, -zs);
            if (P.watch && f.s >= 1 && f.s < 1.1) dets[f.slit > 0 ? 0 : 1].material.color.set(0xffffff);
          });
          fly.flush(); fly2.flush();
          const mx = Math.max(1, ...bins);
          const xs = Array.from({ length: 161 }, (_, i) => -W + i * W / 80);
          ch.draw([
            { pts: Array.from(bins, (b, i) => [-W + (i + 0.5) * 2 * W / 64, b / mx]), color: 'rgba(79,209,232,.55)', w: 1.5, fill: 'rgba(79,209,232,.12)' },
            { pts: xs.map(z => [z, F.slitI(z / Math.hypot(z, L), P.d, A, P.lam, P.watch)]), color: '#fff', w: 1.2 },
          ]);
          out({ '已打到螢幕': nh + ' 顆', '條紋間距 ≈ Lλ/d': (L * P.lam / P.d).toFixed(2), '有沒有干涉': P.watch ? '沒有（知道路徑）' : '有' });
        },
      };
    },
  },
  {
    id: 'uncertainty', realm: 'quantum', cat: '波函數', title: '海森堡不確定性原理', en: 'Heisenberg Uncertainty Principle', keys: '測不準 uncertainty 波包 wave packet',
    tex: ['\\Delta x\\,\\Delta p \\ge \\dfrac{\\hbar}{2}', '\\psi(x,0) \\propto e^{-x^2/4\\sigma^2}\\,e^{ik_0x}'],
    explain: '<p>粒子的位置和動量<b>沒辦法同時很確定</b>。這不是儀器不夠好，而是波的本質：要把波擠在很小的範圍內（位置確定），就得疊加很多不同波長（動量不確定）。</p><p>3D 螺旋是波函數 \\(\\psi(x)\\)（上下是實部、前後是虛部），白線是機率密度 \\(|\\psi|^2\\)。後方紫色的是同一個粒子在<b>動量空間</b>的分布。高斯波包剛好讓乘積達到最小值 \\(\\hbar/2\\)。</p><p>打開「自由演化」：沒有外力的波包會越攤越開，\\(\\Delta x\\) 長大但 \\(\\Delta p\\) 不變，乘積就大於 \\(\\hbar/2\\)。</p>',
    watch: ['把起始寬度 σ 調小：前面的波包變窄，後面的動量分布變寬。', '自由演化時，越窄的波包攤開得越快。', '左下的點永遠在雙曲線 Δx·Δp = ħ/2 上或上方。'],
    params: [
      { k: 's', label: '起始寬度 σ', min: 0.4, max: 3, step: 0.05, v: 1 },
      { k: 'k0', label: '平均動量 k₀', min: 0, max: 3, step: 0.05, v: 1.5 },
      { k: 'free', label: '自由演化（會攤開）', bool: true, v: true },
    ],
    grid: false, cam: [-4, 8, 22], target: [0, 1, -1.5],
    setup({ THREE, root, U, P, out, chart }) {
      const NP = 400, X = 12, SX = 0.75;
      const axis = U.line(2, 0xffffff, 0.25).set([U.V(-X * SX, 0, 0), U.V(X * SX, 0, 0)]);
      const pax = U.line(2, 0xffffff, 0.25).set([U.V(-X * SX, 0, -4), U.V(X * SX, 0, -4)]);
      const helix = U.line(NP, 0x4fd1e8), dens = U.line(NP, 0xf5f7ff), mom = U.line(NP, 0xa78bfa);
      const l1 = U.label('位置空間 ψ(x)', { color: '#4fd1e8', size: 0.4 }), l2 = U.label('動量空間 |φ(p)|²', { color: '#a78bfa', size: 0.4 });
      l1.position.set(-X * SX + 1.6, 3.4, 0); l2.position.set(-X * SX + 1.8, 2.6, -4);
      const A = vecs(U, NP), B = vecs(U, NP), M = vecs(U, NP);
      // 海森堡開車：車子跟著波包中心走
      const car = new THREE.Group(), cb = U.box(1.2, 0.45, 0.7, U.mat(0xd9534f, { metal: 0.3 })), ct = U.box(0.6, 0.35, 0.6, U.mat(0x9fd8ff, { opacity: 0.6 }));
      ct.position.set(-0.1, 0.38, 0); car.add(cb, ct);
      for (const [wx, wz] of [[-0.4, 0.36], [0.4, 0.36], [-0.4, -0.36], [0.4, -0.36]]) { const w = U.cyl(0.16, 0.16, 0.1, U.mat(0x111111)); w.rotation.x = Math.PI / 2; w.position.set(wx, -0.22, wz); car.add(w); }
      const cop = U.pop('警察：先生，你知道你剛剛開多快嗎？', 0.62), hei = U.pop('', 0.62); car.scale.setScalar(1.6);
      root.add(axis, pax, helix, dens, mom, l1, l2, car, cop, hei);
      const ch = chart({ title: 'Δx · Δp（曲線是下限 ħ/2）', x: [0, 6], y: [0, 1.4], xl: 'Δx', yl: 'Δp' });
      let tt = 0;
      return {
        onParam() { tt = 0; },
        update(dt, P) {
          const s = P.s, k0 = P.k0;
          if (P.free) tt += dt * 1.5; else tt = 0;
          if (Math.abs(k0 * tt) > X - 3 || F.sigmaX(s, tt) > 5) tt = 0;
          // ψ(x,t) = N a^{-1/2} exp(−(x−k0t)²/(4σ²a) + i k0 (x − k0 t/2))，a = 1 + i t/(2σ²)
          const ai = tt / (2 * s * s), am2 = 1 + ai * ai, N = (2 * Math.PI * s * s) ** -0.25 * am2 ** -0.25, argh = -Math.atan(ai) / 2;
          for (let i = 0; i < NP; i++) {
            const x = -X + 2 * X * i / (NP - 1), u = x - k0 * tt, q = -u * u / (4 * s * s);
            const re = q / am2, im = -q * ai / am2, ph = im + k0 * (x - k0 * tt / 2) + argh, mag = N * Math.exp(re);
            A[i].set(x * SX, 1.4 + mag * Math.cos(ph) * 2.2, mag * Math.sin(ph) * 2.2);
            B[i].set(x * SX, mag * mag * 5, 0);
            const p = -6 + 12 * i / (NP - 1), sp = F.sigmaP(s);
            M[i].set(x * SX, Math.exp(-((p - k0) ** 2) / (2 * sp * sp)) / Math.sqrt(2 * Math.PI * sp * sp) * 2.2, -4);
          }
          helix.set(A); dens.set(B); mom.set(M);
          const dx = F.sigmaX(s, tt), dp = F.sigmaP(s);
          car.position.set(k0 * tt * SX, 4.6, 0);
          cop.position.set(-3, 7.4, 0); hei.position.set(-3, 6.5, 0);
          hei.set(dx < 1 ? '海森堡：不知道，但我很清楚我在哪裡！' : dx > 1.8 ? '海森堡：速度我很清楚，但我在哪…不知道' : '海森堡：大概知道在哪、大概知道多快…');
          ch.draw([{ pts: Array.from({ length: 60 }, (_, i) => { const x = 0.3 + i * 0.1; return [x, 0.5 / x]; }), color: 'rgba(255,255,255,.4)', dash: [4, 4], w: 1.2 }], [{ x: dx, y: dp, color: '#4fd1e8', r: 5 }]);
          out({ 'Δx': dx.toFixed(3), 'Δp': dp.toFixed(3), 'Δx·Δp': (dx * dp).toFixed(3) + ' ħ', '下限 ħ/2': '0.500 ħ' });
        },
      };
    },
  },
  {
    id: 'infinitewell', realm: 'quantum', cat: '波函數', title: '無限位能井（盒中粒子）', en: 'Particle in a Box · Schrödinger Equation', keys: '薛丁格 schrodinger 能階 量子化 位能井',
    tex: ['-\\dfrac{\\hbar^2}{2m}\\dfrac{d^2\\psi}{dx^2} = E\\psi', 'E_n = \\dfrac{n^2\\pi^2\\hbar^2}{2mL^2},\\quad \\psi_n = \\sqrt{\\tfrac{2}{L}}\\sin\\dfrac{n\\pi x}{L}'],
    explain: '<p>把粒子關在兩面無限高的牆之間，解<b>薛丁格方程</b>：波函數在牆上必須是 0，所以只能是「兩端固定的弦」那種駐波，盒子裡剛好裝半個、一個、一個半…波長。</p><p>能量因此只能是特定值 \\(E_n \\propto n^2\\)——這就是<b>能量量子化</b>。最低能量 \\(E_1\\) 也不是 0：粒子永遠不會完全靜止（零點能）。</p><p>螺旋是 \\(\\psi\\) 隨時間轉動的相位；單一能階的 \\(|\\psi|^2\\)（白線）不隨時間改變，所以叫<b>定態</b>。</p>',
    watch: ['能階間距越往上越大（1、4、9、16…）。', '第 n 個能階有 n−1 個節點，那裡永遠找不到粒子。', '打開「疊加兩個能階」：白色的機率分布開始左右晃動，晃動頻率 = 能量差 / h。'],
    params: [
      { k: 'n', label: '能階 n', min: 1, max: 6, step: 1, v: 2 },
      { k: 'sup', label: '疊加兩個能階', bool: true, v: false },
    ],
    grid: false, cam: [-3, 5, 17], target: [0, 3, 0],
    setup(ctx) {
      const { root, U } = ctx, L = 8, h = 0.17;
      const walls = [-1, 1].map(s => { const w = U.box(0.25, 7, 2.4, U.mat(0x4fd1e8, { opacity: 0.18 })); w.position.set(s * (L / 2 + 0.125), 3.3, 0); return w; });
      const say = U.pop('', 0.6); say.position.set(0, 7.6, 0);
      root.add(...walls, say);
      const sc = levelScene(ctx, {
        x0: -L / 2 - 0.4, x1: L / 2 + 0.4, sx: 1, top: 6.8, vy: x => Math.abs(x) > L / 2 ? 6.8 : 0,
        n0: 1, nmax: 6, Y: n => h * n * n, E: n => n * n, w: 1.6, amp: 1.1, damp: 2.2,
        span: () => [-L / 2, L / 2],
        psi: (n, x) => F.wellPsi(n, L, x + L / 2),
        readout: (n, m, sup) => ({ '能量 Eₙ': `${n * n} E₁`, '節點數': n - 1, '波長 2L/n': (2 * L / n).toFixed(2), '晃動週期': sup ? `h / ${Math.abs(n * n - m * m)}E₁` : '—（定態）' }),
      });
      return {
        update(dt, P, t) {
          sc.update(dt, P, t);
          say.set(P.sup ? '粒子：兩層一起來，晃來晃去～' : P.n === 1 ? '粒子：放我出去！最低能量也停不下來（零點能）' : `粒子：第 ${P.n} 層，有 ${P.n - 1} 個地方我絕對不會出現`);
        },
      };
    },
  },
  {
    id: 'tunneling', realm: 'quantum', cat: '波函數', title: '量子穿隧', en: 'Quantum Tunneling', keys: '穿隧 tunneling 位障 barrier',
    tex: ['T \\approx e^{-2\\kappa a},\\quad \\kappa = \\dfrac{\\sqrt{2m(V_0-E)}}{\\hbar}', 'i\\hbar\\dfrac{\\partial\\psi}{\\partial t} = \\left[-\\dfrac{\\hbar^2}{2m}\\dfrac{\\partial^2}{\\partial x^2} + V(x)\\right]\\psi'],
    explain: '<p>古典粒子能量不夠就翻不過山；量子粒子的波函數在牆裡面只是<b>指數衰減</b>、不會立刻變 0，牆夠薄的話還剩一點點穿到另一邊——粒子就有機率「穿牆」。</p><p>這裡是真的一步一步數值解薛丁格方程。穿透率對牆的厚度非常敏感（指數關係），這是太陽核融合、α 衰變、隧道二極體、掃描穿隧顯微鏡的原理。</p>',
    watch: ['牆變厚一點點，穿過去的部分就少很多。', '能量比牆高時也會有反射——古典粒子不會。', '「實際穿過」是數值模擬量到的，會和公式算的很接近。'],
    params: [
      { k: 'E', label: '粒子能量 E', min: 0.4, max: 3, step: 0.05, v: 1 },
      { k: 'V0', label: '牆的高度 V₀', min: 0.5, max: 4, step: 0.05, v: 1.6 },
      { k: 'a', label: '牆的厚度 a', min: 0.2, max: 3, step: 0.05, v: 0.8 },
    ],
    grid: false, cam: [-2, 6, 20], target: [0, 1.5, 0],
    setup({ root, U, P, out }) {
      const N = 1000, X = 50, dx = 2 * X / N, DT = 0.004, SX = 0.24, NP = 500;
      const R = new Float64Array(N), I = new Float64Array(N), V = new Float64Array(N);
      const barrier = U.box(1, 1, 2.4, U.mat(0xa78bfa, { opacity: 0.35, emissive: 0xa78bfa, ei: 0.15 }));
      const eLine = U.line(2, 0xf5b544, 0.7, true), helix = U.line(NP, 0x4fd1e8), dens = U.line(NP, 0xf5f7ff);
      const axis = U.line(2, 0xffffff, 0.2).set([U.V(-X * SX * 0.6, 0, 0), U.V(X * SX * 0.6, 0, 0)]);
      const A = vecs(U, NP), B = vecs(U, NP);
      const cats = [0xf0a050, 0xf0a050].map(c => U.cat(0.42, c)), catL = cats.map(() => U.label('', { size: 0.45 }));
      const wface = U.face(0.4), say = U.pop('', 0.6); say.position.set(0, 6.4, 0);
      root.add(barrier, eLine, helix, dens, axis, ...cats, ...catL, wface, say);
      const YS = 1.2;
      let tt, done;
      const reset = () => {
        const k0 = Math.sqrt(2 * P.E), s = 4, x0 = -18;
        for (let i = 0; i < N; i++) {
          const x = -X + i * dx, g = Math.exp(-((x - x0) ** 2) / (4 * s * s)) * (2 * Math.PI * s * s) ** -0.25;
          R[i] = g * Math.cos(k0 * x); I[i] = g * Math.sin(k0 * x);
          V[i] = x >= 0 && x <= P.a ? P.V0 : 0;
        }
        R[0] = R[N - 1] = I[0] = I[N - 1] = 0;
        tt = 0; done = 0;
      };
      reset();
      // Visscher 交錯法：R += dt·H·I，I −= dt·H·R
      const step = () => {
        const c = 0.5 / (dx * dx);
        for (let i = 1; i < N - 1; i++) R[i] += DT * (-c * (I[i + 1] - 2 * I[i] + I[i - 1]) + V[i] * I[i]);
        for (let i = 1; i < N - 1; i++) I[i] -= DT * (-c * (R[i + 1] - 2 * R[i] + R[i - 1]) + V[i] * R[i]);
      };
      return {
        actions: { '再發射一次': reset },
        onParam: reset,
        update(dt, P) {
          const k0 = Math.sqrt(2 * P.E), tEnd = 34 / k0;
          if (tt < tEnd) { const n = Math.round(dt * 2.4 / DT); for (let j = 0; j < n; j++) step(); tt += n * DT; }
          else if ((done += dt) > 2) reset();
          barrier.scale.set(P.a * SX, P.V0 * YS, 1); barrier.position.set(P.a * SX / 2, P.V0 * YS / 2, 0);
          eLine.set([U.V(-X * SX * 0.6, P.E * YS, 0), U.V(X * SX * 0.6, P.E * YS, 0)]);
          let tot = 0, tr = 0, xl = 0, xr = 0;
          for (let i = 0; i < N; i++) { const p = R[i] * R[i] + I[i] * I[i], x = -X + i * dx; tot += p; if (x > P.a) { tr += p; xr += p * x; } else xl += p * x; }
          // 貓放在左右兩邊機率的重心，透明度＝那邊的機率
          const pT = tr / tot, sides = [[xl / Math.max(1e-12, tot - tr), 1 - pT], [xr / Math.max(1e-12, tr), pT]];
          cats.forEach((c, j) => {
            const [xc, pr] = sides[j], on = pr > 0.005;
            c.visible = catL[j].visible = on;
            c.position.set(U.clamp(xc, -X * 0.6, X * 0.6) * SX, P.E * YS + 1.3, 0); c.f.look().mood(j ? 'happy' : tt > 8 / k0 ? 'ouch' : 'happy');
            fade(c, 0.15 + 0.85 * pr);
            catL[j].position.set(c.position.x, c.position.y + 0.9, 0); catL[j].set(`${j ? '穿牆的貓' : tt > 8 / k0 ? '反彈的貓' : '貓'} ${(pr * 100).toFixed(1)}%`);
          });
          const late = tt > tEnd * 0.5, tunnel = P.E < P.V0 && pT > 0.005;
          wface.position.set(P.a * SX / 2, P.V0 * YS + 0.6, 0); wface.look().mood(late && tunnel ? 'shock' : 'happy');
          say.set(!late ? '薛丁格的貓：衝啊——！' : tunnel ? '牆：不可能！我明明比你高！？　貓：我同時撞牆又穿牆了～' : P.E >= P.V0 && pT < 0.995 ? '貓：比牆高還被彈回來一點？量子就是這樣～' : P.E < P.V0 ? '貓：牆太厚了…穿不過去（機率太小）' : '貓：輕鬆通過～');
          const off = (N - NP * 1.2) / 2 | 0;
          for (let j = 0; j < NP; j++) {
            const i = off + Math.round(j * 1.2), x = -X + i * dx;
            A[j].set(x * SX, P.E * YS + R[i] * 3, I[i] * 3);
            B[j].set(x * SX, (R[i] * R[i] + I[i] * I[i]) * 14, 0);
          }
          helix.set(A); dens.set(B);
          const T = F.barrierT(P.E, P.V0, P.a);
          out({ '公式穿透率 T': (T * 100).toFixed(1) + '%', '實際穿過（模擬）': (tr / tot * 100).toFixed(1) + '%', '古典預測': P.E >= P.V0 ? '100% 通過' : '0%（翻不過）', 'E / V₀': (P.E / P.V0).toFixed(2) });
        },
      };
    },
  },
  {
    id: 'qho', realm: 'quantum', cat: '波函數', title: '量子諧振子', en: 'Quantum Harmonic Oscillator', keys: '諧振子 harmonic oscillator 厄米 hermite 零點能',
    tex: ['E_n = \\left(n + \\tfrac12\\right)\\hbar\\omega', '\\psi_n(x) \\propto H_n\\!\\left(x\\right) e^{-x^2/2}'],
    explain: '<p>把彈簧（拋物線位能 \\(V = \\tfrac12 m\\omega^2 x^2\\)）丟進量子力學：能階<b>等間距</b>，每格 \\(\\hbar\\omega\\)，而且最低能量是 \\(\\tfrac12\\hbar\\omega\\) 不是 0。</p><p>分子振動、晶格振動（聲子）、甚至光場本身（光子）都是量子諧振子，所以它是量子場論的基本零件。</p><p>白線兩端的小點是古典粒子的折返點；量子的波函數會<b>稍微滲出</b>拋物線外，那裡古典上是禁區。</p>',
    watch: ['能階間距完全一樣，跟無限位能井的 n² 不同。', 'n 越大，機率分布越像古典：兩端（跑最慢的地方）機率最高。', '「疊加相鄰能階」會讓機率團像擺錘一樣來回擺動。'],
    params: [
      { k: 'n', label: '能階 n', min: 0, max: 8, step: 1, v: 3 },
      { k: 'sup', label: '疊加相鄰能階', bool: true, v: false },
    ],
    grid: false, cam: [-3, 5, 18], target: [0, 3.2, 0],
    setup(ctx) {
      const { root, U, P } = ctx, h = 0.7, SX = 1.25;
      const tp = [-1, 1].map(() => U.sphere(0.08, U.glow(0xf5b544)));
      const say = U.pop('', 0.6); say.position.set(0, 7.8, 0);
      root.add(...tp, say);
      const sc = levelScene(ctx, {
        x0: -4.4, x1: 4.4, sx: SX, top: 7, vy: x => h * x * x / 2,
        n0: 0, nmax: 8, Y: n => h * (n + 0.5), E: n => n + 0.5, w: 2, amp: 1.2, damp: 2.4,
        span: n => { const r = Math.sqrt(2 * n + 1) + 1.6; return [-Math.min(4.4, r), Math.min(4.4, r)]; },
        psi: F.qhoPsi,
        readout: (n, m, sup) => ({ '能量 Eₙ': `${(n + 0.5).toFixed(1)} ħω`, '節點數': n, '古典折返點': '±' + Math.sqrt(2 * n + 1).toFixed(2), '狀態': sup ? `n=${n} 與 n=${m} 疊加` : '定態' }),
      });
      return {
        update(dt, P, t) {
          sc.update(dt, P, t);
          const r = Math.sqrt(2 * P.n + 1);
          tp.forEach((s, i) => s.position.set((i ? r : -r) * SX, h * (P.n + 0.5), 0));
          tp.forEach(s => (s.visible = !P.sup));
          say.set(P.sup ? '量子彈簧：盪來盪去～像古典的擺' : P.n === 0 ? '量子彈簧：降到最低也還在抖（零點能 ½ħω）' : '量子彈簧：我有偷偷滲出拋物線外喔');
        },
      };
    },
  },
  {
    id: 'hydrogen', realm: 'quantum', cat: '波函數', title: '氫原子軌域', en: 'Hydrogen Atom Orbitals', keys: '電子雲 orbital 軌域 量子數 s p d f',
    tex: ['\\psi_{n\\ell m}(r,\\theta,\\phi) = R_{n\\ell}(r)\\,Y_\\ell^m(\\theta,\\phi)', 'E_n = -\\dfrac{13.6\\ \\text{eV}}{n^2}'],
    explain: '<p>氫原子的薛丁格方程可以精確解出來。電子不是在軌道上繞，而是一團<b>機率雲</b>：每個點是依照 \\(|\\psi|^2\\) 隨機抽出來的「可能在這裡找到電子」的位置。</p><p>三個量子數決定形狀：主量子數 \\(n\\) 決定能量與大小，角量子數 \\(\\ell\\) 決定形狀（s、p、d、f），磁量子數 \\(m\\) 決定方向。青色和洋紅色代表波函數的正負號，化學鍵就是靠這些瓣重疊形成的。</p>',
    watch: ['s 軌域（ℓ=0）是球形，p 是啞鈴，d 是四葉草。', '徑向節點有 n−ℓ−1 個（球殼狀的空隙），角節點有 ℓ 個（平面或錐面）。', 'ℓ 會自動限制在 0…n−1，m 在 −ℓ…ℓ。'],
    params: [
      { k: 'n', label: '主量子數 n', min: 1, max: 4, step: 1, v: 3 },
      { k: 'l', label: '角量子數 ℓ', min: 0, max: 3, step: 1, v: 2 },
      { k: 'm', label: '磁量子數 m', min: -3, max: 3, step: 1, v: 0 },
    ],
    grid: false, cam: [7, 5, 9], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const NPT = 4500, cloud = U.points(NPT, 0xffffff, 0.09, true);
      const nuc = U.sphere(0.07, U.glow(0xff6b6b));
      const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(d => U.line(2, 0xffffff, 0.15).set([U.V(...d).multiplyScalar(-5), U.V(...d).multiplyScalar(5)]));
      const g = new THREE.Group(); g.add(cloud, nuc, ...axes);
      const say = U.pop('', 0.42); say.position.set(0, 4.6, 0);
      root.add(g, say);
      const POS = [0.31, 0.82, 0.91], NEG = [0.93, 0.36, 0.8];
      let q = {};
      const NAMES = { 1: { 0: 'z', 1: 'x', '-1': 'y' }, 2: { 0: 'z²', 1: 'xz', '-1': 'yz', 2: 'x²−y²', '-2': 'xy' }, 3: { 0: 'z³', 1: 'xz²', '-1': 'yz²', 2: 'z(x²−y²)', '-2': 'xyz', 3: 'x(x²−3y²)', '-3': 'y(3x²−y²)' } };
      const gen = () => {
        const n = P.n, l = Math.min(P.l, n - 1), m = Math.max(-l, Math.min(l, P.m));
        q = { n, l, m };
        // 徑向：照 r²R² 建累積分布，反查抽樣
        const RM = 4 * n * n + 10, K = 1500, cdf = new Float64Array(K);
        let s = 0;
        for (let i = 0; i < K; i++) { const r = (i + 0.5) * RM / K, R = F.hydrogenR(n, l, r); s += r * r * R * R; cdf[i] = s; }
        // 角度：拒絕抽樣
        let ymax = 0;
        for (let i = 0; i <= 60; i++) for (let j = 0; j < 60; j++) ymax = Math.max(ymax, F.realY(l, m, -1 + i / 30, j / 60 * 2 * Math.PI) ** 2);
        const sc = 3.4 / (1.6 * n * n + 2.4);
        for (let k = 0; k < NPT; k++) {
          const u = Math.random() * s; let lo = 0, hi = K - 1;
          while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid + 1; else hi = mid; }
          const r = (lo + Math.random()) * RM / K;
          let ct, ph, y;
          do { ct = Math.random() * 2 - 1; ph = Math.random() * 2 * Math.PI; y = F.realY(l, m, ct, ph); } while (Math.random() * ymax * 1.05 > y * y);
          const st = Math.sqrt(1 - ct * ct), sign = Math.sign(F.hydrogenR(n, l, r) * y) || 1;
          // 物理的 z 軸 → three.js 的 y（朝上）
          cloud.pos.set([r * st * Math.cos(ph) * sc, r * ct * sc, -r * st * Math.sin(ph) * sc], k * 3);
          cloud.col.set(sign > 0 ? POS : NEG, k * 3);
        }
        cloud.flush();
      };
      gen();
      return {
        onParam: gen,
        update(dt) {
          g.rotation.y += dt * 0.15;
          const { n, l, m } = q, sub = 'spdf'[l] + (l ? NAMES[l][m] : '');
          say.set('電子：問我在哪？' + ['我是一顆球～', '我是啞鈴！', '我是四葉草！', '我形狀太複雜了…'][l]);
          out({ '軌域': `${n}${sub}`, '量子數 (n, ℓ, m)': `(${n}, ${l}, ${m})`, '能量 Eₙ': F.hydrogenE(n).toFixed(2) + ' eV', '節點': `徑向 ${n - l - 1}、角 ${l}` });
        },
      };
    },
  },
  {
    id: 'sterngerlach', realm: 'quantum', cat: '量子態', title: '自旋與斯特恩–格拉赫實驗', en: 'Spin · Stern–Gerlach Experiment', keys: '自旋 spin 量子測量 sg',
    tex: ['S_z = \\pm\\dfrac{\\hbar}{2}', 'P(\\uparrow_{\\hat n}) = \\cos^2\\dfrac{\\theta}{2}'],
    explain: '<p>銀原子穿過不均勻磁場會被推上或推下，推多少取決於它的磁矩方向。古典預期磁矩方向亂七八糟，螢幕上應該是<b>一整條</b>；實驗卻只看到<b>上下兩個點</b>——自旋只有兩種值，這是量子化最直接的證據。</p><p>串聯更怪：先選出「z 向上」，再量 z 一定還是向上；但中間插一個量 x 的裝置，最後再量 z 又變回一半一半。<b>測量會改變狀態</b>，x 和 z 的資訊不能同時保留。</p>',
    watch: ['打開「古典預期」：螢幕變成一條連續的帶子。', '選「z → z」：第二台只剩向上一個點。', '選「z → x → z」：被擋掉一半之後，最後又分成上下兩半。'],
    params: [
      { k: 'mode', label: '裝置', options: [['z', '單一 SG-z'], ['zz', 'z → z'], ['zxz', 'z → x → z']], v: 'z' },
      { k: 'classic', label: '古典預期（連續分布）', bool: true, v: false },
    ],
    grid: false, cam: [-15, 7, 11], target: [2, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const SCR = 11, V = 9, BLK = 1.6, DEF = 0.55, MAXH = 3000, NF = 300;
      const oven = U.box(1.2, 1.2, 1.2, U.mat(0x3a2a1a, { emissive: 0xff7a30, ei: 0.25 })); oven.position.set(-10, 0, 0);
      const screen = U.box(0.1, 6, 6, U.mat(0x1c2030, { rough: 0.9 })); screen.position.set(SCR + 0.1, 0, 0);
      const hits = U.points(MAXH, 0xf5f7ff, 0.15, true), fly = U.points(NF, 0xffffff, 0.12);
      const of = U.face(0.6), say = U.pop('', 0.65); of.position.set(-10, 0, 0.1); say.position.set(-2, 4.2, 0);
      root.add(oven, screen, hits, fly, of, say);
      const stageG = new THREE.Group(); root.add(stageG);
      const AX = { z: 0, x: 90 };
      let st = [], nh = 0, up = 0, dn = 0, acc = 0;
      const fl = Array.from({ length: NF }, () => ({ on: false }));
      const build = () => {
        stageG.children.slice().forEach(c => { stageG.remove(c); c.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); }); });
        const axes = [...P.mode].map(c => AX[c]), xs = axes.map((_, i) => axes.length === 1 ? -3 : -5 + i * 10 / (axes.length - 1) * 0.9);
        let off = U.V();
        st = axes.map((deg, i) => {
          const dir = U.V(0, Math.cos(deg * D), Math.sin(deg * D)), g = new THREE.Group();
          const N = U.box(2, 0.6, 1.4, U.mat(0xd9534f, { metal: 0.4 })), S = U.box(2, 0.4, 1.8, U.mat(0x3f6fd9, { metal: 0.4 }));
          N.position.y = 0.9; S.position.y = -0.95;
          const lab = U.label(deg ? 'SG-x' : 'SG-z', { color: '#4fd1e8', size: 0.38 }); lab.position.y = 1.8;
          g.add(N, S, lab); g.rotation.x = deg * D; g.position.set(xs[i], off.y, off.z);
          stageG.add(g);
          const s = { x: xs[i], dir, base: off.clone() };
          if (i < axes.length - 1) {
            const blk = U.box(0.1, 0.9, 0.9, U.mat(0x555a66)); blk.position.copy(off).addScaledVector(dir, -DEF).setX(xs[i] + BLK); stageG.add(blk);
            off = off.clone().addScaledVector(dir, DEF);
          }
          return s;
        });
        nh = up = dn = 0; hits.flush(0);
      };
      build();
      const randDir = () => U.V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      return {
        onParam: build,
        update(dt, P) {
          acc += dt * 60;
          for (; acc >= 1; acc--) { const f = fl.find(f => !f.on); if (!f) break; Object.assign(f, { on: true, x: -9.4, o: U.V(), v: U.V(), n: randDir(), k: 0, sign: 0 }); }
          fl.forEach((f, i) => {
            if (!f.on) { fly.pos[i * 3 + 1] = 1e4; return; }
            const nx = f.x + V * dt, s = st[f.k];
            if (s && f.x < s.x && nx >= s.x) {
              // 測量：量子是 ±1，機率 (1 + n·a)/2；古典是連續的 n·a
              const c = f.n.dot(s.dir);
              f.sign = P.classic ? c : (Math.random() < (1 + c) / 2 ? 1 : -1);
              if (!P.classic) f.n.copy(s.dir).multiplyScalar(Math.sign(f.sign));
              // 中間幾台：走到擋板時剛好偏 DEF；最後一台：到螢幕時偏 1.6
              f.v.copy(s.dir).multiplyScalar(f.sign * V * (f.k < st.length - 1 ? DEF / BLK : 1.6 / (SCR - s.x)));
            }
            if (s && f.k < st.length - 1 && f.x < s.x + BLK && nx >= s.x + BLK) {
              if (f.sign < 0) { f.on = false; return; }
              f.o.copy(st[f.k + 1].base); f.v.set(0, 0, 0); f.k++;
            }
            f.x = nx; f.o.addScaledVector(f.v, dt);
            if (f.x >= SCR) {
              f.on = false;
              if (nh < MAXH) { hits.pos.set([SCR, f.o.y + (Math.random() - 0.5) * 0.12, f.o.z + (Math.random() - 0.5) * 0.12], nh * 3); hits.col.set(f.sign > 0 ? [0.96, 0.71, 0.27] : [0.31, 0.82, 0.91], nh * 3); nh++; hits.flush(nh); }
              f.sign > 0 ? up++ : dn++;
              return;
            }
            fly.pos[i * 3] = f.x; fly.pos[i * 3 + 1] = f.o.y; fly.pos[i * 3 + 2] = f.o.z;
          });
          fly.flush();
          of.look();
          say.set(P.classic ? '古典物理：應該是一整條帶子吧？' : { z: '銀原子：只能選上或下，沒有中間！', zz: '銀原子：已經是上了，再量還是上～', zxz: '銀原子：量了 x 就忘了 z，又變回一半一半！' }[P.mode]);
          const tot = up + dn || 1;
          const theory = { z: '50% / 50%', zz: '100% / 0%', zxz: '50% / 50%' }[P.mode];
          out({ '最後量到 ↑': (up / tot * 100).toFixed(1) + '%', '最後量到 ↓': (dn / tot * 100).toFixed(1) + '%', '量子理論': P.classic ? '（古典模式）' : theory, '已到螢幕': up + dn + ' 顆' });
        },
      };
    },
  },
  {
    id: 'bloch', realm: 'quantum', cat: '量子態', title: '布洛赫球與量子位元', en: 'Bloch Sphere · Qubit', keys: 'qubit 量子位元 量子電腦 疊加 superposition 量子閘',
    tex: ['|\\psi\\rangle = \\cos\\tfrac{\\theta}{2}\\,|0\\rangle + e^{i\\phi}\\sin\\tfrac{\\theta}{2}\\,|1\\rangle', 'P(0) = \\cos^2\\tfrac{\\theta}{2}'],
    explain: '<p>一個<b>量子位元</b>的所有可能狀態，剛好可以畫成球面上的一個點：北極是 \\(|0\\rangle\\)、南極是 \\(|1\\rangle\\)，其他地方都是兩者的<b>疊加</b>。緯度 \\(\\theta\\) 決定量到 0 或 1 的機率，經度 \\(\\phi\\) 是相位——量 0/1 時看不到，但會影響干涉。</p><p>量子電腦的「閘」就是把這個箭頭轉來轉去；<b>量測</b>則會讓狀態瞬間跳到北極或南極（塌縮）。在磁場裡，箭頭會繞著 z 軸轉（拉莫進動）。</p>',
    watch: ['箭頭到 z 軸的投影高度就是 P(0) − P(1)。', '按「量測 1000 次」看統計，按「量測一次」看塌縮。', 'H 閘把北極轉到赤道（|+⟩），再按一次轉回來。'],
    params: [
      { k: 'th', label: '極角 θ', min: 0, max: 180, step: 1, v: 60, unit: '°' },
      { k: 'ph', label: '相位 φ', min: 0, max: 360, step: 1, v: 30, unit: '°' },
      { k: 'prec', label: '進動（磁場中旋轉）', bool: true, v: false },
    ],
    grid: false, cam: [7, 5, 10], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const R = 3;
      const sph = U.sphere(R, U.mat(0x4fd1e8, { opacity: 0.07, side: THREE.DoubleSide }));
      const circ = (f) => U.line(129, 0xffffff, 0.25).set(Array.from({ length: 129 }, (_, i) => f(i / 128 * 2 * Math.PI)));
      const rings = [circ(a => U.V(R * Math.cos(a), 0, R * Math.sin(a))), circ(a => U.V(R * Math.cos(a), R * Math.sin(a), 0)), circ(a => U.V(0, R * Math.sin(a), R * Math.cos(a)))];
      const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(d => U.line(2, 0xffffff, 0.35).set([U.V(...d).multiplyScalar(-R * 1.15), U.V(...d).multiplyScalar(R * 1.15)]));
      // 布洛赫 (x, y, z) → three.js (x, z, −y)
      const T3 = (x, y, z) => U.V(x, z, -y);
      const labs = [['|0⟩', 0, 0, 1], ['|1⟩', 0, 0, -1], ['|+⟩', 1, 0, 0], ['|−⟩', -1, 0, 0], ['|+i⟩', 0, 1, 0], ['|−i⟩', 0, -1, 0]].map(([s, x, y, z]) => { const l = U.label(s, { color: '#e9edf5', size: 0.42 }); l.position.copy(T3(x, y, z).multiplyScalar(R * 1.3)); return l; });
      const arrow = U.arrow(0x4fd1e8, 0.07), tip = U.sphere(0.13, U.glow(0xffffff));
      const proj = U.line(2, 0xf5b544, 0.8, true), pz = U.sphere(0.09, U.glow(0xf5b544));
      // 薛丁格的貓：|0⟩ = 活、|1⟩ = 死（卡通版只是暈倒）
      const cat = U.cat(0.55), box = U.box(1.8, 1, 1.4, U.mat(0x8a5a2b, { rough: 0.8 }));
      cat.position.set(-5.2, -1.6, 1.5); box.position.set(-5.2, -2.6, 1.5);
      const catL = U.label('', { size: 0.36, color: '#ffe066' }), say = U.pop('', 0.4);
      catL.position.set(-5.2, -0.6, 1.5); say.position.set(-3.5, 4.6, 0);
      root.add(sph, ...rings, ...axes, ...labs, arrow, tip, proj, pz, cat, box, catL, say);
      const n = { x: 0, y: 0, z: 1 };
      let last = '—', c0 = 0, c1 = 0;
      const fromP = () => { const th = P.th * D, ph = P.ph * D; n.x = Math.sin(th) * Math.cos(ph); n.y = Math.sin(th) * Math.sin(ph); n.z = Math.cos(th); };
      fromP();
      const p0 = () => (1 + n.z) / 2;
      return {
        onParam: fromP,
        actions: {
          'X 閘（翻轉）': () => { n.y = -n.y; n.z = -n.z; },
          'H 閘（哈達瑪）': () => { [n.x, n.z] = [n.z, n.x]; n.y = -n.y; },
          '量測一次（會塌縮）': () => { const r = Math.random() < p0(); last = r ? '0' : '1'; r ? c0++ : c1++; n.x = n.y = 0; n.z = r ? 1 : -1; },
          '量測 1000 次（統計）': () => { for (let i = 0; i < 1000; i++) Math.random() < p0() ? c0++ : c1++; last = '統計'; },
          '清除統計': () => { c0 = c1 = 0; last = '—'; },
        },
        update(dt, P, t) {
          if (P.prec) { const w = 1.2 * dt, x = n.x; n.x = x * Math.cos(w) - n.y * Math.sin(w); n.y = x * Math.sin(w) + n.y * Math.cos(w); }
          const v = T3(n.x, n.y, n.z).multiplyScalar(R);
          arrow.set(U.V(), v); tip.position.copy(v);
          proj.set([v, U.V(0, v.y, 0)]); pz.position.set(0, v.y, 0);
          const pc = p0(), alive = pc > 0.999, dead = pc < 0.001;
          cat.f.look().mood(alive ? 'happy' : dead ? 'dizzy' : (t * 3 | 0) % 2 ? 'happy' : 'dizzy');
          fade(cat, alive || dead ? 1 : 0.35 + 0.3 * Math.abs(Math.sin(t * 4)));
          catL.set(alive ? '活貓 |0⟩' : dead ? '死貓 |1⟩（卡通版只是暈倒）' : `又活又死？活 ${(pc * 100).toFixed(0)}%`);
          say.set(alive ? '打開箱子：活的！喵～' : dead ? '打開箱子：牠倒下了…（死）' : '薛丁格：打開箱子（量測）之前，貓又活又死！');
          const th = Math.acos(Math.max(-1, Math.min(1, n.z))), ph = (Math.atan2(n.y, n.x) / D + 360) % 360, tot = c0 + c1;
          out({ 'α = cos(θ/2)': Math.cos(th / 2).toFixed(3), 'β = e^{iφ} sin(θ/2)': `${Math.sin(th / 2).toFixed(3)} ∠${ph.toFixed(0)}°`, 'P(0)': (p0() * 100).toFixed(1) + '%', 'P(1)': ((1 - p0()) * 100).toFixed(1) + '%', '上次量測': last, '統計 0 : 1': tot ? `${c0} : ${c1}（${(c0 / tot * 100).toFixed(1)}%）` : '—' });
        },
      };
    },
  },
  {
    id: 'entanglement', realm: 'quantum', cat: '量子態', title: '量子糾纏與貝爾不等式', en: 'Entanglement · Bell / CHSH', keys: '糾纏 entanglement 貝爾 bell chsh epr 鬼魅般的超距作用',
    tex: ['|\\Psi^-\\rangle = \\tfrac{1}{\\sqrt2}\\left(|\\uparrow\\downarrow\\rangle - |\\downarrow\\uparrow\\rangle\\right)', 'E(a,b) = -\\cos(a-b),\\quad S_{\\text{量子}} = 2\\sqrt2 > 2'],
    explain: '<p>中間的源一次放出一對<b>糾纏</b>的粒子，分別飛到左右兩台偵測器。單看一邊，結果完全隨機（一半 +、一半 −）；但兩邊<b>一起比對</b>時，結果高度相關：角度相同時永遠相反。</p><p>愛因斯坦認為粒子出發時就「帶好答案」（隱變數）。貝爾證明：如果真是這樣，相關性最多只能是左下的虛線，CHSH 值不會超過 2；量子力學預測的是 \\(-\\cos\\) 曲線，S 可以到 \\(2\\sqrt2\\)。實驗站在量子這邊（2022 年諾貝爾獎）。</p>',
    watch: ['兩邊角度相同：每次燈號都相反（關聯 −1）。', '角度差 90°：完全不相關（關聯 0）。', '角度差 45° 時量子的關聯比隱變數直線更強——這個差距就是貝爾不等式被打破的地方。'],
    params: [
      { k: 'a', label: '左邊偵測器角度 a', min: 0, max: 180, step: 1, v: 0, unit: '°' },
      { k: 'b', label: '右邊偵測器角度 b', min: 0, max: 180, step: 1, v: 45, unit: '°' },
      { k: 'rate', label: '每秒粒子對', min: 1, max: 60, step: 1, v: 12 },
    ],
    grid: false, cam: [-6, 6, 19], target: [0, 0, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const X = 7, NF = 120;
      const src = U.sphere(0.45, U.mat(0x111111, { emissive: 0xa78bfa }));
      const dets = [-1, 1].map(s => {
        const g = new THREE.Group();
        const ring = U.mesh(new THREE.TorusGeometry(1.1, 0.07, 10, 48), U.mat(0x9aa3b5, { metal: 0.8, rough: 0.3 }));
        ring.rotation.y = Math.PI / 2;
        const ax = U.beam(0x4fd1e8, 0.04).set(U.V(0, -1.1, 0), U.V(0, 1.1, 0));
        const lamp = U.sphere(0.32, U.mat(0x111111, { emissive: 0x333333 })); lamp.position.set(s * 0.9, 2.1, 0);
        const lab = U.label('', { color: '#e9edf5', size: 0.4 }); lab.position.set(0, -1.9, 0);
        g.add(ring, ax, lamp, lab); g.position.x = s * X; root.add(g);
        return { g, ax, lamp, lab, flash: 0 };
      });
      const fly = U.points(NF, 0xffffff, 0.18), fl = Array.from({ length: NF / 2 }, () => ({ on: false }));
      dets.forEach(d => { d.face = U.face(0.32); d.lamp.add(d.face); });
      const say = U.pop('', 0.6); say.position.set(0, 2.8, 0);
      root.add(src, fly, say);
      const ch = chart({ title: '關聯 E vs 角度差（實線量子、虛線隱變數）', x: [0, 180], y: [-1.05, 1.05], xl: '|a − b| (°)', yl: 'E' });
      let acc = 0, n = 0, same = 0, key = '';
      return {
        actions: { '清除統計': () => { n = same = 0; } },
        update(dt, P, t) {
          const k = P.a + ',' + P.b; if (k !== key) { key = k; n = same = 0; }
          dets[0].ax.rotation.x = P.a * D; dets[1].ax.rotation.x = P.b * D;
          acc += dt * P.rate;
          for (; acc >= 1; acc--) {
            const f = fl.find(f => !f.on); if (!f) break;
            const A = Math.random() < 0.5 ? 1 : -1, B = Math.random() < Math.sin((P.a - P.b) * D / 2) ** 2 ? A : -A;
            Object.assign(f, { on: true, x: 0, A, B });
          }
          fl.forEach((f, i) => {
            if (f.on) {
              f.x += dt * 7;
              if (f.x >= X) {
                f.on = false; n++; if (f.A === f.B) same++;
                [f.A, f.B].forEach((r, j) => { dets[j].lamp.material.emissive.set(r > 0 ? 0xf5b544 : 0x4fd1e8); dets[j].flash = 0.25; dets[j].lab.set(r > 0 ? '+1' : '−1'); dets[j].face.mood(r > 0 ? 'happy' : 'shock'); });
              }
            }
            fly.pos.set(f.on ? [-f.x, 0, 0, f.x, 0, 0] : [0, 1e4, 0, 0, 1e4, 0], i * 6);
          });
          fly.flush();
          dets.forEach(d => { d.flash -= dt; if (d.flash <= 0) d.lamp.material.emissive.set(0x333333); d.face.look(); });
          say.set(cycle(['愛因斯坦：鬼魅般的超距作用？我不信！', '愛因斯坦：上帝不擲骰子！', '波耳：別告訴上帝該怎麼做！', '貝爾：吵什麼，量 CHSH 就知道了'], t));
          const Em = n ? (2 * same - n) / n : 0, dd = Math.abs(P.a - P.b);
          const xs = Array.from({ length: 61 }, (_, i) => i * 3);
          ch.draw([
            { pts: xs.map(x => [x, -1 + 2 * x / 180]), color: 'rgba(255,255,255,.45)', dash: [5, 4], w: 1.5 },
            { pts: xs.map(x => [x, F.corr(0, x * D)]), color: '#4fd1e8' },
          ], n ? [{ x: dd, y: Em, color: '#f5b544', r: 5, text: `量到 ${Em.toFixed(2)}` }] : []);
          out({ '量測對數': n, '量到的關聯 E': n ? Em.toFixed(3) : '—', '量子預測 −cos(a−b)': F.corr(P.a * D, P.b * D).toFixed(3), '隱變數上限 CHSH': '2', '量子 CHSH（0°,90°,45°,135°）': F.chsh(0, 90 * D, 45 * D, 135 * D).toFixed(3) });
        },
      };
    },
  },
];
