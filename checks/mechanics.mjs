// 力學與流體（fork A）的公式檢查
import assert from 'node:assert/strict';
import { F } from '../topics/mechanics.js';
import { F as FL } from '../topics/fluids.js';
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const D = Math.PI / 180;

near(F.range(10, 45 * D, 9.8), 100 / 9.8, 1e-9, '45° 射程 v²/g');
near(F.range(10, 30 * D), F.range(10, 60 * D), 1e-9, '30° 與 60° 射程相同');
near(F.maxHeight(10, 90 * D, 10), 5, 1e-9, '垂直上拋最高點');
near(F.centripetal(4, 2), 8, 1e-12, '向心加速度');
near(F.pendulumPeriod(1, 9.8, 1e-4), 2 * Math.PI * Math.sqrt(1 / 9.8), 1e-6, '單擺小角度極限');
near(F.pendulumPeriod(1, 9.8, 90 * D) / (2 * Math.PI * Math.sqrt(1 / 9.8)), 1.18034, 1e-4, '單擺 90° 週期比');
{ // 彈性碰撞：動量、動能都守恆；同質量交換速度
  const [v1, v2] = F.collide(1, 3, 4, 0, 1);
  near(v1 + 3 * v2, 4, 1e-12, '彈性 動量');
  near(0.5 * v1 * v1 + 1.5 * v2 * v2, 8, 1e-12, '彈性 動能');
  assert.deepEqual(F.collide(2, 2, 3, 0, 1), [0, 3], '同質量交換速度');
  const [w1, w2] = F.collide(1, 3, 4, 0, 0);
  near(w1, w2, 1e-12, '完全非彈性 黏在一起'); near(w1, 1, 1e-12, '完全非彈性 共同速度');
}
near(F.spinRate(10, 1, 2.5), 4, 1e-12, '角動量守恆');
near(F.escapeSpeed(20, 5) / F.orbitSpeed(20, 5), Math.SQRT2, 1e-12, '逃逸速度是 √2 倍');
near(F.keplerPeriod(6, 70) ** 2 / 216, F.keplerPeriod(2, 70) ** 2 / 8, 1e-9, '克卜勒第三定律');
for (const e of [0, 0.5, 0.9]) for (const M of [0.1, 2, 5]) { const E = F.eccAnomaly(M, e); near(E - e * Math.sin(E), M, 1e-10, `克卜勒方程 e=${e} M=${M}`); }
near(FL.floatFraction(600, 1000), 0.6, 1e-12, '浮體沒入六成');
assert.equal(FL.floatFraction(7870, 1000), 1, '鐵沉底');
near(FL.hydraulic(100, 1, 16), 1600, 1e-12, '液壓放大');
{ // 時間暫停的飛刀：照 aimVy 丟出，T 秒後剛好到目標高度
  const T = 0.75, vy = F.aimVy(-0.45, T);
  near(vy * T - 9.8 * T * T / 2, -0.45, 1e-12, '飛刀瞄準 aimVy');
}
