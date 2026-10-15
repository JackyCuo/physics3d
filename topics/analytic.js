import { VIO, AMBER, CYAN } from './palette.js';
import * as jojo from './jojo.js';
// 理論物理・分析力學與統計
const g = 9.8;
export const F = {
  PHI: (1 + Math.sqrt(5)) / 2,
  fib: n => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; },   // F(1) = F(2) = 1
  goldenAngle: () => 360 * (1 - 2 / (1 + Math.sqrt(5))),   // 360°/φ² ≈ 137.508°
  // 垂直拋球：t=0 與 t=T 都在地面。真實路徑 y = g t (T−t)/2，試探路徑再加 ε sin(nπt/T)
  path: (t, eps, n, T = 2) => g * t * (T - t) / 2 + eps * Math.sin(n * Math.PI * t / T),
  // 作用量 S = ∫ (½ ẏ² − g y) dt（m = 1），梯形法
  action(eps, n, T = 2, N = 400) {
    let S = 0;
    for (let i = 0; i <= N; i++) {
      const t = T * i / N, v = g * (T / 2 - t) + eps * (n * Math.PI / T) * Math.cos(n * Math.PI * t / T);
      S += (i === 0 || i === N ? 0.5 : 1) * (0.5 * v * v - g * F.path(t, eps, n, T));
    }
    return S * T / N;
  },
  angMom: (x, z, vx, vz) => x * vz - z * vx,
  // 二維諧振子 V = ½(kx x² + kz z²) 的速度 Verlet 一步；s = [x, z, vx, vz]
  oscStep(s, kx, kz, h) {
    s[2] -= kx * s[0] * h / 2; s[3] -= kz * s[1] * h / 2;
    s[0] += s[2] * h; s[1] += s[3] * h;
    s[2] -= kx * s[0] * h / 2; s[3] -= kz * s[1] * h / 2;
    return s;
  },
  // 馬克士威–波茲曼速率分布（m = k = 1）
  mb: (v, T) => 4 * Math.PI * (1 / (2 * Math.PI * T)) ** 1.5 * v * v * Math.exp(-v * v / (2 * T)),
  vp: T => Math.sqrt(2 * T), vavg: T => Math.sqrt(8 * T / Math.PI), vrms: T => Math.sqrt(3 * T),
  // 雙擺（m = l = 1）：s = [θ1, θ2, ω1, ω2]
  dp(s) {
    const [a, b, w1, w2] = s, d = a - b, den = 3 - Math.cos(2 * d);
    return [w1, w2,
      (-3 * g * Math.sin(a) - g * Math.sin(a - 2 * b) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den,
      (2 * Math.sin(d) * (2 * w1 * w1 + 2 * g * Math.cos(a) + w2 * w2 * Math.cos(d))) / den];
  },
  dpStep(s, h) {
    const k1 = F.dp(s), k2 = F.dp(s.map((v, i) => v + h / 2 * k1[i])), k3 = F.dp(s.map((v, i) => v + h / 2 * k2[i])), k4 = F.dp(s.map((v, i) => v + h * k3[i]));
    for (let i = 0; i < 4; i++) s[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return s;
  },
  dpEnergy([a, b, w1, w2]) {
    return 0.5 * w1 * w1 + 0.5 * (w1 * w1 + w2 * w2 + 2 * w1 * w2 * Math.cos(a - b)) - g * (2 * Math.cos(a) + Math.cos(b));
  },
};


const cycle = (arr, t, sec = 4) => arr[Math.floor(t / sec) % arr.length];
export default [
  {
    id: 'leastaction', realm: 'theory', cat: '分析力學與統計', title: '最小作用量原理', en: 'Principle of Least Action', keys: '拉格朗日 lagrangian 作用量 action 變分 hamilton',
    tex: ['S = \\int_{t_1}^{t_2} L\\,dt,\\quad L = T - V', '\\delta S = 0 \\;\\Rightarrow\\; \\dfrac{d}{dt}\\dfrac{\\partial L}{\\partial \\dot q} - \\dfrac{\\partial L}{\\partial q} = 0'],
    explain: '<p>換一個角度看力學：球從地面丟上去、2 秒後落回原地，中間可以想像有無限多種走法。對每一種走法算<b>作用量</b> \\(S = \\int (\\text{動能} - \\text{位能})\\,dt\\)。</p><p>大自然真正走的那一條，是讓 \\(S\\) <b>取極值（這裡是最小）</b>的路徑。從這個原理可以推出牛頓定律（歐拉–拉格朗日方程），也能推出光學、相對論、量子力學——現代物理幾乎都從作用量出發。</p>',
    watch: ['橫軸是時間、縱軸是高度：球其實只是垂直上下，畫成這樣才看得到整條路徑。', '橘色是真實的拋物線，紫色是你調出來的試探路徑。', '把 ε 往正或負推，左下的 S 都會變大：真實路徑在曲線最低點。', '所有路徑起點、終點、所花時間都一樣，差別只在中間怎麼走。'],
    params: [
      { k: 'eps', label: '路徑偏移 ε', min: -3, max: 3, step: 0.05, v: 1.5, unit: 'm' },
      { k: 'n', label: '偏移形狀', options: [[1, '一個鼓包'], [2, '一上一下'], [3, '三段波']], v: 1 },
    ],
    cam: [2, 4, 12], target: [0, 1.6, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const T = 2, SX = 3.5, SY = 0.6, M = 80, FAN = [-3, -2, -1, 1, 2, 3];
      const pos = (t, eps, n) => U.V((t - T / 2) * SX, F.path(t, eps, n, T) * SY, eps * 0.45);
      const curve = (eps, n) => Array.from({ length: M }, (_, i) => pos(T * i / (M - 1), eps, n));
      const truth = U.line(M, AMBER), trial = U.line(M, VIO);
      const fan = FAN.map(() => U.line(M, 0xffffff, 0.14));
      const bT = U.sphere(0.2, U.mat(0x111111, { emissive: AMBER })), bE = U.sphere(0.2, U.mat(0x111111, { emissive: VIO }));
      const ends = [0, T].map(t => { const m = U.cyl(0.25, 0.25, 0.05, U.glow(0xffffff, 0.6)); m.position.copy(pos(t, 0, 1)); return m; });
      const lT = U.label('', { color: '#f5b544', size: 0.36 }), lE = U.label('', { color: '#c9b8ff', size: 0.36 });
      const tAx = U.arrow(0xffffff, 0.02).set(U.V(-T / 2 * SX - 0.3, -0.25, 0), U.V(T * SX + 0.9, 0, 0));
      const tL = U.label('時間 t →', { color: 'rgba(233,237,245,.7)', size: 0.34 }); tL.position.set(T / 2 * SX + 0.2, -0.65, 0);
      root.add(truth, trial, ...fan, bT, bE, ...ends, lT, lE, tAx, tL);
      const ch = chart({ title: '作用量 S(ε)', x: [-3, 3], y: [-35, 0], xl: 'ε', yl: 'S' });
      let key = '';
      return {
        update(dt, P, t) {
          const k = P.eps + ',' + P.n;
          if (k !== key) {
            key = k;
            truth.set(curve(0, P.n)); trial.set(curve(P.eps, P.n));
            fan.forEach((f, i) => f.set(curve(FAN[i], P.n)));
          }
          const s = (t * 0.8) % (T + 0.6), tt = Math.min(s, T);
          bT.position.copy(pos(tt, 0, P.n)); bE.position.copy(pos(tt, P.eps, P.n));
          const S0 = F.action(0, P.n, T), S = F.action(P.eps, P.n, T);
          lT.set(`S = ${S0.toFixed(1)}`); lT.position.copy(pos(T / 2, 0, P.n)).add(U.V(0, 0.6, 0));
          lE.set(`S = ${S.toFixed(1)}`); lE.position.copy(pos(T / 2 + 0.35, P.eps, P.n)).add(U.V(0, 0.6, 0));
          const xs = Array.from({ length: 61 }, (_, i) => -3 + i / 10);
          const ys = xs.map(e => F.action(e, P.n, T));
          ch.o.y = [Math.min(...ys) - 2, Math.max(...ys) + 2];
          ch.draw([{ pts: xs.map((e, i) => [e, ys[i]]), color: '#a78bfa' }], [{ x: 0, y: S0, color: '#f5b544', r: 4, text: '真實' }, { x: P.eps, y: S, color: '#fff', r: 4 }]);
          out({ '真實路徑 S': S0.toFixed(2) + ' J·s', '試探路徑 S': S.toFixed(2) + ' J·s', '多出來的 ΔS': (S - S0).toFixed(2) + ' J·s' });
        },
      };
    },
  },
  {
    id: 'noether', realm: 'theory', cat: '分析力學與統計', title: '諾特定理', en: "Noether's Theorem · Symmetry ↔ Conservation", keys: 'noether 對稱 守恆 角動量 能量守恆',
    tex: ['\\text{對稱性} \\;\\Longleftrightarrow\\; \\text{守恆量}', '\\dfrac{\\partial L}{\\partial \\varphi} = 0 \\;\\Rightarrow\\; L_z = \\dfrac{\\partial L}{\\partial \\dot\\varphi} = \\text{常數}'],
    explain: '<p>艾米．諾特在 1918 年證明：<b>每一種連續對稱，都對應一個守恆量</b>。系統轉任何角度都長一樣（旋轉對稱）→ <b>角動量守恆</b>；物理規則不隨時間改變（時間平移對稱）→ <b>能量守恆</b>；空間平移對稱 → 動量守恆。</p><p>畫面是一顆球在碗裡滾。圓碗有旋轉對稱，角動量 \\(L_z\\) 一直不變；把碗壓扁，對稱被打破，角動量就開始上下擺盪。讓碗的硬度隨時間變化，能量也不再守恆。</p>',
    watch: ['碗是圓的時候，左下的紫線（角動量）完全水平。', '把「壓扁」推上去：紫線開始波動，但橘線（能量）仍然水平。', '打開「碗隨時間變化」：換成能量不守恆；碗是圓的話角動量照樣守恆。'],
    params: [
      { k: 'asym', label: '壓扁程度（打破旋轉對稱）', min: 0, max: 1, step: 0.01, v: 0 },
      { k: 'drive', label: '碗隨時間變化（打破時間對稱）', bool: true, v: false },
    ],
    cam: [0, 9, 10], target: [0, 0.5, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const SC = 0.13, NS = 48, R = 5;
      const geo = new THREE.PlaneGeometry(2 * R, 2 * R, NS, NS); geo.rotateX(-Math.PI / 2);
      const bowl = U.mesh(geo, U.mat(0x2a2440, { opacity: 0.55, side: THREE.DoubleSide, rough: 0.6 }));
      const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: VIO, wireframe: true, transparent: true, opacity: 0.12 }));
      const ball = U.sphere(0.22, U.mat(0xdfe3ea, { emissive: CYAN, ei: 0.4 }));
      const trail = U.line(500, CYAN, 0.6), lArr = U.arrow(VIO, 0.05);
      root.add(bowl, wire, ball, trail, lArr);
      const ch = chart({ title: '角動量 Lz（紫）與能量 E（橘）', x: [0, 15], y: [-6, 9], xl: 't (s)', yl: '' });
      let s, tt, hist, pts, key = -1, kf = 1;
      const reset = () => { s = [3, 0, 0, 1.4]; tt = 0; hist = []; pts = []; };
      reset();
      const V = (x, z, kz) => 0.5 * (x * x + kz * z * z);
      return {
        actions: { '重新開始': reset },
        onParam: reset,
        update(dt, P) {
          const kz = 1 + P.asym;
          for (let i = 0; i < 8; i++) {
            kf = P.drive ? 1 + 0.45 * Math.sin(1.7 * (tt + i * dt / 8)) : 1;
            F.oscStep(s, kf, kf * kz, dt / 8);
          }
          tt += dt;
          if (key !== P.asym + ',' + kf.toFixed(2)) {
            key = P.asym + ',' + kf.toFixed(2);
            const a = geo.attributes.position;
            for (let i = 0; i < a.count; i++) a.setY(i, SC * kf * V(a.getX(i), a.getZ(i), kz));
            a.needsUpdate = true; geo.computeVertexNormals();
          }
          const [x, z, vx, vz] = s;
          ball.position.set(x, SC * kf * V(x, z, kz) + 0.22, z);
          if (!pts.length || pts.at(-1).distanceTo(ball.position) > 0.06) { pts.push(ball.position.clone()); if (pts.length > 500) pts.shift(); }
          trail.set(pts);
          const L = F.angMom(x, z, vx, vz), E = 0.5 * (vx * vx + vz * vz) + kf * V(x, z, kz);
          lArr.set(U.V(0, 0, 0), U.V(0, L * 0.5, 0));
          if (!hist.length || tt - hist.at(-1)[0] > 0.05) hist.push([tt, L, E]);
          hist = hist.filter(h => h[0] > tt - 15);
          ch.o.x = [Math.max(0, tt - 15), Math.max(15, tt)];
          ch.draw([{ pts: hist.map(h => [h[0], h[1]]), color: '#a78bfa' }, { pts: hist.map(h => [h[0], h[2]]), color: '#f5b544' }]);
          out({ '角動量 Lz': L.toFixed(3), '能量 E': E.toFixed(3), '旋轉對稱': P.asym ? '破缺 → Lz 不守恆' : '有 → Lz 守恆', '時間對稱': P.drive ? '破缺 → E 不守恆' : '有 → E 守恆' });
        },
      };
    },
  },
  {
    id: 'maxwell', realm: 'theory', cat: '分析力學與統計', title: '馬克士威–波茲曼分布', en: 'Maxwell–Boltzmann Distribution', keys: '統計力學 statistical 速率分布 溫度 熱平衡',
    tex: ['f(v) = 4\\pi \\left(\\dfrac{m}{2\\pi k_B T}\\right)^{3/2} v^2\\, e^{-mv^2/2k_BT}', '\\tfrac12 m\\langle v^2\\rangle = \\tfrac32 k_B T'],
    explain: '<p>氣體分子的速率不是都一樣，而是有一個固定形狀的分布：很慢和很快的都少，大部分集中在中間。溫度越高，分布越往右、越扁平。<b>溫度其實就是分子平均動能的量度</b>。</p><p>按「全部同速度重來」，所有分子一開始速率完全相同。它們互相碰撞交換能量，幾秒內就<b>自己變成</b>馬克士威–波茲曼分布——統計力學說，這是排法最多（熵最大）的分布。</p>',
    watch: ['左下長條是盒子裡真實的速率統計，白線是理論曲線。', '重來之後，原本只有一根尖峰的長條會慢慢攤開，貼上白線。', '溫度加倍，最可能速率只增加 √2 倍。'],
    params: [{ k: 'T', label: '溫度 T', min: 0.3, max: 4, step: 0.05, v: 1 }],
    cam: [0, 4, 10], target: [0, 2.2, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const N = 400, B = 2.2, r = 0.1, NB = 28;
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * B, 2 * B, 2 * B)), new THREE.LineBasicMaterial({ color: VIO, transparent: true, opacity: 0.5 }));
      const g = new THREE.Group(); g.position.y = B + 0.05;
      const pts = U.points(N, 0xffffff, 0.2, true);
      g.add(box, pts); root.add(g);
      const p = new Float32Array(N * 3), v = new Float32Array(N * 3), c = new THREE.Color();
      let hist = new Float32Array(NB), Tcur = P.T;
      const init = () => {
        Tcur = P.T;
        const s = F.vrms(P.T);
        for (let i = 0; i < N; i++) {
          for (let k = 0; k < 3; k++) p[i * 3 + k] = (Math.random() * 2 - 1) * (B - r);
          const d = U.V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(s);
          v[i * 3] = d.x; v[i * 3 + 1] = d.y; v[i * 3 + 2] = d.z;
        }
        hist.fill(0);
      };
      init();
      const ch = chart({ title: '速率分布 f(v)', x: [0, 1], y: [0, 1], xl: 'v', yl: 'f' });
      return {
        actions: { '全部同速度重來': init },
        onParam() { const k = Math.sqrt(P.T / Tcur); for (let i = 0; i < 3 * N; i++) v[i] *= k; Tcur = P.T; },
        update(dt) {
          const h = Math.min(dt, 1 / 30) * 1.5;
          for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) {
            const j = i * 3 + k;
            p[j] += v[j] * h;
            if (p[j] > B - r) { p[j] = B - r; v[j] = -Math.abs(v[j]); }
            if (p[j] < -B + r) { p[j] = -B + r; v[j] = Math.abs(v[j]); }
          }
          // ponytail: O(N²) 兩兩檢查碰撞，N=400 每格 8 萬次還很輕；要更多粒子再改網格分桶
          for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            const dx = p[j * 3] - p[i * 3], dy = p[j * 3 + 1] - p[i * 3 + 1], dz = p[j * 3 + 2] - p[i * 3 + 2], d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > 4 * r * r || d2 === 0) continue;
            const dvx = v[j * 3] - v[i * 3], dvy = v[j * 3 + 1] - v[i * 3 + 1], dvz = v[j * 3 + 2] - v[i * 3 + 2], dot = dvx * dx + dvy * dy + dvz * dz;
            if (dot >= 0) continue;   // 已經在分開
            const k = dot / d2;      // 等質量彈性碰撞：交換法向速度
            v[i * 3] += k * dx; v[i * 3 + 1] += k * dy; v[i * 3 + 2] += k * dz;
            v[j * 3] -= k * dx; v[j * 3 + 1] -= k * dy; v[j * 3 + 2] -= k * dz;
          }
          const vmax = 4 * Math.sqrt(P.T), bw = vmax / NB, now = new Float32Array(NB);
          let s2 = 0;
          for (let i = 0; i < N; i++) {
            const s = Math.hypot(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
            s2 += s * s;
            now[Math.min(NB - 1, Math.floor(s / bw))]++;
            pts.pos[i * 3] = p[i * 3]; pts.pos[i * 3 + 1] = p[i * 3 + 1]; pts.pos[i * 3 + 2] = p[i * 3 + 2];
            U.heat(s / (2.2 * Math.sqrt(P.T)), c).toArray(pts.col, i * 3);
          }
          pts.flush();
          for (let b = 0; b < NB; b++) hist[b] = hist[b] * 0.9 + now[b] / (N * bw) * 0.1;
          const fmax = F.mb(F.vp(P.T), P.T);
          ch.o.x = [0, vmax]; ch.o.y = [0, Math.max(fmax * 1.25, ...hist) * 1.05];
          const bars = [];
          for (let b = 0; b < NB; b++) bars.push([b * bw, hist[b]], [(b + 1) * bw, hist[b]]);
          ch.draw([
            { pts: bars, color: '#a78bfa', fill: 'rgba(167,139,250,.25)', w: 1 },
            { pts: Array.from({ length: 80 }, (_, i) => { const x = vmax * i / 79; return [x, F.mb(x, P.T)]; }), color: '#ffffff', w: 2 },
          ], [{ x: F.vp(P.T), vline: true, color: 'rgba(245,181,68,.6)' }]);
          out({ '最可能速率 vₚ': F.vp(P.T).toFixed(2), '平均速率 v̄': F.vavg(P.T).toFixed(2), '方均根（理論）': F.vrms(P.T).toFixed(2), '方均根（盒子裡）': Math.sqrt(s2 / N).toFixed(2) });
        },
      };
    },
  },
  {
    id: 'chaos', realm: 'theory', cat: '分析力學與統計', title: '混沌與雙擺', en: 'Chaos · Double Pendulum', keys: '混沌 chaos 蝴蝶效應 butterfly 雙擺 李雅普諾夫 lyapunov',
    tex: ['|\\delta(t)| \\approx |\\delta_0|\\, e^{\\lambda t}'],
    explain: '<p>兩個雙擺用<b>完全相同的方程式</b>，起始角度只差一點點（預設 0.0001 弧度，肉眼完全看不出來）。一開始兩者重疊，過幾秒後差距<b>指數成長</b>，接著走上完全不同的路。</p><p>這就是<b>混沌</b>：系統完全遵守決定論，但對初始條件極度敏感，所以長期無法預測——天氣預報只能準幾天也是這個原因（蝴蝶效應）。左下圖的縱軸取對數，直線上升代表指數發散，斜率是李雅普諾夫指數 \\(\\lambda\\)。</p>',
    watch: ['前幾秒兩個擺疊在一起，看起來像只有一個。', '左下圖先是一條斜直線（指數成長），到頂之後就是完全不相關了。', '把起始角度調小到 30° 左右：運動變規律，差距幾乎不長大——小擺幅不混沌。'],
    params: [
      { k: 'th', label: '起始角度', min: 20, max: 175, step: 1, v: 120, unit: '°' },
      { k: 'lg', label: '初始差距（10 的次方）', min: -8, max: -1, step: 0.5, v: -4 },
    ],
    grid: false, cam: [0, 1.2, 9], target: [0, 0.6, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const Ls = 1.5, O = U.V(0, 2.4, 0), cols = [AMBER, CYAN];
      const pivot = U.sphere(0.1, U.mat(0xdfe3ea, { metal: 0.8 })); pivot.position.copy(O);
      const bar = U.box(1.6, 0.08, 0.08, U.mat(0x3a3f4c, { metal: 0.7 })); bar.position.copy(O).add(U.V(0, 0.05, 0));
      const pends = cols.map((col, k) => {
        const z = k ? 0.22 : -0.22;   // 兩個擺錘半徑 0.17，隔 0.44 才不互穿；也避開中間的橫桿
        const r1 = U.beam(0, 0.035, U.mat(0xdfe3ea, { metal: 0.6 })), r2 = U.beam(0, 0.035, U.mat(0xdfe3ea, { metal: 0.6 }));
        const b1 = U.sphere(0.13, U.mat(0x111111, { emissive: col })), b2 = U.sphere(0.17, U.mat(0x111111, { emissive: col }));
        const tr = U.line(400, col, 0.75);
        root.add(r1, r2, b1, b2, tr);
        return { z, r1, r2, b1, b2, tr, pts: [] };
      });
      root.add(pivot, bar);
      const ch = chart({ title: 'log₁₀ |兩擺角度差|', x: [0, 30], y: [-8, 1], xl: 't (s)', yl: '' });
      let S, tt, hist, E0;
      const reset = () => {
        const a = P.th * Math.PI / 180;
        S = [[a, a, 0, 0], [a + 10 ** P.lg, a, 0, 0]];
        tt = 0; hist = []; E0 = F.dpEnergy(S[0]);
        pends.forEach(p => { p.pts = []; });
      };
      reset();
      return {
        actions: { '重新放手': reset },
        onParam: reset,
        update(dt) {
          const n = Math.max(1, Math.ceil(dt / 0.002));
          for (const s of S) for (let i = 0; i < n; i++) F.dpStep(s, dt / n);
          tt += dt;
          S.forEach((s, k) => {
            const p = pends[k];
            const j1 = U.V(O.x + Ls * Math.sin(s[0]), O.y - Ls * Math.cos(s[0]), p.z);
            const j2 = j1.clone().add(U.V(Ls * Math.sin(s[1]), -Ls * Math.cos(s[1]), 0));
            p.r1.set(U.V(O.x, O.y, p.z), j1); p.r2.set(j1, j2);
            p.b1.position.copy(j1); p.b2.position.copy(j2);
            if (!p.pts.length || p.pts.at(-1).distanceTo(j2) > 0.03) { p.pts.push(j2); if (p.pts.length > 400) p.pts.shift(); }
            p.tr.set(p.pts);
          });
          const d = Math.hypot(S[0][0] - S[1][0], S[0][1] - S[1][1]);
          if (!hist.length || tt - hist.at(-1)[0] > 0.05) hist.push([tt, Math.log10(Math.max(d, 1e-9))]);
          hist = hist.filter(h => h[0] > tt - 30);
          ch.o.x = [Math.max(0, tt - 30), Math.max(30, tt)];
          ch.draw([{ pts: hist, color: '#a78bfa' }]);
          out({ '角度差': d < 1e-3 ? d.toExponential(1) + ' rad' : d.toFixed(3) + ' rad', '經過時間': tt.toFixed(1) + ' s', '能量誤差（數值）': (Math.abs(F.dpEnergy(S[0]) - E0) / (3 * 9.8)).toExponential(1) });
        },
      };
    },
  },
  {
    id: 'goldenspiral', realm: 'theory', cat: '數學與自然', title: '黃金螺線（飆馬野郎版）', en: 'Golden Spiral · Fibonacci & Phyllotaxis (Steel Ball Run parody)', keys: '黃金比例 golden ratio φ 費氏數列 fibonacci 對數螺線 葉序 向日葵 黃金角 jojo 飆馬野郎 steel ball run 傑洛 黃金回轉 黃金長方形',
    tex: ['\\varphi = \\dfrac{1+\\sqrt5}{2} \\approx 1.618,\\qquad \\lim_{n\\to\\infty}\\dfrac{F_{n+1}}{F_n} = \\varphi', 'r(\\theta) = a\\,\\varphi^{2\\theta/\\pi},\\qquad \\text{黃金角} = \\dfrac{360^\\circ}{\\varphi^2} \\approx 137.5^\\circ'],
    explain: '<p><b>黃金比例</b> \\(\\varphi\\) 是唯一滿足「整體 : 大段 = 大段 : 小段」的比例。從黃金長方形切掉一個正方形，剩下的又是黃金長方形，可以無限切下去；在每個正方形畫四分之一圓，連起來就是<b>黃金螺線</b>。它是一種對數螺線，每轉 90° 放大 \\(\\varphi\\) 倍。</p><p>費氏數列 1, 1, 2, 3, 5, 8…（每項是前兩項相加）相鄰兩項的比會越來越接近 \\(\\varphi\\)，所以左邊用費氏正方形拼出來的螺線很接近真正的黃金螺線。</p><p>右邊的向日葵：每顆新種子比上一顆多轉一個<b>黃金角</b> 137.5°。因為 \\(\\varphi\\) 是「最難用分數逼近的無理數」，種子永遠不會排成直線、也不會留縫，排得最密。角度改一點點就會出現一條條放射狀的縫。</p><p>《JoJo》第七部《飆馬野郎》裡，傑洛說大自然中的「黃金長方形」是鋼球「黃金回轉」的祕密。這是漫畫設定；但黃金比例、費氏數列和葉序都是真的。（鸚鵡螺殼和星系是對數螺線，但大多不是剛好的黃金比例。）</p>',
    watch: ['把正方形數 n 拉大：左下的 Fₙ₊₁/Fₙ 一下大一下小，夾著 φ 收斂。', '鋼球沿著黃金螺線滾，越往外每轉 90° 半徑就放大 1.618 倍。', '向日葵角度拉到 137.5° 以外（例如 135° 或 140°）：種子排出一條條縫。', '角度換成 90° 或 120° 這種整齊的分數：種子排成幾條直線，浪費空間。'],
    params: [
      { k: 'n', label: '費氏正方形數 n', min: 2, max: 12, step: 1, v: 9 },
      { k: 'ang', label: '向日葵每顆種子轉的角度', min: 90, max: 180, step: 0.1, v: 137.5, unit: '°' },
      { k: 'N', label: '種子數', min: 50, max: 800, step: 10, v: 500 },
    ],
    grid: false, cam: [0, 2.5, 17], target: [0, 2.5, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const SP = U.V(-4.2, 3, 0), SF = U.V(4.6, 3, 0), MAXN = 12, MAXS = 800;
      const sqs = Array.from({ length: MAXN }, () => U.line(5, 0xffffff, 0.35));
      const spiral = U.line(MAXN * 24, 0xf5b544);
      const seeds = U.points(MAXS, 0xf5b544, 0.22, true);
      const disk = U.mesh(new THREE.CircleGeometry(2.8, 64), U.mat(0x3a2a14, { rough: 0.9 })); disk.position.copy(SF).add(U.V(0, 0, -0.05));
      const petals = new THREE.Group();
      for (let i = 0; i < 24; i++) { const p = U.mesh(new THREE.CircleGeometry(0.55, 16), U.mat(0xf2c230, { rough: 0.7 })); const a = i / 24 * Math.PI * 2; p.scale.set(0.5, 1.5, 1); p.position.set(3.35 * Math.cos(a), 3.35 * Math.sin(a), -0.08); p.rotation.z = a - Math.PI / 2; petals.add(p); }
      petals.position.copy(SF);
      const ball = jojo.steelBall(U, THREE, 0.3);
      const gy = jojo.gyro(U, THREE); gy.position.set(0.3, -1.6, 2); gy.scale.setScalar(0.9);
      const say = U.pop('', 0.5); say.position.set(0.3, 1.6, 2);
      const lab = U.label('', { size: 0.4, color: '#f5b544' }); lab.position.set(SP.x, -0.6, 0);
      root.add(...sqs, spiral, disk, petals, seeds, ball, gy, say, lab);
      const ch = chart({ title: 'Fₙ₊₁ / Fₙ → φ', x: [1, 12], y: [0.9, 2.1], xl: 'n', yl: '' });
      let key = '', path = [], u = 0;
      const build = () => {
        // 費氏正方形：右、上、左、下輪流往外貼；每格畫四分之一圓
        const n = P.n, sizes = Array.from({ length: n }, (_, i) => F.fib(i + 1));
        let [x0, y0, x1, y1] = [0, 0, 1, 1];
        const rects = [[0, 0, 1, 1]], arcs = [[[1, 1], [0, 1], [1, 0]]];   // [圓心, 起點, 終點]
        for (let k = 1; k < n; k++) {
          const s = sizes[k], d = (k - 1) % 4;
          if (d === 0) { rects.push([x1, y0, x1 + s, y1]); arcs.push([[x1, y1], [x1, y0], [x1 + s, y1]]); x1 += s; }
          else if (d === 1) { rects.push([x0, y1, x1, y1 + s]); arcs.push([[x0, y1], [x1, y1], [x0, y1 + s]]); y1 += s; }
          else if (d === 2) { rects.push([x0 - s, y0, x0, y1]); arcs.push([[x0, y0], [x0, y1], [x0 - s, y0]]); x0 -= s; }
          else { rects.push([x0, y0 - s, x1, y0]); arcs.push([[x1, y0], [x0, y0], [x1, y0 - s]]); y0 -= s; }
        }
        const sc = 6.4 / Math.max(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const tw = (x, y) => U.V(SP.x + (x - cx) * sc, SP.y + (y - cy) * sc, 0);
        sqs.forEach((l, i) => { l.visible = i < n; if (i < n) { const [a, b, c, d] = rects[i]; l.set([tw(a, b), tw(c, b), tw(c, d), tw(a, d), tw(a, b)]); } });
        path = [];
        for (const [[ox, oy], [ax, ay], [bx, by]] of arcs) {
          const r = Math.hypot(ax - ox, ay - oy), ta = Math.atan2(ay - oy, ax - ox);
          let dtt = Math.atan2(by - oy, bx - ox) - ta; dtt = Math.atan2(Math.sin(dtt), Math.cos(dtt));
          for (let j = 0; j < 24; j++) { const th = ta + dtt * j / 23; path.push(tw(ox + r * Math.cos(th), oy + r * Math.sin(th))); }
        }
        spiral.set(path);
        // 向日葵：第 i 顆種子 r ∝ √i、角度 i × ang
        const R = 2.6 / Math.sqrt(P.N);
        for (let i = 0; i < MAXS; i++) {
          const on = i < P.N, a = i * P.ang * Math.PI / 180, r = R * Math.sqrt(i + 0.5);
          seeds.pos.set(on ? [SF.x + r * Math.cos(a), SF.y + r * Math.sin(a), 0.02] : [0, 1e4, 0], i * 3);
          seeds.col.set(i % 2 ? [0.96, 0.71, 0.27] : [0.55, 0.36, 0.12], i * 3);
        }
        seeds.flush();
      };
      return {
        update(dt, P, t) {
          const k = `${P.n},${P.ang},${P.N}`; if (k !== key) { key = k; build(); u = 0; }
          u = (u + dt * 0.12) % 1;
          const i = Math.min(path.length - 1, Math.floor(u * path.length));
          ball.position.copy(path[i]).add(U.V(0, 0, 0.3)); ball.rotation.z -= dt * 8;
          const off = Math.abs(P.ang - F.goldenAngle()), n = P.n, ratio = F.fib(n + 1) / F.fib(n);
          gy.face.look().mood(off > 1 ? 'shock' : 'happy');
          say.set(off > 1 ? '角度錯了！種子排出縫來了——這不是黃金的回轉！' : cycle(['LESSON 5：大自然裡到處藏著「黃金長方形」。', '照黃金比例回轉，鋼球就能得到「無限」的力量！', '向日葵的種子，也照黃金角 137.5° 排。', n >= 11 ? '強尼：這就是…ACT 4，無限的回轉！' : '再多切幾個正方形看看，強尼。'], t));
          lab.set(`長邊 : 短邊 = ${F.fib(n + 1)} : ${F.fib(n)} = ${ratio.toFixed(5)}`);
          ch.draw([{ pts: [[1, F.PHI], [12, F.PHI]], color: 'rgba(255,255,255,.4)', dash: [4, 4], w: 1 }, { pts: Array.from({ length: 12 }, (_, j) => [j + 1, F.fib(j + 2) / F.fib(j + 1)]), color: '#f5b544' }], [{ x: n, y: ratio, color: '#4fd1e8', r: 5 }]);
          out({ 'Fₙ': F.fib(n), 'Fₙ₊₁ / Fₙ': ratio.toFixed(6), '與 φ 的差': (ratio - F.PHI).toExponential(2), '黃金角': F.goldenAngle().toFixed(3) + '°', '向日葵角度偏離': (P.ang - F.goldenAngle()).toFixed(2) + '°' });
        },
      };
    },
  },
];
