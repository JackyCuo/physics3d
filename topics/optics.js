// 經典物理・光學
const D = Math.PI / 180;
export const F = {
  // 光纖從空氣進光的最大接受角：sin θmax = √(n1² − n2²)（大於 1 時任何角度都收得進來）
  acceptance: (n1, n2) => n1 <= n2 ? null : Math.asin(Math.min(1, Math.sqrt(n1 * n1 - n2 * n2))),
  // 薄透鏡：1/f = 1/do + 1/di；di 為負是虛像；do = f 時成像在無窮遠
  thinLens: (f, dO) => { const inv = 1 / f - 1 / dO; return Math.abs(inv) < 1e-9 ? Infinity : 1 / inv; },
  magnification: (dI, dO) => -dI / dO,
  // 回傳折射角（弧度）；全反射時回傳 null
  snell(n1, n2, th1) { const s = n1 / n2 * Math.sin(th1); return Math.abs(s) > 1 ? null : Math.asin(s); },
  critical: (n1, n2) => n1 > n2 ? Math.asin(n2 / n1) : null,
  // 菲涅耳反射率（s、p 偏振平均）
  reflectance(n1, n2, th1) {
    const th2 = F.snell(n1, n2, th1);
    if (th2 == null) return 1;
    const c1 = Math.cos(th1), c2 = Math.cos(th2);
    const rs = (n1 * c1 - n2 * c2) / (n1 * c1 + n2 * c2), rp = (n1 * c2 - n2 * c1) / (n1 * c2 + n2 * c1);
    return (rs * rs + rp * rp) / 2;
  },
};

