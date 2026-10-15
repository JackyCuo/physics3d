import { AMBER, CYAN, RED, WHITE } from './palette.js';
// 經典物理・力學
export const F = {
  accel: (force, m) => force / m,
  // 互推後：m1 v1 + m2 v2 = 0
  recoil: (m1, m2, J) => [-J / m1, J / m2],
  range: (v, th, g = 9.8) => v * v * Math.sin(2 * th) / g,
  flightTime: (v, th, g = 9.8) => 2 * v * Math.sin(th) / g,
  maxHeight: (v, th, g = 9.8) => (v * Math.sin(th)) ** 2 / (2 * g),
  centripetal: (v, r) => v * v / r,
  // 單擺精確週期 T = 4√(L/g) K(sin(θ0/2))；K 用算術幾何平均（AGM）算
  pendulumPeriod(L, g, th0) {
    let a = 1, b = Math.cos(th0 / 2);
    for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
    return 2 * Math.PI * Math.sqrt(L / g) / a;
  },
  springOmega: (k, m) => Math.sqrt(k / m),
  // 一維碰撞，e 是恢復係數（1 彈性、0 黏在一起）
  collide(m1, m2, u1, u2, e) {
    const p = m1 * u1 + m2 * u2, M = m1 + m2;
    return [(p + m2 * e * (u2 - u1)) / M, (p + m1 * e * (u1 - u2)) / M];
  },
  spinRate: (I1, w1, I2) => I1 * w1 / I2,
  orbitSpeed: (GM, r) => Math.sqrt(GM / r),
  escapeSpeed: (GM, r) => Math.sqrt(2 * GM / r),
  keplerPeriod: (a, GM) => 2 * Math.PI * Math.sqrt(a ** 3 / GM),
  // 解克卜勒方程 E − e sinE = M（牛頓法）
  eccAnomaly(M, e) { let E = e < 0.8 ? M : Math.PI; for (let i = 0; i < 30; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; },
};


export default [
  {
    id: 'newton1', realm: 'classic', cat: '力學', title: '牛頓第一定律', en: "Newton's First Law · Inertia", keys: '慣性 inertia',
    tex: '\\sum \\vec F = 0 \\;\\Rightarrow\\; \\vec v = \\text{常數}',
    explain: '<p>沒有外力時，靜止的物體維持靜止，運動中的物體維持<b>等速直線</b>運動。我們平常看到東西會停下來，是因為有摩擦力這個「外力」。</p><p>把摩擦係數 \\(\\mu\\) 拉到 0，冰上的冰球就會永遠滑下去。</p>',
    watch: ['每 0.5 秒留下一個記號：間距一樣＝速度不變。', '有摩擦時記號越來越密，代表在減速；紅色箭頭是摩擦力，方向永遠和速度相反。'],
    params: [
      { k: 'mu', label: '摩擦係數 μ', min: 0, max: 0.3, step: 0.01, v: 0 },
      { k: 'v0', label: '初速度', min: 1, max: 6, step: 0.1, v: 3, unit: 'm/s' },
    ],
    cam: [0, 7, 11], target: [0, 0, 0],
    setup({ root, U, P, out }) {
      const ice = U.box(24, 0.2, 5, U.mat(0x9fd8ff, { opacity: 0.18, rough: 0.05, metal: 0.3 }));
      ice.position.y = -0.1;
      const puck = U.cyl(0.5, 0.5, 0.3, U.mat(0x22252e, { metal: 0.6, rough: 0.3, emissive: AMBER, ei: 0.08 }));
      const ring = U.cyl(0.52, 0.52, 0.06, U.glow(AMBER), 32, true);
      puck.add(ring);
      const vA = U.arrow(CYAN), fA = U.arrow(RED);
      const vL = U.label('v', { color: '#4fd1e8', size: 0.4 }), fL = U.label('f', { color: '#ff6b6b', size: 0.4 });
      const marks = [];
      root.add(ice, puck, vA, fA, vL, fL);
      let x, v, mt;
      const reset = () => { x = -11; v = P.v0; mt = 0; marks.splice(0).forEach(m => root.remove(m)); };
      reset();
      return {
        actions: { '再推一次': reset },
        update(dt) {
          const a = v > 0 ? -P.mu * 9.8 : 0;
          v = Math.max(0, v + a * dt);
          x += v * dt;
          if (x > 11.5) reset();
          puck.position.set(x, 0.15, 0);
          vA.set(U.V(x, 0.7, 0), U.V(v * 0.5, 0, 0));
          fA.set(U.V(x, 0.35, 0.9), U.V(a ? -P.mu * 4 : 0, 0, 0));
          vL.position.set(x + v * 0.5 + 0.3, 0.9, 0);
          fL.visible = !!a; fL.position.set(x - P.mu * 4 - 0.3, 0.55, 0.9);
          mt += dt;
          if (mt >= 0.5 && v > 0) {
            mt = 0;
            const m = U.cyl(0.08, 0.08, 0.02, U.glow(AMBER, 0.6));
            m.position.set(x, 0.01, -1); root.add(m); marks.push(m);
          }
          out({ '速度 v': v.toFixed(2) + ' m/s', '加速度 a': a.toFixed(2) + ' m/s²', '合力': a ? '摩擦力' : '0（等速）' });
        },
      };
    },
  },
  {
    id: 'newton2', realm: 'classic', cat: '力學', title: '牛頓第二定律', en: "Newton's Second Law · F = ma", keys: 'f=ma 加速度',
    tex: '\\vec F = m\\,\\vec a',
    explain: '<p>合力越大，加速度越大；質量越大，越難推動。加速度 \\(a = F/m\\)，方向和合力相同。</p><p>速度隨時間<b>線性</b>增加（左下的 v–t 圖是一條直線），斜率就是加速度。</p>',
    watch: ['把質量加倍、力不變：v–t 圖斜率變一半。', '車子大小代表質量；橘色是外力，青色是加速度。'],
    params: [
      { k: 'f', label: '推力 F', min: 0, max: 20, step: 0.5, v: 8, unit: 'N' },
      { k: 'm', label: '質量 m', min: 0.5, max: 8, step: 0.1, v: 2, unit: 'kg' },
    ],
    cam: [0, 5, 13], target: [0, 0.5, 0],
    setup({ root, U, P, out, chart }) {
      const rail = U.box(26, 0.1, 1.6, U.mat(0x2a2f3c, { metal: 0.6 }));
      rail.position.y = -0.05;
      const cart = U.box(1, 1, 1, U.mat(0x30343f, { metal: 0.5, rough: 0.35, emissive: AMBER, ei: 0.06 }));
      const fA = U.arrow(AMBER, 0.07), aA = U.arrow(CYAN);
      const fL = U.label('F', { color: '#f5b544' }), aL = U.label('a', { color: '#4fd1e8' });
      root.add(rail, cart, fA, aA, fL, aL);
      const ch = chart({ title: '速度–時間', x: [0, 4], y: [0, 20], xl: 't (s)', yl: 'v (m/s)' });
      let x, v, tt, hist;
      const reset = () => { x = -12; v = 0; tt = 0; hist = []; };
      reset();
      return {
        actions: { '回到起點': reset },
        update(dt) {
          const a = F.accel(P.f, P.m);
          v += a * dt; x += v * dt; tt += dt;
          if (x > 12 || tt > 4) reset();
          const s = Math.cbrt(P.m / 2) * 1.1;
          cart.scale.setScalar(s);
          cart.position.set(x, s / 2, 0);
          fA.set(U.V(x - s / 2 - P.f * 0.18 - 0.05, s / 2, 0), U.V(P.f * 0.18, 0, 0));
          aA.set(U.V(x, s + 0.3, 0), U.V(a * 0.25, 0, 0));
          fL.position.set(x - s / 2 - P.f * 0.09, s / 2 + 0.45, 0);
          aL.position.set(x + a * 0.25 + 0.3, s + 0.3, 0);
          if (!hist.length || tt - hist.at(-1)[0] > 0.03) hist.push([tt, v]);
          ch.draw([{ pts: [[0, 0], [4, a * 4]], color: 'rgba(255,255,255,.15)', dash: [4, 4], w: 1 }, { pts: hist }], [{ x: tt, y: v }]);
          out({ '加速度 a = F/m': a.toFixed(2) + ' m/s²', '速度 v': v.toFixed(2) + ' m/s', '動量 p = mv': (P.m * v).toFixed(2) + ' kg·m/s' });
        },
      };
    },
  },
  {
    id: 'newton3', realm: 'classic', cat: '力學', title: '牛頓第三定律', en: "Newton's Third Law · Action–Reaction", keys: '作用力 反作用力',
    tex: '\\vec F_{12} = -\\vec F_{21}',
    explain: '<p>A 推 B 的同時，B 也用<b>大小相同、方向相反</b>的力推 A。兩個力作用在不同物體上，所以不會互相抵消。</p><p>力一樣大，但質量小的那個加速度大，所以飛得比較快：\\(m_1 v_1 = m_2 v_2\\)，總動量維持 0。</p>',
    watch: ['兩人的手貼在一起時（白光閃的地方）才有力，兩支紅箭頭永遠一樣長、方向相反。', '手臂打直推不動了，手一分開，力就消失，之後各自等速飄走。', '把其中一人質量調大：他後退得慢，另一人飛得快。'],
    params: [
      { k: 'm1', label: '左邊太空人質量 m₁', min: 40, max: 150, step: 1, v: 60, unit: 'kg' },
      { k: 'm2', label: '右邊太空人質量 m₂', min: 40, max: 150, step: 1, v: 100, unit: 'kg' },
      { k: 'f', label: '推力', min: 50, max: 400, step: 10, v: 200, unit: 'N' },
    ],
    grid: false, cam: [0, 3, 12], target: [0, 1, 0],
    setup({ THREE, root, U, P, out }) {
      const stars = U.points(400, WHITE, 0.07);
      for (let i = 0; i < 400; i++) { const r = 30 + Math.random() * 20, th = Math.random() * 6.28, ph = Math.acos(2 * Math.random() - 1); stars.pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); }
      stars.flush();
      const body = (c) => {
        const g = new THREE.Group();
        const torso = U.sphere(0.55, U.mat(0xdfe3ea, { rough: 0.6 }));
        torso.scale.set(1, 1.35, 0.8);
        const visor = U.sphere(0.28, U.mat(c, { metal: 0.8, rough: 0.15, emissive: c, ei: 0.25 }));
        visor.position.set(0, 1.0, 0.18);
        const helm = U.sphere(0.4, U.mat(0xeef0f4, { rough: 0.5 }));
        helm.position.y = 1.0;
        g.add(torso, helm, visor);
        return g;
      };
      const A = body(AMBER), B = body(CYAN);
      // 手臂：高度 1 的圓柱轉成水平，scale.y＝長度；從肩膀伸到手的位置
      const arm = c => { const g = new THREE.Group(), m = U.cyl(0.09, 0.09, 1, U.mat(0xdfe3ea, { rough: 0.6 })), h = U.sphere(0.14, U.mat(c, { emissive: c, ei: 0.3 })); m.rotation.z = Math.PI / 2; g.add(m, h); g.set = (x0, x1) => { m.scale.y = Math.abs(x1 - x0); m.position.x = (x0 + x1) / 2; h.position.x = x1; }; g.position.y = 1.3; return g; };
      const armA = arm(AMBER), armB = arm(CYAN);
      const spark = U.sphere(0.22, U.glow(0xffffff, 0.85)); spark.position.y = 1.3;
      const fA = U.arrow(RED, 0.08), fB = U.arrow(RED, 0.08), vA = U.arrow(AMBER), vB = U.arrow(CYAN);
      const lA = U.label('F₂₁（B 推 A）', { color: '#ff6b6b' }), lB = U.label('F₁₂（A 推 B）', { color: '#ff6b6b' });
      root.add(stars, A, B, armA, armB, spark, fA, fB, vA, vB, lA, lB);
      const REST = 0.45, REACH = 1.1;   // 手臂平常長度、打直的長度（打直就推不下去，手分開）
      let x1, x2, v1, v2, pushing, wait, t;
      const sh = () => [x1 + 0.45 * Math.cbrt(P.m1 / 80), x2 - 0.45 * Math.cbrt(P.m2 / 80)];   // 兩人肩膀的 x
      const reset = () => { const s1 = 0.45 * Math.cbrt(P.m1 / 80), s2 = 0.45 * Math.cbrt(P.m2 / 80); x1 = -(s1 + REST); x2 = s2 + REST; v1 = v2 = 0; pushing = false; wait = 1.2; t = 0; };
      reset();
      const go = () => { reset(); wait = 0; pushing = true; };
      return {
        actions: { '推！': go },
        update(dt) {
          t += dt;
          if (wait > 0 && (wait -= dt) <= 0) pushing = true;
          if (pushing) { v1 -= P.f / P.m1 * dt; v2 += P.f / P.m2 * dt; }
          x1 += v1 * dt; x2 += v2 * dt;
          let [s1, s2] = sh();
          if (pushing && (s2 - s1) / 2 > REACH) pushing = false;   // 手臂打直，手離開
          if (x2 > 14 || x1 < -14) { reset(); [s1, s2] = sh(); }
          A.position.set(x1, 1, 0); B.position.set(x2, 1, 0);
          A.scale.setScalar(Math.cbrt(P.m1 / 80)); B.scale.setScalar(Math.cbrt(P.m2 / 80));
          // 推的時候兩隻手貼在一起（接觸點 C）；放開後手縮回平常長度
          const C = (s1 + s2) / 2, touching = pushing || wait > 0;
          armA.set(s1, touching ? C : s1 + REST); armB.set(s2, touching ? C : s2 - REST);
          spark.visible = pushing; spark.position.x = C; spark.scale.setScalar(1 + 0.35 * Math.sin(t * 30));
          // 兩個力都畫在接觸點：作用在 A 的朝左、作用在 B 的朝右，一樣長
          const L = pushing ? P.f / 100 : 0;
          fA.set(U.V(C, 1.55, 0.25), U.V(-L, 0, 0)); fB.set(U.V(C, 1.05, 0.25), U.V(L, 0, 0));
          lA.visible = lB.visible = pushing;
          lA.position.set(C - L / 2, 2.4, 0.25); lB.position.set(C + L / 2, 0.6, 0.25);
          vA.set(U.V(x1, -0.4, 0), U.V(v1 * 1.5, 0, 0)); vB.set(U.V(x2, -0.4, 0), U.V(v2 * 1.5, 0, 0));
          out({ 'v₁': v1.toFixed(2) + ' m/s', 'v₂': v2.toFixed(2) + ' m/s', 'm₁v₁': (P.m1 * v1).toFixed(1), 'm₂v₂': (P.m2 * v2).toFixed(1), '總動量': Math.abs(P.m1 * v1 + P.m2 * v2).toFixed(1) });
        },
      };
    },
  },
  {
    id: 'projectile', realm: 'classic', cat: '力學', title: '拋體運動', en: 'Projectile Motion', keys: '斜拋 拋物線 parabola',
    tex: ['x = v_0\\cos\\theta\\,t,\\quad y = v_0\\sin\\theta\\,t - \\tfrac12 g t^2', 'R = \\dfrac{v_0^2 \\sin 2\\theta}{g}'],
    explain: '<p>斜拋出去的物體，水平方向沒有受力，所以<b>水平速度不變</b>；垂直方向只受重力，做等加速度運動。兩個方向各走各的，合起來就是一條<b>拋物線</b>。</p><p>不計空氣阻力時，同樣的初速以 \\(45^\\circ\\) 拋最遠；\\(30^\\circ\\) 和 \\(60^\\circ\\) 的射程一樣，因為 \\(\\sin 2\\theta\\) 相同。</p>',
    watch: ['橘色箭頭（水平速度）從頭到尾一樣長；青色（垂直速度）一路縮短，到頂點變 0，再往下變長。', '左下圖：vx 是水平線，vy 是斜直線，斜率就是 −g。', '把角度調成 30° 和 60° 比比看落點。'],
    params: [
      { k: 'v', label: '初速 v₀', min: 4, max: 14, step: 0.1, v: 11, unit: 'm/s' },
      { k: 'th', label: '仰角 θ', min: 5, max: 85, step: 1, v: 45, unit: '°' },
    ],
    cam: [8, 6, 27], target: [8, 3, 0],
    setup({ root, U, P, out, chart }) {
      const G = 9.8;
      const ground = U.box(26, 0.1, 6, U.mat(0x1a1d26, { rough: 0.9 })); ground.position.set(9, -0.05, 0);
      const cannon = U.cyl(0.18, 0.26, 1.2, U.mat(0x30343f, { metal: 0.7, rough: 0.3 }));
      const base = U.sphere(0.45, U.mat(0x30343f, { metal: 0.6 }));
      const ball = U.sphere(0.22, U.mat(0x222222, { emissive: AMBER, ei: 0.8 }));
      const path = U.line(120, WHITE, 0.35, true);
      const trail = U.points(240, AMBER, 0.14);
      const vx = U.arrow(AMBER), vy = U.arrow(CYAN), vv = U.arrow(WHITE, 0.03);
      const flag = U.cyl(0.03, 0.03, 1.2, U.glow(RED));
      const landL = U.label('', { color: '#ff6b6b', size: 0.45 });
      root.add(ground, cannon, base, ball, path, trail, vx, vy, vv, flag, landL);
      const ch = chart({ title: '速度分量：vx（橘）vy（青）', x: [0, 3], y: [-14, 14], xl: 't (s)', yl: 'v' });
      let tt, hist, n, wait;
      const reset = () => { tt = 0; hist = []; n = 0; wait = 0; trail.flush(0); };
      reset();
      return {
        actions: { '再發射一次': reset },
        onParam: reset,
        update(dt) {
          const th = P.th * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), T = F.flightTime(P.v, th, G), R = F.range(P.v, th, G);
          cannon.rotation.z = th - Math.PI / 2;
          cannon.position.set(0.6 * c, 0.6 * s, 0);
          path.set(Array.from({ length: 120 }, (_, i) => { const q = T * i / 119; return U.V(P.v * c * q, P.v * s * q - G * q * q / 2, 0); }));
          flag.position.set(R, 0.6, 0); landL.set(`R = ${R.toFixed(1)} m`); landL.position.set(R, 1.6, 0);
          if (tt < T) tt = Math.min(T, tt + dt); else if ((wait += dt) > 1.2) reset();
          const x = P.v * c * tt, y = P.v * s * tt - G * tt * tt / 2, vyv = P.v * s - G * tt, o = U.V(x, y, 0);
          ball.position.copy(o);
          vx.set(o, U.V(P.v * c * 0.18, 0, 0)); vy.set(o, U.V(0, vyv * 0.18, 0)); vv.set(o, U.V(P.v * c * 0.18, vyv * 0.18, 0));
          if (tt < T && (!hist.length || tt - hist.at(-1)[0] > 0.05)) {
            hist.push([tt, P.v * c, vyv]);
            if (n < 240) { trail.pos.set([x, y, 0], n * 3); trail.flush(++n); }
          }
          ch.o.x = [0, Math.max(1, T)];
          ch.draw([
            { pts: [[0, 0], [Math.max(1, T), 0]], color: 'rgba(255,255,255,.15)', w: 1 },
            { pts: hist.map(h => [h[0], h[1]]), color: '#f5b544' },
            { pts: hist.map(h => [h[0], h[2]]), color: '#4fd1e8' },
          ], [{ x: tt, y: vyv, color: '#4fd1e8' }]);
          out({ '射程 R': R.toFixed(2) + ' m', '飛行時間': T.toFixed(2) + ' s', '最高點 H': F.maxHeight(P.v, th, G).toFixed(2) + ' m', 'vx': (P.v * c).toFixed(2) + ' m/s', 'vy': vyv.toFixed(2) + ' m/s' });
        },
      };
    },
  },
  {
    id: 'centripetal', realm: 'classic', cat: '力學', title: '圓周運動與向心力', en: 'Circular Motion · Centripetal Force', keys: '向心力 向心加速度 離心',
    tex: ['a_c = \\dfrac{v^2}{r} = \\omega^2 r', 'F_c = m\\dfrac{v^2}{r}'],
    explain: '<p>球放在<b>無摩擦的冰桌</b>上，用繩子綁著等速率繞圈：速率沒變，但<b>方向一直在變</b>，所以仍然有加速度，方向永遠指向圓心，叫做向心加速度。提供這個力的是繩子的張力。</p><p>所謂「離心力」其實不存在：剪斷繩子，球不會往外飛，而是沿著<b>切線</b>直直飛出去——就是牛頓第一定律。</p>',
    watch: ['紅色箭頭（向心力）永遠指向中心，青色（速度）永遠沿切線。', '速度加倍，向心力變 4 倍（左下圖是拋物線）。', '按「剪斷繩子」看球沿切線飛走。'],
    params: [
      { k: 'r', label: '半徑 r', min: 1, max: 4, step: 0.05, v: 2.5, unit: 'm' },
      { k: 'v', label: '速率 v', min: 1, max: 6, step: 0.1, v: 3, unit: 'm/s' },
      { k: 'm', label: '質量 m', min: 0.2, max: 2, step: 0.05, v: 0.5, unit: 'kg' },
    ],
    cam: [0, 8, 10], target: [0, 1, 0],
    setup({ root, U, P, out, chart }) {
      const H = 1.5;
      const post = U.cyl(0.08, 0.12, H, U.mat(0x30343f, { metal: 0.7 })); post.position.y = H / 2;
      const hub = U.sphere(0.14, U.glow(AMBER)); hub.position.y = H;
      const ball = U.sphere(0.25, U.mat(0x222222, { emissive: AMBER, ei: 0.7 }));
      const rope = U.beam(0xcfd6e4, 0.015);
      const ring = U.line(97, WHITE, 0.35, true);
      const vA = U.arrow(CYAN), fA = U.arrow(RED, 0.06);
      // 無摩擦桌面：重力和桌面支撐力抵消，水平方向只剩繩子的拉力；剪斷後球沿桌面直線滑走
      const table = U.cyl(20, 20, 0.04, U.mat(0x9fd8ff, { opacity: 0.1, rough: 0.05, metal: 0.3 }), 64);
      root.add(post, hub, ball, rope, ring, vA, fA, table);
      const ch = chart({ title: '向心力 F = mv²/r', x: [0, 6], y: [0, 10], xl: 'v (m/s)', yl: 'F (N)' });
      let phi = 0, cut = -1, cp = U.V(), cv = U.V();
      return {
        actions: { '剪斷繩子': () => { if (cut < 0) cut = 0; } },
        update(dt) {
          const C = U.V(0, H, 0);
          ring.set(Array.from({ length: 97 }, (_, i) => U.V(P.r * Math.cos(i / 96 * 6.2832), H, P.r * Math.sin(i / 96 * 6.2832))));
          ball.scale.setScalar(Math.cbrt(P.m / 0.5));
          table.position.y = H - 0.25 * ball.scale.x - 0.02;
          if (cut < 0) {
            phi += P.v / P.r * dt;
            cp.set(P.r * Math.cos(phi), H, P.r * Math.sin(phi));
            cv.set(-Math.sin(phi), 0, Math.cos(phi)).multiplyScalar(P.v);
            rope.visible = true; rope.set(C, cp);
            fA.set(cp, C.clone().sub(cp).normalize().multiplyScalar(Math.min(2.2, 0.15 * P.m * P.v * P.v / P.r + 0.3)));
          } else {
            cut += dt; cp.addScaledVector(cv, dt);
            rope.visible = false; fA.visible = false;
            if (cut > 2.5) cut = -1;
          }
          ball.position.copy(cp);
          vA.set(cp, cv.clone().multiplyScalar(0.35));
          const Fc = P.m * P.v * P.v / P.r;
          ch.o.y = [0, Math.max(1, P.m * 36 / P.r)];
          ch.draw([{ pts: Array.from({ length: 41 }, (_, i) => { const v = 6 * i / 40; return [v, P.m * v * v / P.r]; }), color: '#f5b544' }], [{ x: P.v, y: Fc, color: '#ff6b6b', r: 5 }]);
          out({ '向心加速度 v²/r': F.centripetal(P.v, P.r).toFixed(2) + ' m/s²', '向心力 F': Fc.toFixed(2) + ' N', '角速度 ω': (P.v / P.r).toFixed(2) + ' rad/s', '週期 T': (2 * Math.PI * P.r / P.v).toFixed(2) + ' s', '狀態': cut < 0 ? '繞圈中' : '繩子斷了，沿切線飛' });
        },
      };
    },
  },
  {
    id: 'pendulum', realm: 'classic', cat: '力學', title: '單擺與簡諧運動', en: 'Simple Pendulum · SHM', keys: '單擺 簡諧 鐘擺 週期 shm',
    tex: ['\\ddot\\theta = -\\dfrac{g}{L}\\sin\\theta', 'T \\approx 2\\pi\\sqrt{\\dfrac{L}{g}}\\quad(\\theta_0 \\text{ 很小})'],
    explain: '<p>擺錘受到的回復力是重力沿切線的分量 \\(-mg\\sin\\theta\\)。角度小時 \\(\\sin\\theta \\approx \\theta\\)，運動就變成<b>簡諧運動</b>，週期只跟擺長有關、跟擺幅和質量都無關——伽利略看教堂吊燈發現的就是這個。</p><p>擺幅變大，近似就不準了：真正的週期會<b>變長</b>。這裡是直接解完整方程式，所以可以看到差距。</p>',
    watch: ['左下圖白色虛線是小角度近似，橘線是真實擺動；擺幅小時兩條幾乎重疊。', '把起始角度拉到 120° 以上：真實擺動明顯落後近似。', '紅色箭頭是回復力，在最低點是 0、在兩端最大。'],
    params: [
      { k: 'L', label: '擺長 L', min: 0.5, max: 4, step: 0.05, v: 2.5, unit: 'm' },
      { k: 'th0', label: '起始角度 θ₀', min: 5, max: 170, step: 1, v: 30, unit: '°' },
    ],
    cam: [0, 4.5, 12], target: [0, 4, 0],
    setup({ root, U, P, out, chart }) {
      const G = 9.8, PIV = U.V(0, 5.5, 0);
      const bar = U.box(2.4, 0.12, 0.5, U.mat(0x30343f, { metal: 0.7 })); bar.position.copy(PIV).y += 0.06;
      const rod = U.beam(0xcfd6e4, 0.02);
      const bob = U.sphere(0.28, U.mat(0x222222, { emissive: AMBER, ei: 0.75, metal: 0.4 }));
      const arc = U.line(80, AMBER, 0.35, true), vert = U.line(2, WHITE, 0.25, true);
      const fA = U.arrow(RED, 0.045);
      root.add(bar, rod, bob, arc, vert, fA);
      const ch = chart({ title: '角度 θ(t)：真實（橘）vs 小角度近似（白）', x: [0, 8], y: [-1, 1], xl: 't (s)', yl: 'θ' });
      let th, w, tt, hist, lastX, Tm;
      const reset = () => { th = P.th0 * Math.PI / 180; w = 0; tt = 0; hist = []; lastX = null; Tm = null; };
      reset();
      return {
        onParam: reset,
        update(dt) {
          const prev = th, sub = 20, h = dt / sub;
          for (let i = 0; i < sub; i++) { w += -G / P.L * Math.sin(th) * h; th += w * h; }
          tt += dt;
          if (prev < 0 && th >= 0 && w > 0) { const tc = tt - dt * th / (th - prev); if (lastX != null) Tm = tc - lastX; lastX = tc; }
          const p = U.V(PIV.x + P.L * Math.sin(th), PIV.y - P.L * Math.cos(th), 0);
          rod.set(PIV, p); bob.position.copy(p);
          const a0 = P.th0 * Math.PI / 180;
          arc.set(Array.from({ length: 80 }, (_, i) => { const a = -a0 + 2 * a0 * i / 79; return U.V(P.L * Math.sin(a), PIV.y - P.L * Math.cos(a), 0); }));
          vert.set([PIV, U.V(0, PIV.y - P.L - 0.6, 0)]);
          fA.set(p, U.V(-Math.cos(th), -Math.sin(th), 0).multiplyScalar(1.4 * Math.sin(th)));
          if (!hist.length || tt - hist.at(-1)[0] > 0.04) hist.push([tt, th]);
          if (hist[0][0] < tt - 8) hist.shift();
          const t0 = Math.max(0, tt - 8), w0 = Math.sqrt(G / P.L);
          ch.o.x = [t0, t0 + 8]; ch.o.y = [-a0 * 1.15, a0 * 1.15];
          ch.draw([
            { pts: Array.from({ length: 81 }, (_, i) => { const q = t0 + i / 10; return [q, a0 * Math.cos(w0 * q)]; }), color: 'rgba(255,255,255,.5)', dash: [4, 4], w: 1.5 },
            { pts: hist, color: '#f5b544' },
          ], [{ x: tt, y: th, color: '#f5b544' }]);
          const Tsmall = 2 * Math.PI / w0, Tex = F.pendulumPeriod(P.L, G, a0);
          out({ '小角度近似 T': Tsmall.toFixed(3) + ' s', '精確週期 T': Tex.toFixed(3) + ' s', '模擬量到的 T': Tm ? Tm.toFixed(3) + ' s' : '量測中…', '近似誤差': ((Tex / Tsmall - 1) * 100).toFixed(1) + '%' });
        },
      };
    },
  },
  {
    id: 'hooke', realm: 'classic', cat: '力學', title: '虎克定律與彈簧振子', en: "Hooke's Law · Spring Oscillator", keys: '彈簧 彈力 胡克 spring',
    tex: ['F = -kx', '\\omega = \\sqrt{\\dfrac{k}{m}},\\quad E = \\tfrac12 kx^2 + \\tfrac12 mv^2'],
    explain: '<p>彈簧的力和伸長量成正比、方向相反：拉越長拉回來的力越大。負號代表它永遠把物體<b>往平衡點推</b>。</p><p>這種「越偏越用力拉回」的力會造成簡諧振動，頻率由彈簧硬度 \\(k\\) 和質量 \\(m\\) 決定，跟振幅無關。能量在彈性位能和動能之間來回交換，總和不變。</p>',
    watch: ['紅色箭頭（彈力）在兩端最長、經過中間時是 0；青色（速度）剛好相反。', '左下圖：位能（青）和動能（橘）此消彼長，白色虛線總能量是水平線。', 'k 調大振得快，m 調大振得慢。'],
    params: [
      { k: 'k', label: '彈性係數 k', min: 5, max: 100, step: 1, v: 20, unit: 'N/m' },
      { k: 'm', label: '質量 m', min: 0.2, max: 5, step: 0.1, v: 1, unit: 'kg' },
      { k: 'A', label: '振幅 A', min: 0.2, max: 1.5, step: 0.05, v: 1, unit: 'm' },
    ],
    cam: [0, 3, 12], target: [-0.5, 0.8, 0],
    setup({ root, U, P, out, chart }) {
      const WALL = -4;
      const wall = U.box(0.3, 2.4, 2, U.mat(0x30343f, { metal: 0.6 })); wall.position.set(WALL - 0.15, 1.2, 0);
      const floor = U.box(10, 0.1, 2, U.mat(0x1a1d26, { rough: 0.9 })); floor.position.set(0, -0.05, 0);
      const block = U.box(1, 1, 1, U.mat(0x30343f, { metal: 0.5, rough: 0.35, emissive: AMBER, ei: 0.08 }));
      const spring = U.line(240, 0xcfd6e4);
      const eq = U.line(2, WHITE, 0.35, true).set([U.V(0.5, 0, 1), U.V(0.5, 2, 1)]);
      const fA = U.arrow(RED, 0.06), vA = U.arrow(CYAN);
      root.add(wall, floor, block, spring, eq, fA, vA);
      const ch = chart({ title: '能量：位能（青）動能（橘）總和（白）', x: [0, 6], y: [0, 1], xl: 't (s)', yl: 'E' });
      let tt = 0, hist = [];
      return {
        onParam() { tt = 0; hist = []; },
        update(dt) {
          tt += dt;
          const w = F.springOmega(P.k, P.m), x = P.A * Math.cos(w * tt), v = -P.A * w * Math.sin(w * tt);
          block.scale.setScalar(Math.cbrt(P.m));
          const s = block.scale.x;
          block.position.set(x + 0.5, s / 2, 0);
          const L = (x + 0.5 - s / 2) - WALL;
          spring.set(Array.from({ length: 240 }, (_, i) => { const u = i / 239, a = u * 16 * 2 * Math.PI, r = u < 0.04 || u > 0.96 ? 0 : 0.22; return U.V(WALL + u * L, 0.5 + r * Math.cos(a), r * Math.sin(a)); }));
          fA.set(U.V(x + 0.5, s + 0.35, 0), U.V(-x / P.A * 1.5, 0, 0));
          vA.set(U.V(x + 0.5, s + 0.8, 0), U.V(v / (P.A * w) * 1.5, 0, 0));
          const PE = 0.5 * P.k * x * x, KE = 0.5 * P.m * v * v, E = 0.5 * P.k * P.A * P.A;
          if (!hist.length || tt - hist.at(-1)[0] > 0.03) hist.push([tt, PE, KE]);
          if (hist[0][0] < tt - 3) hist.shift();
          const t0 = Math.max(0, tt - 3);
          ch.o.x = [t0, t0 + 3]; ch.o.y = [0, E * 1.15];
          ch.draw([
            { pts: [[t0, E], [t0 + 3, E]], color: 'rgba(255,255,255,.6)', dash: [4, 4], w: 1.5 },
            { pts: hist.map(h => [h[0], h[1]]), color: '#4fd1e8' },
            { pts: hist.map(h => [h[0], h[2]]), color: '#f5b544' },
          ]);
          out({ '位移 x': x.toFixed(2) + ' m', '彈力 F = −kx': (-P.k * x).toFixed(1) + ' N', '角頻率 ω': w.toFixed(2) + ' rad/s', '週期 T': (2 * Math.PI / w).toFixed(2) + ' s', '總能量': E.toFixed(2) + ' J' });
        },
      };
    },
  },
  {
    id: 'collision', realm: 'classic', cat: '力學', title: '動量守恆與碰撞', en: 'Conservation of Momentum · Collisions', keys: '動量 碰撞 彈性 非彈性 momentum',
    tex: ['m_1u_1 + m_2u_2 = m_1v_1 + m_2v_2', 'e = \\dfrac{v_2 - v_1}{u_1 - u_2}'],
    explain: '<p>兩台車相撞時，彼此的力大小相等、方向相反、作用時間一樣，所以<b>總動量在碰撞前後完全一樣</b>。</p><p>動能就不一定了：恢復係數 \\(e=1\\) 是彈性碰撞，動能也守恆；\\(e=0\\) 兩車黏在一起，損失最多動能（變成熱和形變）。但不管哪一種，動量都守恆。</p>',
    watch: ['左下圖白線（總動量）在碰撞瞬間完全不動，兩台車各自的動量卻跳了一下。', '兩車一樣重、e = 1：前車停住，速度整個交給後車（像撞球）。', '把 e 調成 0 看「動能損失」。'],
    params: [
      { k: 'm1', label: '左車質量 m₁', min: 0.5, max: 5, step: 0.1, v: 1, unit: 'kg' },
      { k: 'm2', label: '右車質量 m₂', min: 0.5, max: 5, step: 0.1, v: 3, unit: 'kg' },
      { k: 'u1', label: '左車初速 u₁', min: 0.5, max: 6, step: 0.1, v: 4, unit: 'm/s' },
      { k: 'u2', label: '右車初速 u₂', min: -4, max: 2, step: 0.1, v: 0, unit: 'm/s' },
      { k: 'e', label: '恢復係數 e（1 彈性、0 黏住）', min: 0, max: 1, step: 0.05, v: 1 },
    ],
    cam: [0, 5, 15], target: [0, 0.5, 0],
    setup({ root, U, P, out, chart }) {
      const rail = U.box(28, 0.1, 1.6, U.mat(0x2a2f3c, { metal: 0.6 })); rail.position.y = -0.05;
      const c1 = U.box(1, 1, 1, U.mat(0x30343f, { metal: 0.5, emissive: AMBER, ei: 0.12 }));
      const c2 = U.box(1, 1, 1, U.mat(0x30343f, { metal: 0.5, emissive: CYAN, ei: 0.12 }));
      const a1 = U.arrow(AMBER), a2 = U.arrow(CYAN);
      const l1 = U.label('m₁', { color: '#f5b544', size: 0.38 }), l2 = U.label('m₂', { color: '#4fd1e8', size: 0.38 });
      const flash = U.sphere(0.3, U.glow(0xffffff, 0.8));
      root.add(rail, c1, c2, a1, a2, l1, l2, flash);
      const ch = chart({ title: '動量：m₁（橘）m₂（青）總和（白）', x: [0, 7], y: [-1, 1], xl: 't (s)', yl: 'p' });
      let x1, x2, v1, v2, tt, hist, hit, pmax, before;
      const reset = () => {
        x1 = -7; x2 = 2; v1 = P.u1; v2 = P.u2; tt = 0; hist = []; hit = -1;
        pmax = (P.m1 * Math.abs(P.u1) + P.m2 * Math.abs(P.u2)) * 1.15 + 0.1;
        before = { p: P.m1 * P.u1 + P.m2 * P.u2, K: 0.5 * P.m1 * P.u1 ** 2 + 0.5 * P.m2 * P.u2 ** 2 };
      };
      reset();
      return {
        actions: { '重新開始': reset },
        onParam: reset,
        update(dt) {
          const s1 = Math.cbrt(P.m1) * 0.8, s2 = Math.cbrt(P.m2) * 0.8;
          x1 += v1 * dt; x2 += v2 * dt; tt += dt;
          if (x2 - x1 <= (s1 + s2) / 2 && v1 > v2) { [v1, v2] = F.collide(P.m1, P.m2, v1, v2, P.e); hit = 0; x1 = x2 - (s1 + s2) / 2; }
          if (tt > 7 || Math.abs(x1) > 14 || Math.abs(x2) > 14) reset();
          c1.scale.setScalar(s1); c2.scale.setScalar(s2);
          c1.position.set(x1, s1 / 2, 0); c2.position.set(x2, s2 / 2, 0);
          a1.set(U.V(x1, s1 + 0.3, 0), U.V(v1 * 0.4, 0, 0)); a2.set(U.V(x2, s2 + 0.3, 0), U.V(v2 * 0.4, 0, 0));
          l1.position.set(x1, s1 + 0.9, 0); l2.position.set(x2, s2 + 0.9, 0);
          flash.visible = hit >= 0 && hit < 0.25;
          if (hit >= 0) { hit += dt; flash.position.set(x1 + s1 / 2, 0.4, 0); flash.scale.setScalar(1 + hit * 6); }
          const p1 = P.m1 * v1, p2 = P.m2 * v2;
          if (!hist.length || tt - hist.at(-1)[0] > 0.03) hist.push([tt, p1, p2]);
          ch.o.y = [-pmax, pmax];
          ch.draw([
            { pts: hist.map(h => [h[0], h[1] + h[2]]), color: 'rgba(255,255,255,.85)', w: 2.5 },
            { pts: hist.map(h => [h[0], h[1]]), color: '#f5b544' },
            { pts: hist.map(h => [h[0], h[2]]), color: '#4fd1e8' },
          ]);
          const K = 0.5 * P.m1 * v1 * v1 + 0.5 * P.m2 * v2 * v2;
          out({ 'v₁': v1.toFixed(2) + ' m/s', 'v₂': v2.toFixed(2) + ' m/s', '總動量（前）': before.p.toFixed(2), '總動量（現在）': (p1 + p2).toFixed(2), '總動能（前）': before.K.toFixed(2) + ' J', '動能損失': (before.K ? (1 - K / before.K) * 100 : 0).toFixed(1) + '%' });
        },
      };
    },
  },
  {
    id: 'angular', realm: 'classic', cat: '力學', title: '角動量守恆', en: 'Conservation of Angular Momentum', keys: '轉動慣量 花式滑冰 旋轉 torque',
    tex: ['L = I\\omega = \\text{常數}', 'I = I_0 + 2mr^2'],
    explain: '<p>沒有外力矩時，<b>角動量 \\(L = I\\omega\\) 不變</b>。把手上的啞鈴收到身體旁邊，轉動慣量 \\(I\\) 變小，轉速 \\(\\omega\\) 就自動變快。花式滑冰選手收手臂高速旋轉、跳水選手抱膝翻轉，都是這個原理。</p><p>有趣的是轉動動能 \\(\\tfrac12 I\\omega^2\\) 會<b>增加</b>，多出來的能量來自手臂往內拉時做的功。</p>',
    watch: ['橘色箭頭（角動量）長度從頭到尾不變。', '拖動「手臂伸出距離」或按按鈕：收手轉速暴增，左下的點沿著反比曲線 ω = L/I 移動。', '注意「轉動動能」收手時變大。'],
    params: [
      { k: 'r', label: '手臂伸出距離 r', min: 0.3, max: 1.5, step: 0.01, v: 1.5, unit: 'm' },
      { k: 'w0', label: '張開手時的轉速', min: 0.4, max: 2, step: 0.05, v: 1, unit: 'rad/s' },
    ],
    cam: [4.5, 4, 6], target: [0, 1.4, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const I0 = 1.5, MW = 3, Iof = r => I0 + 2 * MW * r * r;
      const disk = U.cyl(1.7, 1.7, 0.14, U.mat(0x2a2f3c, { metal: 0.6, rough: 0.3 })); disk.position.y = 0.07;
      const fig = new THREE.Group();
      const torso = U.cyl(0.32, 0.26, 1.5, U.mat(0xdfe3ea, { rough: 0.6 })); torso.position.y = 1;
      const head = U.sphere(0.25, U.mat(0xdfe3ea, { rough: 0.5 })); head.position.y = 2;
      const arms = [-1, 1].map(s => {
        const arm = U.beam(0xdfe3ea, 0.07, U.mat(0xdfe3ea, { rough: 0.6 }));
        const db = U.sphere(0.2, U.mat(0x222222, { emissive: AMBER, ei: 0.6, metal: 0.5 }));
        fig.add(arm, db);
        return { s, arm, db };
      });
      fig.add(torso, head);
      const LA = U.arrow(AMBER, 0.07), WA = U.arrow(CYAN, 0.05);
      const trail = U.points(300, AMBER, 0.08);
      root.add(disk, fig, LA, WA, trail);
      const ch = chart({ title: 'ω = L / I（角動量固定）', x: [0, 15], y: [0, 10], xl: 'I (kg·m²)', yl: 'ω' });
      let r = P.r, tgt = P.r, n = 0;
      const ang = () => Iof(1.5) * P.w0;
      return {
        actions: { '收起手臂': () => { tgt = 0.3; }, '張開手臂': () => { tgt = 1.5; } },
        onParam(k) { if (k === 'r') tgt = P.r; },
        update(dt) {
          r += (tgt - r) * Math.min(1, dt * 3);
          const L = ang(), I = Iof(r), w = F.spinRate(Iof(1.5), P.w0, I);
          fig.rotation.y += w * dt;
          for (const a of arms) {
            const sh = U.V(a.s * 0.3, 1.5, 0), hand = U.V(a.s * (0.3 + r), 1.45, 0);
            a.arm.set(sh, hand); a.db.position.copy(hand);
          }
          const hx = (0.3 + r), ry = fig.rotation.y;
          trail.pos.set([hx * Math.cos(ry), 1.45, -hx * Math.sin(ry)], (n % 300) * 3); n++;
          trail.flush(Math.min(n, 300));
          LA.set(U.V(0, 2.3, 0), U.V(0, 1.4, 0));
          WA.set(U.V(0.6, 2.3, 0), U.V(0, Math.min(2.5, w * 0.3), 0));
          ch.o.y = [0, L / Iof(0.3) * 1.1];
          ch.draw([{ pts: Array.from({ length: 60 }, (_, i) => { const x = Iof(0.3) + (Iof(1.5) - Iof(0.3)) * i / 59; return [x, L / x]; }), color: '#f5b544' }], [{ x: I, y: w, color: '#4fd1e8', r: 5 }]);
          out({ '轉動慣量 I': I.toFixed(2) + ' kg·m²', '角速度 ω': w.toFixed(2) + ' rad/s', '角動量 L': L.toFixed(2), '轉動動能': (0.5 * I * w * w).toFixed(2) + ' J', '每秒轉': (w / 2 / Math.PI).toFixed(2) + ' 圈' });
        },
      };
    },
  },
  {
    id: 'gravity', realm: 'classic', cat: '力學', title: '萬有引力定律', en: "Newton's Law of Universal Gravitation", keys: '引力 重力 軌道 逃逸速度 orbit',
    tex: ['F = G\\dfrac{m_1 m_2}{r^2}', 'v_{\\text{圓}} = \\sqrt{\\dfrac{GM}{r}},\\quad v_{\\text{逃逸}} = \\sqrt{\\dfrac{2GM}{r}}'],
    explain: '<p>任何兩個有質量的物體都互相吸引，力和質量乘積成正比、和<b>距離平方成反比</b>。蘋果掉下來和月亮繞地球，是同一個力。</p><p>行星其實一直在「往下掉」，只是橫向速度夠快，一直掉不到恆星上，就成了軌道。速度剛好 \\(\\sqrt{GM/r}\\) 是正圓，比它快變橢圓，超過 \\(\\sqrt2\\) 倍就逃逸、再也不回來。</p>',
    watch: ['地面上的小箭頭是重力場，越靠近恆星越強（距離平方反比）。', '速度倍率 1.0 是正圓；0.7 是橢圓；超過 1.41 行星飛走（總能量變正）。', '恆星也被行星拉著小小晃動，兩個紅色力箭頭永遠一樣長。'],
    params: [
      { k: 'M', label: '恆星質量 M', min: 5, max: 40, step: 1, v: 20 },
      { k: 'r0', label: '起始距離 r', min: 2, max: 7, step: 0.1, v: 5 },
      { k: 'vf', label: '初速 ÷ 正圓速度', min: 0.3, max: 1.6, step: 0.01, v: 0.8 },
    ],
    grid: false, cam: [0, 15, 12], target: [0, 0, 0],
    setup({ root, U, P, out }) {
      const m = 1;
      const star = U.sphere(1, U.glow(AMBER)), halo = U.sphere(1, U.glow(AMBER, 0.15));
      const planet = U.sphere(0.22, U.mat(0x222222, { emissive: CYAN, ei: 0.8 }));
      const trail = U.points(700, CYAN, 0.08);
      const f1 = U.arrow(RED, 0.05), f2 = U.arrow(RED, 0.05);
      const field = [];
      for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) { const a = U.arrow(0x8a93a8, 0.02); a.p = U.V(i * 1.6, -0.4, j * 1.6); field.push(a); }
      const msg = U.label('', { color: '#ff6b6b', size: 0.5 }); msg.position.set(0, 2.5, 0);
      root.add(star, halo, planet, trail, f1, f2, msg, ...field);
      let p1, p2, v1, v2, n, end;
      const reset = () => {
        const Mt = P.M + m, vr = P.vf * Math.sqrt(Mt / P.r0);
        p1 = U.V(-m * P.r0 / Mt, 0, 0); p2 = U.V(P.M * P.r0 / Mt, 0, 0);
        v1 = U.V(0, 0, -m * vr / Mt); v2 = U.V(0, 0, P.M * vr / Mt);
        n = 0; end = 0; trail.flush(0); msg.visible = false;
      };
      reset();
      const acc = (a, b, M) => { const d = b.clone().sub(a), r = d.length(); return d.multiplyScalar(M / (r * r * r)); };
      return {
        actions: { '重新開始': reset },
        onParam: reset,
        update(dt) {
          if (end > 0) { if ((end += dt) > 2) reset(); return; }
          const sub = 40, h = dt / sub;
          for (let i = 0; i < sub; i++) {
            const a1 = acc(p1, p2, m), a2 = acc(p2, p1, P.M);
            v1.addScaledVector(a1, h); v2.addScaledVector(a2, h);
            p1.addScaledVector(v1, h); p2.addScaledVector(v2, h);
          }
          const rs = 0.3 + P.M * 0.012, d = p2.distanceTo(p1);
          star.scale.setScalar(rs); halo.scale.setScalar(rs * 1.6);
          star.position.copy(p1); halo.position.copy(p1); planet.position.copy(p2);
          trail.pos.set([p2.x, p2.y, p2.z], (n % 700) * 3); n++; trail.flush(Math.min(n, 700));
          const Fm = P.M * m / (d * d), dir = p1.clone().sub(p2).normalize(), L = Math.min(2.5, 0.5 + Fm * 0.6);
          f2.set(p2, dir.clone().multiplyScalar(L)); f1.set(p1, dir.clone().multiplyScalar(-L));
          for (const a of field) {
            const g = acc(a.p, p1, P.M), gl = g.length();
            a.visible = a.p.distanceTo(p1) > 1;
            if (a.visible) a.set(a.p, g.multiplyScalar(Math.min(0.9, 0.35 * Math.sqrt(gl)) / gl));
          }
          const vrel = v2.clone().sub(v1).length(), E = 0.5 * (P.M * m / (P.M + m)) * vrel * vrel - P.M * m / d;
          if (d < rs + 0.2) { end = 1e-6; msg.set('撞上恆星'); msg.visible = true; }
          if (d > 30) { end = 1e-6; msg.set('逃逸'); msg.visible = true; }
          out({ '距離 r': d.toFixed(2), '引力 F': Fm.toFixed(3), '速度 v': vrel.toFixed(2), '正圓速度': F.orbitSpeed(P.M + m, d).toFixed(2), '逃逸速度': F.escapeSpeed(P.M + m, d).toFixed(2), '總能量': E.toFixed(2) + (E < 0 ? '（束縛）' : '（逃逸）') });
        },
      };
    },
  },
  {
    id: 'kepler', realm: 'classic', cat: '力學', title: '克卜勒行星運動定律', en: "Kepler's Laws of Planetary Motion", keys: '克普勒 行星 橢圓 等面積',
    tex: ['\\text{① 橢圓軌道，太陽在焦點}', '\\text{② } \\dfrac{dA}{dt} = \\text{常數}', '\\text{③ } \\dfrac{T^2}{a^3} = \\dfrac{4\\pi^2}{GM}'],
    explain: '<p>克卜勒從第谷的觀測資料歸納出三條定律：行星走<b>橢圓</b>，太陽在其中一個焦點；行星和太陽的連線在<b>相同時間掃過相同面積</b>，所以靠近太陽時跑得快、遠離時慢；週期平方和半長軸立方成正比。</p><p>後來牛頓證明，這三條都可以從萬有引力 \\(F \\propto 1/r^2\\) 推出來。第二定律其實就是角動量守恆。</p>',
    watch: ['軌道被切成 12 塊扇形，每一塊都是相同時間掃過的——形狀不同但面積一樣。', '離心率 e 調大：近日點附近行星明顯加速。', '左下圖：不管半長軸多少，(a³, T²) 都落在同一條直線上。'],
    params: [
      { k: 'a', label: '半長軸 a', min: 2, max: 6, step: 0.05, v: 4 },
      { k: 'e', label: '離心率 e', min: 0, max: 0.9, step: 0.01, v: 0.55 },
    ],
    grid: false, cam: [-2, 12, 10], target: [-2, 0, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const GM = 70, K = 12, SUB = 16;
      const sun = U.sphere(0.4, U.glow(AMBER)), halo = U.sphere(0.7, U.glow(AMBER, 0.15));
      const planet = U.sphere(0.2, U.mat(0x222222, { emissive: CYAN, ei: 0.8 }));
      const orbit = U.line(201, WHITE, 0.5);
      const fanGeo = new THREE.BufferGeometry();
      fanGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(K * SUB * 9), 3));
      fanGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(K * SUB * 9), 3));
      const fan = new THREE.Mesh(fanGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
      const sweepGeo = new THREE.BufferGeometry();
      sweepGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(64 * 9), 3));
      const sweep = new THREE.Mesh(sweepGeo, new THREE.MeshBasicMaterial({ color: 0x4fd1e8, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
      const radius = U.beam(0xffffff, 0.015, U.glow(0xffffff, 0.5));
      const vA = U.arrow(CYAN, 0.04);
      const peri = U.label('近日點', { size: 0.36, color: 'rgba(233,237,245,.7)' }), aph = U.label('遠日點', { size: 0.36, color: 'rgba(233,237,245,.7)' });
      root.add(fan, sweep, orbit, sun, halo, planet, radius, vA, peri, aph);
      const ch = chart({ title: '克卜勒第三定律：T² 對 a³', x: [0, 230], y: [0, 130], xl: 'a³', yl: 'T²' });
      const pos = (E, out = U.V()) => out.set(P.a * (Math.cos(E) - P.e), 0, -P.a * Math.sqrt(1 - P.e * P.e) * Math.sin(E));
      const build = () => {
        orbit.set(Array.from({ length: 201 }, (_, i) => pos(i / 200 * 2 * Math.PI)));
        const pa = fanGeo.attributes.position.array, ca = fanGeo.attributes.color.array, A = new THREE.Color(0xf5b544), B = new THREE.Color(0x4fd1e8);
        let o = 0;
        for (let k = 0; k < K; k++) for (let s = 0; s < SUB; s++) {
          const E0 = F.eccAnomaly(2 * Math.PI * (k + s / SUB) / K, P.e), E1 = F.eccAnomaly(2 * Math.PI * (k + (s + 1) / SUB) / K, P.e);
          const q0 = pos(E0), q1 = pos(E1), col = k % 2 ? B : A;
          for (const q of [U.V(), q0, q1]) { pa[o] = q.x; pa[o + 1] = q.y - 0.01; pa[o + 2] = q.z; col.toArray(ca, o); o += 3; }
        }
        fanGeo.attributes.position.needsUpdate = fanGeo.attributes.color.needsUpdate = true;
        peri.position.set(P.a * (1 - P.e), 0.6, 0); aph.position.set(-P.a * (1 + P.e), 0.6, 0);
      };
      build();
      let tt = 0;
      return {
        onParam() { build(); tt = 0; },
        update(dt) {
          tt += dt;
          const T = F.keplerPeriod(P.a, GM), Mn = (2 * Math.PI * tt / T) % (2 * Math.PI), E = F.eccAnomaly(Mn, P.e);
          const p = pos(E);
          planet.position.copy(p); radius.set(U.V(), p);
          const r = p.length(), v = Math.sqrt(GM * (2 / r - 1 / P.a));
          const tan = pos(E + 0.001).sub(p).normalize();
          vA.set(p, tan.multiplyScalar(v * 0.25));
          // 目前這一塊扇形從哪裡開始掃
          const k0 = Math.floor(Mn / (2 * Math.PI / K)), sa = sweepGeo.attributes.position.array;
          for (let i = 0; i < 64; i++) {
            const m0 = k0 * 2 * Math.PI / K + (Mn - k0 * 2 * Math.PI / K) * i / 64, m1 = k0 * 2 * Math.PI / K + (Mn - k0 * 2 * Math.PI / K) * (i + 1) / 64;
            const q0 = pos(F.eccAnomaly(m0, P.e)), q1 = pos(F.eccAnomaly(m1, P.e));
            sa.set([0, 0.01, 0, q0.x, 0.01, q0.z, q1.x, 0.01, q1.z], i * 9);
          }
          sweepGeo.attributes.position.needsUpdate = true;
          const b = P.a * Math.sqrt(1 - P.e * P.e);
          ch.draw([{ pts: [[0, 0], [230, 230 * 4 * Math.PI ** 2 / GM]], color: 'rgba(255,255,255,.4)', dash: [4, 4], w: 1.5 }], [{ x: P.a ** 3, y: T * T, color: '#f5b544', r: 5, text: `a = ${P.a.toFixed(1)}` }]);
          out({ '週期 T': T.toFixed(2) + ' s', 'T² / a³': (T * T / P.a ** 3).toFixed(4), '距離 r': r.toFixed(2), '速度 v': v.toFixed(2), '掃面積速率': (Math.PI * P.a * b / T).toFixed(2), '近日／遠日速度比': ((1 + P.e) / (1 - P.e)).toFixed(2) });
        },
      };
    },
  },
];
