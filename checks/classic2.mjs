// 經典物理：熱學、波動、光學、電磁的新增主題
import assert from 'node:assert/strict';
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const D = Math.PI / 180;

const { F: th } = await import('../topics/thermo.js');
near(th.idealP(1, 273.15, 22.414), 101.32, 0.05, '理想氣體 STP ≈ 1 atm');
near(th.carnotEff(600, 300), 0.5, 1e-12, '卡諾效率');
{ // 循環在四個角接起來：絕熱段終點溫度要等於另一個熱庫
  const a = th.carnotAt(600, 300, 1.999999), b = th.carnotAt(600, 300, 3.999999), st = th.carnotStates(600, 300);
  near(a.T, 300, 1e-3, '絕熱膨脹降到 Tc'); near(b.V, st.V1, 1e-4, '循環回到 V1'); near(b.T, 600, 1e-2, '絕熱壓縮升回 Th');
}
{ // 熱方程式最後收斂成直線
  const T = new Float64Array(21).fill(0); T[0] = 100;
  for (let i = 0; i < 5000; i++) th.heatStep(T, 0.4);
  near(T[10], 50, 0.01, '熱傳導穩態是直線');
}

const { F: wv } = await import('../topics/waves.js');
{ const h = wv.harmonic(2, 0.65, 80, 0.005); near(h.lambda, 0.65, 1e-12, '第 2 諧音 λ = L'); near(h.f, 2 * Math.sqrt(80 / 0.005) / 1.3, 1e-9, '諧音頻率'); }
near(wv.resAmp(2, 2, 0.5, 1), 1, 1e-12, '共振時 A = F0/(γω0)');
near(wv.resPhase(2, 2, 0.3), Math.PI / 2, 1e-12, '共振時相位落後 90°');

const { F: op } = await import('../topics/optics.js');
near(op.acceptance(1.5, 1.3) / D, 48.4, 0.1, '光纖接受角');
near(op.thinLens(3, 6), 6, 1e-12, '物在 2f 成像在 2f'); near(op.magnification(6, 6), -1, 1e-12, '2f 倒立等大');
assert.ok(op.thinLens(3, 2) < 0, '焦點內是虛像');
assert.equal(op.thinLens(3, 3), Infinity, '物在焦點不成像');
assert.ok(op.thinLens(-3, 5) < 0 && op.thinLens(-3, 5) > -3, '凹透鏡縮小虛像在焦點內');

const { F: em } = await import('../topics/em.js');
near(em.coulomb(1e-6, 1e-6, 1), 8.9875e-3, 1e-7, '庫侖 1μC 1m');
near(em.coulomb(1e-6, 1e-6, 2) / em.coulomb(1e-6, 1e-6, 1), 0.25, 1e-12, '平方反比');
near(em.larmor(1, 2, -1, 0.5), 4, 1e-12, '迴旋半徑');
near(em.wireB(10, 0.02) * 2 * Math.PI * 0.02, em.MU0 * 10, 1e-15, '安培定律 ∮B·dl = μ0 I');
near(1 / Math.sqrt(em.MU0 * 8.8541878128e-12), em.C, 1e3, 'c = 1/√(μ0ε0)');
{ // 偶極的電場線從 +q 出發後會落在 −q
  const cs = [{ q: 1, x: -1, y: 0, z: 0 }, { q: -1, x: 1, y: 0, z: 0 }];
  const end = em.trace(cs, [-1, 0.15, 0]).at(-1);
  assert.ok(Math.hypot(end[0] - 1, end[1], end[2]) < 0.2, '偶極電場線落在負電荷');
}
