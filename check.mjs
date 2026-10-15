// 物理公式自我檢查：node check.mjs
import assert from 'node:assert/strict';
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const D = Math.PI / 180;

const { F: optics } = await import('./topics/optics.js');
near(optics.snell(1, 1.5, 30 * D) / D, 19.47, 0.01, '斯涅爾 空氣→玻璃 30°');
assert.equal(optics.snell(1.5, 1, 60 * D), null, '玻璃→空氣 60° 應全反射');
near(optics.critical(1.33, 1) / D, 48.75, 0.01, '水的臨界角');
near(optics.reflectance(1, 1.5, 0), 0.04, 1e-3, '正入射反射率 4%');

const { F: waves } = await import('./topics/waves.js');
near(waves.doppler(100, 340, 34, true), 111.11, 0.01, '都卜勒 前方');
near(waves.doppler(100, 340, 34, false), 90.91, 0.01, '都卜勒 後方');
near(waves.machAngle(2) / D, 30, 1e-9, '馬赫 2 → 30°');

const { F: em } = await import('./topics/em.js');
near(em.flux([{ q: 2, x: 0.5, y: 0.3, z: 0 }], em.sphereSamples(2, 3000)), 2, 0.01, '高斯：球面內電荷');
near(em.flux([{ q: 2, x: 0.5, y: 0.3, z: 0 }], em.cubeSamples(2, 40)), 2, 0.02, '高斯：立方體內電荷');
near(em.flux([{ q: 2, x: 4, y: 0, z: 0 }], em.sphereSamples(2, 3000)), 0, 0.01, '高斯：外部電荷通量 0');

const { F: cos } = await import('./topics/cosmology.js');
{ // 只有物質：a = (3t/2)^(2/3)，t = 2/3 時 a = 1
  const cv = cos.curve(1, 0, 1);
  const p = cv.reduce((b, q) => Math.abs(q[0] - 2 / 3) < Math.abs(b[0] - 2 / 3) ? q : b);
  near(p[1], 1, 0.01, '弗里德曼 物質主導 a ∝ t^(2/3)');
  const now = cos.curve(0.3, 0.7).find(q => q[1] >= 1);
  near(now[0], 0.964, 0.01, 'ΛCDM 宇宙年齡 ≈ 0.964/H₀');
  assert.ok(cos.curve(3, 0, 6).at(-1)[1] < 0.02, 'Ωm=3 應再塌縮');
}

const { F: th } = await import('./topics/thermo.js');
near(Math.exp(th.lnOmega(10, 5)), 252, 1e-6, 'C(10,5)');
assert.equal(th.lnOmega(100, 0), 0, '全在左邊只有 1 種排法');

const { F: fl } = await import('./topics/fluids.js');
near(fl.speedAt(1, 1, 0.5), 4, 1e-12, '連續方程式');
near(fl.pressureDrop(1000, 1, 4), 7500, 1e-9, '白努利壓力差');

const { F: me } = await import('./topics/mechanics.js');
const [v1, v2] = me.recoil(60, 100, 120);
near(60 * v1 + 100 * v2, 0, 1e-12, '第三定律 動量守恆');

console.log('全部通過');

// 各分區的檢查（checks/*.mjs，各自 import 自己的 topics）
import { readdirSync } from 'node:fs';
for (const f of readdirSync(new URL('./checks/', import.meta.url)).filter(f => f.endsWith('.mjs')).sort()) await import(`./checks/${f}`);
console.log('分區檢查也全部通過');
