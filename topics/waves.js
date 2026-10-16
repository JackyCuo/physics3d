// 經典物理・波動（《JoJo》第一、二部「波紋氣功」惡搞，只是外觀與台詞）
import * as jojo from './jojo.js';
const cycle = (arr, t, sec = 4) => arr[Math.floor(t / sec) % arr.length];
export const F = {
  // 兩端固定的弦：λn = 2L/n，fn = n v / 2L，v = √(T/μ)
  harmonic: (n, L, T, mu) => { const v = Math.sqrt(T / mu); return { v, lambda: 2 * L / n, f: n * v / (2 * L) }; },
  // 兩個同振幅波源疊加後的振幅（不計衰減）：|2 cos(π Δr / λ + φ/2)|
  // 受迫阻尼振盪的穩態振幅與相位落後
  resAmp: (w, w0, g, f0) => f0 / Math.sqrt((w0 * w0 - w * w) ** 2 + (g * w) ** 2),
  resPhase: (w, w0, g) => Math.atan2(g * w, w0 * w0 - w * w),
  // 聲源以速度 vs 移動、觀察者靜止：前方 f' = f c/(c − vs)，後方 f c/(c + vs)
  doppler: (f, c, vs, ahead) => ahead ? (vs >= c ? Infinity : f * c / (c - vs)) : f * c / (c + vs),
  machAngle: M => M > 1 ? Math.asin(1 / M) : null,
};

