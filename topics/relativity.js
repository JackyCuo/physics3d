import { VIO, AMBER, CYAN } from './palette.js';
import * as jojo from './jojo.js';
// 理論物理・相對論
const G = 6.674e-11, C = 2.998e8, MSUN = 1.989e30;
export const F = {
  gamma: beta => 1 / Math.sqrt(1 - beta * beta),
  energy: m => m * C * C,                       // E = mc²（焦耳）
  rs: M => 2 * G * M / (C * C),                 // 史瓦西半徑（公尺）
  // 澤爾多維奇效應（簡化）：吸收體旋轉 Ω、波的角動量數 m、頻率 ω = 1；吸收正比於旋轉座標中的頻率 ω − mΩ，負的就變放大
  zeldovichGain: (m, W, kappa) => Math.exp(-kappa * (1 - m * W)),
  // 史瓦西時空的光線（赤道面）：d²x/dλ² = −(3/2) r_s h² x / r⁵，h = |x × v|
  // 從 (−L, b) 往 +x 出發；回傳 { pts: [[x,y]...], captured, dir: 最後方向角 }
  traceRay(b, rs, L = 14, maxSteps = 20000) {
    let x = -L, y = b, vx = 1, vy = 0;
    const h2 = b * b, pts = [[x, y]];
    const acc = (x, y) => { const r2 = x * x + y * y, k = -1.5 * rs * h2 / (r2 * r2 * Math.sqrt(r2)); return [k * x, k * y]; };
    for (let i = 0; i < maxSteps; i++) {
      const r = Math.hypot(x, y);
      if (r < rs * 1.01) return { pts, captured: true, dir: Math.atan2(vy, vx) };
      if (r > L * 1.05 && x * vx + y * vy > 0) break;
      const dt = Math.min(0.05 * L / 14, 0.01 * r);
      // RK4
      const [a1x, a1y] = acc(x, y);
      const [a2x, a2y] = acc(x + vx * dt / 2, y + vy * dt / 2);
      const [a3x, a3y] = acc(x + (vx + a1x * dt / 2) * dt / 2, y + (vy + a1y * dt / 2) * dt / 2);
      const [a4x, a4y] = acc(x + (vx + a2x * dt / 2) * dt, y + (vy + a2y * dt / 2) * dt);
      x += dt * (vx + dt / 6 * (a1x + a2x + a3x)); y += dt * (vy + dt / 6 * (a1y + a2y + a3y));
      vx += dt / 6 * (a1x + 2 * a2x + 2 * a3x + a4x); vy += dt / 6 * (a1y + 2 * a2y + 2 * a3y + a4y);
      const [px, py] = pts.at(-1);
      if (Math.hypot(x - px, y - py) > 0.08) pts.push([x, y]);
    }
    pts.push([x, y]);
    return { pts, captured: false, dir: Math.atan2(vy, vx) };
  },
};


// 光鐘：兩片鏡子＋一顆光子
function lightClock(U, THREE, Lm) {
  const g = new THREE.Group();
  const mm = U.mat(0xdfe3ea, { metal: 0.9, rough: 0.15, emissive: VIO, ei: 0.15 });
  const top = U.box(1.2, 0.08, 0.8, mm), bot = U.box(1.2, 0.08, 0.8, mm);
  top.position.y = Lm; const rod = U.cyl(0.03, 0.03, Lm, U.mat(0x555a66)); rod.position.set(-0.6, Lm / 2, 0);
  const ph = U.sphere(0.12, U.glow(0xfff2c0));
  g.add(top, bot, rod, ph);
  g.photon = ph;
  return g;
}
const cycle = (arr, t, sec = 4) => arr[Math.floor(t / sec) % arr.length];
const tri = s => { const f = s - Math.floor(s); return f < 0.5 ? 2 * f : 2 - 2 * f; };   // 0→1→0

