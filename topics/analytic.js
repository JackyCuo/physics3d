import { VIO, AMBER, CYAN } from './palette.js';
// 理論物理・分析力學與統計
const g = 9.8;
export const F = {
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
        const z = k ? 0.12 : -0.12;
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
];
