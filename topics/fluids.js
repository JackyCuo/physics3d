import { AMBER, CYAN, RED } from './palette.js';
// 經典物理・流體
export const F = {
  // 連續方程式：A1 v1 = A2 v2
  speedAt: (v1, r1, r) => v1 * (r1 / r) ** 2,
  // 白努利（同高度）：P1 + ½ρv1² = P2 + ½ρv2²
  pressureDrop: (rho, v1, v2) => 0.5 * rho * (v2 * v2 - v1 * v1),
  // 漂浮時沒入比例 = ρ物/ρ液（沉的話是 1）
  floatFraction: (rho, rf) => Math.min(1, rho / rf),
  hydraulic: (F1, A1, A2) => F1 * A2 / A1,
};


export default [
  {
    id: 'bernoulli', realm: 'classic', cat: '流體', title: '白努利定律', en: "Bernoulli's Principle", keys: '白努力 文氏管 venturi',
    tex: ['P + \\tfrac12\\rho v^2 + \\rho g h = \\text{常數}', 'A_1 v_1 = A_2 v_2'],
    explain: '<p>流體在管子裡流動時，<b>流得越快的地方壓力越小</b>。水流進變窄的喉部，因為每秒流過的水量一樣（\\(A_1v_1=A_2v_2\\)），截面積小就必須加速；多出來的動能來自壓力，所以喉部的壓力下降。</p><p>上面三支直立的玻璃管就是壓力計：液柱越高代表那裡的壓力越大。飛機機翼、噴霧器、文氏管流量計都是這個原理。</p>',
    watch: ['喉部的粒子跑得最快（顏色偏紅），上方的液柱也最矮。', '把「喉部粗細」調小：速度變成平方倍增加，壓力差急遽變大。', '進口和出口一樣粗，所以兩邊液柱高度相同——能量沒有消失。'],
    params: [
      { k: 'v1', label: '入口流速 v₁', min: 0.4, max: 2, step: 0.05, v: 1.2, unit: 'm/s' },
      { k: 'ratio', label: '喉部半徑／入口半徑', min: 0.45, max: 1, step: 0.01, v: 0.6 },
    ],
    cam: [3, 6, 19], target: [0, 1.6, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const R1 = 1.1, L = 8, RHO = 1000, G = 9.8, K = 0.5, N = 700;
      const r = x => R1 - (R1 - R1 * P.ratio) * (Math.abs(x) < 3 ? 0.5 * (1 + Math.cos(Math.PI * x / 3)) : 0);
      const pipe = U.mesh(new THREE.BufferGeometry(), U.mat(0x7fd6ff, { opacity: 0.16, rough: 0.05, metal: 0.2, side: THREE.DoubleSide }));
      const rim = U.mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x7fd6ff, wireframe: true, transparent: true, opacity: 0.08 }));
      pipe.rotation.z = rim.rotation.z = -Math.PI / 2;
      const build = () => {
        const pts = [];
        for (let i = 0; i <= 120; i++) { const x = -L + 2 * L * i / 120; pts.push(new THREE.Vector2(r(x), x)); }
        pipe.geometry.dispose(); rim.geometry.dispose();
        pipe.geometry = new THREE.LatheGeometry(pts, 48);
        rim.geometry = new THREE.LatheGeometry(pts.filter((_, i) => i % 4 === 0), 24);
      };
      build();
      const parts = U.points(N, 0xffffff, 0.11, true);
      const ps = Array.from({ length: N }, () => ({ x: -L + Math.random() * 2 * L, f: Math.sqrt(Math.random()) * 0.92, th: Math.random() * 6.283 }));
      root.add(pipe, rim, parts);
      const gx = [-5.5, 0, 5.5], tubes = gx.map((x, i) => {
        const glass = U.cyl(0.16, 0.16, 4.2, U.mat(0xffffff, { opacity: 0.12, side: THREE.DoubleSide }), 20, true);
        const liq = U.cyl(0.12, 0.12, 1, U.mat(0x4fd1e8, { emissive: 0x4fd1e8, ei: 0.35 }), 20);
        const lab = U.label(`P${'₁₂₃'[i]}`, { color: '#e9edf5', size: 0.38 });
        root.add(glass, liq, lab);
        return { x, glass, liq, lab };
      });
      const c = new THREE.Color();
      const ch = chart({ title: '沿管子：速度 v（橘）與壓力 P（青）', x: [-L, L], y: [0, 1.05], xl: 'x', yl: '' });
      return {
        onParam(k) { if (k === 'ratio') build(); },
        update(dt) {
          const v2 = F.speedAt(P.v1, R1, R1 * P.ratio), vmax = F.speedAt(2, 1, 0.45);
          const a = parts.pos;
          ps.forEach((p, i) => {
            const rx = r(p.x), v = F.speedAt(P.v1, R1, rx);
            p.x += v * dt * 1.4;
            if (p.x > L) p.x -= 2 * L;
            a[i * 3] = p.x; a[i * 3 + 1] = Math.cos(p.th) * rx * p.f; a[i * 3 + 2] = Math.sin(p.th) * rx * p.f;
            U.heat(v / vmax * 1.6, c).toArray(parts.col, i * 3);
          });
          parts.flush();
          const Pa = x => -F.pressureDrop(RHO, P.v1, F.speedAt(P.v1, R1, r(x)));   // 相對入口的壓力差
          const drop = F.pressureDrop(RHO, P.v1, v2);
          for (const t of tubes) {
            const top = r(t.x), h = 0.25 + K * (Pa(t.x) + F.pressureDrop(RHO, 0.4, F.speedAt(2, 1, 0.45))) / (RHO * G);
            t.glass.position.set(t.x, top + 2.1, 0);
            t.liq.scale.y = h; t.liq.position.set(t.x, top + h / 2, 0);
            t.lab.position.set(t.x, top + 4.6, 0);
          }
          const xs = Array.from({ length: 81 }, (_, i) => -L + 2 * L * i / 80);
          const pmin = -drop || -1;
          ch.draw([
            { pts: xs.map(x => [x, F.speedAt(P.v1, R1, r(x)) / v2]), color: '#f5b544' },
            { pts: xs.map(x => [x, 1 - Pa(x) / pmin * 0.9]), color: '#4fd1e8' },
          ]);
          out({ '入口 v₁': P.v1.toFixed(2) + ' m/s', '喉部 v₂': v2.toFixed(2) + ' m/s', 'P₁ − P₂': (drop / 1000).toFixed(2) + ' kPa', '½ρv² 增加': (drop / 1000).toFixed(2) + ' kPa' });
        },
      };
    },
  },
  {
    id: 'archimedes', realm: 'classic', cat: '流體', title: '阿基米德浮力原理', en: "Archimedes' Principle · Buoyancy", keys: '浮力 浮沉 密度 buoyancy',
    tex: ['F_B = \\rho_{\\text{液}}\\, V_{\\text{排開}}\\, g', '\\text{漂浮時}\\;\\dfrac{V_{\\text{沒入}}}{V} = \\dfrac{\\rho_{\\text{物}}}{\\rho_{\\text{液}}}'],
    explain: '<p>泡在液體裡的物體會受到向上的浮力，大小等於它<b>排開的液體重量</b>。因為液體越深壓力越大，物體底部被往上推的力比頂部往下壓的力大，差值就是浮力。</p><p>物體密度比液體小就會浮起來，而且沉到剛好「排開的液體重量 = 自身重量」為止；密度比液體大就沉底。鋼鐵做的船能浮，是因為整艘船（含裡面的空氣）的平均密度比水小。</p>',
    watch: ['方塊浮著不動時，紅色（重力）和青色（浮力）箭頭一樣長。', '密度調成 600：方塊剛好六成泡在水裡。', '換成水銀（13600 kg/m³）：連鐵塊（7870）都會浮起來。'],
    params: [
      { k: 'rho', label: '方塊密度', min: 100, max: 8000, step: 10, v: 600, unit: 'kg/m³' },
      { k: 'rf', label: '液體', options: [[1000, '清水'], [1025, '海水'], [790, '酒精'], [13600, '水銀']], v: 1000 },
    ],
    cam: [5, 4.5, 9], target: [0, 2.2, 0],
    setup({ THREE, root, U, P, out }) {
      const G = 9.8, W = 4, H0 = 2.4, TOP = 4.6;
      const tank = U.box(W, TOP, W, U.mat(0xbfe6ff, { opacity: 0.07, side: THREE.BackSide })); tank.position.y = TOP / 2;
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, TOP, W)), new THREE.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.35 }));
      edges.position.y = TOP / 2;
      const water = U.box(W - 0.04, 1, W - 0.04, U.mat(0x2f8fd8, { opacity: 0.32, rough: 0.1 }));
      const surf = U.mesh(new THREE.PlaneGeometry(W - 0.04, W - 0.04), U.glow(0x7fd6ff, 0.18)); surf.rotation.x = -Math.PI / 2;
      const block = U.box(1, 1, 1, U.mat(0xb08a5a, { rough: 0.7 }));
      const wA = U.arrow(RED, 0.06), bA = U.arrow(CYAN, 0.06);
      const wL = U.label('重力', { color: '#ff6b6b', size: 0.34 }), bL = U.label('浮力', { color: '#4fd1e8', size: 0.34 });
      const status = U.label('', { size: 0.42 }); status.position.set(0, TOP + 0.8, 0);
      root.add(tank, edges, water, surf, block, wA, bA, wL, bL, status);
      const wood = new THREE.Color(0xb08a5a), steel = new THREE.Color(0x8d96a8), c = new THREE.Color();
      let y, v, sub = 0;
      const drop = () => { y = TOP + 1; v = 0; };
      drop();
      return {
        actions: { '重新丟下去': drop },
        update(dt) {
          const level = H0 + sub / (W * W);
          const steps = 10, h = dt / steps;
          for (let i = 0; i < steps; i++) {
            sub = U.clamp(level - (y - 0.5), 0, 1);
            const a = (P.rf * sub * G - P.rho * G) / P.rho - (sub > 0 ? 2.5 : 0) * v;
            v += a * h; y += v * h;
            if (y < 0.5) { y = 0.5; v = Math.max(0, v); }
          }
          block.position.y = y;
          block.material.color.copy(c.copy(wood).lerp(steel, U.clamp((P.rho - 900) / 3000, 0, 1)));
          water.scale.y = level; water.position.y = level / 2;
          surf.position.y = level + 0.001;
          water.material.color.set(P.rf > 5000 ? 0xc8ccd6 : P.rf < 900 ? 0x8fb8d8 : 0x2f8fd8);
          const Wt = P.rho * G, B = P.rf * sub * G, sc = 1.8 / Math.max(Wt, B, 1);
          wA.set(U.V(-0.15, y, 0.6), U.V(0, -Wt * sc, 0)); bA.set(U.V(0.15, y - 0.5 + sub / 2, 0.6), U.V(0, B * sc, 0));
          wL.position.set(-0.75, y - Wt * sc - 0.2, 0.6); bL.position.set(0.75, y - 0.5 + sub / 2 + B * sc + 0.2, 0.6);
          bL.visible = B > 1;
          const floats = P.rho < P.rf;
          status.set(floats ? `浮起：${(F.floatFraction(P.rho, P.rf) * 100).toFixed(0)}% 泡在液體裡` : '沉到底');
          out({ '重量 ρVg': (Wt / 1000).toFixed(2) + ' kN', '浮力 ρ液 V排 g': (B / 1000).toFixed(2) + ' kN', '目前沒入比例': (sub * 100).toFixed(0) + '%', '平衡時沒入': floats ? (F.floatFraction(P.rho, P.rf) * 100).toFixed(0) + '%' : '100%（沉底）', '液面上升': (sub / (W * W) * 100).toFixed(1) + ' cm' });
        },
      };
    },
  },
  {
    id: 'pascal', realm: 'classic', cat: '流體', title: '帕斯卡原理（液壓機）', en: "Pascal's Principle · Hydraulic Press", keys: '帕斯卡 液壓 千斤頂 hydraulic',
    tex: ['P = \\dfrac{F_1}{A_1} = \\dfrac{F_2}{A_2}', 'F_1 d_1 = F_2 d_2'],
    explain: '<p>對密閉液體施加的壓力，會<b>原封不動地傳到液體的每一個地方</b>。小活塞面積小，只要很小的力就能產生很大的壓力；同樣的壓力作用在大活塞上，乘上大面積就變成很大的力。汽車千斤頂、油壓剎車、挖土機都是這樣。</p><p>但能量沒有變多：小活塞要壓下很長一段，大活塞才升高一點點，\\(F_1d_1 = F_2d_2\\)。</p>',
    watch: ['兩個活塞的壓力讀數永遠一樣。', '大活塞面積是小活塞的幾倍，力就放大幾倍，但升高的距離縮小同樣倍數。', '大活塞半徑調大，升降幾乎看不出來——省力不省功。'],
    params: [
      { k: 'F1', label: '施力 F₁', min: 10, max: 300, step: 5, v: 100, unit: 'N' },
      { k: 'r1', label: '小活塞半徑', min: 0.15, max: 0.5, step: 0.01, v: 0.25, unit: 'm' },
      { k: 'r2', label: '大活塞半徑', min: 0.6, max: 1.4, step: 0.01, v: 1, unit: 'm' },
    ],
    cam: [0, 4, 12.5], target: [-0.4, 2, 0],
    setup({ THREE, root, U, P, out }) {
      const X1 = -2.6, X2 = 1.4, BASE = 0.5, L0 = 2.2, STROKE = 1.2;
      const glassMat = U.mat(0xbfe6ff, { opacity: 0.12, side: THREE.DoubleSide });
      const liqMat = U.mat(0x4fd1e8, { opacity: 0.55, emissive: 0x4fd1e8, ei: 0.15 });
      const mk = x => {
        const glass = U.cyl(1, 1, 3.4, glassMat, 40, true); glass.position.set(x, BASE + 1.7, 0);
        const liq = U.cyl(1, 1, 1, liqMat, 40);
        const pis = U.cyl(1, 1, 0.14, U.mat(0x8d96a8, { metal: 0.8, rough: 0.25 }), 40);
        root.add(glass, liq, pis);
        return { x, glass, liq, pis };
      };
      const s = mk(X1), b = mk(X2);
      const pipe = U.box(X2 - X1, 0.4, 0.4, liqMat); pipe.position.set((X1 + X2) / 2, BASE - 0.2 + 0.2, 0);
      const pipeG = U.box(X2 - X1 + 0.1, 0.5, 0.5, glassMat); pipeG.position.copy(pipe.position);
      const rod = U.beam(0x8d96a8, 0.05, U.mat(0x8d96a8, { metal: 0.8 }));
      const load = U.box(1, 0.8, 1, U.mat(0x30343f, { metal: 0.5, emissive: AMBER, ei: 0.1 }));
      const f1 = U.arrow(AMBER, 0.06), f2 = U.arrow(CYAN, 0.07);
      const l1 = U.label('', { color: '#f5b544', size: 0.34 }), l2 = U.label('', { color: '#4fd1e8', size: 0.34 }), pL = U.label('', { size: 0.34 });
      root.add(pipe, pipeG, rod, load, f1, f2, l1, l2, pL);
      const len = F => 0.5 + 0.7 * Math.log10(1 + F / 10);
      return {
        update(dt, P, t) {
          const A1 = Math.PI * P.r1 ** 2, A2 = Math.PI * P.r2 ** 2, d1 = STROKE * (1 - Math.cos(t * 1.6)) / 2, d2 = d1 * A1 / A2;
          const F2 = F.hydraulic(P.F1, A1, A2), pr = P.F1 / A1;
          for (const [c, r, top] of [[s, P.r1, L0 - d1], [b, P.r2, L0 + d2]]) {
            c.glass.scale.set(r + 0.04, 1, r + 0.04);
            c.liq.scale.set(r, top - BASE + 0.2, r); c.liq.position.set(c.x, (top + BASE - 0.2) / 2, 0);
            c.pis.scale.set(r, 1, r); c.pis.position.set(c.x, top + 0.07, 0);
          }
          rod.set(U.V(X1, L0 - d1 + 0.14, 0), U.V(X1, L0 - d1 + 1.6, 0));
          load.scale.set(P.r2 * 1.2, 1, P.r2 * 1.2); load.position.set(X2, L0 + d2 + 0.55, 0);
          const a1 = len(P.F1), a2 = len(F2);
          f1.set(U.V(X1, L0 - d1 + 1.6 + a1, 0), U.V(0, -a1, 0)); f2.set(U.V(X2 + P.r2 + 0.35, L0 + d2 - 0.2, 0), U.V(0, a2, 0));
          l1.set(`F₁ = ${P.F1.toFixed(0)} N`); l1.position.set(X1, L0 - d1 + 1.9 + a1, 0);
          l2.set(`F₂ = ${F2.toFixed(0)} N`); l2.position.set(X2 + P.r2 + 0.35, L0 + d2 + a2, 0);
          pL.set(`P = ${pr.toFixed(0)} Pa（處處相同）`); pL.position.set((X1 + X2) / 2, 0.1, 0.8);
          out({ '壓力 P = F₁/A₁': pr.toFixed(0) + ' Pa', '大活塞的力 F₂': F2.toFixed(0) + ' N', '力的放大倍數': (A2 / A1).toFixed(1) + ' 倍', '小活塞下降 d₁': d1.toFixed(2) + ' m', '大活塞上升 d₂': d2.toFixed(3) + ' m', 'F₁d₁ vs F₂d₂': (P.F1 * d1).toFixed(1) + ' / ' + (F2 * d2).toFixed(1) + ' J' });
        },
      };
    },
  },
];
