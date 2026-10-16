// 經典物理・熱學
const lnFact = n => { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; };
export const F = {
  // 理想氣體：V 用公升、回傳 kPa（nRT / V）
  idealP: (n, T, VL) => n * 8.314 * T / VL,
  vrms: (T, M = 0.028) => Math.sqrt(3 * 8.314 * T / M),
  carnotEff: (Th, Tc) => 1 - Tc / Th,
  // 卡諾循環四個角的體積（單原子 γ = 5/3：T V^(2/3) 在絕熱線上不變）
  carnotStates(Th, Tc, V1 = 1, V2 = 2.5) { const r = (Th / Tc) ** 1.5; return { V1, V2, V3: V2 * r, V4: V1 * r }; },
  // 卡諾循環：s ∈ [0,4) → {V, T}
  carnotAt(Th, Tc, s) {
    const { V1, V2, V3, V4 } = F.carnotStates(Th, Tc), st = Math.min(3, Math.floor(s)), u = s - st;
    if (st === 0) return { V: V1 * (V2 / V1) ** u, T: Th };
    if (st === 1) { const V = V2 * (V3 / V2) ** u; return { V, T: Th * (V2 / V) ** (2 / 3) }; }
    if (st === 2) return { V: V3 * (V4 / V3) ** u, T: Tc };
    const V = V4 * (V1 / V4) ** u; return { V, T: Tc * (V4 / V) ** (2 / 3) };
  },
  // 一維熱方程式顯式一步：r = αΔt/Δx² ≤ 0.5，兩端固定
  heatStep(T, r) {
    let prev = T[0];
    for (let i = 1; i < T.length - 1; i++) { const cur = T[i]; T[i] = cur + r * (prev - 2 * cur + T[i + 1]); prev = cur; }
    return T;
  },
  // 傅立葉定律：q = k A ΔT / L
  fourier: (k, A, dT, L) => k * A * dT / L,
  lnFact,
  // 波茲曼熵 S/k = ln Ω，Ω = C(N, n)：N 顆粒子裡有 n 顆在左邊的排法數
  lnOmega: (N, n) => lnFact(N) - lnFact(n) - lnFact(N - n),
};