export default [
  {
    id: 'snell', realm: 'classic', cat: '光學', title: '斯涅爾定律（折射）', en: "Snell's Law · Refraction", keys: '斯乃爾 折射率 refraction',
    tex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2',
    explain: '<p>光在不同介質裡速度不同（\\(v = c/n\\)）。斜斜射進另一種介質時，光會偏折：進到折射率大的介質（變慢）會<b>往法線靠近</b>，反之遠離法線。</p><p>從大折射率射向小折射率、入射角超過<b>臨界角</b> \\(\\theta_c = \\sin^{-1}(n_2/n_1)\\) 時，光完全出不去，這就是<b>全反射</b>——光纖就是靠它傳訊號。</p><p>常見折射率：空氣 1.00、水 1.33、玻璃 1.50、鑽石 2.42。</p>',
    watch: ['光點的間距代表速度：進到下方介質後光點變密，因為光變慢了。', '把 n₁ 調得比 n₂ 大，再慢慢加大入射角：折射光貼著介面消失，只剩反射。', '反射光的亮度照菲涅耳公式算，越斜反射越強。'],
    params: [
      { k: 'th', label: '入射角 θ₁', min: 0, max: 89, step: 0.5, v: 40, unit: '°' },
      { k: 'n1', label: '上方折射率 n₁', min: 1, max: 2.5, step: 0.01, v: 1 },
      { k: 'n2', label: '下方折射率 n₂', min: 1, max: 2.5, step: 0.01, v: 1.5 },
    ],
    grid: false, cam: [6, 3, 15], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const S = 6;
      const top = U.box(14, 7, 6, U.mat(0x9fd8ff, { opacity: 0.04, side: THREE.BackSide })); top.position.y = 3.5;
      const bot = U.box(14, 7, 6, U.mat(0x7fb8ff, { opacity: 0.2, rough: 0.05, metal: 0.1 })); bot.position.y = -3.5;
      const face = U.mesh(new THREE.PlaneGeometry(14, 6), U.glow(0xbfe6ff, 0.12)); face.rotation.x = -Math.PI / 2;
      const normal = U.line(2, 0xffffff, 0.5, true).set([U.V(0, 5, 0), U.V(0, -5, 0)]);
      const laser = U.cyl(0.22, 0.22, 1.4, U.mat(0x2a2d36, { metal: 0.7, rough: 0.3 }));
      const inc = U.beam(0xff3b5c, 0.045), ref = U.beam(0xff3b5c, 0.045, U.glow(0xff3b5c, 0.5)), tra = U.beam(0xff3b5c, 0.045);
      const arc1 = U.line(40, 0xf5b544), arc2 = U.line(40, 0x4fd1e8);
      const l1 = U.label('θ₁', { color: '#f5b544' }), l2 = U.label('θ₂', { color: '#4fd1e8' });
      const n1L = U.label('', { color: 'rgba(233,237,245,.6)', size: 0.36 }), n2L = U.label('', { color: 'rgba(233,237,245,.6)', size: 0.36 });
      n1L.position.set(-5.2, 3.6, 0); n2L.position.set(-5.2, -3.6, 0);
      const pulses = Array.from({ length: 10 }, () => U.sphere(0.11, U.glow(0xffd1dc)));
      root.add(top, bot, face, normal, laser, inc, ref, tra, arc1, arc2, l1, l2, n1L, n2L, ...pulses);
      const arc = (ln, a0, a1, r, down) => ln.set(Array.from({ length: 40 }, (_, i) => { const a = a0 + (a1 - a0) * i / 39; return U.V(r * Math.sin(a), (down ? -1 : 1) * r * Math.cos(a), 0); }));
      return {
        update(dt, P, t) {
          const th1 = P.th * D, th2 = F.snell(P.n1, P.n2, th1), R = F.reflectance(P.n1, P.n2, th1);
          const src = U.V(-Math.sin(th1), Math.cos(th1), 0).multiplyScalar(S);
          const O = U.V();
          const refl = U.V(Math.sin(th1), Math.cos(th1), 0).multiplyScalar(S);
          inc.set(src, O); ref.set(O, refl);
          ref.material.opacity = 0.12 + 0.88 * R;
          laser.position.copy(src).multiplyScalar(1.08);
          laser.quaternion.setFromUnitVectors(U.V(0, 1, 0), src.clone().normalize());
          tra.visible = th2 != null;
          const outDir = th2 != null ? U.V(Math.sin(th2), -Math.cos(th2), 0) : refl.clone().normalize();
          if (th2 != null) tra.set(O, outDir.clone().multiplyScalar(S));
          arc(arc1, 0, -th1, 1.6, false); arc(arc2, 0, th2 ?? th1, 1.6, th2 != null);
          l1.position.set(-Math.sin(th1 / 2) * 2.2, Math.cos(th1 / 2) * 2.2, 0);
          l2.set(th2 != null ? 'θ₂' : '全反射');
          l2.position.set(th2 != null ? Math.sin(th2 / 2) * 2.2 : 2.6, th2 != null ? -Math.cos(th2 / 2) * 2.2 : 2.6, 0);
          n1L.set(`n₁ = ${P.n1.toFixed(2)}`); n2L.set(`n₂ = ${P.n2.toFixed(2)}`);
          bot.material.opacity = 0.06 + (P.n2 - 1) * 0.18;
          top.material.opacity = 0.03 + (P.n1 - 1) * 0.18; top.material.side = P.n1 > 1.02 ? THREE.FrontSide : THREE.BackSide;
          // 光點：速度 = c/n，所以時間長度 = 路徑 × n
          const T = S * P.n1 + S * (th2 != null ? P.n2 : P.n1);
          pulses.forEach((p, i) => {
            const tau = ((t * 3 + i * T / pulses.length) % T);
            if (tau < S * P.n1) p.position.copy(src).multiplyScalar(1 - tau / (S * P.n1));
            else p.position.copy(outDir).multiplyScalar((tau - S * P.n1) / (th2 != null ? P.n2 : P.n1));
          });
          const c = F.critical(P.n1, P.n2);
          out({ '折射角 θ₂': th2 != null ? (th2 / D).toFixed(1) + '°' : '— 全反射', '臨界角 θc': c ? (c / D).toFixed(1) + '°' : '無（n₁ ≤ n₂）', '反射率': (R * 100).toFixed(1) + '%', '下方光速': (1 / P.n2).toFixed(3) + ' c' });
        },
      };
    },
  },
  {
    id: 'tir', realm: 'classic', cat: '光學', title: '全反射與光纖', en: 'Total Internal Reflection · Optical Fiber', keys: '全反射 光纖 臨界角 fiber 數值孔徑',
    tex: ['\\theta > \\theta_c = \\sin^{-1}\\dfrac{n_2}{n_1}', '\\sin\\theta_{\\max} = \\sqrt{n_1^2 - n_2^2}'],
    explain: '<p>光纖中間是折射率較高的<b>纖芯</b> \\(n_1\\)，外面包一層折射率較低的<b>包層</b> \\(n_2\\)。光從纖芯打到包層時，只要入射角大於臨界角，就會百分之百反射回來，一路彈跳把訊號送到幾十公里外。</p><p>不是所有角度射進來的光都能被困住：從端面進光的角度必須小於<b>接受角</b> \\(\\theta_{\\max}\\)，否則在牆上會漏出去。網路、內視鏡都是靠這個原理。</p>',
    watch: ['把進光角度慢慢加大：超過接受角之後，每次碰壁都有一道光漏到包層外面。', '把包層折射率調得接近纖芯：臨界角變大，能困住的光的角度範圍變小。', '光點走的是鋸齒路線，角度越斜，走同樣距離要彈越多次。'],
    params: [
      { k: 'th', label: '進光角度 θ', min: 0, max: 80, step: 0.5, v: 25, unit: '°' },
      { k: 'n1', label: '纖芯折射率 n₁', min: 1.3, max: 1.8, step: 0.01, v: 1.5 },
      { k: 'n2', label: '包層折射率 n₂', min: 1, max: 1.7, step: 0.01, v: 1.3 },
    ],
    grid: false, cam: [0, 3, 13], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const X0 = -7, X1 = 7, RC = 0.7, RCL = 1.05, D = Math.PI / 180, RED = 0xff3b5c;
      const core = U.cyl(RC, RC, X1 - X0, U.mat(0x9fd8ff, { opacity: 0.16, rough: 0.05, side: THREE.DoubleSide }), 48);
      const clad = U.cyl(RCL, RCL, X1 - X0, U.mat(0xa78bfa, { opacity: 0.08, rough: 0.05, side: THREE.DoubleSide }), 48, true);
      core.rotation.z = clad.rotation.z = Math.PI / 2;
      const laser = U.cyl(0.18, 0.18, 1.2, U.mat(0x2a2d36, { metal: 0.7, rough: 0.3 }));
      const segs = Array.from({ length: 70 }, () => U.beam(RED, 0.035, U.glow(RED, 1)));
      const leaks = Array.from({ length: 40 }, () => U.beam(RED, 0.025, U.glow(0xff9aa8, 0.6)));
      const pulse = U.sphere(0.1, U.glow(0xffd1dc));
      const lc = U.label('纖芯 n₁', { color: 'rgba(233,237,245,.6)', size: 0.34 }), lcl = U.label('包層 n₂', { color: 'rgba(200,180,255,.6)', size: 0.34 });
      lc.position.set(X1 - 1, 0, 0.9); lcl.position.set(X1 - 1, RCL + 0.35, 0);
      root.add(core, clad, laser, pulse, lc, lcl, ...segs, ...leaks);
      const path = [];
      return {
        update(dt, _, t) {
          const th = P.th * D, n1 = P.n1, n2 = P.n2;
          const src = U.V(X0 - 3 * Math.cos(th), -3 * Math.sin(th), 0);
          laser.position.copy(src).lerp(U.V(X0, 0, 0), -0.15);
          laser.quaternion.setFromUnitVectors(U.V(0, 1, 0), U.V(Math.cos(th), Math.sin(th), 0));
          const al = Math.asin(Math.sin(th) / n1), inc = Math.PI / 2 - al;
          const R = F.reflectance(n1, n2, inc), esc = F.snell(n1, n2, inc);
          path.length = 0; path.push([src, 1]);
          let p = U.V(X0, 0, 0), d = U.V(Math.cos(al), Math.sin(al), 0), I = 1, li = 0;
          path.push([p.clone(), 1]);
          for (let b = 0; b < 68; b++) {
            const tw = d.y > 1e-9 ? (RC - p.y) / d.y : d.y < -1e-9 ? (-RC - p.y) / d.y : Infinity;
            if (p.x + d.x * tw >= X1) { p = p.clone().addScaledVector(d, (X1 - p.x) / d.x); path.push([p, I]); break; }
            p = p.clone().addScaledVector(d, tw); path.push([p, I]);
            if (esc != null && li < leaks.length) {
              const o = U.V(Math.sin(esc), Math.sign(d.y) * Math.cos(esc), 0);
              leaks[li].visible = true; leaks[li].set(p, p.clone().addScaledVector(o, 2.5)); leaks[li].material.opacity = 0.7 * I * (1 - R); li++;
            }
            I *= R; d.y = -d.y;
            if (I < 0.03) break;
          }
          for (; li < leaks.length; li++) leaks[li].visible = false;
          const exitDir = U.V(Math.cos(Math.asin(Math.min(1, n1 * Math.sin(al)))), Math.sign(d.y) * Math.min(1, n1 * Math.sin(al)), 0);
          const last = path.at(-1);
          if (last[0].x >= X1 - 1e-6) path.push([last[0].clone().addScaledVector(exitDir, 2.5), last[1]]);
          segs.forEach((s, i) => {
            const a = path[i], b = path[i + 1];
            s.visible = !!b; if (!b) return;
            s.set(a[0], b[0]); s.material.opacity = Math.max(0.08, a[1]); s.material.transparent = true;
          });
          // 光點沿路徑跑
          let tot = 0; for (let i = 1; i < path.length; i++) tot += path[i][0].distanceTo(path[i - 1][0]);
          let s = (t * 4) % tot;
          for (let i = 1; i < path.length; i++) { const L = path[i][0].distanceTo(path[i - 1][0]); if (s <= L) { pulse.position.copy(path[i - 1][0]).lerp(path[i][0], s / L); break; } s -= L; }
          const crit = F.critical(n1, n2), acc = F.acceptance(n1, n2);
          out({ '臨界角 θc': crit ? (crit / D).toFixed(1) + '°' : '無（n₁ ≤ n₂）', '接受角 θmax': acc ? (acc / D).toFixed(1) + '°' : '—', '碰壁入射角': (inc / D).toFixed(1) + '°', '狀態': esc == null ? '全反射，光被困住' : `每次碰壁漏掉 ${((1 - R) * 100).toFixed(0)}%` });
        },
      };
    },
  },
  {
    id: 'lens', realm: 'classic', cat: '光學', title: '透鏡成像', en: 'Thin Lens Equation', keys: '凸透鏡 凹透鏡 焦距 實像 虛像 放大鏡',
    tex: ['\\dfrac{1}{f} = \\dfrac{1}{d_o} + \\dfrac{1}{d_i}', 'm = -\\dfrac{d_i}{d_o}'],
    explain: '<p>透鏡把光偏折。凸透鏡讓平行光聚到<b>焦點</b>，凹透鏡讓平行光散開、看起來像從焦點發出來。畫三條特殊光線就能找出像在哪裡：平行主軸的光經過焦點、穿過中心的光直走、經過前焦點的光出來變平行。</p><p>\\(d_i\\) 是正的代表光真的聚在那裡，是可以投影在螢幕上的<b>實像</b>（倒立）；負的代表光只是「看起來」從那裡來，是<b>虛像</b>（正立），放大鏡就是這樣。</p>',
    watch: ['凸透鏡：把物體從遠處慢慢推近焦點，像越來越大、越來越遠。', '物體放在焦點以內：出來的光不會相交，往回延長（虛線）才交在一起，變成正立放大的虛像。', '凹透鏡不管物體放哪裡都只有縮小的正立虛像。'],
    params: [
      { k: 'type', label: '透鏡', options: [[1, '凸透鏡'], [-1, '凹透鏡']], v: 1 },
      { k: 'f', label: '焦距 |f|', min: 1.5, max: 5, step: 0.1, v: 3 },
      { k: 'do', label: '物距 dₒ', min: 0.8, max: 10, step: 0.05, v: 7 },
      { k: 'ho', label: '物高', min: 0.5, max: 2.5, step: 0.1, v: 1.5 },
    ],
    grid: false, cam: [1, 2, 17], target: [1, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const lensM = U.mesh(new THREE.BufferGeometry(), U.mat(0x9fd8ff, { opacity: 0.3, rough: 0.05, metal: 0.1, side: THREE.DoubleSide }));
      const build = s => {
        const half = r => s > 0 ? 0.06 + 0.32 * (1 - (r / 2.6) ** 2) : 0.06 + 0.32 * (r / 2.6) ** 2, prof = [];
        for (let i = 0; i <= 20; i++) prof.push(new THREE.Vector2(2.6 * i / 20, half(2.6 * i / 20)));
        for (let i = 20; i >= 0; i--) prof.push(new THREE.Vector2(2.6 * i / 20, -half(2.6 * i / 20)));
        lensM.geometry.dispose(); lensM.geometry = new THREE.LatheGeometry(prof, 48); lensM.rotation.z = Math.PI / 2;
      };
      build(P.type);
      const axis = U.line(2, 0xffffff, 0.3, true).set([U.V(-12, 0, 0), U.V(14, 0, 0)]);
      const obj = U.arrow(0xf5b544, 0.06), img = U.arrow(0x4fd1e8, 0.06);
      const foc = [-1, 1].map(() => U.sphere(0.09, U.glow(0xffffff)));
      const fl = [U.label('F', { size: 0.34 }), U.label("F'", { size: 0.34 })];
      const imgL = U.label('', { color: '#4fd1e8', size: 0.36 });
      const COLS = [0xff6b6b, 0x7ee787, 0xa78bfa];
      const rin = COLS.map(c => U.line(2, c)), rout = COLS.map(c => U.line(2, c)), rvirt = COLS.map(c => U.line(2, c, 0.6, true));
      root.add(lensM, axis, obj, img, imgL, ...foc, ...fl, ...rin, ...rout, ...rvirt);
      return {
        onParam(k, v) { if (k === 'type') build(v); },
        update() {
          const f = P.type * P.f, dO = P.do, ho = P.ho, dI = F.thinLens(f, dO), m = isFinite(dI) ? F.magnification(dI, dO) : Infinity;
          const O = U.V(-dO, ho, 0);
          obj.set(U.V(-dO, 0, 0), U.V(0, ho, 0));
          foc[0].position.set(-P.f, 0, 0); foc[1].position.set(P.f, 0, 0);
          fl[0].position.set(-P.f, -0.4, 0); fl[1].position.set(P.f, -0.4, 0);
          const Iv = isFinite(dI) ? U.V(dI, m * ho, 0) : null;
          img.visible = imgL.visible = !!Iv && Math.abs(dI) < 40;
          if (img.visible) {
            img.set(U.V(dI, 0, 0), U.V(0, m * ho, 0));
            img.children[0].material.transparent = true; img.children[0].material.opacity = dI > 0 ? 1 : 0.45;
            imgL.set(dI > 0 ? '實像' : '虛像'); imgL.position.set(dI, m * ho + Math.sign(m * ho || 1) * 0.45, 0);
          }
          // 三條特殊光線的入射點：(0, ho)、(0, 0)、(0, m·ho)
          const hits = [U.V(0, ho, 0), U.V(0, 0, 0), Iv ? U.V(0, m * ho, 0) : null];
          hits.forEach((H, i) => {
            const ok = H && Math.abs(H.y) < 2.6;
            rin[i].visible = rout[i].visible = !!ok; rvirt[i].visible = false;
            if (!ok) return;
            rin[i].set([O, H]);
            let dir;
            if (Iv) dir = (dI > 0 ? Iv.clone().sub(H) : H.clone().sub(Iv)).normalize();
            else dir = i === 0 ? U.V(f, -ho, 0).normalize() : U.V(dO, -ho, 0).normalize();   // dₒ = f：出射光全部平行中心光線
            if (dir.x < 0) dir.negate();
            rout[i].set([H, H.clone().addScaledVector(dir, (14 - H.x) / dir.x)]);
            if (Iv && dI < 0) { rvirt[i].visible = true; rvirt[i].set([H, Iv]).computeLineDistances(); }
          });
          const kind = !isFinite(dI) ? '不成像（在無窮遠）' : `${dI > 0 ? '實像' : '虛像'}、${m < 0 ? '倒立' : '正立'}、${Math.abs(m) > 1 ? '放大' : '縮小'}`;
          out({ '像距 dᵢ': isFinite(dI) ? dI.toFixed(2) : '∞', '放大率 m': isFinite(m) ? m.toFixed(2) + '×' : '∞', '像': kind, '焦距 f': f.toFixed(1) });
        },
      };
    },
  },
];
