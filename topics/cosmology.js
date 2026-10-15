// 理論物理・宇宙學（時間單位 1/H₀，今天 a = 1）
export const F = {
  // 解弗里德曼方程：ä = −Ωm/(2a²) + ΩΛ a，起點 a=0.01、ȧ 由第一條方程給
  curve(Om, OL, tmax = 3, h = 0.002) {
    const Ok = 1 - Om - OL, E = a => Om / a + Ok + OL * a * a;
    let a = 0.01, v = Math.sqrt(Math.max(E(a), 0)), t = Om > 0 ? (2 / 3) * a ** 1.5 / Math.sqrt(Om) : 0;
    const acc = a => -Om / (2 * a * a) + OL * a, pts = [[t, a, v / a]];
    const step = dt => {   // RK4
      const k1a = v, k1v = acc(a), k2a = v + dt / 2 * k1v, k2v = acc(a + dt / 2 * k1a), k3a = v + dt / 2 * k2v, k3v = acc(a + dt / 2 * k2a), k4a = v + dt * k3v, k4v = acc(a + dt * k3a);
      a += dt / 6 * (k1a + 2 * k2a + 2 * k3a + k4a); v += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    };
    // 輸出固定間隔 h；早期 a 很小、變化很快，裡面再切細
    while (t < tmax && a > 0.009 && a < 8) {
      for (let left = h; left > 1e-12;) { const d = Math.min(left, 0.005 * a / (Math.abs(v) + 1e-9), 0.005 * Math.sqrt(a ** 3)); step(d); left -= d; if (a <= 0.009) break; }
      t += h;
      pts.push([t, a, v / a]);
    }
    return pts;
  },
  hubbleV: (H0, d) => H0 * d,              // km/s，d 用 Mpc
  hubbleTime: H0 => 977.8 / H0,            // 1/H₀ 換成十億年
};