export default [
  {
    id: 'entropy', realm: 'classic', cat: '熱學', title: '熵與熱力學第二定律', en: 'Entropy · Second Law of Thermodynamics', keys: '熵 entropy 波茲曼 boltzmann 亂度',
    tex: ['S = k_B \\ln \\Omega', '\\Delta S_{\\text{孤立系統}} \\ge 0'],
    explain: '<p><b>熵</b>是在數「同一個巨觀狀態有幾種微觀排法」\\(\\Omega\\)。N 顆粒子全部擠在左邊只有 1 種排法；左右各一半的排法數是 \\(\\binom{N}{N/2}\\)，多到天文數字。</p><p>抽掉隔板後，粒子只是隨機亂跑，但系統幾乎必然走向排法最多的狀態——這就是<b>熵增加</b>，也是時間有方向的原因。粒子越多，自己跑回左邊的機率越小到不可能。</p>',
    watch: ['左下的熵曲線很快爬到最高點後就只在頂端小小抖動。', '粒子數調少（例如 20）：偶爾會看到明顯的漲落，左邊多右邊少。', '「全部放回左邊」等於外力做功讓熵下降，系統自己不會這樣做。'],
    params: [
      { k: 'N', label: '粒子數 N', min: 10, max: 600, step: 10, v: 240 },
      { k: 'T', label: '溫度（粒子速率）', min: 0.5, max: 4, step: 0.1, v: 2 },
    ],
    cam: [0, 6, 12], target: [0, 1.5, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const W = 4, H = 1.5, Dz = 1.5, MAX = 600;
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * W, 2 * H, 2 * Dz)), new THREE.LineBasicMaterial({ color: 0xf5b544, transparent: true, opacity: 0.45 }));
      const glass = U.box(2 * W, 2 * H, 2 * Dz, U.mat(0xf5b544, { opacity: 0.04, side: THREE.BackSide }));
      const wall = U.box(0.06, 2 * H, 2 * Dz, U.mat(0xf5b544, { opacity: 0.35, emissive: 0xf5b544, ei: 0.2 }));
      const g = new THREE.Group(); g.position.y = H + 0.05; g.add(box, glass, wall);
      const pts = U.points(MAX, 0xffffff, 0.14, true); g.add(pts);
      const lL = U.label('', { size: 0.42 }), lR = U.label('', { size: 0.42 });
      lL.position.set(-W / 2, 2 * H + 0.6, 0); lR.position.set(W / 2, 2 * H + 0.6, 0);
      root.add(g, lL, lR);
      const ch = chart({ title: '熵 S / k = ln Ω', x: [0, 20], y: [0, 1], xl: 't (s)', yl: 'S' });
      const c = new THREE.Color();
      let ps, open, tt, hist;
      const init = () => {
        ps = Array.from({ length: P.N }, () => {
          const d = U.V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
          return { x: -W + 0.1 + Math.random() * (W - 0.2), y: -H + 0.1 + Math.random() * (2 * H - 0.2), z: -Dz + 0.1 + Math.random() * (2 * Dz - 0.2), d, s: 0.6 + Math.random() * 0.8 };
        });
        open = false; wall.visible = true; tt = 0; hist = [];
      };
      init();
      return {
        actions: { '抽掉隔板': () => { open = true; wall.visible = false; }, '全部放回左邊': init },
        onParam(k) { if (k === 'N') init(); },
        update(dt) {
          let nL = 0;
          ps.forEach((p, i) => {
            const v = p.s * P.T;
            p.x += p.d.x * v * dt; p.y += p.d.y * v * dt; p.z += p.d.z * v * dt;
            if (p.x < -W) { p.x = -W; p.d.x *= -1; }
            if (p.x > W) { p.x = W; p.d.x *= -1; }
            if (!open && p.x > -0.03) { p.x = -0.03; p.d.x = -Math.abs(p.d.x); }
            if (Math.abs(p.y) > H) { p.y = Math.sign(p.y) * H; p.d.y *= -1; }
            if (Math.abs(p.z) > Dz) { p.z = Math.sign(p.z) * Dz; p.d.z *= -1; }
            if (p.x < 0) nL++;
            pts.pos[i * 3] = p.x; pts.pos[i * 3 + 1] = p.y; pts.pos[i * 3 + 2] = p.z;
            U.heat(p.s / 1.6, c).toArray(pts.col, i * 3);
          });
          pts.flush(ps.length);
          const N = ps.length, S = F.lnOmega(N, nL), Smax = F.lnOmega(N, Math.floor(N / 2));
          if (open) tt += dt;
          if (!hist.length || tt - hist.at(-1)[0] > 0.1) hist.push([tt, S / Smax]);
          if (tt > 20) hist = hist.filter(h => h[0] > tt - 20);
          ch.o.x = [Math.max(0, tt - 20), Math.max(20, tt)];
          ch.draw([{ pts: hist, color: '#f5b544', fill: 'rgba(245,181,68,.12)' }], [{ x: tt, y: S / Smax, color: '#fff' }]);
          lL.set(`左 ${nL}`); lR.set(`右 ${N - nL}`);
          out({ '微觀排法數 Ω': S < 2.3 ? Math.round(Math.exp(S)) + '' : '10^' + (S / Math.LN10).toFixed(1), 'S / k = ln Ω': S.toFixed(1), '最大可能 ln Ω': Smax.toFixed(1), '全回左邊的機率': open ? '2^−' + N : '—' });
        },
      };
    },
  },
  {
    id: 'idealgas', realm: 'classic', cat: '熱學', title: '理想氣體定律', en: 'Ideal Gas Law · PV = nRT', keys: '波以耳 查理 boyle charles 氣體 壓力',
    tex: 'PV = nRT',
    explain: '<p>氣體的壓力來自無數分子撞擊容器壁。溫度越高，分子跑得越快、撞得越用力，壓力越大；體積越小，分子撞到活塞越頻繁，壓力也越大。</p><p>合起來就是 \\(PV=nRT\\)：溫度固定時 \\(P \\propto 1/V\\)（<b>波以耳定律</b>），壓力固定時 \\(V \\propto T\\)（<b>查理定律</b>）。這裡是 1 莫耳氣體，\\(R = 8.314\\ \\text{J/(mol}\\cdot\\text{K)}\\)。</p>',
    watch: ['把體積調小：粒子撞活塞的次數變多，紅色壓力箭頭變長，右下的點沿著雙曲線往上爬。', '升高溫度：粒子變快、顏色偏紅，同樣的體積壓力等比例變大。', '溫度和體積同時加倍，壓力不變。'],
    params: [
      { k: 'T', label: '溫度 T', min: 100, max: 800, step: 10, v: 300, unit: 'K' },
      { k: 'V', label: '體積 V', min: 5, max: 25, step: 0.5, v: 12, unit: 'L' },
    ],
    cam: [5, 5, 10], target: [-1.2, 2.4, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const R = 1.5, N = 220, hOf = V => V / 5, RIN = R - 0.08;
      const wall = U.cyl(R, R, 5.6, U.mat(0x9fd8ff, { opacity: 0.1, side: THREE.DoubleSide }), 48, true); wall.position.y = 2.8;
      const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(R, R, 5.6, 48, 1, true)), new THREE.LineBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.35 })); ring.position.y = 2.8;
      const base = U.cyl(R + 0.15, R + 0.15, 0.14, U.mat(0x2a2f3c, { metal: 0.6 })); base.position.y = -0.07;
      const piston = U.cyl(R - 0.02, R - 0.02, 0.25, U.mat(0x3a3f4c, { metal: 0.7, rough: 0.3, emissive: 0xf5b544, ei: 0.06 }));
      const rod = U.cyl(0.1, 0.1, 3, U.mat(0x8a90a0, { metal: 0.8, rough: 0.2 }));
      const pA = U.arrow(0xff6b6b, 0.07), pL = U.label('P', { color: '#ff8a8a', size: 0.4 });
      const pts = U.points(N, 0xffffff, 0.13, true);
      root.add(wall, ring, base, piston, rod, pA, pL, pts);
      const ps = Array.from({ length: N }, () => {
        const r = Math.sqrt(Math.random()) * (RIN - 0.05), a = Math.random() * 6.283;
        return { p: U.V(r * Math.cos(a), Math.random() * 2, r * Math.sin(a)), d: U.V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), s: 0.5 + Math.random() };
      });
      const ch = chart({ title: 'P–V 圖：等溫線（虛線是 300 K）', x: [0, 26], y: [0, 1400], xl: 'V (L)', yl: 'P (kPa)' });
      const Vs = Array.from({ length: 60 }, (_, i) => 3 + i * 23 / 59);
      const ref = Vs.map(V => [V, F.idealP(1, 300, V)]);
      const c = new THREE.Color();
      let hits = 0, rate = 0, tw = 0, lastT = -1, iso = [];
      return {
        update(dt) {
          const h = hOf(P.V), sp = 1.5 * Math.sqrt(P.T / 300);
          piston.position.y = h + 0.125; rod.position.y = h + 1.75;
          ps.forEach((q, i) => {
            q.p.addScaledVector(q.d, q.s * sp * dt);
            if (q.p.y < 0) { q.p.y = 0; q.d.y = Math.abs(q.d.y); }
            if (q.p.y > h) { q.p.y = h; if (q.d.y > 0) { q.d.y = -q.d.y; hits++; } }
            const rr = Math.hypot(q.p.x, q.p.z);
            if (rr > RIN) {
              const nx = q.p.x / rr, nz = q.p.z / rr, dn = q.d.x * nx + q.d.z * nz;
              if (dn > 0) { q.d.x -= 2 * dn * nx; q.d.z -= 2 * dn * nz; }
              q.p.x = nx * RIN; q.p.z = nz * RIN;
            }
            q.p.toArray(pts.pos, i * 3);
            U.heat(q.s * sp / 4.6, c).toArray(pts.col, i * 3);
          });
          pts.flush();
          tw += dt; if (tw > 0.6) { rate = hits / tw; hits = 0; tw = 0; }
          const Pk = F.idealP(1, P.T, P.V);
          pA.set(U.V(R * 0.6, h + 0.3, 0), U.V(0, Pk / 420, 0));
          pL.position.set(R * 0.6 + 0.4, h + 0.4 + Pk / 420, 0);
          if (P.T !== lastT) { lastT = P.T; iso = Vs.map(V => [V, F.idealP(1, P.T, V)]); }
          ch.draw([{ pts: ref, color: 'rgba(255,255,255,.3)', dash: [4, 4], w: 1 }, { pts: iso, color: '#f5b544' }], [{ x: P.V, y: Pk, color: '#ff6b6b', r: 5 }]);
          out({ '壓力 P = nRT/V': Pk.toFixed(1) + ' kPa', 'PV / T（= nR）': (Pk * P.V / P.T).toFixed(2) + ' J/K', '分子方均根速率（N₂）': F.vrms(P.T).toFixed(0) + ' m/s', '撞活塞次數': rate.toFixed(0) + ' 次/秒' });
        },
      };
    },
  },
  {
    id: 'carnot', realm: 'classic', cat: '熱學', title: '卡諾循環', en: 'Carnot Cycle · Heat Engine', keys: '熱機 效率 carnot engine 熱力學',
    tex: ['\\eta = \\dfrac{W}{Q_h} = 1 - \\dfrac{T_c}{T_h}', 'TV^{\\gamma-1} = \\text{常數（絕熱）}'],
    explain: '<p>熱機從高溫熱庫吸熱 \\(Q_h\\)、做功 \\(W\\)、再把剩下的熱 \\(Q_c\\) 丟給低溫熱庫。卡諾循環由四段組成：<b>等溫膨脹 → 絕熱膨脹 → 等溫壓縮 → 絕熱壓縮</b>。</p><p>它是兩個溫度之間效率最高的熱機，效率只由兩個溫度決定：\\(\\eta = 1 - T_c/T_h\\)。P–V 圖圍起來的面積就是每一圈做的功。</p>',
    watch: ['底下的熱庫變紅時氣缸在吸熱、變藍時在放熱；灰色是隔熱（絕熱段）。', '絕熱膨脹時沒有吸熱，氣體靠自己的內能推活塞，所以溫度一路下降。', '把兩個溫度拉近：P–V 圖圍的面積變小，效率跟著下降。'],
    params: [
      { k: 'Th', label: '高溫熱庫 Th', min: 300, max: 900, step: 10, v: 600, unit: 'K' },
      { k: 'Tc', label: '低溫熱庫 Tc', min: 150, max: 600, step: 10, v: 300, unit: 'K' },
    ],
    cam: [7, 6, 13], target: [-1.5, 2.2, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const R = 1.4, N = 160, RIN = R - 0.08;
      const wall = U.cyl(R, R, 5.6, U.mat(0x9fd8ff, { opacity: 0.1, side: THREE.DoubleSide }), 48, true); wall.position.y = 2.8;
      const piston = U.cyl(R - 0.02, R - 0.02, 0.25, U.mat(0x3a3f4c, { metal: 0.7, rough: 0.3 }));
      const rod = U.cyl(0.1, 0.1, 3, U.mat(0x8a90a0, { metal: 0.8, rough: 0.2 }));
      const res = U.box(4.2, 0.6, 4.2, U.mat(0x444a58, { rough: 0.6 })); res.position.y = -0.3;
      const resL = U.label('', { size: 0.4 }); resL.position.set(0, 6.3, 0);
      const pts = U.points(N, 0xffffff, 0.13, true);
      root.add(wall, piston, rod, res, resL, pts);
      const ps = Array.from({ length: N }, () => {
        const r = Math.sqrt(Math.random()) * (RIN - 0.05), a = Math.random() * 6.283;
        return { p: U.V(r * Math.cos(a), Math.random() * 0.5, r * Math.sin(a)), d: U.V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), s: 0.5 + Math.random() };
      });
      const ch = chart({ title: 'P–V 圖（面積＝每圈做的功）', x: [0, 1], y: [0, 1], xl: 'V', yl: 'P' });
      const c = new THREE.Color(), HOT = new THREE.Color(0xff5a3c), COLD = new THREE.Color(0x3c8bff), INS = new THREE.Color(0x444a58);
      const NAMES = ['① 等溫膨脹（從高溫熱庫吸熱）', '② 絕熱膨脹（溫度下降）', '③ 等溫壓縮（放熱給低溫熱庫）', '④ 絕熱壓縮（溫度上升）'];
      let s = 0, key = '', loop = [], st;
      return {
        update(dt) {
          const Th = P.Th, Tc = Math.min(P.Tc, P.Th - 20);
          st = F.carnotStates(Th, Tc);
          if (key !== Th + ',' + Tc) {
            key = Th + ',' + Tc;
            loop = Array.from({ length: 201 }, (_, i) => { const q = F.carnotAt(Th, Tc, i / 50); return [q.V, q.T / q.V]; });
            ch.o.x = [0, st.V3 * 1.05]; ch.o.y = [0, Th / st.V1 * 1.1];
          }
          s = (s + dt * 0.3) % 4;
          const { V, T } = F.carnotAt(Th, Tc, s), stage = Math.floor(s);
          const h = 0.5 + 4.4 * (V - st.V1) / (st.V3 - st.V1);
          piston.position.y = h + 0.125; rod.position.y = h + 1.75;
          res.material.color.copy(stage === 0 ? HOT : stage === 2 ? COLD : INS);
          res.material.emissive.copy(stage === 0 ? HOT : stage === 2 ? COLD : INS).multiplyScalar(stage % 2 ? 0 : 0.35);
          resL.set(stage === 0 ? `高溫熱庫 ${Th} K` : stage === 2 ? `低溫熱庫 ${Tc} K` : '隔熱墊');
          const sp = 1.5 * Math.sqrt(T / 300);
          ps.forEach((q, i) => {
            q.p.addScaledVector(q.d, q.s * sp * dt);
            if (q.p.y < 0) { q.p.y = 0; q.d.y = Math.abs(q.d.y); }
            if (q.p.y > h) { q.p.y = h; q.d.y = -Math.abs(q.d.y); }
            const rr = Math.hypot(q.p.x, q.p.z);
            if (rr > RIN) { const nx = q.p.x / rr, nz = q.p.z / rr, dn = q.d.x * nx + q.d.z * nz; if (dn > 0) { q.d.x -= 2 * dn * nx; q.d.z -= 2 * dn * nz; } q.p.x = nx * RIN; q.p.z = nz * RIN; }
            q.p.toArray(pts.pos, i * 3);
            U.heat((T - 150) / 750, c).toArray(pts.col, i * 3);
          });
          pts.flush();
          ch.draw([{ pts: loop, color: '#f5b544' }], [{ x: V, y: T / V, color: '#fff', r: 5 }]);
          const eta = F.carnotEff(Th, Tc), Qh = 8.314 * Th * Math.log(st.V2 / st.V1);
          out({ '現在': NAMES[stage], '氣體溫度': T.toFixed(0) + ' K', '效率 η = 1 − Tc/Th': (eta * 100).toFixed(1) + '%', '每圈吸熱 Qh': Qh.toFixed(0) + ' J', '每圈做功 W': (Qh * eta).toFixed(0) + ' J' });
        },
      };
    },
  },
  {
    id: 'conduction', realm: 'classic', cat: '熱學', title: '熱傳導', en: "Heat Conduction · Fourier's Law", keys: '傅立葉 fourier 導熱 熱方程式',
    tex: ['q = -kA\\,\\dfrac{dT}{dx}', '\\dfrac{\\partial T}{\\partial t} = \\alpha\\,\\dfrac{\\partial^2 T}{\\partial x^2}'],
    explain: '<p>熱會自己從高溫流向低溫。棒子左端一直加熱、右端一直冰著，熱沿著棒子傳過去，每秒流過的熱量和<b>溫度梯度</b>成正比（傅立葉定律），比例常數 \\(k\\) 就是材料的導熱係數。</p><p>一開始溫度分布是彎的曲線，最後會變成一條<b>直線</b>（穩態）：這時每一段流進來的熱等於流出去的熱，溫度不再變化。銅比玻璃導熱快幾百倍。</p>',
    watch: ['左下的溫度曲線從彎曲慢慢拉直，最後貼在虛線（穩態）上。', '換成玻璃：熱要很久才傳到另一端（時間比例已放慢，不是真實秒數）。', '穩態時棒子中間的熱流量和兩端溫差成正比。'],
    params: [
      { k: 'Th', label: '熱端溫度', min: 60, max: 300, step: 5, v: 200, unit: '°C' },
      { k: 'Tc', label: '冷端溫度', min: 0, max: 40, step: 1, v: 0, unit: '°C' },
      { k: 'mat', label: '材料', options: [[400, '銅'], [237, '鋁'], [80, '鐵'], [1, '玻璃']], v: 400 },
    ],
    cam: [0, 4, 12], target: [0, 0.6, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const M = 48, Lv = 10, w = Lv / M, c = new THREE.Color();
      const segs = Array.from({ length: M }, (_, i) => { const m = U.box(w * 0.98, 0.7, 0.7, U.mat(0xffffff, { rough: 0.35, metal: 0.3 })); m.position.set(-Lv / 2 + w * (i + 0.5), 0.6, 0); root.add(m); return m; });
      const flame = U.mesh(new THREE.ConeGeometry(0.5, 1.4, 24), U.glow(0xff7a2c, 0.9)); flame.position.set(-Lv / 2 - 0.7, 0.8, 0);
      const ice = U.box(1, 1, 1, U.mat(0xbfe6ff, { opacity: 0.55, emissive: 0x3c8bff, ei: 0.25 })); ice.position.set(Lv / 2 + 0.7, 0.6, 0);
      const lH = U.label('', { color: '#ff9a6b', size: 0.4 }), lC = U.label('', { color: '#8fc8ff', size: 0.4 });
      lH.position.set(-Lv / 2 - 0.7, 2.1, 0); lC.position.set(Lv / 2 + 0.7, 1.7, 0);
      const fA = U.arrow(0xffd27a, 0.06);
      root.add(flame, ice, lH, lC, fA);
      const ch = chart({ title: '沿棒子的溫度（虛線＝穩態直線）', x: [0, 0.5], y: [0, 300], xl: 'x (m)', yl: 'T (°C)' });
      let T, time;
      const reset = () => { T = new Float64Array(M).fill(P.Tc); time = 0; };
      reset();
      return {
        actions: { '重來（整根回到冷端溫度）': reset },
        onParam(k) { if (k === 'mat') reset(); },
        update(dt, P2, t) {
          T[0] = P.Th; T[M - 1] = P.Tc;
          // ponytail: 擴散率用 √k 縮放，玻璃才看得到在動；不是真實時間
          const alpha = 0.06 * Math.sqrt(P.mat / 400), dx = 1 / (M - 1), sub = 0.4 * dx * dx / alpha;
          const n = Math.min(400, Math.ceil(dt / sub));
          for (let i = 0; i < n; i++) F.heatStep(T, alpha * (dt / n) / (dx * dx));
          time += dt;
          segs.forEach((m, i) => { U.heat(T[i] / 300, c); m.material.color.copy(c); m.material.emissive.copy(c).multiplyScalar(0.25); });
          flame.scale.y = 0.8 + 0.1 * Math.sin(t * 13) + P.Th / 600;
          lH.set(`${P.Th} °C`); lC.set(`${P.Tc} °C`);
          const mid = M >> 1, Lm = 0.5, A = 1e-4;
          const q = F.fourier(P.mat, A, T[mid - 1] - T[mid + 1], 2 * Lm / (M - 1));
          fA.set(U.V(-1.5, 1.5, 0), U.V(Math.min(3, Math.max(0.05, q / F.fourier(P.mat, A, 300, Lm) * 3)), 0, 0));
          ch.draw([
            { pts: [[0, P.Th], [Lm, P.Tc]], color: 'rgba(255,255,255,.35)', dash: [4, 4], w: 1 },
            { pts: Array.from(T, (v, i) => [i / (M - 1) * Lm, v]), color: '#f5b544' },
          ]);
          out({ '中間熱流 q': q.toFixed(2) + ' W', '穩態熱流': F.fourier(P.mat, A, P.Th - P.Tc, Lm).toFixed(2) + ' W', '中點溫度': T[mid].toFixed(1) + ' °C', '導熱係數 k': P.mat + ' W/(m·K)' });
        },
      };
    },
  },
];