export default [
  {
    id: 'doppler', realm: 'classic', cat: '波動', title: '都卜勒效應', en: 'Doppler Effect', keys: '都普勒 多普勒 音爆 mach 馬赫 sonic boom',
    tex: ["f' = f\\,\\dfrac{c}{c \\mp v_s}", '\\sin\\mu = \\dfrac{1}{M},\\quad M = \\dfrac{v_s}{c}'],
    explain: '<p>聲源在移動時，它往前發出的每一圈波都比上一圈更靠近前面，所以<b>前方的波被擠密（頻率變高、聲音變尖）</b>，後方被拉開（頻率變低）。救護車開過去時聲音「咿——嗚」就是這樣。</p><p>聲源速度超過音速（\\(M>1\\)）時，波來不及跑在聲源前面，全部疊在一個圓錐面上，形成<b>馬赫錐</b>，也就是音爆。</p><p>同樣的原理用在光上：遠離我們的星系光譜變紅（紅移），用來測宇宙膨脹。</p>',
    watch: ['聲源是史比特瓦根（戴圓頂禮帽）：「史比特瓦根冷靜地離開了」——走遠的時候，後面的人聽到的聲音變低。', '每一圈都是以「發出那一刻聲源的位置」為圓心擴散。', '把速度推到 1.0：前方所有波面擠在一起，那就是音障。', '超過 1.0 之後出現圓錐，速度越快錐角越尖。'],
    params: [
      { k: 'M', label: '聲源速度（馬赫數 v/c）', min: 0, max: 2, step: 0.01, v: 0.5 },
      { k: 'f', label: '聲源頻率', min: 0.5, max: 4, step: 0.1, v: 1.6, unit: 'Hz' },
    ],
    cam: [0, 19, 21], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const C = 2.4, X = 10, N = 60;
      const circ = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 97 }, (_, i) => U.V(Math.cos(i / 96 * 6.2832), 0, Math.sin(i / 96 * 6.2832))));
      const shellGeo = new THREE.SphereGeometry(1, 32, 16);
      const waves = Array.from({ length: N }, () => {
        const ring = new THREE.Line(circ, new THREE.LineBasicMaterial({ color: 0x4fd1e8, transparent: true }));
        const shell = U.mesh(shellGeo, new THREE.MeshBasicMaterial({ color: 0x4fd1e8, transparent: true, opacity: 0.04, depthWrite: false, side: THREE.DoubleSide }));
        ring.visible = shell.visible = false;
        root.add(ring, shell);
        return { ring, shell, x: 0, born: -1 };
      });
      const src = U.sphere(0.28, U.mat(0x222222, { emissive: 0xf5b544 }));
      const ears = [-1, 1].map(s => { const e = U.sphere(0.32, U.mat(0xdfe3ea, { rough: 0.4 })); e.position.set(s * (X + 1.5), 0.8, 0); root.add(e); return e; });
      const lF = U.label('', { color: '#f5b544' }), lB = U.label('', { color: '#4fd1e8' });
      lF.position.set(X + 1.5, 1.9, 0); lB.position.set(-X - 1.5, 1.9, 0);
      const cone = U.mesh(new THREE.ConeGeometry(1, 1, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
      // 史比特瓦根：聲源加上臉和圓頂禮帽
      const sf = U.face(0.28), black = U.mat(0x1a1a20, { rough: 0.6 });
      const bowler = U.mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), black); bowler.position.y = 0.2;
      const bb = U.cyl(0.34, 0.34, 0.03, black); bb.position.y = 0.2;
      src.add(sf, bowler, bb); src.scale.setScalar(1.6);
      const say = U.pop('', 1.1);
      root.add(src, lF, lB, cone, say);
      let x = -X, acc = 0, next = 0;
      return {
        update(dt, P, t) {
          const vs = P.M * C;
          x += vs * dt;
          if (x > X) { x = -X; waves.forEach(w => { w.born = -1; w.ring.visible = w.shell.visible = false; }); }
          src.position.set(x, 0.8, 0);
          acc += dt;
          if (acc >= 1 / P.f) { acc = 0; const w = waves[next++ % N]; w.x = x; w.born = t; }
          for (const w of waves) {
            if (w.born < 0) continue;
            const r = (t - w.born) * C;
            const on = r < 26;
            w.ring.visible = w.shell.visible = on;
            if (!on) continue;
            w.ring.position.set(w.x, 0.8, 0); w.ring.scale.setScalar(r);
            w.shell.position.set(w.x, 0.8, 0); w.shell.scale.setScalar(r);
            w.ring.material.opacity = Math.max(0.08, 1 - r / 26);
          }
          const mu = F.machAngle(P.M);
          cone.visible = mu != null;
          if (mu) {
            const h = 14, rad = h * Math.tan(mu);
            cone.scale.set(rad, h, rad);
            cone.rotation.z = -Math.PI / 2;  // 錐尖朝 +x
            cone.position.set(x - h / 2, 0.8, 0);
          }
          const ff = F.doppler(P.f, C, vs, true), fb = F.doppler(P.f, C, vs, false);
          lF.set(isFinite(ff) && x < X + 1.5 ? `${ff.toFixed(2)} Hz` : '音爆'); lB.set(`${fb.toFixed(2)} Hz`);
          sf.look().mood(P.M >= 1 ? 'shock' : 'happy');
          say.position.set(x, 3, 0);
          say.set(P.M >= 1 ? '喬瑟夫：你的下一句話是——「音爆！」' : P.M > 0.05 ? cycle(['史比特瓦根冷靜地離開了…（後面聽起來變低）', 'コォォォ…（波紋的呼吸聲，前面聽起來變尖）'], t, 3.5) : '史比特瓦根：我站著不動，大家聽到的都一樣');
          out({ '前方聽到 f′': isFinite(ff) ? ff.toFixed(2) + ' Hz' : '無（超音速）', '後方聽到 f′': fb.toFixed(2) + ' Hz', '前方波長': isFinite(ff) ? ((C - vs) / P.f).toFixed(2) : '0', '馬赫角 μ': mu ? (mu * 180 / Math.PI).toFixed(1) + '°' : '—' });
        },
      };
    },
  },
  {
    id: 'standing', realm: 'classic', cat: '波動', title: '駐波與諧音', en: 'Standing Waves · Harmonics', keys: '駐波 弦 諧波 節點 波腹 吉他',
    tex: ['y = 2A\\sin(kx)\\cos(\\omega t)', 'f_n = \\dfrac{n}{2L}\\sqrt{\\dfrac{T}{\\mu}}'],
    explain: '<p>兩端固定的弦被撥動時，往右跑的波和反射回來往左跑的波疊在一起，形成<b>駐波</b>：有些點永遠不動（<b>節點</b>），有些點振動最大（波腹）。</p><p>因為兩端一定是節點，弦上只能剛好放進半個波長的整數倍：\\(\\lambda_n = 2L/n\\)。所以弦只會發出基音和它的整數倍頻率（諧音），這就是樂器音色的來源。拉緊弦（張力變大）波速變快，音調變高。</p>',
    watch: ['喬納森把波紋打進弦裡：「刻下血液的節拍！」——只有剛好放得進整數個半波長的節拍才會留下來。', '白點是節點，數一數：第 n 諧音有 n + 1 個節點。', '打開「顯示兩個行進波」：青色往右、紫色往左，兩者相加就是橘色的駐波。', '張力變成 4 倍，頻率變 2 倍（升高八度）。'],
    params: [
      { k: 'n', label: '第幾諧音 n', min: 1, max: 8, step: 1, v: 3 },
      { k: 'T', label: '弦的張力 T', min: 20, max: 200, step: 5, v: 80, unit: 'N' },
      { k: 'parts', label: '顯示兩個行進波', bool: true, v: false },
    ],
    grid: false, cam: [0, 2.5, 14], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const L = 12, NP = 241, A = 1.1, LEN = 0.65, MU = 0.005;
      const str = U.points(NP, 0xf5b544, 0.16), envA = U.line(NP, 0xffffff, 0.22, true), envB = U.line(NP, 0xffffff, 0.22, true);
      const gR = U.line(NP, 0x4fd1e8, 0.8), gL = U.line(NP, 0xa78bfa, 0.8);
      const pegs = [-1, 1].map(s => { const m = U.box(0.3, 1.2, 0.6, U.mat(0x3a3f4c, { metal: 0.7 })); m.position.x = s * (L / 2 + 0.15); return m; });
      const nodes = Array.from({ length: 9 }, () => U.sphere(0.12, U.glow(0xffffff)));
      const lab = U.label('', { color: '#f5b544', size: 0.45 }); lab.position.set(0, 3, 0);
      const jo = jojo.jonathan(U, THREE); jo.position.set(-L / 2 - 1.4, -2.6, 0.6); jo.scale.setScalar(1.1);
      const say = U.pop('', 0.5); say.position.set(-L / 2 + 1, 3.6, 0.6);
      root.add(str, envA, envB, gR, gL, ...pegs, ...nodes, lab, jo, say);
      const xs = Array.from({ length: NP }, (_, i) => -L / 2 + L * i / (NP - 1));
      const pa = [], pb = [], pr = [], pl = [];
      for (let i = 0; i < NP; i++) { pa.push(U.V()); pb.push(U.V()); pr.push(U.V()); pl.push(U.V()); }
      return {
        update(dt, _, t) {
          const n = Math.round(P.n), k = n * Math.PI / L, w = 1.6 * n * Math.sqrt(P.T / 80);   // f ∝ n√T
          xs.forEach((x, i) => {
            const u = x + L / 2, s = Math.sin(k * u);
            str.pos[i * 3] = x; str.pos[i * 3 + 1] = 2 * A * s * Math.cos(w * t) * 0.5; str.pos[i * 3 + 2] = 0;
            pa[i].set(x, A * s, 0); pb[i].set(x, -A * s, 0);
            pr[i].set(x, 0.5 * A * Math.sin(k * u - w * t), 0); pl[i].set(x, 0.5 * A * Math.sin(k * u + w * t), 0);
          });
          str.flush(); envA.set(pa); envB.set(pb); gR.set(pr); gL.set(pl);
          gR.visible = gL.visible = !!P.parts;
          nodes.forEach((m, i) => { m.visible = i <= n; m.position.set(-L / 2 + i * L / n, 0, 0); });
          const h = F.harmonic(n, LEN, P.T, MU);
          lab.set(n === 1 ? '基音' : `第 ${n} 諧音`);
          jo.face.look().mood(n >= 6 ? 'shock' : 'happy');
          say.set(n >= 6 ? '山吹色的波紋疾走！（サンライトイエローオーバードライブ）' : cycle(['心臟在顫抖！燃燒到盡頭的熱情！', '刻下血液的節拍！', `第 ${n} 段波紋，${n + 1} 個節點！`], t, 3));
          out({ '波長 λ = 2L/n': h.lambda.toFixed(3) + ' m', '頻率 fₙ': h.f.toFixed(0) + ' Hz', '波速 v = √(T/μ)': h.v.toFixed(0) + ' m/s', '節點數': n + 1 });
        },
      };
    },
  },
  {
    id: 'interference', realm: 'classic', cat: '波動', title: '波的干涉', en: 'Two-Source Interference', keys: '干涉 疊加 水波 建設性 破壞性',
    tex: ['\\Delta r = m\\lambda \\;\\Rightarrow\\; \\text{建設性}', '\\Delta r = (m+\\tfrac12)\\lambda \\;\\Rightarrow\\; \\text{破壞性}'],
    explain: '<p>兩個一起上下振動的波源在水面上各自發出圓形波。在某一點，如果兩個波走的距離差 \\(\\Delta r\\) 剛好是波長的整數倍，波峰碰波峰，振幅加倍（<b>建設性干涉</b>）；差半個波長就波峰碰波谷，互相抵消（<b>破壞性干涉</b>）。</p><p>抵消的點連起來是一條條雙曲線，就是水面上看起來「不動」的那幾道紋路。光的雙狹縫實驗也是同一件事。</p>',
    watch: ['兩隻青蛙（齊貝林男爵的波紋梗）：中央那隻在亮帶上被波紋打得上下跳，另一隻坐在平靜帶上一動也不動。', '切成反相，兩隻青蛙的命運對調。', '找找從兩波源中間往外放射的「平靜帶」，那裡兩個波永遠互相抵消。', '把兩個波源拉遠或把波長調短，平靜帶變多、變密。', '切成「反相」：原本的中央亮帶變成平靜帶。'],
    params: [
      { k: 'd', label: '波源間距 d', min: 1, max: 6, step: 0.1, v: 3 },
      { k: 'lam', label: '波長 λ', min: 0.6, max: 3, step: 0.05, v: 1.2 },
      { k: 'ph', label: '兩波源相位', options: [[0, '同相'], [Math.PI, '反相']], v: 0 },
    ],
    grid: false, cam: [0, 11, 11], target: [0, 0, 0],
    setup({ THREE, root, U, P, out }) {
      const S = 110, SIZE = 18;
      const geo = new THREE.PlaneGeometry(SIZE, SIZE, S, S); geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position, nV = pos.count, col = new Float32Array(nV * 3);
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const xz = Float32Array.from({ length: nV * 2 }, (_, i) => pos.getX(i >> 1) * (1 - (i & 1)) + pos.getZ(i >> 1) * (i & 1));
      const water = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
      const srcs = [0, 1].map(() => U.sphere(0.18, U.mat(0x222222, { emissive: 0xf5b544 })));
      // 兩隻青蛙：一隻在中央線、一隻在第一條「同相時的平靜帶」上，跟著水面上下
      const frog = () => { const f = new THREE.Group(), gm = U.mat(0x4caf50, { rough: 0.6 }), b = U.sphere(0.35, gm), fc = U.face(0.3); b.scale.y = 0.7; fc.position.set(0, 0.12, 0.08); f.add(b, fc); f.fc = fc; return f; };
      const frogs = [frog(), frog()], fSay = [U.pop('', 0.45), U.pop('', 0.45)];
      const ze = jojo.zeppeli(U, THREE); ze.position.set(-5, 0.2, 6.5); ze.scale.setScalar(1.2);
      const zSay = U.pop('', 0.5); zSay.position.set(-2, 3.8, 6.5);
      root.add(water, ...srcs, ...frogs, ...fSay, ze, zSay);
      const R = 5.5, H = (x, z, t) => { const k = 2 * Math.PI / P.lam, a = P.d / 2, r1 = Math.hypot(x + a, z), r2 = Math.hypot(x - a, z); return Math.sin(k * r1 - 3 * t) / Math.sqrt(r1 + 0.6) + Math.sin(k * r2 - 3 * t + P.ph) / Math.sqrt(r2 + 0.6); };
      const lo = new THREE.Color(0x061428), mid = new THREE.Color(0x1b6fa8), hi = new THREE.Color(0xd9f6ff), c = new THREE.Color();
      return {
        update(dt, _, t) {
          const k = 2 * Math.PI / P.lam, w = 3, a = P.d / 2, a2 = pos.array;
          srcs[0].position.set(-a, 0.25, 0); srcs[1].position.set(a, 0.25, 0);
          for (let i = 0; i < nV; i++) {
            const x = xz[i * 2], z = xz[i * 2 + 1];
            const r1 = Math.hypot(x + a, z), r2 = Math.hypot(x - a, z);
            const h = Math.sin(k * r1 - w * t) / Math.sqrt(r1 + 0.6) + Math.sin(k * r2 - w * t + P.ph) / Math.sqrt(r2 + 0.6);
            a2[i * 3 + 1] = h * 0.35;
            const u = h * 0.7;
            if (u < 0) c.copy(mid).lerp(lo, Math.min(1, -u)); else c.copy(mid).lerp(hi, Math.min(1, u));
            col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
          }
          pos.needsUpdate = true; geo.attributes.color.needsUpdate = true;
          // 第二隻青蛙：半徑 R 的圓上，第一個 |Δr| = λ/2 的方向（同相時的平靜帶）
          // 找 Δr/λ 的小數部分最接近 ½ 的方向，有好幾條時挑最靠近 40° 的（離中央那隻遠一點）
          let best = 0, bd = 1e9;
          for (let j = 0; j <= 90; j++) { const a = j * Math.PI / 180, x = R * Math.sin(a), z = R * Math.cos(a), q = Math.abs(Math.hypot(x + P.d / 2, z) - Math.hypot(x - P.d / 2, z)) / P.lam, e = Math.abs(q - Math.floor(q) - 0.5) + Math.abs(j - 40) / 2000; if (e < bd) { bd = e; best = a; } }
          const spots = [[0, R], [R * Math.sin(best), R * Math.cos(best)]];
          frogs.forEach((f, i) => {
            const [x, z] = spots[i], h = H(x, z, t), amp = Math.hypot(H(x, z, 0), H(x, z, Math.PI / 6));   // 兩個相位差 90° 的取樣估振幅
            f.position.set(x, 0.3 + h * 0.35, z); f.fc.look(); f.fc.mood(amp > 0.4 ? 'dizzy' : 'happy');
            fSay[i].position.set(x, 1.6, z); fSay[i].set(amp > 0.4 ? '呱呱呱！波紋打得我好暈！' : '這裡好平靜～呱');
          });
          ze.face.look();
          zSay.set(cycle(['波紋疊在一起就會變強，錯開半拍就互相抵消！', '注意看青蛙！波紋的強弱取決於「距離差」。', 'コォォォ…有波紋就能站在水面上。'], t, 3.5));
          const ratio = P.d / P.lam, th = ratio >= 1 ? Math.asin(1 / ratio) * 180 / Math.PI : null;
          out({ 'd / λ': ratio.toFixed(2), '第一條亮紋方向': P.ph ? '—（中央變暗）' : th != null ? th.toFixed(1) + '°' : '只有中央亮帶', '亮帶數（同相）': 2 * Math.floor(ratio) + 1, '中央線上 Δr': P.ph ? '0 → 抵消' : '0 → 加強' });
        },
      };
    },
  },
  {
    id: 'resonance', realm: 'classic', cat: '波動', title: '共振', en: 'Driven Oscillator · Resonance', keys: '共振 受迫振動 阻尼 塔科馬 resonance',
    tex: ['m\\ddot x + b\\dot x + kx = F_0\\cos\\omega t', 'A(\\omega) = \\dfrac{F_0/m}{\\sqrt{(\\omega_0^2-\\omega^2)^2 + (\\gamma\\omega)^2}}'],
    explain: '<p>彈簧本身有一個自然頻率 \\(\\omega_0 = \\sqrt{k/m}\\)。用馬達以頻率 \\(\\omega\\) 週期性地推它，當 \\(\\omega\\) 接近 \\(\\omega_0\\) 時，每一次推都剛好推在對的時機，振幅越疊越大，這就是<b>共振</b>。</p><p>阻尼（摩擦）決定共振峰有多高多尖。阻尼小，峰又高又窄——塔科馬海峽吊橋被風吹垮、歌手唱破玻璃杯都是共振；盪鞦韆也是靠同一件事。</p>',
    watch: ['喬納森跟著馬達的節奏「コォォォ」呼吸：節奏對上彈簧的自然頻率，就是「山吹色的波紋疾走」。', '把驅動頻率慢慢推到 2.0 附近（ω₀），振幅會越長越大。', '阻尼調小：右下的共振峰變得又高又尖。', '遠低於 ω₀ 時物體和馬達同步；遠高於 ω₀ 時兩者剛好反向（相位差 180°）。'],
    params: [
      { k: 'w', label: '驅動頻率 ω', min: 0.3, max: 4, step: 0.02, v: 1.2, unit: 'rad/s' },
      { k: 'g', label: '阻尼 γ', min: 0.15, max: 2, step: 0.05, v: 0.3, unit: '1/s' },
    ],
    grid: false, cam: [0, 1.5, 13], target: [-1.5, 1, 0],
    setup({ THREE, root, U, P, out, chart }) {
      const W0 = 2, F0 = 1.5, SC = 0.45, TOP = 3.4, REST = -0.6;
      const motor = U.box(2.4, 0.4, 1.2, U.mat(0x3a3f4c, { metal: 0.6, emissive: 0xf5b544, ei: 0.05 }));
      const wheel = U.cyl(0.5, 0.5, 0.2, U.mat(0x8a90a0, { metal: 0.8 })); wheel.rotation.x = Math.PI / 2; wheel.position.set(0, TOP + 0.9, 0.7);
      const crank = U.beam(0xf5b544, 0.04);
      const spring = U.line(220, 0xd9dde6);
      const mass = U.box(1, 0.8, 1, U.mat(0xf5b544, { metal: 0.3, rough: 0.35 }));
      const ghost = U.line(2, 0xffffff, 0.25, true);
      const mf = U.face(0.4); mf.position.z = 0.1; mass.add(mf);
      const jo = jojo.jonathan(U, THREE); jo.position.set(-4.6, -2.4, 0.5);
      const breath = U.label('コォォォ', { size: 0.5, color: '#f8b500' }), say = U.pop('', 0.5);
      breath.position.set(-4.6, 0.6, 0.5); say.position.set(-3.6, 1.5, 0.8);
      root.add(motor, wheel, crank, spring, mass, ghost, jo, breath, say);
      const ch = chart({ title: '穩態振幅 A(ω)：共振曲線', x: [0, 4], y: [0, 1], xl: 'ω', yl: 'A' });
      const sp = Array.from({ length: 220 }, () => U.V());
      let x, v, tt, peak, pk, lastG = -1, curve = [];
      const reset = () => { x = 0; v = 0; tt = 0; peak = 0; pk = 0; };
      reset();
      return {
        actions: { '重來（從靜止開始）': reset },
        update(dt) {
          const n = 10, h = dt / n;
          for (let i = 0; i < n; i++) { const a = -W0 * W0 * x - P.g * v + F0 * Math.cos(P.w * tt); v += a * h; x += v * h; tt += h; }
          pk = Math.max(pk * Math.exp(-dt * 0.4), Math.abs(x));
          const ys = 0.25 * Math.cos(P.w * tt);
          motor.position.y = TOP + ys;
          crank.set(U.V(0, TOP + 0.9, 0.82), U.V(0.45 * Math.sin(P.w * tt), TOP + 0.9 + 0.45 * Math.cos(P.w * tt), 0.82));
          const my = REST + x * SC;
          mass.position.y = my;
          const top = TOP + ys - 0.2, bot = my + 0.4, turns = 14;
          sp.forEach((p, i) => { const u = i / 219, a = u * turns * 2 * Math.PI, r = (i < 6 || i > 213) ? 0 : 0.35; p.set(r * Math.cos(a), top + (bot - top) * u, r * Math.sin(a)); });
          spring.set(sp);
          ghost.set([U.V(-1.6, REST, 0), U.V(1.6, REST, 0)]);
          if (P.g !== lastG) {
            lastG = P.g;
            curve = Array.from({ length: 160 }, (_, i) => { const w = 0.05 + i * 3.95 / 159; return [w, F.resAmp(w, W0, P.g, F0)]; });
            ch.o.y = [0, Math.max(...curve.map(p => p[1])) * 1.12];
          }
          const As = F.resAmp(P.w, W0, P.g, F0), ph = F.resPhase(P.w, W0, P.g) * 180 / Math.PI;
          const near = Math.abs(P.w - W0) < 0.15;
          jo.scale.setScalar(1 + 0.06 * Math.cos(P.w * tt)); jo.face.look();   // 胸口跟著節奏起伏
          breath.material.opacity = 0.5 + 0.5 * Math.cos(P.w * tt);
          mf.look().mood(pk > 2.5 ? 'dizzy' : pk > 1.2 ? 'shock' : 'happy');
          say.set(near ? (pk > 1.5 ? '山吹色的波紋疾走！（サンライトイエローオーバードライブ）' : '節奏對上了…能量一直累積！') : P.w < W0 ? '呼吸太慢了，跟彈簧對不上…' : '呼吸太急了！推的時機全錯');
          ch.draw([{ pts: curve, color: '#f5b544' }], [{ x: W0, vline: true, color: 'rgba(255,255,255,.25)' }, { x: P.w, y: As, color: '#fff', r: 5 }]);
          out({ '穩態振幅': As.toFixed(2), '目前振幅（量到的）': pk.toFixed(2), '自然頻率 ω₀': W0.toFixed(2) + ' rad/s', '相位落後': ph.toFixed(0) + '°', '品質因子 Q = ω₀/γ': (W0 / P.g).toFixed(1) });
        },
      };
    },
  },
];
