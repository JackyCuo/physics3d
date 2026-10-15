// 理論物理分區的公式檢查
import assert from 'node:assert/strict';
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

const { F: rel } = await import('../topics/relativity.js');
near(rel.gamma(0.6), 1.25, 1e-12, 'γ(0.6c)');
near(rel.rs(1.989e30), 2953, 2, '太陽的史瓦西半徑');
near(rel.energy(0.001), 8.988e13, 1e11, '1 g 的 mc²');
{ // 弱場偏折角 ≈ 2 r_s / b
  const rs = 0.05, b = 5, tr = rel.traceRay(b, rs, 400, 200000);
  near(-tr.dir, 2 * rs / b, 0.002, '重力透鏡偏折角');
  assert.ok(rel.traceRay(2.4, 1).captured, 'b < 2.6 rₛ 應被吞');
  assert.ok(!rel.traceRay(2.8, 1).captured, 'b > 2.6 rₛ 應逃出');
}

const { F: cos } = await import('../topics/cosmology.js');
near(cos.hubbleTime(70), 13.97, 0.01, '1/H₀ (70) ≈ 14.0 十億年');

const { F: an } = await import('../topics/analytic.js');
near(an.action(0, 1), -(9.8 ** 2) * 8 / 24, 0.01, '真實路徑作用量 −g²T³/24');
for (const n of [1, 2, 3]) for (const e of [-1, 0.3, 2]) assert.ok(an.action(e, n) > an.action(0, n), `S(ε=${e}, n=${n}) 應大於真實路徑`);
{ // 圓碗角動量守恆、壓扁就不守恆
  const run = kz => { const s = [3, 0, 0, 1.4], L0 = an.angMom(...s); let dmax = 0; for (let i = 0; i < 20000; i++) { an.oscStep(s, 1, kz, 0.001); dmax = Math.max(dmax, Math.abs(an.angMom(...s) - L0)); } return dmax; };
  assert.ok(run(1) < 1e-9, '對稱時 Lz 守恆');
  assert.ok(run(1.5) > 0.5, '壓扁後 Lz 不守恆');
}
{ // MB 分布積分為 1、平均值正確
  let s = 0, m = 0; const T = 1.7, h = 0.001;
  for (let v = 0; v < 20; v += h) { s += an.mb(v, T) * h; m += v * an.mb(v, T) * h; }
  near(s, 1, 1e-4, 'MB 歸一化'); near(m, an.vavg(T), 1e-3, 'MB 平均速率');
}
{ // 雙擺 RK4 能量守恆
  const s = [2, 2.1, 0, 0], E0 = an.dpEnergy(s);
  for (let i = 0; i < 10000; i++) an.dpStep(s, 0.001);
  near(an.dpEnergy(s), E0, 1e-4, '雙擺 10 秒能量守恆');
}
