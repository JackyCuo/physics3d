// 量子力學主題的公式檢查
import assert from 'node:assert/strict';
import { F } from '../topics/quantum.js';
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const integ = (f, a, b, n = 20000) => { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; };

{ // 普朗克曲線峰值 = 維恩位移
  let best = 0, bl = 0;
  for (let nm = 200; nm < 1500; nm += 0.5) { const v = F.planck(nm * 1e-9, 5000); if (v > best) { best = v; bl = nm; } }
  near(bl, F.wien(5000) * 1e9, 1, '維恩峰值 5000 K');
  near(F.planck(50e-6, 5000) / F.rayleighJeans(50e-6, 5000), 1, 0.03, '長波長時普朗克 ≈ 瑞立–金斯');
}
near(F.photoKE(400, 2.28), 0.82, 0.01, '光電效應 鈉 400 nm');
assert.ok(F.photoKE(700, 2.28) < 0, '紅光打不出鈉的電子');
near(F.wellE(3, 2) / F.wellE(1, 2), 9, 1e-12, '無限位能井 Eₙ ∝ n²');
near(integ(x => F.wellPsi(4, 3, x) ** 2, 0, 3), 1, 1e-6, '位能井波函數歸一化');
near(integ(x => F.qhoPsi(6, x) ** 2, -10, 10), 1, 1e-6, '諧振子 ψ₆ 歸一化');
near(integ(x => F.qhoPsi(3, x) * F.qhoPsi(5, x), -10, 10), 0, 1e-6, '諧振子正交');
for (const [n, l] of [[1, 0], [2, 1], [3, 2], [4, 0], [4, 3]]) near(integ(r => r * r * F.hydrogenR(n, l, r) ** 2, 0, 120), 1, 1e-4, `氫原子 R_${n}${l} 歸一化`);
assert.ok(F.barrierT(1, 1.6, 0.5) > F.barrierT(1, 1.6, 1) && F.barrierT(1, 1.6, 1) > F.barrierT(1, 1.6, 2), '穿透率隨厚度遞減');
near(F.barrierT(2, 1, Math.PI / Math.sqrt(2)), 1, 1e-9, '共振穿透 T = 1');
near(F.sigmaX(1, 0) * F.sigmaP(1), 0.5, 1e-12, '高斯波包 Δx·Δp = ħ/2');
assert.ok(F.sigmaX(1, 3) * F.sigmaP(1) > 0.5, '自由演化後乘積變大');
near(F.chsh(0, Math.PI / 2, Math.PI / 4, 3 * Math.PI / 4), 2 * Math.SQRT2, 1e-12, 'CHSH = 2√2');
near(F.slitI(0, 1.4, 0.22, 0.3, false), 1, 1e-12, '雙狹縫中央亮紋');
near(F.slitI(0.3 / 2.8, 1.4, 0.22, 0.3, false), 0, 1e-9, '雙狹縫第一暗紋');
console.log('量子力學檢查通過');
