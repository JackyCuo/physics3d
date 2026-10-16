// 方程式顯示檢查：每條 KaTeX 都要解析得過、每個主題都有符號說明與推導過程
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const katex = createRequire(import.meta.url)('../vendor/katex/katex.min.js');
const MODS = ['mechanics', 'fluids', 'thermo', 'waves', 'optics', 'em', 'relativity', 'cosmology', 'analytic', 'quantum'];
const SYM = (await import('../topics/symbols.js')).default;
const DER = (await import('../topics/derivations.js')).default;
const SPLIT = / (?=\\;\\Rightarrow)|,?\\q?quad /;   // 同 app.js 的斷行規則
const ok1 = (s, where) => { try { katex.renderToString(s, { throwOnError: true }); } catch (e) { assert.fail(`${where}: ${s}\n${e.message}`); } };
const ok = (s, where) => { ok1(s, where); for (const x of s.split(SPLIT)) ok1(x, where + '（斷行後）'); };
const inline = (h, where) => { for (const m of h.matchAll(/\\\((.+?)\\\)/g)) ok(m[1], where); };

for (const f of MODS) {
  // JS 字串裡只寫一個反斜線（例如 '\;'）會被吃掉，KaTeX 拿到的是 ';'
  const src = readFileSync(new URL(`../topics/${f}.js`, import.meta.url), 'utf8');
  assert.ok(!/(?<!\\)\\[;,!: ]/.test(src), `${f}.js 有單一反斜線的 KaTeX 指令`);
  for (const t of (await import(`../topics/${f}.js`)).default) {
    for (const s of [].concat(t.tex)) ok(s, t.id);
    inline(JSON.parse(JSON.stringify([t.explain, ...(t.watch || [])])).join(''), t.id);
    assert.ok(SYM[t.id]?.length, `${t.id} 沒有符號說明`);
    for (const [k, d] of SYM[t.id]) { ok(k, `${t.id} 符號`); inline(d, `${t.id} 符號說明`); }
    assert.ok(DER[t.id]?.length, `${t.id} 沒有推導過程`);
    for (const [d, e] of DER[t.id]) { inline(d, `${t.id} 推導說明`); if (e) ok(e, `${t.id} 推導`); }
  }
}
console.log('方程式顯示檢查通過');