export default [
  {
    id: 'timedilation', realm: 'theory', cat: '相對論', title: '時間膨脹', en: 'Time Dilation · Light Clock', keys: '狹義相對論 special relativity 光鐘 gamma 勞侖茲',
    tex: ["\\Delta t' = \\gamma\\,\\Delta t_0,\\qquad \\gamma = \\dfrac{1}{\\sqrt{1 - v^2/c^2}}"],
    explain: '<p><b>光鐘</b>：光子在兩片鏡子之間來回彈一次算「滴答」一聲。對任何觀察者，光速都是 \\(c\\)。</p><p>站在月台上看火車上的光鐘，光子走的是<b>斜線</b>，路比較長，但速度還是 \\(c\\)，所以每一聲滴答要花更久——<b>移動中的時鐘走得比較慢</b>，慢 \\(\\gamma\\) 倍。這不是鐘壞了，是時間本身變慢：GPS 衛星每天都要修正這個效應。</p>',
    watch: ['按「Made in Heaven」：普奇神父把火車一路加速到 0.99c。他想讓時間加速，結果月台上的 DIO 看他的鐘反而變慢了。', '就算到 0.99c，火車的鐘也只是變慢（γ ≈ 7），不會停；要讓時間真的停住得跑到光速，有質量的東西做不到——連 THE WORLD 都辦不到。', '火車上的光子拖出一條鋸齒線：斜邊比垂直高度長，這就是 γ 的來源（畢氏定理）。', '速度推到 0.9c 以上：γ 急遽變大，火車上的滴答數明顯落後。', '速度很小時兩個鐘幾乎同步——日常生活感覺不到相對論。'],
    params: [{ k: 'beta', label: '火車速度 v/c', min: 0, max: 0.99, step: 0.01, v: 0.8 }],
    cam: [0, 5, 20], target: [0, 1.4, -1.5],
    setup({ THREE, root, U, P, out }) {
      const Lm = 2.4, c = 3.2, X = 8;
      const rest = lightClock(U, THREE, Lm); rest.position.set(0, 0.15, -4);
      const restBase = U.box(2, 0.15, 1.4, U.mat(0x2a2f3c, { metal: 0.5 })); restBase.position.set(0, 0.07, -4);
      const train = new THREE.Group();
      const car = U.box(3.2, 0.3, 1.6, U.mat(0x30343f, { metal: 0.6, rough: 0.3, emissive: VIO, ei: 0.08 }));
      car.position.y = 0.15; train.add(car);
      const mov = lightClock(U, THREE, Lm); mov.position.y = 0.3; train.add(mov);
      const rail = U.box(2 * X + 6, 0.06, 0.3, U.mat(0x3a3f4c, { metal: 0.7 })); rail.position.y = 0.03;
      const trail = U.line(600, 0xfff2c0, 0.8);
      const lR = U.label('', { color: '#e9edf5', size: 0.55 }), lM = U.label('', { color: '#c9b8ff', size: 0.55 });
      lR.position.set(0, Lm + 1, -4);
      // 普奇神父坐在火車上（跟著火車動），DIO 站在月台的靜止鐘旁
      const pu = jojo.pucci(U, THREE); pu.scale.setScalar(0.42); pu.position.set(1.05, 0.3, 0); train.add(pu);
      const di = jojo.dio(U, THREE); di.scale.setScalar(0.85); di.position.set(1.6, 0.15, -4);
      const puSay = U.pop('', 0.75), diSay = U.pop('', 0.75), menacing = U.label('ゴ ゴ ゴ ゴ', { size: 0.7, color: '#c58bff' });
      diSay.position.set(1.6, 3.4, -4); menacing.position.set(-5, 4.6, -4);
      root.add(rest, restBase, rail, train, trail, lR, lM, di, puSay, diSay, menacing);
      let x = -X, tt = 0, pts = [], mih = false, beta = P.beta;
      return {
        actions: { 'Made in Heaven（加速到 0.99c）': () => { mih = true; } },
        onParam() { tt = 0; x = -X; pts = []; mih = false; },
        update(dt, P, t) {
          beta = mih ? Math.min(0.99, beta + dt * 0.25) : P.beta;   // Made in Heaven：不動滑桿，直接慢慢加速
          const g = F.gamma(beta), v = beta * c;
          tt += dt; x += v * dt;
          if (x > X) { x = -X; pts = []; }
          train.position.x = x;
          const sR = tt * c / (2 * Lm), sM = tt * c / (2 * Lm * g);   // 移動中的光子垂直速度只剩 c/γ
          rest.photon.position.y = Lm * tri(sR);
          mov.photon.position.y = Lm * tri(sM);
          const wp = U.V(x, 0.3 + mov.photon.position.y, 0);
          if (!pts.length || wp.distanceTo(pts.at(-1)) > 0.05) pts.push(wp);
          if (pts.length > 600) pts.shift();
          trail.set(pts);
          const nR = Math.floor(sR), nM = Math.floor(sM);
          lR.set(`靜止的鐘：${nR}`); lM.set(`火車上的鐘：${nM}`); lM.position.set(x, Lm + 1.3, 0);
          pu.face.look().mood(beta > 0.9 ? 'shock' : 'happy'); di.face.look();
          puSay.position.set(x, Lm + 2.2, 0);
          puSay.set(mih && beta < 0.99 ? 'Made in Heaven！時間加速吧！' : beta > 0.9 ? '怎麼回事…月台看我的時間反而變慢了！？' : beta > 0.5 ? '我要到達「天堂」…再快一點！' : '你相信「時間」嗎？');
          diSay.set(beta > 0.9 ? cycle(['WRYYY！神父，你的鐘慢了 ' + g.toFixed(1) + ' 倍！', '但要讓時間「停止」得跑到光速——做不到的！', '能停止時間的，只有我的 THE WORLD！'], t, 3) : cycle(['是我，DIO 噠！我的鐘照常走。', '移動的鐘，看起來就是比較慢。'], t, 3));
          menacing.visible = beta > 0.9;
          out({ 'v/c': beta.toFixed(3) + (mih ? '（Made in Heaven）' : ''), 'γ': g.toFixed(3), '靜止鐘滴答': nR, '火車鐘滴答': nM, '火車時間 / 月台時間': (1 / g).toFixed(3) });
        },
      };
    },
  },
  {
    id: 'lengthcontraction', realm: 'theory', cat: '相對論', title: '長度收縮', en: 'Length Contraction', keys: '狹義相對論 勞侖茲收縮 lorentz',
    tex: ['L = \\dfrac{L_0}{\\gamma} = L_0\\sqrt{1 - v^2/c^2}'],
    explain: '<p>高速運動的物體，在<b>運動方向</b>上的長度會被量得比較短；垂直方向不變。\\(L_0\\) 是物體自己量到的「固有長度」。</p><p>和時間膨脹是同一件事的兩面：宇宙射線產生的緲子壽命只有 2.2 微秒，照理飛不到地面，但在緲子看來大氣層被壓扁了，所以它到得了。</p>',
    watch: ['DIO 坐在 5 公尺長的壓路機上，用接近光速飛過去（「ロードローラーだッ！」）：連 DIO 一起被壓扁，但只扁前後方向。', '在 DIO 自己看來壓路機一點都沒變短——收縮是「你」量到的。', '白色虛線框是壓路機靜止時的長度（5 m），拿來對照。', '只有前後方向變短，高度和寬度完全沒變。', '0.5c 時只縮 13%，0.99c 時剩不到七分之一。'],
    params: [{ k: 'beta', label: '速度 v/c', min: 0, max: 0.99, step: 0.01, v: 0.87 }],
    cam: [0, 5, 14], target: [0, 1, 0],
    setup({ THREE, root, U, P, out }) {
      const L0 = 5, X = 10;
      // 壓路機（長 5 m）＋站在上面的 DIO
      const s = new THREE.Group(), rr = jojo.roller(U, THREE), di = jojo.dio(U, THREE);
      const k = L0 / 2.85, H = 2 * k, W = 1.8 * k;   // 壓路機模型長 2.85 → 放大成 5 m
      rr.scale.setScalar(k); rr.position.x = -0.125 * k; di.position.set(-0.725 * k, H, 0); di.scale.setScalar(0.9);
      s.add(rr, di);
      const say = U.pop('', 0.55);
      const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L0, H, W)), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.15, gapSize: 0.1, transparent: true, opacity: 0.55 }));
      ghost.computeLineDistances(); ghost.position.set(0, H / 2, 0);
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L0, H, W)), new THREE.LineBasicMaterial({ color: VIO }));
      const lG = U.label(`靜止 L₀ = ${L0} m`, { color: 'rgba(233,237,245,.7)', size: 0.36 }); lG.position.set(0, -0.5, W / 2 + 0.4);
      const lS = U.label('', { color: '#c9b8ff', size: 0.4 });
      root.add(s, ghost, box, lG, lS, say);
      let x = -X;
      return {
        update(dt, P) {
          const g = F.gamma(P.beta);
          x += Math.max(P.beta, 0.05) * 4 * dt;
          if (x > X) x = -X;
          s.scale.x = 1 / g; s.position.x = x;
          box.scale.x = 1 / g; box.position.set(x, H / 2, 0);
          ghost.position.x = x; lG.position.x = x;
          lS.set(`L = ${(L0 / g).toFixed(2)} m`); lS.position.set(x, -1.1, W / 2 + 0.4);
          di.face.look().mood(P.beta > 0.9 ? 'shock' : 'happy');
          say.position.set(x, H + 2.8, 0);
          say.set(P.beta > 0.9 ? 'WRYYY！我被壓扁了？不，是你們量的才扁！' : P.beta > 0.5 ? 'ロードローラーだッ！（壓路機啊！）' : '慢慢開…還看不出收縮');
          out({ 'γ': g.toFixed(3), '量到的長度 L': (L0 / g).toFixed(2) + ' m', '縮短比例': ((1 - 1 / g) * 100).toFixed(1) + '%' });
        },
      };
    },
  },
  {
    id: 'emc2', realm: 'theory', cat: '相對論', title: '質能等價 E = mc²', en: 'Mass–Energy Equivalence', keys: 'emc2 質能 湮滅 annihilation 愛因斯坦 einstein',
    tex: ['E = mc^2', 'e^- + e^+ \\;\\to\\; 2\\gamma \\quad (2 \\times 0.511\\ \\text{MeV})'],
    explain: '<p>質量本身就是一種能量，換算率是光速平方——\\(c^2 \\approx 9\\times10^{16}\\ \\text{m}^2/\\text{s}^2\\)，大到嚇人。<b>1 公克</b>的質量全部變成能量，約等於 2 萬噸 TNT，一顆原子彈。</p><p>畫面是電子遇上反粒子正子：兩者<b>完全湮滅</b>，質量全部變成兩道反方向飛出的 γ 射線（動量守恆所以一定成對）。核電與太陽則只把約 0.1%～0.7% 的質量轉成能量（質量虧損）。</p>',
    watch: ['碰撞後粒子消失、只剩兩道光子，總能量 = 兩個電子的靜止質量能。', '把質量滑桿從 1 g 拉到 1 kg：能量照比例放大一千倍。'],
    params: [{ k: 'm', label: '轉換的質量', min: 0.01, max: 1000, step: 0.01, v: 1, unit: 'g' }],
    grid: false, cam: [0, 3, 11], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const e = U.sphere(0.35, U.mat(0x111111, { emissive: CYAN })), p = U.sphere(0.35, U.mat(0x111111, { emissive: AMBER }));
      const le = U.label('e⁻', { color: '#4fd1e8' }), lp = U.label('e⁺', { color: '#f5b544' });
      const flash = U.sphere(1, U.glow(0xffffff, 0.8));
      const waves = [U.line(120, 0xc9b8ff), U.line(120, 0xc9b8ff)];
      const lg = [U.label('γ', { color: '#c9b8ff' }), U.label('γ', { color: '#c9b8ff' })];
      const fe = U.face(0.35), fp = U.face(0.35); e.add(fe); p.add(fp);
      const sayE = U.pop('', 0.45), sayP = U.pop('', 0.45), after = U.pop('', 0.5); after.position.set(0, -1.8, 0);
      root.add(e, p, le, lp, flash, ...waves, ...lg, sayE, sayP, after);
      const T = 4.5, axis = U.V(0.35, 0.9, 0.25).normalize();
      return {
        update(dt, P, t) {
          const s = t % T, before = s < 1.6;
          const d = Math.max(0, 5 * (1 - s / 1.6));
          e.visible = p.visible = le.visible = lp.visible = before;
          e.position.set(-d - 0.35, 0, 0); p.position.set(d + 0.35, 0, 0);
          le.position.set(-d - 0.35, 0.7, 0); lp.position.set(d + 0.35, 0.7, 0);
          fe.look(); fp.look(); fe.mood(s > 1.2 ? 'shock' : 'happy'); fp.mood(s > 1.2 ? 'shock' : 'happy');
          sayE.visible = sayP.visible = before; after.visible = !before;
          sayE.position.set(-d - 0.35, 1.4 + 0.4, 0); sayP.position.set(d + 0.35, 1.0, 0);
          sayE.set('歐拉歐拉歐拉！'); sayP.set('無駄無駄無駄！');
          after.set(s - 1.6 < 1.2 ? 'ドゴォ！' : 'やれやれだぜ…質量全部變成光了（E = mc²）');
          const k = s - 1.6;
          flash.visible = !before && k < 0.6;
          if (flash.visible) { flash.scale.setScalar(0.3 + k * 3); flash.material.opacity = 0.8 * (1 - k / 0.6); }
          waves.forEach((w, i) => {
            w.visible = lg[i].visible = !before;
            if (before) return;
            const dir = axis.clone().multiplyScalar(i ? -1 : 1), len = Math.min(7, k * 4);
            const side = U.V().crossVectors(dir, U.V(0, 0, 1)).normalize();
            w.set(Array.from({ length: 120 }, (_, j) => { const u = j / 119 * len; return dir.clone().multiplyScalar(u).addScaledVector(side, 0.25 * Math.sin(u * 7 - t * 25)); }));
            lg[i].position.copy(dir).multiplyScalar(len + 0.5);
          });
          const E = F.energy(P.m / 1000);
          out({ '能量 E': E.toExponential(2) + ' J', '相當 TNT': (E / 4.184e12).toFixed(E < 4.184e12 ? 3 : 1) + ' 千噸', '台灣家庭年用電': Math.round(E / 1.26e10).toLocaleString() + ' 戶', '一對電子湮滅': '1.022 MeV' });
        },
      };
    },
  },
  {
    id: 'spacetime', realm: 'theory', cat: '相對論', title: '時空彎曲', en: 'Curved Spacetime · General Relativity', keys: '廣義相對論 general relativity 重力井 愛因斯坦場方程',
    tex: ['G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\dfrac{8\\pi G}{c^4}\\,T_{\\mu\\nu}'],
    explain: '<p>廣義相對論說：<b>重力不是力，而是時空的彎曲</b>。方程式左邊是時空的形狀，右邊 \\(T_{\\mu\\nu}\\) 是物質與能量。惠勒的名言：「物質告訴時空怎麼彎，時空告訴物質怎麼動。」</p><p>畫面用常見的「橡皮膜」比喻：中間的恆星把網格壓出一個井，小天體沿著彎曲的時空走「最直的路」，看起來就像被吸引繞圈。</p>',
    watch: ['《星際效應》版：中間的恆星當作黑洞「巨人」，太空船「永續號」繞著它走；越靠近井底時間越慢，所以米勒星球上待一小時，地球過七年（這裡只是比喻，沒算真的時間差）。', '質量越大，井越深，同樣距離的軌道要跑更快才不會掉進去。', '把初速調低：軌道變成橢圓，靠近恆星時跑得最快（克卜勒第二定律）。', '初速太大會逃出重力井（總能量 > 0）。'],
    params: [
      { k: 'M', label: '恆星質量', min: 0.5, max: 3, step: 0.05, v: 1.5 },
      { k: 'r0', label: '起始距離', min: 2.5, max: 9, step: 0.1, v: 6 },
      { k: 'f', label: '初速（圓軌道速度的倍數）', min: 0.4, max: 1.5, step: 0.01, v: 0.8 },
    ],
    grid: false, cam: [0, 10, 15], target: [0, -1, 0],
    setup({ THREE, root, U, P, out }) {
      const S = 12, NL = 33, NP = 90;
      const depth = (r, M) => -M * 1.5 / Math.sqrt(r * r + 0.9);
      const lines = Array.from({ length: NL * 2 }, () => U.line(NP, VIO, 0.35));
      const star = U.sphere(1, U.mat(0x111111, { emissive: AMBER }));
      const glow = U.sphere(1, U.glow(AMBER, 0.15));
      const body = U.sphere(0.25, U.mat(0xdfe3ea, { emissive: CYAN, ei: 0.5 }));
      const trail = U.line(800, CYAN, 0.7);
      const sf = U.face(1), bf = U.face(0.25); star.add(sf); body.add(bf);
      // 《星際效應》惡搞：恆星當成黑洞「巨人」、小天體是太空船，旁邊站著機器人 TARS（四塊直立長方塊）
      const tars = new THREE.Group(), tm = U.mat(0x9aa3b5, { metal: 0.8, rough: 0.35 });
      for (let i = 0; i < 4; i++) { const b = U.box(0.28, 2.2, 0.5, tm); b.position.set(-0.45 + i * 0.3, 1.1, 0); tars.add(b); }
      const tl = U.label('TARS', { size: 0.3, color: '#111' }); tl.position.set(0, 1.7, 0.3); tars.add(tl);
      tars.position.set(-5.5, 0, 7);
      const gName = U.label('巨人（Gargantua）', { size: 0.45, color: '#f5b544' }), sName = U.label('永續號', { size: 0.35, color: '#4fd1e8' });
      const say = U.pop('', 0.5); say.position.set(-4.5, 3.2, 7);
      root.add(...lines, star, glow, body, trail, tars, gName, sName, say);
      let key = '', x, z, vx, vz, pts;
      const launch = () => { x = P.r0; z = 0; vx = 0; vz = -P.f * Math.sqrt(P.M * 4 / P.r0); pts = []; };
      launch();
      const pt = (px, pz, M) => U.V(px, depth(Math.hypot(px, pz), M), pz);
      return {
        actions: { '重新發射': launch },
        onParam(k) { if (k !== 'M') launch(); },
        update(dt, P, t) {
          const GM = P.M * 4;
          if (key !== P.M) {
            key = P.M;
            for (let i = 0; i < NL; i++) {
              const u = -S + 2 * S * i / (NL - 1);
              lines[i].set(Array.from({ length: NP }, (_, j) => pt(u, -S + 2 * S * j / (NP - 1), P.M)));
              lines[NL + i].set(Array.from({ length: NP }, (_, j) => pt(-S + 2 * S * j / (NP - 1), u, P.M)));
            }
            const rs = 0.35 + 0.2 * P.M;
            star.scale.setScalar(rs); glow.scale.setScalar(rs * 1.8);
            star.position.y = glow.position.y = depth(0, P.M) + rs;
          }
          for (let k = 0; k < 10; k++) {   // 速度 Verlet，切細
            const h = dt / 10, r2 = x * x + z * z + 0.05, a = -GM / (r2 * Math.sqrt(r2));
            vx += a * x * h; vz += a * z * h; x += vx * h; z += vz * h;
          }
          const r = Math.hypot(x, z), v = Math.hypot(vx, vz), E = v * v / 2 - GM / r;
          if (r < 0.35 + 0.2 * P.M + 0.25 || r > 16) launch();   // 小天體半徑 0.25：表面碰到恆星就重來，不穿進去
          body.position.copy(pt(x, z, P.M)).add(U.V(0, 0.25, 0));
          const last = pts.at(-1);
          if (!last || last.distanceTo(body.position) > 0.08) { pts.push(body.position.clone()); if (pts.length > 800) pts.shift(); }
          trail.set(pts);
          sf.look(); bf.look().mood(r < 2.2 ? 'shock' : 'happy');
          gName.position.set(0, star.position.y + star.scale.x + 0.7, 0); sName.position.copy(body.position).add(U.V(0, 0.7, 0));
          say.set(r < 2.2 ? '米勒星球：這裡待 1 小時，地球過 7 年！（越深的井，時間越慢）' : E >= 0 ? '庫柏：我們要回家了——飛出重力井！' : cycle(['TARS：誠實度設定 90%。', 'TARS：幽默設定 75%…要調低嗎？', '布蘭德教授：不要溫和地走進那個良夜。', '庫柏：重力是唯一能穿越時空的東西。', '墨菲，留下來（STAY）…'], t));
          out({ '距離 r': r.toFixed(2), '速率 v': v.toFixed(2), '比能量 E': E.toFixed(2), '軌道': E < 0 ? '被束縛（繞行）' : '逃逸' });
        },
      };
    },
  },
  {
    id: 'schwarzschild', realm: 'theory', cat: '相對論', title: '史瓦西半徑與重力透鏡', en: 'Schwarzschild Radius · Gravitational Lensing', keys: '黑洞 black hole 事件視界 event horizon 光子球 重力透鏡 lensing',
    tex: ['r_s = \\dfrac{2GM}{c^2}', '\\dfrac{d^2u}{d\\varphi^2} + u = \\dfrac{3}{2}\\,r_s\\,u^2,\\quad u = \\dfrac1r'],
    explain: '<p>把質量 \\(M\\) 壓縮到半徑 \\(r_s\\) 以內，逃逸速度就超過光速，形成<b>黑洞</b>；這個球面是<b>事件視界</b>。太陽的 \\(r_s\\) 只有約 3 公里。</p><p>光經過大質量天體時會沿著彎曲時空偏折——<b>重力透鏡</b>。畫面裡的光線是真的用史瓦西時空的光線方程算出來的：在 \\(1.5\\,r_s\\) 的<b>光子球</b>附近光可以繞圈；撞擊參數小於 \\(\\tfrac{3\\sqrt3}{2} r_s \\approx 2.6\\,r_s\\) 的光一定會被吞掉。</p>',
    watch: ['離黑洞越近的光線偏得越多，最靠近的直接掉進去（紅色）。', '剛好擦過光子球的光線會繞黑洞轉大半圈才離開。', '質量加倍：視界半徑也加倍，被吞的光線變多。'],
    params: [{ k: 'M', label: '黑洞質量', min: 2, max: 20, step: 0.5, v: 8, unit: 'M☉' }],
    grid: false, cam: [4, 9, 24], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const stars = U.points(900, 0xffffff, 0.08);
      for (let i = 0; i < 900; i++) { const r = 40 + Math.random() * 30, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1); stars.pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); }
      stars.flush();
      const hole = U.sphere(1, new THREE.MeshBasicMaterial({ color: 0x000000 }));
      const ps = U.mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: VIO, wireframe: true, transparent: true, opacity: 0.12 }));
      const disk = U.mesh(new THREE.RingGeometry(3, 6, 96, 1), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
      disk.rotation.x = -Math.PI / 2;
      const lPS = U.label('光子球 1.5 rₛ', { color: '#c9b8ff', size: 0.36 });
      const BS = [0.5, 1.1, 1.7, 2.3, 2.9, 3.5, 4.2, 5, 6];
      const PSI = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      const rays = BS.flatMap(() => PSI.map(() => U.line(800, 0xffffff, 0.75)));
      const dots = rays.map(() => U.sphere(0.07, U.glow(0xffffff)));
      const hf = U.face(1); hole.add(hf);
      const say = U.pop('', 1);
      root.add(stars, hole, ps, disk, lPS, ...rays, ...dots, say);
      let key = -1, paths = [], nCap = 0;
      return {
        update(dt, P, t) {
          const rs = P.M * 0.12;
          if (key !== P.M) {
            key = P.M; nCap = 0; paths = [];
            hole.scale.setScalar(rs); ps.scale.setScalar(1.5 * rs); disk.scale.setScalar(rs);
            lPS.position.set(0, 1.5 * rs + 0.5, 0);
            BS.forEach((b, i) => {
              const tr = F.traceRay(b, rs);
              if (tr.captured) nCap++;
              PSI.forEach((psi, j) => {
                const ln = rays[i * PSI.length + j];
                const p3 = tr.pts.map(([x, y]) => U.V(x, y * Math.cos(psi), y * Math.sin(psi)));
                ln.set(p3);
                ln.material.color.set(tr.captured ? 0xff6b6b : i % 2 ? 0xe9edf5 : 0xc9b8ff);
                paths.push(p3);
              });
            });
          }
          hf.look().mood('happy'); say.position.set(0, 1.5 * rs + 2.2, 0);
          say.set(cycle(['黑洞：光也逃不掉～嗯，好吃！', '黃金體驗鎮魂曲：掉進來的東西「永遠無法到達真實」——外面看它永遠停在視界前', 'DIO：視界旁時間幾乎停止…這才是真正的「THE WORLD」！'], t, 4));
          paths.forEach((p3, i) => { const k = Math.floor((t * 40 + i * 7) % p3.length); dots[i].position.copy(p3[k]); });
          const rsKm = F.rs(P.M * MSUN) / 1000;
          out({ '史瓦西半徑 rₛ': rsKm.toFixed(1) + ' km', '光子球半徑': (1.5 * rsKm).toFixed(1) + ' km', '臨界撞擊參數': (2.598 * rsKm).toFixed(1) + ' km', '被吞掉的光線': `${nCap} / ${BS.length}` });
        },
      };
    },
  },
  {
    id: 'zeldovich', realm: 'theory', cat: '相對論', title: '澤爾多維奇效應（飆馬野郎版）', en: 'Zel’dovich Effect · Rotational Superradiance (Steel Ball Run parody)', keys: '澤爾多維奇 zeldovich 超輻射 superradiance 旋轉都卜勒 角動量 黑洞 彭羅斯 jojo 飆馬野郎 steel ball run 傑洛 鋼球 回轉',
    tex: ["\\omega' = \\omega - m\\Omega", "\\text{吸收} \\propto \\omega - m\\Omega \;\\Rightarrow\; m\\Omega > \\omega \\text{ 時變成放大}"],
    explain: '<p>1971 年澤爾多維奇預言：一個<b>會吸收波的物體</b>，只要轉得夠快，打到它上面、帶有角動量的波不但不會被吸收，反而會<b>被放大</b>。</p><p>原因是<b>旋轉都卜勒效應</b>：帶角動量 \\(m\\) 的波（波前是 m 股的螺旋），在跟著物體轉的座標裡，頻率變成 \\(\\omega - m\\Omega\\)。吸收的多寡正比於這個頻率；轉速超過 \\(\\omega/m\\) 時它變成負的，「吸收」就變成「放出」，多出來的能量是從物體的轉動拿的。</p><p>旋轉黑洞也會這樣放大打上去的波（黑洞超輻射，跟彭羅斯過程是同一類）。2020 年在聲波、2024 年在電磁波上用旋轉的吸收體實驗證實了。</p><p>畫面借《JoJo》第七部《飆馬野郎》傑洛·齊貝林的<b>鋼球</b>：「回轉之中蘊含著無限的力量」，在這裡剛好是對的：能量真的從回轉來。（模型是簡化版：振幅倍率取 \\(e^{-\\kappa(1 - m\\Omega/\\omega)}\\)，只示意正負號與門檻。）</p>',
    watch: ['鋼球不轉時，右邊出去的螺旋波變小（被吸收）。', '轉速剛好 Ω = ω/m 時，波直接穿過、不增不減。', '超過門檻後右邊的波變大，螺旋變成金色：澤爾多維奇放大。', '把 m 調大：門檻 ω/m 變低，比較容易放大。'],
    params: [
      { k: 'W', label: '鋼球轉速 Ω（以 ω 為單位）', min: 0, max: 2, step: 0.01, v: 0.3 },
      { k: 'm', label: '波的角動量數 m', min: 1, max: 3, step: 1, v: 2 },
      { k: 'kappa', label: '吸收強度 κ', min: 0.3, max: 1.5, step: 0.05, v: 0.8 },
    ],
    grid: false, cam: [-4, 5, 14], target: [0, 0, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const X = 9, NP = 260, R0 = 1.2;
      const ball = jojo.steelBall(U, THREE);
      // 黃金長方形（1 : 1.618），放大時發光
      const gr = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([U.V(0, -1.6, -2.59), U.V(0, 1.6, -2.59), U.V(0, 1.6, 2.59), U.V(0, -1.6, 2.59)]), new THREE.LineBasicMaterial({ color: 0xf2c230, transparent: true }));
      const helices = [0, 1, 2].map(() => U.line(NP, CYAN));
      const pts = Array.from({ length: NP }, () => U.V());
      // 傑洛·齊貝林
      const gy = jojo.gyro(U, THREE), gf = gy.face; gy.position.set(-6.5, -2.2, 3); gy.scale.setScalar(0.9);
      const gName = U.label('傑洛·齊貝林', { size: 0.4, color: '#7fe08a' }), say = U.pop('', 0.5), lesson = U.label('', { size: 0.45, color: '#f5b544' });
      gName.position.set(-6.5, 0.6, 3); say.position.set(-4.5, 1.3, 3); lesson.position.set(0, 2.6, 0);
      root.add(ball, gr, ...helices, gy, gName, say, lesson);
      const ch = chart({ title: '振幅倍率 G vs 轉速（虛線是門檻 ω/m）', x: [0, 2], y: [0, 3], xl: 'Ω / ω', yl: 'G' });
      let spin = 0;
      return {
        update(dt, P, t) {
          const m = P.m, G = F.zeldovichGain(m, P.W, P.kappa), w1 = 1 - m * P.W, amp = Math.min(G, 2.6);
          spin += P.W * dt * 6; ball.rotation.x = spin;
          // m 股螺旋：相位 kx + mφ − ωt 固定 → φ = (ωt − kx + 2πj)/m；半徑＝振幅
          helices.forEach((h, j) => {
            h.visible = j < m;
            if (j >= m) return;
            for (let i = 0; i < NP; i++) {
              const x = -X + 2 * X * i / (NP - 1), a = x < -1.1 ? 1 : x > 1.1 ? amp : U.lerp(1, amp, (x + 1.1) / 2.2);
              const ph = (t * 3 - 1.6 * x + 2 * Math.PI * j) / m, r = R0 * a;
              pts[i].set(x, r * Math.cos(ph), r * Math.sin(ph));
            }
            h.set(pts); h.material.color.set(w1 < 0 ? 0xf5b544 : CYAN);
          });
          gr.material.opacity = w1 < 0 ? 0.6 + 0.4 * Math.sin(t * 6) : 0.15;
          gf.look().mood(w1 < 0 ? 'shock' : 'happy');
          say.set(w1 > 0.3 ? 'LESSON 1：回轉還不夠！波被鋼球吃掉了' : w1 > 0 ? '黃金的回轉…就快到了！' : Math.abs(w1) < 1e-9 ? '剛好！波直接穿過去了' : P.W > 1.5 ? '強尼：ACT 4！無限回轉！' : '回轉之中，蘊含著無限的力量！波變強了！');
          lesson.set(w1 < 0 ? '澤爾多維奇放大！' : '');
          const xs = Array.from({ length: 81 }, (_, i) => i / 40);
          ch.draw([{ pts: xs.map(W => [W, Math.min(3, F.zeldovichGain(m, W, P.kappa))]), color: '#f5b544' }, { pts: [[0, 1], [2, 1]], color: 'rgba(255,255,255,.3)', dash: [4, 4], w: 1 }],
            [{ x: 1 / m, vline: true, color: 'rgba(255,255,255,.45)' }, { x: P.W, y: Math.min(3, G), color: '#4fd1e8', r: 5 }]);
          out({ '旋轉座標中的頻率 ω − mΩ': w1.toFixed(2) + ' ω', '放大門檻 Ω > ω/m': (1 / m).toFixed(2) + ' ω', '出射／入射振幅 G': G.toFixed(2), '能量倍率 G²': (G * G).toFixed(2), '狀態': w1 > 0 ? '吸收' : w1 < 0 ? '放大（能量來自鋼球的轉動）' : '剛好透明' });
        },
      };
    },
  },
];