export default [
  {
    id: 'friedmann', realm: 'theory', cat: '宇宙學', title: '弗里德曼方程', en: 'Friedmann Equations · Expanding Universe', keys: '弗里曼 宇宙膨脹 大霹靂 暗能量 dark energy',
    tex: ['H^2 = \\left(\\dfrac{\\dot a}{a}\\right)^2 = \\dfrac{8\\pi G}{3}\\rho - \\dfrac{kc^2}{a^2} + \\dfrac{\\Lambda c^2}{3}', '\\dfrac{\\ddot a}{a} = -\\dfrac{4\\pi G}{3}\\left(\\rho + \\dfrac{3p}{c^2}\\right) + \\dfrac{\\Lambda c^2}{3}'],
    explain: '<p>從廣義相對論推出來的宇宙膨脹方程。\\(a(t)\\) 是<b>尺度因子</b>：今天 \\(a=1\\)，\\(a=0.5\\) 代表當時任兩個星系的距離只有今天的一半。星系本身沒有在空間裡跑，是<b>空間本身被撐開</b>。</p><p>物質（\\(\\Omega_m\\)）的重力讓膨脹減速，暗能量（\\(\\Omega_\\Lambda\\)）讓膨脹加速；兩者加起來決定空間的曲率 \\(\\Omega_k = 1-\\Omega_m-\\Omega_\\Lambda\\)。</p><p>我們的宇宙大約是 \\(\\Omega_m \\approx 0.3,\\ \\Omega_\\Lambda \\approx 0.7\\)：前段減速、後段加速膨脹，曲線先凹後凸。</p>',
    watch: ['白框是一個「跟著空間走」的立方體，框裡的星系數量永遠不變。', '把 ΩΛ 調成 0、Ωm 調到 2 以上：宇宙膨脹到最大後再塌縮（大擠壓）。', '只有物質（Ωm=1、ΩΛ=0）時，a(t) ∝ t^{2/3}，永遠減速但不停止。'],
    params: [
      { k: 'Om', label: '物質密度 Ωm', min: 0, max: 3, step: 0.05, v: 0.3 },
      { k: 'OL', label: '暗能量 ΩΛ', min: 0, max: 1.5, step: 0.05, v: 0.7 },
    ],
    grid: false, cam: [10, 8, 15], target: [0, 0, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const n = 7, gal = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        const j3 = () => (Math.random() - 0.5) * 0.5;
        gal.push([i - 3 + j3(), j - 3 + j3(), k - 3 + j3()]);
      }
      const pts = U.points(gal.length, 0xffffff, 0.22, true), c = new THREE.Color();
      gal.forEach((g, i) => c.setHSL(0.6 + Math.random() * 0.15, 0.6, 0.6 + Math.random() * 0.3).toArray(pts.col, i * 3));
      const home = U.sphere(0.12, U.glow(0xa78bfa));
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
      const rulers = [U.line(2, 0xa78bfa), U.line(2, 0xa78bfa)];
      const dL = U.label('', { color: '#c9b8ff', size: 0.4 });
      root.add(pts, home, box, dL, ...rulers);
      const ch = chart({ title: '尺度因子 a(t)', x: [0, 1], y: [0, 1], xl: 't (1/H₀)', yl: 'a' });
      let cv, key = '', tau = 0, t0 = 0, amax = 1;
      return {
        update(dt, P) {
          const k = P.Om + ',' + P.OL;
          if (k !== key) {
            key = k; cv = F.curve(P.Om, P.OL); tau = 0;
            const now = cv.find(p => p[1] >= 1); t0 = now ? now[0] : null;
            amax = Math.max(1.5, Math.min(8, Math.max(...cv.map(p => p[1])) * 1.1));
          }
          tau += dt * 0.35;
          const tEnd = cv.at(-1)[0];
          if (tau > tEnd + 0.4) tau = 0;
          const idx = Math.min(cv.length - 1, Math.max(0, Math.round((tau - cv[0][0]) / 0.002)));
          const [tt, a, H] = cv[idx];
          const s = a * 1.6;
          gal.forEach((g, i) => { pts.pos[i * 3] = g[0] * s; pts.pos[i * 3 + 1] = g[1] * s; pts.pos[i * 3 + 2] = g[2] * s; });
          pts.flush();
          box.scale.setScalar(s);
          rulers[0].set([U.V(0, 0, 0), U.V(gal[0][0] * s, gal[0][1] * s, gal[0][2] * s)]);
          const far = gal.at(-1);
          rulers[1].set([U.V(0, 0, 0), U.V(far[0] * s, far[1] * s, far[2] * s)]);
          dL.set(`a = ${a.toFixed(2)}`); dL.position.set(0, 3.6 * s + 0.6, 0);
          ch.o.x = [0, Math.max(1, tEnd)]; ch.o.y = [0, amax];
          const marks = [{ x: tt, y: a, color: '#a78bfa', r: 5 }];
          if (t0 != null) marks.push({ x: t0, y: 1, color: 'rgba(255,255,255,.7)', r: 3, text: '今天' });
          ch.draw([{ pts: cv.filter((_, i) => i % 10 === 0).map(p => [p[0], p[1]]), color: '#a78bfa' }], marks);
          const Ok = 1 - P.Om - P.OL;
          const acc = -P.Om / (2 * a * a) + P.OL * a;
          const recollapse = cv.at(-1)[1] < 0.02;
          out({ '曲率 Ωk': Ok.toFixed(2) + (Math.abs(Ok) < 0.01 ? '（平坦）' : Ok > 0 ? '（開放）' : '（封閉）'), '尺度因子 a': a.toFixed(3), '哈伯參數 H/H₀': H.toFixed(3), '此刻': acc > 0 ? '加速膨脹' : H > 0 ? '減速膨脹' : '收縮中', '宇宙結局': recollapse ? '大擠壓' : P.OL > 0 ? '永遠加速膨脹' : '永遠膨脹', '今天的年齡': t0 != null ? Math.round(t0 * 144) + ' 億年' : '—' });
        },
      };
    },
  },
  {
    id: 'hubble', realm: 'theory', cat: '宇宙學', title: '哈伯定律', en: "Hubble–Lemaître Law", keys: '哈伯 hubble 紅移 redshift 宇宙膨脹 哈伯常數',
    tex: ['v = H_0\\, d', 'z \\approx \\dfrac{v}{c}'],
    explain: '<p>1929 年哈伯發現：<b>星系離我們越遠，遠離的速度越快</b>，而且剛好成正比，比例常數就是哈伯常數 \\(H_0 \\approx 70\\ \\text{km/s/Mpc}\\)。</p><p>這不代表我們在宇宙中心——空間均勻膨脹時，<b>從任何一個星系看出去都是這樣</b>。遠離的星系光波被拉長，顏色往紅色偏（紅移）。把時間倒推，\\(1/H_0\\) 大約就是宇宙的年齡。</p>',
    watch: ['顏色代表紅移：越遠的星系越紅、跑越快。', '左下圖每個點是一個星系，全部落在同一條直線上，斜率就是 H₀。', 'H₀ 調大，宇宙膨脹得快，推算出來的年齡就變小。'],
    params: [{ k: 'H0', label: '哈伯常數 H₀', min: 50, max: 100, step: 1, v: 70, unit: 'km/s/Mpc' }],
    grid: false, cam: [8, 7, 14], target: [0, 0, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const N = 70, D = 9;   // 畫面 1 單位 = 100 Mpc
      const home = U.sphere(0.25, U.mat(0x111111, { emissive: 0xa78bfa }));
      const lH = U.label('我們', { color: '#c9b8ff', size: 0.38 }); lH.position.y = 0.6;
      const gs = Array.from({ length: N }, () => {
        const m = U.sphere(0.06 + Math.random() * 0.1, U.glow(0xffffff));
        root.add(m);
        return { m, dir: U.V(Math.random() - 0.5, (Math.random() - 0.5) * 0.7, Math.random() - 0.5).normalize(), d: 0.5 + Math.random() * D };
      });
      const rays = [0, 1, 2].map(() => U.line(2, 0xa78bfa, 0.5, true));
      root.add(home, lH, ...rays);
      const ch = chart({ title: '速度 v 對距離 d', x: [0, D * 100], y: [0, 100 * D * 100], xl: 'd (Mpc)', yl: 'v (km/s)' });
      const c = new THREE.Color();
      return {
        update(dt, P) {
          const rate = P.H0 / 70 * 0.06;   // 畫面上的膨脹速率（放大過）
          for (const g of gs) {
            g.d += g.d * rate * dt;
            if (g.d > D) g.d = 0.5 + Math.random() * 1.5;
            g.m.position.copy(g.dir).multiplyScalar(g.d);
            g.m.material.color.copy(c.setHSL(0.62 * (1 - g.d / D), 0.85, 0.62));   // 越遠越紅
          }
          rays.forEach((r, i) => r.set([U.V(), gs[i].m.position]));
          ch.draw([{ pts: [[0, 0], [D * 100, F.hubbleV(P.H0, D * 100)]], color: 'rgba(167,139,250,.5)', dash: [4, 4], w: 1 }],
            gs.map(g => ({ x: g.d * 100, y: F.hubbleV(P.H0, g.d * 100), r: 2.5, color: '#' + g.m.material.color.getHexString() })));
          const far = gs.reduce((a, b) => a.d > b.d ? a : b);
          out({ '哈伯時間 1/H₀': F.hubbleTime(P.H0).toFixed(1) + ' 十億年', '100 Mpc 處速度': F.hubbleV(P.H0, 100).toFixed(0) + ' km/s', '最遠星系': (far.d * 100).toFixed(0) + ' Mpc', '它的紅移 z': (F.hubbleV(P.H0, far.d * 100) / 3e5).toFixed(3) });
        },
      };
    },
  },
];
