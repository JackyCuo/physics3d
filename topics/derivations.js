// 每個主題方程式的推導過程：一行一步「說明 :: 式子（KaTeX）」，沒有 :: 的行只有文字
const S = String.raw;
const D = {
  // ---------- 力學 ----------
  newton1: S`
第一定律是牛頓力學的出發點（公理），但可以看成第二定律在合力為零時的特例 :: \sum\vec F = m\vec a
合力為零 :: 0 = m\vec a \;\Rightarrow\; \vec a = 0
加速度是速度對時間的變化率 :: \dfrac{d\vec v}{dt} = 0
變化率是零，代表速度不隨時間改變：靜止的保持靜止，運動的保持等速直線 :: \vec v = \text{常數}
第一定律真正的作用是定義「慣性參考系」：只有在不加速的座標系裡，這句話才成立。`,
  newton2: S`
動量的定義 :: \vec p = m\vec v
牛頓原本的說法：力等於動量的變化率 :: \vec F = \dfrac{d\vec p}{dt}
質量不變時，把 \(m\) 提到微分外面 :: \vec F = m\dfrac{d\vec v}{dt}
速度的變化率就是加速度 :: \vec F = m\vec a
移項：同樣的力，質量越大加速度越小 :: \vec a = \dfrac{\vec F}{m}`,
  newton3: S`
兩個物體只互相作用、沒有外力時，總動量不變（實驗事實，跟第三定律等價） :: \vec p_1 + \vec p_2 = \text{常數}
對時間微分 :: \dfrac{d\vec p_1}{dt} + \dfrac{d\vec p_2}{dt} = 0
由第二定律，動量變化率就是受力：物體 1 受到 \(\vec F_{21}\)，物體 2 受到 \(\vec F_{12}\) :: \vec F_{21} + \vec F_{12} = 0
移項得到第三定律 :: \vec F_{12} = -\vec F_{21}
太空版：兩人一開始靜止，總動量 0，打完之後 :: m_1\vec v_1 + m_2\vec v_2 = 0 \;\Rightarrow\; m_1 v_1 = m_2 v_2\ (\text{大小})
地面版：腳底的摩擦力是外力，最大是 :: f_{\max} = \mu N = \mu m g`,
  projectile: S`
只受重力：水平方向沒有力，垂直方向加速度向下 :: a_x = 0,\qquad a_y = -g
把初速分解成水平、垂直兩個分量 :: v_{0x} = v_0\cos\theta,\qquad v_{0y} = v_0\sin\theta
對時間積分一次得到速度 :: v_x = v_0\cos\theta,\qquad v_y = v_0\sin\theta - g t
再積分一次得到位置（從原點出發） :: x = v_0\cos\theta\,t,\qquad y = v_0\sin\theta\,t - \tfrac12 g t^2
落地時 \(y = 0\)，提出 \(t\)（\(t = 0\) 是出發那一刻） :: t\left(v_0\sin\theta - \tfrac12 g t\right) = 0 \;\Rightarrow\; t_f = \dfrac{2v_0\sin\theta}{g}
把飛行時間代進 \(x\) :: R = v_0\cos\theta\cdot\dfrac{2v_0\sin\theta}{g} = \dfrac{v_0^2\cdot 2\sin\theta\cos\theta}{g}
倍角公式 \(2\sin\theta\cos\theta = \sin 2\theta\) :: R = \dfrac{v_0^2\sin 2\theta}{g}
\(\sin 2\theta\) 最大是 1，發生在 \(2\theta = 90^\circ\)；而 \(\sin 2\theta = \sin(180^\circ - 2\theta)\)，所以 30° 和 60° 射程一樣 :: \theta = 45^\circ \;\Rightarrow\; R_{\max} = \dfrac{v_0^2}{g}`,
  centripetal: S`
等速圓周運動的位置，\(\omega\) 是角速度 :: \vec r = r\,(\cos\omega t,\ \sin\omega t)
對時間微分得到速度，方向沿切線 :: \vec v = r\omega\,(-\sin\omega t,\ \cos\omega t),\qquad v = \omega r
再微分一次得到加速度 :: \vec a = -r\omega^2(\cos\omega t,\ \sin\omega t) = -\omega^2\vec r
負號代表指向圓心，大小是 :: a_c = \omega^2 r
用 \(\omega = v/r\) 換掉 \(\omega\) :: a_c = \left(\dfrac{v}{r}\right)^2 r = \dfrac{v^2}{r}
由第二定律，需要的向心力 :: F_c = m a_c = m\dfrac{v^2}{r}`,
  pendulum: S`
重力沿著圓弧切線方向的分量把擺錘拉回最低點 :: F_t = -mg\sin\theta
擺錘沿圓弧走的距離是 \(s = L\theta\)，切線加速度 :: a_t = \ddot s = L\ddot\theta
第二定律 \(F_t = m a_t\)，兩邊消去 \(m\) :: mL\ddot\theta = -mg\sin\theta \;\Rightarrow\; \ddot\theta = -\dfrac{g}{L}\sin\theta
角度很小時（弧度）\(\sin\theta \approx \theta\) :: \ddot\theta = -\dfrac{g}{L}\theta
這是簡諧運動 \(\ddot x = -\omega^2 x\) 的形式，解是餘弦 :: \theta(t) = \theta_0\cos\omega t,\qquad \omega = \sqrt{\dfrac{g}{L}}
週期是轉一圈 \(2\pi\) 需要的時間，跟質量、振幅都無關 :: T = \dfrac{2\pi}{\omega} = 2\pi\sqrt{\dfrac{L}{g}}
角度大時 \(\sin\theta < \theta\)，回復力比較小，週期會變長；網站用精確公式（算術–幾何平均）計算，不是用近似值。`,
  hooke: S`
虎克定律是實驗定律：形變不大時，彈力跟位移成正比、方向相反 :: F = -kx
第二定律 :: m\ddot x = -kx \;\Rightarrow\; \ddot x = -\dfrac{k}{m}x
猜解 \(x = A\cos(\omega t + \phi)\)，微分兩次後代入 :: -\omega^2 A\cos(\omega t+\phi) = -\dfrac{k}{m}A\cos(\omega t+\phi)
兩邊相等，所以 :: \omega = \sqrt{\dfrac{k}{m}}
能量：把運動方程 \(m\ddot x + kx = 0\) 兩邊乘上 \(\dot x\) :: m\dot x\ddot x + kx\dot x = \dfrac{d}{dt}\left(\tfrac12 m\dot x^2 + \tfrac12 kx^2\right) = 0
微分是零，所以括號裡不隨時間改變：動能和彈性位能互相轉換 :: E = \tfrac12 mv^2 + \tfrac12 kx^2 = \text{常數}`,
  collision: S`
碰撞時兩球受的力等大反向（第三定律），作用時間一樣長 :: \vec F_{12}\,\Delta t = -\vec F_{21}\,\Delta t
力乘時間（衝量）等於動量變化 :: m_2(v_2 - u_2) = -m_1(v_1 - u_1)
移項，碰撞前後總動量相同 :: m_1u_1 + m_2u_2 = m_1v_1 + m_2v_2
另外定義恢復係數：分開速度 ÷ 接近速度 :: e = \dfrac{v_2 - v_1}{u_1 - u_2}
兩條式子聯立解出 \(v_1\)、\(v_2\)（網站就是用這組） :: v_1 = \dfrac{m_1u_1 + m_2u_2 + m_2e(u_2-u_1)}{m_1+m_2},\qquad v_2 = \dfrac{m_1u_1 + m_2u_2 + m_1e(u_1-u_2)}{m_1+m_2}
\(e = 1\) 時動能也守恆；兩球一樣重時剛好交換速度 :: m_1 = m_2,\ e = 1 \;\Rightarrow\; v_1 = u_2,\ v_2 = u_1
\(e = 0\) 時兩球黏在一起，一起以質心速度前進 :: v_1 = v_2 = \dfrac{m_1u_1 + m_2u_2}{m_1+m_2}`,
  angular: S`
轉動版的第二定律：力矩等於角動量的變化率 :: \tau = \dfrac{dL}{dt}
轉椅的軸承很滑，沒有外力矩 :: \tau = 0 \;\Rightarrow\; L = \text{常數}
剛體的角動量是 \(L = I\omega\)，轉動慣量把每一小塊質量乘上到軸距離的平方加起來 :: I = \sum_i m_i r_i^2
人本身是 \(I_0\)，兩手各拿一個質量 \(m\)、離軸 \(r\) 的啞鈴 :: I = I_0 + 2mr^2
手收回前後角動量相同 :: I_1\omega_1 = I_2\omega_2 \;\Rightarrow\; \omega_2 = \dfrac{I_1}{I_2}\,\omega_1
轉動動能用 \(L\) 表示 :: K = \tfrac12 I\omega^2 = \dfrac{L^2}{2I}
\(L\) 不變、\(I\) 變小，動能就變大；多出來的能量是手臂把啞鈴往內拉時做的功。`,
  gravity: S`
牛頓發現月球的向心加速度和地表重力的比例剛好等於距離平方的反比，加上第三定律（兩邊對稱），寫成 :: F = G\dfrac{m_1 m_2}{r^2}
圓軌道：引力剛好提供向心力 :: \dfrac{GMm}{r^2} = \dfrac{mv^2}{r}
消去 \(m\)、乘上 \(r\) :: v_{\text{圓}} = \sqrt{\dfrac{GM}{r}}
引力位能（取無限遠為 0） :: U = -\dfrac{GMm}{r}
逃逸：剛好跑到無限遠時速度變 0，總能量是 0 :: \tfrac12 mv^2 - \dfrac{GMm}{r} = 0
解出 :: v_{\text{逃逸}} = \sqrt{\dfrac{2GM}{r}} = \sqrt2\,v_{\text{圓}}`,
  kepler: S`
② 太陽的引力永遠指向太陽，對太陽沒有力矩，所以角動量守恆 :: L = mr^2\dot\varphi = \text{常數}
行星轉過 \(d\varphi\) 時掃過的細長三角形面積是 \(\tfrac12 r^2\,d\varphi\) :: \dfrac{dA}{dt} = \tfrac12 r^2\dot\varphi = \dfrac{L}{2m} = \text{常數}
① 用 \(u = 1/r\) 改寫運動方程（比奈公式），平方反比力會變成 :: \dfrac{d^2u}{d\varphi^2} + u = \dfrac{GMm^2}{L^2}
這是簡諧方程加常數，解是 :: u = \dfrac{GMm^2}{L^2}\left(1 + e\cos\varphi\right)
這正是以原點為焦點的圓錐曲線，\(0 \le e < 1\) 時是橢圓：太陽在焦點。
③ 先看圓軌道：引力等於向心力，\(v = 2\pi r/T\) :: \dfrac{GMm}{r^2} = m\left(\dfrac{2\pi}{T}\right)^2 r
整理 :: \dfrac{T^2}{r^3} = \dfrac{4\pi^2}{GM}
橢圓時把 \(r\) 換成半長軸 \(a\)：用橢圓面積 \(\pi ab = \tfrac{dA}{dt}\cdot T\) 可以證明同一條式子成立 :: \dfrac{T^2}{a^3} = \dfrac{4\pi^2}{GM}`,
  timestop: S`
停止中外界時間不走（\(\Delta t = 0\)），位置不變 :: \vec x(t_0 + \Delta t) = \vec x(t_0) + \vec v\,\Delta t = \vec x(t_0)
速度也一樣（\(\vec v + \vec a\,\Delta t = \vec v\)），所以動量完整保留 :: \vec p = m\vec v = \text{凍結前的值}
恢復後只受重力 :: \ddot{\vec x} = \vec g
積分一次 :: \vec v(t) = \vec v_0 + \vec g\,t
再積分一次 :: \vec x(t) = \vec x_0 + \vec v_0 t + \tfrac12\vec g\,t^2
壓路機從高度 \(h\) 靜止落下，落地時間與速度 :: h = \tfrac12 g t^2 \;\Rightarrow\; t = \sqrt{\dfrac{2h}{g}},\qquad v = gt = \sqrt{2gh}`,
  timestopreal: S`
外界時間慢 \(k\) 倍：你過了 \(\Delta t_{\text{你}}\)，外界只過了 :: \Delta t_{\text{外}} = \dfrac{\Delta t_{\text{你}}}{k}
你以為的速度 \(u\) 走了 \(d = u\,\Delta t_{\text{你}}\)，外界量到的速度 :: v = \dfrac{d}{\Delta t_{\text{外}}} = \dfrac{u\,\Delta t_{\text{你}}}{\Delta t_{\text{你}}/k} = k\,u
迎面的空氣被你擋到相對靜止，動能變成熱（每公斤空氣的能量守恆） :: c_pT_0 + \tfrac12 v^2 = c_pT_{\text{滯止}}
解出 :: T_{\text{滯止}} = T_0 + \dfrac{v^2}{2c_p}
例：\(k = 1000\)、\(u = 1.4\ \text{m/s}\) → \(v = 1400\ \text{m/s}\) :: T \approx 293 + \dfrac{1400^2}{2\times1005} \approx 1268\ \text{K} \approx 995^\circ\text{C}
光：頻率 \(f\) 的光，在你的 1 秒裡只振了外界 \(1/k\) 秒的份 :: f_{\text{你}} = \dfrac{f}{k}
換成你熟悉的顏色（正常世界裡頻率 \(f/k\) 的光的波長） :: \lambda_{\text{你看到}} = \dfrac{c}{f/k} = k\,\lambda
例：綠光 550 nm、\(k = 2\) → 1100 nm，已經是紅外線。`,
  // ---------- 流體 ----------
  bernoulli: S`
連續方程：液體不可壓縮，每秒流過任一截面的體積一樣 :: \dfrac{dV}{dt} = A_1v_1 = A_2v_2
取一小團體積 \(\Delta V\)、質量 \(\rho\Delta V\) 的流體，從 1 流到 2；兩端壓力推它做的功 :: W = P_1A_1\Delta x_1 - P_2A_2\Delta x_2 = (P_1 - P_2)\,\Delta V
動能變化 :: \Delta K = \tfrac12\rho\,\Delta V\,(v_2^2 - v_1^2)
重力位能變化 :: \Delta U = \rho\,\Delta V\,g\,(h_2 - h_1)
功能定理 \(W = \Delta K + \Delta U\)，兩邊除以 \(\Delta V\) :: P_1 - P_2 = \tfrac12\rho(v_2^2 - v_1^2) + \rho g(h_2 - h_1)
把同一點的量移到同一邊 :: P_1 + \tfrac12\rho v_1^2 + \rho g h_1 = P_2 + \tfrac12\rho v_2^2 + \rho g h_2
所以管子變細的地方流速變快、壓力變小。`,
  archimedes: S`
靜止液體在深度 \(h\) 的壓力：上面那一柱液體的重量 ÷ 面積 :: P = P_0 + \rho g h
方塊高 \(H\)、底面積 \(A\)，頂面在深度 \(h_1\)、底面在 \(h_2 = h_1 + H\) :: P_{\text{底}} - P_{\text{頂}} = \rho g(h_2 - h_1) = \rho g H
側面的壓力左右抵消，剩下向上的淨力 :: F_B = (P_{\text{底}} - P_{\text{頂}})A = \rho g H A
\(HA\) 就是泡在液體裡的體積 :: F_B = \rho_{\text{液}}\,V_{\text{排開}}\,g
任何形狀都可以切成很多細長柱子，每根都一樣，所以這式子對任何形狀都成立。
漂浮時浮力等於重量 :: \rho_{\text{液}}V_{\text{沒入}}\,g = \bar\rho_{\text{物}}V g
消去 \(g\) :: \dfrac{V_{\text{沒入}}}{V} = \dfrac{\bar\rho_{\text{物}}}{\rho_{\text{液}}}
鋼船：鋼板很重但中間是空氣，平均密度＝總質量 ÷ 外形體積，小於水就浮；灌水後平均密度變大就沉。`,
  pascal: S`
密閉液體裡外加的壓力會傳到每一處；兩個活塞同高，\(\rho g h\) 一樣 :: P_1 = P_2
壓力 = 力 ÷ 面積 :: \dfrac{F_1}{A_1} = \dfrac{F_2}{A_2} \;\Rightarrow\; F_2 = F_1\dfrac{A_2}{A_1}
液體不可壓縮，小活塞壓下去的體積等於大活塞升起的體積 :: A_1d_1 = A_2d_2 \;\Rightarrow\; d_2 = d_1\dfrac{A_1}{A_2}
兩式相乘，面積比剛好消掉 :: F_2d_2 = F_1\dfrac{A_2}{A_1}\cdot d_1\dfrac{A_1}{A_2} = F_1d_1
力放大幾倍，距離就縮小幾倍：省力不省功。`,
  // ---------- 熱學 ----------
  entropy: S`
\(N\) 個分子分成左右兩半，左邊剛好 \(n\) 個的排法數 :: \Omega(n) = \dbinom{N}{n} = \dfrac{N!}{n!\,(N-n)!}
每一種微觀排法機率都一樣，所以排法最多的巨觀狀態最常出現：\(n = N/2\) 時最大。
熵要能相加：兩個系統合起來排法相乘 \(\Omega = \Omega_1\Omega_2\)，只有對數能把乘法變加法 :: k_B\ln(\Omega_1\Omega_2) = k_B\ln\Omega_1 + k_B\ln\Omega_2
所以定義 :: S = k_B\ln\Omega
全部擠在左邊只有一種排法 :: \Omega = 1 \;\Rightarrow\; S = 0
\(N\) 很大時（斯特林近似），平均分配的排法數 :: \ln\dbinom{N}{N/2} \approx N\ln 2 \;\Rightarrow\; \Omega \approx 2^N
平均分配比全在左邊多 \(2^N\) 倍；\(N\) 是 \(10^{23}\) 時，自己跑回左邊的機率實際上是零 :: \Delta S_{\text{孤立系統}} \ge 0`,
  idealgas: S`
一個質量 \(m\) 的分子以 \(v_x\) 撞牆彈回，動量變化 :: \Delta p = 2mv_x
邊長 \(L\) 的盒子，來回一趟要 \(2L/v_x\)，平均施力 :: F = \dfrac{2mv_x}{2L/v_x} = \dfrac{mv_x^2}{L}
\(N\) 個分子加起來除以牆的面積 \(L^2\) :: P = \dfrac{Nm\langle v_x^2\rangle}{L^3} = \dfrac{Nm\langle v_x^2\rangle}{V}
三個方向平均起來一樣，\(\langle v_x^2\rangle = \tfrac13\langle v^2\rangle\) :: PV = \tfrac23 N\cdot\tfrac12 m\langle v^2\rangle
溫度就是分子平均動能的量度 :: \tfrac12 m\langle v^2\rangle = \tfrac32 k_BT \;\Rightarrow\; PV = Nk_BT
分子數換成莫耳數 \(N = nN_A\)，\(R = N_Ak_B\) :: PV = nRT`,
  carnot: S`
熱力學第一定律：循環回到原狀態，內能不變，吸的熱減放的熱就是功 :: W = Q_h - Q_c
① 在 \(T_h\) 等溫膨脹：理想氣體內能只看溫度，吸的熱全部拿去做功 :: Q_h = \int P\,dV = nRT_h\ln\dfrac{V_2}{V_1}
③ 在 \(T_c\) 等溫壓縮，放出 :: Q_c = nRT_c\ln\dfrac{V_3}{V_4}
②④ 絕熱：沒有熱進出，內能變化等於負的功 :: nC_v\,dT = -P\,dV = -\dfrac{nRT}{V}dV \;\Rightarrow\; C_v\dfrac{dT}{T} = -R\dfrac{dV}{V}
積分，並用 \(C_p - C_v = R\)、\(\gamma = C_p/C_v\) 得 \(R/C_v = \gamma - 1\) :: TV^{\gamma-1} = \text{常數}
兩條絕熱線分別是 \(T_hV_2^{\gamma-1} = T_cV_3^{\gamma-1}\)、\(T_hV_1^{\gamma-1} = T_cV_4^{\gamma-1}\)，相除 :: \dfrac{V_2}{V_1} = \dfrac{V_3}{V_4}
所以兩個對數相同，熱量比等於溫度比 :: \dfrac{Q_c}{Q_h} = \dfrac{T_c}{T_h}
代回效率 :: \eta = \dfrac{W}{Q_h} = 1 - \dfrac{Q_c}{Q_h} = 1 - \dfrac{T_c}{T_h}`,
  conduction: S`
傅立葉定律（實驗）：熱流跟溫度梯度成正比，從熱流到冷 :: q = -kA\dfrac{\partial T}{\partial x}
取 \(x\) 到 \(x + dx\) 的薄片，質量 \(\rho A\,dx\)、比熱 \(c\)；流進減流出等於升溫 :: \rho cA\,dx\,\dfrac{\partial T}{\partial t} = q(x) - q(x+dx) = -\dfrac{\partial q}{\partial x}dx
代入傅立葉定律 :: \rho cA\dfrac{\partial T}{\partial t} = kA\dfrac{\partial^2T}{\partial x^2}
令 \(\alpha = k/\rho c\)，得到熱傳導方程 :: \dfrac{\partial T}{\partial t} = \alpha\dfrac{\partial^2T}{\partial x^2}
穩態時溫度不再變，\(\partial^2T/\partial x^2 = 0\)，溫度沿棒子是直線 :: q = kA\dfrac{T_h - T_c}{L}`,
  // ---------- 波動 ----------
  doppler: S`
聲源週期 \(T = 1/f\)；一個週期裡，波往前走 \(cT\)，聲源也往前走 \(v_sT\)。
前方相鄰兩個波峰的距離被壓短 :: \lambda_{\text{前}} = (c - v_s)T
觀察者靜止，波速仍是 \(c\)，聽到的頻率 :: f' = \dfrac{c}{\lambda_{\text{前}}} = \dfrac{c}{(c - v_s)T} = f\,\dfrac{c}{c - v_s}
後方被拉長 :: \lambda_{\text{後}} = (c + v_s)T \;\Rightarrow\; f' = f\,\dfrac{c}{c + v_s}
超音速：\(t\) 秒前發出的波現在半徑 \(ct\)，聲源已經走了 \(v_st\)；所有圓的公切線形成圓錐 :: \sin\mu = \dfrac{ct}{v_st} = \dfrac{c}{v_s} = \dfrac{1}{M}`,
  standing: S`
弦上一小段長 \(dx\)、質量 \(\mu\,dx\)；兩端張力的垂直分量差給它加速度 :: \mu\,dx\,\dfrac{\partial^2y}{\partial t^2} = T\dfrac{\partial^2y}{\partial x^2}dx
跟波動方程 \(\partial^2y/\partial t^2 = v^2\,\partial^2y/\partial x^2\) 對照，波速 :: v = \sqrt{\dfrac{T}{\mu}}
兩個反方向前進的同樣的波 :: y_1 = A\sin(kx - \omega t),\qquad y_2 = A\sin(kx + \omega t)
相加，用和差化積 \(\sin\alpha + \sin\beta = 2\sin\tfrac{\alpha+\beta}{2}\cos\tfrac{\alpha-\beta}{2}\) :: y = 2A\sin(kx)\cos(\omega t)
形狀 \(\sin kx\) 不動，只是整體上下振：駐波。兩端固定 \(y(0) = y(L) = 0\) :: \sin(kL) = 0 \;\Rightarrow\; kL = n\pi
波長 :: \lambda_n = \dfrac{2\pi}{k} = \dfrac{2L}{n}
頻率 \(f = v/\lambda\) :: f_n = \dfrac{n}{2L}\sqrt{\dfrac{T}{\mu}}`,
  interference: S`
兩個同相波源到某點的距離分別是 \(r_1\)、\(r_2\) :: y = A\sin(kr_1 - \omega t) + A\sin(kr_2 - \omega t)
和差化積 :: y = 2A\cos\!\left(\dfrac{k\,\Delta r}{2}\right)\sin\!\left(k\bar r - \omega t\right),\qquad \Delta r = r_2 - r_1,\quad \bar r = \dfrac{r_1 + r_2}{2}
前面的餘弦就是那一點的振幅，\(k = 2\pi/\lambda\) :: A_{\text{合}} = 2A\left|\cos\dfrac{\pi\,\Delta r}{\lambda}\right|
振幅最大：\(\pi\Delta r/\lambda = m\pi\) :: \Delta r = m\lambda
振幅為零：\(\pi\Delta r/\lambda = (m + \tfrac12)\pi\) :: \Delta r = \left(m + \tfrac12\right)\lambda`,
  resonance: S`
彈簧力、阻尼力加上外力 :: m\ddot x + b\dot x + kx = F_0\cos\omega t
除以 \(m\)，令 \(\gamma = b/m\)、\(\omega_0^2 = k/m\) :: \ddot x + \gamma\dot x + \omega_0^2x = \dfrac{F_0}{m}\cos\omega t
穩態時以外力的頻率振動；用複數 \(x = \text{Re}(Xe^{i\omega t})\)，微分變成乘 \(i\omega\) :: (-\omega^2 + i\gamma\omega + \omega_0^2)X = \dfrac{F_0}{m}
解出複數振幅 :: X = \dfrac{F_0/m}{(\omega_0^2 - \omega^2) + i\gamma\omega}
取絕對值就是振幅 :: A(\omega) = |X| = \dfrac{F_0/m}{\sqrt{(\omega_0^2 - \omega^2)^2 + (\gamma\omega)^2}}
相位落後外力 :: \tan\delta = \dfrac{\gamma\omega}{\omega_0^2 - \omega^2}
\(\omega = \omega_0\) 時第一項是零，只剩阻尼擋著；阻尼越小，共振越高 :: A(\omega_0) = \dfrac{F_0}{m\gamma\omega_0}`,
  // ---------- 光學 ----------
  snell: S`
費馬原理：光走花時間最少的路。起點在介質 1 高 \(a\)、終點在介質 2 深 \(b\)，水平距離 \(d\)，在界面 \(x\) 處轉折 :: t(x) = \dfrac{\sqrt{a^2 + x^2}}{v_1} + \dfrac{\sqrt{b^2 + (d - x)^2}}{v_2}
時間最短：對 \(x\) 微分等於 0 :: \dfrac{x}{v_1\sqrt{a^2 + x^2}} = \dfrac{d - x}{v_2\sqrt{b^2 + (d - x)^2}}
兩個分式剛好是入射角、折射角的正弦 :: \dfrac{\sin\theta_1}{v_1} = \dfrac{\sin\theta_2}{v_2}
光速 \(v = c/n\) 代入 :: n_1\sin\theta_1 = n_2\sin\theta_2
從密到疏時，折射角先到 90°，那時的入射角是臨界角 :: \sin\theta_c = \dfrac{n_2}{n_1}`,
  tir: S`
斯涅爾定律裡讓折射角等於 90° :: n_1\sin\theta_c = n_2\sin 90^\circ \;\Rightarrow\; \theta_c = \sin^{-1}\dfrac{n_2}{n_1}
光從空氣（\(n = 1\)）以 \(\theta\) 射進光纖端面，折射角 \(\theta_r\) :: \sin\theta = n_1\sin\theta_r
進去後打到側壁的入射角是 \(90^\circ - \theta_r\)，要大於臨界角才會全反射 :: \sin(90^\circ - \theta_r) = \cos\theta_r \ge \dfrac{n_2}{n_1}
換成正弦 :: \sin\theta_r \le \sqrt{1 - \dfrac{n_2^2}{n_1^2}}
代回第二步 :: \sin\theta_{\max} = n_1\sqrt{1 - \dfrac{n_2^2}{n_1^2}} = \sqrt{n_1^2 - n_2^2}`,
  lens: S`
物體高 \(h_o\)、像高 \(h_i\)（取大小）。通過透鏡中心的光不偏折，兩個相似三角形 :: \dfrac{h_i}{h_o} = \dfrac{d_i}{d_o}
平行主軸的光折射後經過焦點，透鏡後方另一對相似三角形 :: \dfrac{h_i}{h_o} = \dfrac{d_i - f}{f}
兩式相等 :: \dfrac{d_i}{d_o} = \dfrac{d_i}{f} - 1
兩邊除以 \(d_i\) 再移項 :: \dfrac{1}{d_o} = \dfrac{1}{f} - \dfrac{1}{d_i} \;\Rightarrow\; \dfrac{1}{f} = \dfrac{1}{d_o} + \dfrac{1}{d_i}
實像是倒立的，加負號表示方向 :: m = -\dfrac{d_i}{d_o}
物體在焦點內（\(d_o < f\)）時算出 \(d_i < 0\)：虛像，在同一側、正立、放大（放大鏡）。`,
  // ---------- 電磁 ----------
  gauss: S`
點電荷的電場，向外輻射 :: \vec E = \dfrac{q}{4\pi\varepsilon_0r^2}\,\hat r
取以電荷為中心、半徑 \(r\) 的球面：電場處處垂直球面、大小一樣 :: \oint\vec E\cdot d\vec A = \dfrac{q}{4\pi\varepsilon_0r^2}\cdot 4\pi r^2 = \dfrac{q}{\varepsilon_0}
結果跟 \(r\) 無關：電場的 \(1/r^2\) 剛好跟面積的 \(r^2\) 抵消。
任意形狀的曲面：每一小塊的通量只跟它從電荷看過去的立體角 \(d\Omega\) 有關，包住電荷時立體角總和 \(4\pi\) :: d\Phi = \dfrac{q}{4\pi\varepsilon_0}\,d\Omega \;\Rightarrow\; \Phi = \dfrac{q}{4\pi\varepsilon_0}\cdot 4\pi = \dfrac{q}{\varepsilon_0}
電荷在外面：電場線穿進去又穿出來，兩邊立體角抵消 :: \Phi = 0
很多電荷時電場相加（疊加原理），通量也相加 :: \oint_S\vec E\cdot d\vec A = \dfrac{Q_{\text{enc}}}{\varepsilon_0}`,
  coulomb: S`
庫侖用扭秤量出：力跟兩電荷的乘積成正比、跟距離平方成反比。也可以從高斯定律反推：點電荷 \(q_1\) 外取半徑 \(r\) 的球面 :: E\cdot 4\pi r^2 = \dfrac{q_1}{\varepsilon_0}
解出電場 :: E = \dfrac{q_1}{4\pi\varepsilon_0r^2}
另一個電荷受的力 = 電量 × 電場 :: F = q_2E = \dfrac{1}{4\pi\varepsilon_0}\dfrac{q_1q_2}{r^2}
常數合起來 :: k = \dfrac{1}{4\pi\varepsilon_0} = \dfrac{1}{4\pi\times8.854\times10^{-12}},\qquad k \approx 8.99\times10^9\ \text{N}\,\text{m}^2/\text{C}^2`,
  dipole: S`
單一點電荷在某點產生的電場 :: \vec E_i = \dfrac{1}{4\pi\varepsilon_0}\dfrac{q_i}{r_i^2}\,\hat r_i
電場是線性的，很多電荷時直接向量相加（疊加原理） :: \vec E = \sum_i\vec E_i
電偶極：\(+q\) 在 \(z = d/2\)、\(-q\) 在 \(z = -d/2\)；看軸上很遠（\(r \gg d\)）的一點 :: E = \dfrac{q}{4\pi\varepsilon_0}\left[\dfrac{1}{(r - d/2)^2} - \dfrac{1}{(r + d/2)^2}\right]
展開 \(\dfrac{1}{(r \mp d/2)^2} \approx \dfrac{1}{r^2}\left(1 \pm \dfrac{d}{r}\right)\) :: E \approx \dfrac{q}{4\pi\varepsilon_0}\cdot\dfrac{2d}{r^3} = \dfrac{2qd}{4\pi\varepsilon_0r^3}
遠處只看得到 \(q\) 和 \(d\) 的乘積，所以定義偶極矩；偶極的電場隨 \(1/r^3\) 衰減，比單一電荷快 :: \vec p = q\,\vec d`,
  lorentz: S`
實驗定律：電場推電荷，磁場推運動中的電荷 :: \vec F = q\left(\vec E + \vec v\times\vec B\right)
磁力的功率：外積垂直於 \(\vec v\)，點積是零，所以磁場只會讓粒子轉彎、不會加速 :: P = \vec F\cdot\vec v = q(\vec v\times\vec B)\cdot\vec v = 0
只有磁場、速度垂直磁場：速率不變、力大小固定，就是等速圓周，磁力當向心力 :: |q|v_\perp B = \dfrac{mv_\perp^2}{r}
解出半徑 :: r = \dfrac{mv_\perp}{|q|B}
轉一圈的時間跟速度無關（迴旋加速器的原理） :: T = \dfrac{2\pi r}{v_\perp} = \dfrac{2\pi m}{|q|B}
電場和磁場互相垂直時，粒子整體以固定速度漂移 :: \vec v_d = \dfrac{\vec E\times\vec B}{B^2},\qquad v_d = \dfrac{E}{B}`,
  faraday: S`
磁通量：把穿過線圈的磁場加起來 :: \Phi_B = \int\vec B\cdot d\vec A
均勻磁場、面積 \(A\)、線圈法線和磁場夾 \(\theta\) :: \Phi_B = BA\cos\theta
法拉第的實驗：磁通量改變就產生電動勢，\(N\) 匝線圈串聯相加 :: \mathcal{E} = -N\dfrac{d\Phi_B}{dt}
例：發電機線圈以 \(\omega\) 轉動，\(\theta = \omega t\) :: \mathcal{E} = -NBA\dfrac{d}{dt}\cos\omega t = NBA\omega\sin\omega t
負號（冷次定律）：如果是正號，感應電流會加強變化、變化又產生更大的電流，能量無中生有，違反能量守恆。`,
  ampere: S`
安培定律：沿封閉迴路繞一圈，磁場的切線分量加起來等於穿過的電流 :: \oint\vec B\cdot d\vec\ell = \mu_0I_{\text{enc}}
長直導線有圓柱對稱：磁場繞著導線，在半徑 \(r\) 的圓上大小一樣、方向跟 \(d\vec\ell\) 平行 :: \oint\vec B\cdot d\vec\ell = B\cdot 2\pi r
代進安培定律 :: B\cdot 2\pi r = \mu_0I
解出 :: B = \dfrac{\mu_0I}{2\pi r}`,
  emwave: S`
真空中（沒有電荷、電流）的馬克士威方程，兩條旋度式 :: \nabla\times\vec E = -\dfrac{\partial\vec B}{\partial t},\qquad \nabla\times\vec B = \mu_0\varepsilon_0\dfrac{\partial\vec E}{\partial t}
對第一式再取一次旋度，用 \(\nabla\times(\nabla\times\vec E) = \nabla(\nabla\cdot\vec E) - \nabla^2\vec E\)，且 \(\nabla\cdot\vec E = 0\) :: -\nabla^2\vec E = -\dfrac{\partial}{\partial t}(\nabla\times\vec B) = -\mu_0\varepsilon_0\dfrac{\partial^2\vec E}{\partial t^2}
得到波動方程 :: \nabla^2\vec E = \mu_0\varepsilon_0\dfrac{\partial^2\vec E}{\partial t^2}
跟 \(\partial^2y/\partial x^2 = \tfrac{1}{v^2}\partial^2y/\partial t^2\) 對照，波速 :: c = \dfrac{1}{\sqrt{\mu_0\varepsilon_0}},\qquad \mu_0\varepsilon_0 = 4\pi\times10^{-7}\times8.854\times10^{-12},\qquad c \approx 3.00\times10^8\ \text{m/s}
代入 \(\vec E = E_0\sin(kx - \omega t)\,\hat y\) :: k^2 = \mu_0\varepsilon_0\omega^2 \;\Rightarrow\; \dfrac{\omega}{k} = c \;\Rightarrow\; c = \lambda f
磁場由第一式的 \(z\) 分量求出：\(\partial B_z/\partial t = -\partial E_y/\partial x\) :: \dfrac{\partial B_z}{\partial t} = -kE_0\cos(kx - \omega t) \;\Rightarrow\; B_z = \dfrac{k}{\omega}E_0\sin(kx - \omega t)
所以磁場沿 \(z\)、跟電場同相，振幅 :: B_0 = \dfrac{E_0}{c}`,
  // ---------- 相對論 ----------
  timedilation: S`
光鐘：兩面鏡子相距 \(D\)，光來回一趟算一下。跟鐘一起動的人量到 :: \Delta t_0 = \dfrac{2D}{c}
鐘以 \(v\) 飛過時，月台上的人看到光走斜線；相對論假設光速對所有人都是 \(c\)，畢氏定理 :: \left(\dfrac{c\,\Delta t'}{2}\right)^2 = D^2 + \left(\dfrac{v\,\Delta t'}{2}\right)^2
整理，\(2D = c\,\Delta t_0\) :: \Delta t'^2(c^2 - v^2) = 4D^2 = c^2\Delta t_0^2
解出 :: \Delta t' = \dfrac{\Delta t_0}{\sqrt{1 - v^2/c^2}} = \gamma\,\Delta t_0
例：\(v = 0.99c\) :: \gamma = \dfrac{1}{\sqrt{1 - 0.9801}} \approx 7.09`,
  lengthcontraction: S`
月台上兩點相距 \(L_0\)（相對月台靜止），火車以 \(v\) 開過，月台的人量到時間 :: \Delta t = \dfrac{L_0}{v}
「車頭經過第一點」「經過第二點」兩件事在火車上同一個位置發生，火車上的鐘量到的是固有時 :: \Delta t_0 = \dfrac{\Delta t}{\gamma}
火車上的人看兩點以 \(v\) 掠過，量到距離 :: L = v\,\Delta t_0 = \dfrac{v\,\Delta t}{\gamma} = \dfrac{L_0}{\gamma}
代入 \(\gamma\) :: L = L_0\sqrt{1 - v^2/c^2}
垂直運動方向不收縮：否則兩個人對「誰變細」會得到互相矛盾的結論。`,
  emc2: S`
相對論動量（低速時回到 \(mv\)） :: p = \gamma mv = \dfrac{mv}{\sqrt{1 - v^2/c^2}}
動能 = 從靜止加速到 \(v\) 的功；\(F\,dx = \tfrac{dp}{dt}dx = v\,dp\) :: K = \int F\,dx = \int_0^p v\,dp
分部積分 \(\int v\,dp = pv - \int p\,dv\) :: K = \gamma mv^2 - \int_0^v\dfrac{mv'}{\sqrt{1 - v'^2/c^2}}\,dv'
積分 :: K = \gamma mv^2 + mc^2\sqrt{1 - v^2/c^2} - mc^2
前兩項合併：\(\gamma mv^2 + mc^2/\gamma = \gamma m(v^2 + c^2 - v^2) = \gamma mc^2\) :: K = \gamma mc^2 - mc^2
動能 + 靜止時就有的那份能量 = 總能量；\(v = 0\) 時 :: E = \gamma mc^2 \;\xrightarrow{v = 0}\; E = mc^2
檢查低速：\(\gamma \approx 1 + v^2/2c^2\) :: K \approx \tfrac12 mv^2
電子和正電子靜止時湮滅，總動量 0，只能變成兩個反向的光子，各帶一份靜止能量 :: E_\gamma = m_ec^2 = 9.11\times10^{-31}\times(3\times10^8)^2\ \text{J},\qquad E_\gamma \approx 8.2\times10^{-14}\ \text{J} = 0.511\ \text{MeV}`,
  spacetime: S`
牛頓重力寫成位勢 \(\Phi\) 的形式：質量密度決定位勢的彎曲 :: \nabla^2\Phi = 4\pi G\rho
愛因斯坦的想法：重力就是時空幾何。左邊換成描述彎曲的張量（由度規 \(g_{\mu\nu}\) 的二階導數組成），右邊換成能量–動量張量（\(\rho c^2\) 是它的 00 分量） :: (\text{曲率}) = \kappa\,T_{\mu\nu}
能量–動量守恆 \(\nabla^\mu T_{\mu\nu} = 0\)，所以左邊的散度也必須是零；滿足的只有愛因斯坦張量和度規本身 :: \nabla^\mu G_{\mu\nu} = 0,\qquad \nabla^\mu g_{\mu\nu} = 0
所以最一般的寫法 :: G_{\mu\nu} + \Lambda g_{\mu\nu} = \kappa\,T_{\mu\nu}
決定 \(\kappa\)：令 \(\Lambda = 0\)，弱場、低速時 \(g_{00} \approx -(1 + 2\Phi/c^2)\)，00 分量化成 :: \nabla^2\Phi = \dfrac{\kappa c^4}{2}\rho
要跟牛頓一致 :: \dfrac{\kappa c^4}{2} = 4\pi G \;\Rightarrow\; \kappa = \dfrac{8\pi G}{c^4}`,
  schwarzschild: S`
快速估計：逃逸速度等於光速的半徑（剛好跟廣義相對論的精確結果一樣） :: \sqrt{\dfrac{2GM}{r}} = c \;\Rightarrow\; r_s = \dfrac{2GM}{c^2}
精確解：愛因斯坦方程在球對稱質量外的解（史瓦西度規，只看赤道面） :: ds^2 = -\left(1 - \dfrac{r_s}{r}\right)c^2dt^2 + \dfrac{dr^2}{1 - r_s/r} + r^2d\varphi^2
光走 \(ds^2 = 0\)；時間、角度不出現在係數裡，有兩個守恆量 \(E\)、\(L\)（能量、角動量） :: \dot r^2 = E^2 - \left(1 - \dfrac{r_s}{r}\right)\dfrac{L^2}{r^2},\qquad \dot\varphi = \dfrac{L}{r^2}
換成 \(u = 1/r\)：\(\dot r = \tfrac{dr}{d\varphi}\dot\varphi = -L\tfrac{du}{d\varphi}\) :: \left(\dfrac{du}{d\varphi}\right)^2 = \dfrac{E^2}{L^2} - u^2 + r_su^3
對 \(\varphi\) 微分，兩邊除以 \(2\,du/d\varphi\) :: \dfrac{d^2u}{d\varphi^2} + u = \dfrac32 r_s u^2
右邊是零時 \(u = \sin\varphi/b\)，是直線；右邊那一項讓光彎曲（重力透鏡）。
光子球：繞圓圈時 \(u\) 不變，左邊微分項為零 :: u = \dfrac32 r_su^2 \;\Rightarrow\; r = \dfrac32 r_s
剛好掠過光子球的光，撞擊參數 \(b = L/E\)：在 \(u = 2/3r_s\) 處 \(du/d\varphi = 0\) :: \dfrac{1}{b^2} = u^2(1 - r_su) = \dfrac{4}{27r_s^2} \;\Rightarrow\; b = \dfrac{3\sqrt3}{2}r_s \approx 2.6\,r_s
比這更靠近的光都會掉進去，所以黑洞的影子半徑約 \(2.6\,r_s\)。`,
  zeldovich: S`
繞著轉軸、方位角 \(\varphi\) 方向有 \(m\) 個波峰的波 :: \psi \propto e^{i(m\varphi - \omega t)}
換到跟著物體轉的座標：\(\varphi = \varphi' + \Omega t\) :: \psi \propto e^{i(m\varphi' + m\Omega t - \omega t)} = e^{i[m\varphi' - (\omega - m\Omega)t]}
所以轉動的物體看到的頻率 :: \omega' = \omega - m\Omega
物體在自己的座標裡只會吸收（摩擦耗散），吸收率跟它看到的頻率同號 :: \text{吸收} \propto \omega' = \omega - m\Omega
\(m\Omega > \omega\) 時 \(\omega' < 0\)：在物體看來波是反著轉的，「吸收」變成負的——物體的轉動能交給波，波被放大，物體轉速變慢 :: m\Omega > \omega \;\Rightarrow\; \text{吸收} < 0
能量守恆：波每帶走能量 \(\Delta E\)，同時帶走角動量 \(\tfrac{m}{\omega}\Delta E\)，正是物體失去的。`,
  // ---------- 宇宙學 ----------
  friedmann: S`
牛頓式推法：取半徑 \(R = a(t)\,r\) 的球，裡面的質量 :: M = \tfrac43\pi R^3\rho
球面上每公斤物質的能量守恆（動能 + 位能） :: \tfrac12\dot R^2 - \dfrac{GM}{R} = E
代入 \(M\) 和 \(R = ar\) :: \tfrac12\dot a^2r^2 - \dfrac{4\pi G}{3}\rho a^2r^2 = E
兩邊除以 \(\tfrac12 a^2r^2\)，把常數寫成 \(-2E/r^2 = kc^2\)（曲率） :: \left(\dfrac{\dot a}{a}\right)^2 = \dfrac{8\pi G}{3}\rho - \dfrac{kc^2}{a^2}
加上宇宙常數（相當於固定密度 \(\Lambda c^2/8\pi G\)） :: H^2 = \dfrac{8\pi G}{3}\rho - \dfrac{kc^2}{a^2} + \dfrac{\Lambda c^2}{3}
膨脹時能量守恆（熱力學第一定律） :: \dot\rho = -3\,\dfrac{\dot a}{a}\left(\rho + \dfrac{p}{c^2}\right)
第一式乘 \(a^2\) 後對時間微分，代入上式 :: \dfrac{\ddot a}{a} = -\dfrac{4\pi G}{3}\left(\rho + \dfrac{3p}{c^2}\right) + \dfrac{\Lambda c^2}{3}
只有物質（\(p = 0\)、\(k = 0\)、\(\Lambda = 0\)）：粒子數不變，\(\rho \propto a^{-3}\) :: \dot a^2 \propto \dfrac{1}{a} \;\Rightarrow\; a^{1/2}\,da \propto dt \;\Rightarrow\; a \propto t^{2/3}`,
  hubble: S`
宇宙均勻膨脹：所有距離都乘上同一個尺度因子 :: d(t) = a(t)\,d_0
對時間微分 :: v = \dot d = \dot a\,d_0 = \dfrac{\dot a}{a}\,d
今天的 \(\dot a/a\) 就是哈伯常數 :: v = H_0\,d
光在路上被空間一起拉長，波長跟 \(a\) 成正比 :: 1 + z = \dfrac{\lambda_{\text{觀測}}}{\lambda_{\text{發出}}} = \dfrac{a_{\text{今}}}{a_{\text{發出}}}
近處：光飛了 \(\Delta t = d/c\)，這段時間 \(a\) 只多了 \(\dot a\,\Delta t\) :: z \approx \dfrac{\dot a}{a}\,\dfrac{d}{c} = \dfrac{H_0d}{c} = \dfrac{v}{c}
粗估宇宙年齡：倒推回所有星系擠在一起 :: t \approx \dfrac{d}{v} = \dfrac{1}{H_0} = \dfrac{3.086\times10^{19}\ \text{km}}{70\ \text{km/s}} \approx 140\ \text{億年}`,
  // ---------- 分析力學 ----------
  leastaction: S`
真實路徑 \(q(t)\) 旁邊取一條稍微偏一點的 \(q + \delta q\)，兩端固定：\(\delta q(t_1) = \delta q(t_2) = 0\) :: \delta S = \int_{t_1}^{t_2}\left(\dfrac{\partial L}{\partial q}\delta q + \dfrac{\partial L}{\partial\dot q}\delta\dot q\right)dt
第二項分部積分，\(\delta\dot q = \tfrac{d}{dt}\delta q\) :: \int\dfrac{\partial L}{\partial\dot q}\dfrac{d\,\delta q}{dt}dt = \left[\dfrac{\partial L}{\partial\dot q}\delta q\right]_{t_1}^{t_2} - \int\dfrac{d}{dt}\dfrac{\partial L}{\partial\dot q}\,\delta q\,dt
兩端 \(\delta q = 0\)，方括號消失 :: \delta S = \int_{t_1}^{t_2}\left(\dfrac{\partial L}{\partial q} - \dfrac{d}{dt}\dfrac{\partial L}{\partial\dot q}\right)\delta q\,dt
對任何偏離 \(\delta q\) 都要是零，括號本身必須是零（歐拉–拉格朗日方程） :: \dfrac{d}{dt}\dfrac{\partial L}{\partial\dot q} - \dfrac{\partial L}{\partial q} = 0
檢查：\(L = \tfrac12 m\dot x^2 - V(x)\) 代入，得到的正是牛頓第二定律 :: \dfrac{d}{dt}(m\dot x) + \dfrac{dV}{dx} = 0 \;\Rightarrow\; m\ddot x = -\dfrac{dV}{dx} = F`,
  noether: S`
平面上用極座標寫拉格朗日量 :: L = \tfrac12 m\left(\dot r^2 + r^2\dot\varphi^2\right) - V(r)
位能只跟距離有關（轉任何角度都一樣，旋轉對稱），\(L\) 裡沒有 \(\varphi\) :: \dfrac{\partial L}{\partial\varphi} = 0
\(\varphi\) 的歐拉–拉格朗日方程 :: \dfrac{d}{dt}\dfrac{\partial L}{\partial\dot\varphi} = \dfrac{\partial L}{\partial\varphi} = 0
括號裡的量不隨時間變，算出來正是角動量 :: L_z = \dfrac{\partial L}{\partial\dot\varphi} = mr^2\dot\varphi = \text{常數}
同樣道理：\(L\) 裡沒有 \(x\)（平移對稱）→ 動量守恆；\(L\) 不顯含時間（時間平移對稱）→ 能量守恆。`,
  maxwell: S`
波茲曼因子：能量 \(E\) 的狀態，機率正比於 \(e^{-E/k_BT}\)；分子動能 \(\tfrac12 m(v_x^2 + v_y^2 + v_z^2)\) :: f(\vec v) \propto e^{-m(v_x^2 + v_y^2 + v_z^2)/2k_BT}
每個方向各自是高斯分布；用 \(\int e^{-\alpha x^2}dx = \sqrt{\pi/\alpha}\) 歸一化 :: f(v_x) = \left(\dfrac{m}{2\pi k_BT}\right)^{1/2}e^{-mv_x^2/2k_BT}
三個方向相乘 :: f(\vec v) = \left(\dfrac{m}{2\pi k_BT}\right)^{3/2}e^{-mv^2/2k_BT}
只問速率不問方向：速率在 \(v\) 到 \(v + dv\) 的是半徑 \(v\)、厚 \(dv\) 的球殼，體積 \(4\pi v^2dv\) :: f(v) = 4\pi\left(\dfrac{m}{2\pi k_BT}\right)^{3/2}v^2e^{-mv^2/2k_BT}
高斯分布的變異數 \(\langle v_x^2\rangle = k_BT/m\)，三個方向加起來 :: \tfrac12 m\langle v^2\rangle = \tfrac12 m\cdot\dfrac{3k_BT}{m} = \tfrac32 k_BT
最可能速率：\(df/dv = 0\) :: v_p = \sqrt{\dfrac{2k_BT}{m}}
溫度加倍，最可能速率只變成 \(\sqrt2\) 倍。`,
  chaos: S`
雙擺的運動方程（用拉格朗日量推得）是兩個角度互相耦合的非線性方程，沒有公式解，網站用數值積分一步一步算。
兩條起點只差 \(\delta_0\) 的軌跡，差距很小時可以線性化：差距的成長率跟差距本身成正比 :: \dfrac{d\delta}{dt} \approx \lambda\,\delta
解是指數 :: |\delta(t)| \approx |\delta_0|\,e^{\lambda t}
差距長到 \(\Delta\)（跟整個擺一樣大）就完全不準，可預測時間 :: t_{\text{預測}} \approx \dfrac{1}{\lambda}\ln\dfrac{\Delta}{\delta_0}
初始誤差縮小 1000 倍，只多換到 \(\ln 1000/\lambda \approx 6.9/\lambda\) 的時間：這就是天氣預報很難超過兩週的原因。`,
  goldenspiral: S`
費波那契數列：每項是前兩項相加 :: F_{n+1} = F_n + F_{n-1}
兩邊除以 \(F_n\)，假設比值趨近 \(\varphi\) :: \dfrac{F_{n+1}}{F_n} = 1 + \dfrac{F_{n-1}}{F_n} \;\Rightarrow\; \varphi = 1 + \dfrac{1}{\varphi}
乘上 \(\varphi\) 得到二次方程，取正根 :: \varphi^2 - \varphi - 1 = 0 \;\Rightarrow\; \varphi = \dfrac{1 + \sqrt5}{2} \approx 1.618
黃金矩形切掉一個正方形，剩下的矩形縮小 \(\varphi\) 倍、轉 90°；螺線每轉 \(\pi/2\) 半徑放大 \(\varphi\) 倍 :: r\!\left(\theta + \tfrac{\pi}{2}\right) = \varphi\,r(\theta) \;\Rightarrow\; r(\theta) = a\,\varphi^{2\theta/\pi}
黃金角：圓周按黃金比例切開，小的那一份；由 \(\varphi = 1 + 1/\varphi\) 得 \(1 - 1/\varphi = 1/\varphi^2\) :: 360^\circ\left(1 - \dfrac{1}{\varphi}\right) = \dfrac{360^\circ}{\varphi^2} \approx 137.5^\circ`,
  // ---------- 量子 ----------
  blackbody: S`
空腔裡的電磁駐波：頻率在 \(f\) 到 \(f + df\) 的模式數（含兩個偏振） :: n(f)\,df = \dfrac{8\pi f^2}{c^3}\,df
古典物理說每個模式平均能量 \(k_BT\)，頻率越高模式越多，總能量會無限大（紫外災難）。
普朗克假設：能量只能是 \(hf\) 的整數倍，機率照波茲曼因子；等比級數加總 :: \langle E\rangle = \dfrac{\sum_n nhf\,e^{-nhf/k_BT}}{\sum_n e^{-nhf/k_BT}} = \dfrac{hf}{e^{hf/k_BT} - 1}
模式數 × 平均能量，得到能量密度 :: u(f) = \dfrac{8\pi hf^3}{c^3}\,\dfrac{1}{e^{hf/k_BT} - 1}
換成波長 \(f = c/\lambda\)、\(|df| = c\,d\lambda/\lambda^2\)，表面輻射強度 \(B = uc/4\pi\) :: B_\lambda(T) = \dfrac{2hc^2}{\lambda^5}\,\dfrac{1}{e^{hc/\lambda k_BT} - 1}
低頻時 \(hf \ll k_BT\)，\(e^x - 1 \approx x\)，回到古典的 \(k_BT\)；高頻被指數壓下去，不會發散。
維恩定律：\(dB_\lambda/d\lambda = 0\)，令 \(x = hc/\lambda k_BT\) :: 5\left(1 - e^{-x}\right) = x \;\Rightarrow\; x \approx 4.965
所以 :: \lambda_{\max}T = \dfrac{hc}{4.965\,k_B} = 2.898\times10^{-3}\ \text{m}\cdot\text{K}`,
  photoelectric: S`
愛因斯坦：光是一顆一顆的光子，每顆能量 :: E = hf
一個光子把全部能量給一個電子；電子要先花至少功函數 \(\phi\) 才能離開金屬，剩下的變動能 :: hf = \phi + K
最表面的電子剛好只花 \(\phi\)，動能最大 :: K_{\max} = hf - \phi
動能剛好是零的頻率：截止頻率 :: hf_0 = \phi \;\Rightarrow\; f_0 = \dfrac{\phi}{h}
光變強＝光子變多，只會打出更多電子，不會讓每個電子更快；頻率低於 \(f_0\) 時，再多光子也沒用。
實驗量法：加反向電壓 \(V_0\) 剛好擋住最快的電子，畫 \(V_0\) 對 \(f\) 是直線，斜率就是 \(h/e\) :: eV_0 = hf - \phi`,
  debroglie: S`
光子沒有質量，相對論給出 \(E = pc\)；配合 \(E = hf\)、\(c = f\lambda\) :: p = \dfrac{E}{c} = \dfrac{hf}{c} = \dfrac{h}{\lambda}
德布羅意大膽假設物質也一樣 :: \lambda = \dfrac{h}{p} = \dfrac{h}{mv}
電子繞原子核一圈，波要首尾接得起來（駐波），周長是波長的整數倍 :: 2\pi r = n\lambda = n\dfrac{h}{mv}
移項 :: mvr = n\dfrac{h}{2\pi}
\(mvr\) 就是角動量：波耳原本硬加的量子化條件，從波的觀點自然出現 :: L = n\hbar`,
  doubleslit: S`
量子力學的規則：分不出走哪條路時，把兩條路的機率幅相加 :: \psi = \psi_1 + \psi_2
機率是絕對值平方，展開多出交叉項 :: P = |\psi_1|^2 + |\psi_2|^2 + 2\,\text{Re}\!\left(\psi_1^*\psi_2\right)
遠處的屏幕：兩條路的路程差 \(d\sin\theta\)，相位差 :: \delta = \dfrac{2\pi d\sin\theta}{\lambda}
兩邊振幅一樣：\(\psi_2 = \psi_1e^{i\delta}\) :: |\psi_1|^2\left|1 + e^{i\delta}\right|^2 = 4|\psi_1|^2\cos^2\dfrac{\delta}{2}
每條縫有寬度 \(a\)：把縫裡每一點的波加起來（單縫繞射） :: \int_{-a/2}^{a/2}e^{i\frac{2\pi}{\lambda}y\sin\theta}\,dy \propto \dfrac{\sin\beta}{\beta},\qquad \beta = \dfrac{\pi a\sin\theta}{\lambda}
兩個效果相乘 :: I(\theta) \propto \cos^2\!\left(\dfrac{\pi d\sin\theta}{\lambda}\right)\operatorname{sinc}^2\!\left(\dfrac{\pi a\sin\theta}{\lambda}\right)
觀測粒子走哪條縫：兩條路分得出來，就不能把機率幅相加，只能把機率相加，交叉項消失，條紋跟著消失。`,
  uncertainty: S`
高斯波包，機率分布的標準差是 \(\sigma\) :: \psi(x) \propto e^{-x^2/4\sigma^2}e^{ik_0x} \;\Rightarrow\; |\psi|^2 \propto e^{-x^2/2\sigma^2},\quad \Delta x = \sigma
動量分布是波函數的傅立葉轉換（\(p = \hbar k\)）；高斯的傅立葉轉換還是高斯 :: \phi(k) \propto e^{-\sigma^2(k - k_0)^2}
\(|\phi|^2 \propto e^{-2\sigma^2(k - k_0)^2}\) 的標準差 :: \Delta k = \dfrac{1}{2\sigma}
換成動量 :: \Delta p = \hbar\,\Delta k = \dfrac{\hbar}{2\sigma}
相乘，\(\sigma\) 剛好消掉 :: \Delta x\,\Delta p = \sigma\cdot\dfrac{\hbar}{2\sigma} = \dfrac{\hbar}{2}
高斯剛好取等號；其他形狀的波包乘積都更大（可用柯西–施瓦茲不等式證明） :: \Delta x\,\Delta p \ge \dfrac{\hbar}{2}`,
  infinitewell: S`
井裡位能是 0，薛丁格方程 :: -\dfrac{\hbar^2}{2m}\psi'' = E\psi \;\Rightarrow\; \psi'' = -k^2\psi,\quad k = \dfrac{\sqrt{2mE}}{\hbar}
通解 :: \psi = A\sin kx + B\cos kx
牆外位能無限大，\(\psi = 0\)；波函數要連續：\(\psi(0) = 0\) 給 \(B = 0\)，\(\psi(L) = 0\) 給 :: A\sin kL = 0 \;\Rightarrow\; kL = n\pi
能量只能取這些值 :: E_n = \dfrac{\hbar^2k^2}{2m} = \dfrac{n^2\pi^2\hbar^2}{2mL^2}
歸一化：找到粒子的總機率是 1 :: A^2\int_0^L\sin^2\dfrac{n\pi x}{L}\,dx = A^2\dfrac{L}{2} = 1 \;\Rightarrow\; A = \sqrt{\dfrac{2}{L}}
\(n = 0\) 會讓 \(\psi\) 處處為零（沒有粒子），所以最低是 \(n = 1\)：粒子不可能完全靜止（零點能）。`,
  tunneling: S`
薛丁格方程是量子力學的基本假設；能量固定時令 \(\psi = \phi(x)e^{-iEt/\hbar}\)，代入得定態方程 :: -\dfrac{\hbar^2}{2m}\phi'' + V\phi = E\phi
位障裡 \(V_0 > E\)，移項後係數是正的 :: \phi'' = \kappa^2\phi,\qquad \kappa = \dfrac{\sqrt{2m(V_0 - E)}}{\hbar}
解是指數，不是振盪：波函數在牆裡衰減，但不是立刻變零 :: \phi = Ce^{-\kappa x} + De^{\kappa x}
牆夠厚（\(\kappa a \gg 1\)）時主要是衰減項，穿過厚度 \(a\) 振幅剩 \(e^{-\kappa a}\)，機率是平方 :: T \approx e^{-2\kappa a}
在牆兩側把 \(\phi\) 和 \(\phi'\) 接連續，可以解出精確值 :: T = \left[1 + \dfrac{V_0^2\sinh^2\kappa a}{4E(V_0 - E)}\right]^{-1}
厚牆時 \(\sinh^2\kappa a \approx e^{2\kappa a}/4\)，回到 \(e^{-2\kappa a}\)（前面多一個 \(16E(V_0 - E)/V_0^2\) 的係數）。`,
  qho: S`
彈簧位能 :: V = \tfrac12 m\omega^2x^2
定態薛丁格方程 :: -\dfrac{\hbar^2}{2m}\psi'' + \tfrac12 m\omega^2x^2\psi = E\psi
換成無單位的 \(\xi = x\sqrt{m\omega/\hbar}\)、\(\varepsilon = 2E/\hbar\omega\) :: \dfrac{d^2\psi}{d\xi^2} = (\xi^2 - \varepsilon)\psi
\(\xi\) 很大時 \(\psi \approx e^{-\xi^2/2}\)；令 \(\psi = H(\xi)e^{-\xi^2/2}\) 代入 :: H'' - 2\xi H' + (\varepsilon - 1)H = 0
用冪級數解 \(H\)；級數若不停止，\(H\) 會像 \(e^{\xi^2}\) 一樣把 \(\psi\) 撐爆，所以必須在第 \(n\) 項停住 :: \varepsilon - 1 = 2n,\qquad n = 0, 1, 2, \dots
換回能量；停住的多項式就是厄米多項式 \(H_n\) :: E_n = \left(n + \tfrac12\right)\hbar\omega,\qquad \psi_n \propto H_n(\xi)e^{-\xi^2/2}
\(n = 0\) 仍有 \(\tfrac12\hbar\omega\)：零點能，符合不確定性原理。`,
  hydrogen: S`
電子和質子之間的庫侖位能 :: V(r) = -\dfrac{e^2}{4\pi\varepsilon_0r}
位能只跟 \(r\) 有關，波函數拆成「距離」乘「方向」 :: \psi(r,\theta,\phi) = R(r)\,Y_\ell^m(\theta,\phi)
方向部分是球諧函數，任何球對稱位能都一樣；它們是角動量的本徵態 :: \hat L^2Y_\ell^m = \ell(\ell + 1)\hbar^2Y_\ell^m,\qquad \hat L_zY_\ell^m = m\hbar\,Y_\ell^m
距離部分：多了一項角動量造成的離心位能 :: -\dfrac{\hbar^2}{2m_er^2}\dfrac{d}{dr}\!\left(r^2\dfrac{dR}{dr}\right) + V_{\text{有效}}R = ER,\qquad V_{\text{有效}} = V(r) + \dfrac{\ell(\ell + 1)\hbar^2}{2m_er^2}
要 \(R\) 在無限遠趨近零，級數解必須停住，得到整數 \(n\)，並且 \(\ell \le n - 1\) :: E_n = -\dfrac{m_ee^4}{2(4\pi\varepsilon_0)^2\hbar^2}\cdot\dfrac{1}{n^2}
代入數值 :: E_n = -\dfrac{13.6\ \text{eV}}{n^2}
同一個 \(n\) 不同 \(\ell\)、\(m\) 能量一樣，只是形狀不同（s、p、d 軌域）。`,
  sterngerlach: S`
磁矩在不均勻磁場裡受力，大小正比於磁矩在 \(z\) 的分量 :: F_z = \mu_z\dfrac{\partial B_z}{\partial z}
古典：磁矩方向隨機，\(\mu_z\) 連續分布，屏上應該是一整條。實驗只出現兩點，所以自旋的 \(z\) 分量只有兩個值 :: S_z = \pm\dfrac{\hbar}{2}
沿 \(\hat n\)（跟 \(z\) 夾 \(\theta\)）的「上」態，用 \(z\) 方向的基底寫 :: |\uparrow_{\hat n}\rangle = \cos\dfrac{\theta}{2}|\uparrow_z\rangle + e^{i\phi}\sin\dfrac{\theta}{2}|\downarrow_z\rangle
原本是 \(z\) 上，量 \(\hat n\) 得到上的機率是內積的平方 :: P(\uparrow_{\hat n}) = \left|\langle\uparrow_{\hat n}|\uparrow_z\rangle\right|^2 = \cos^2\dfrac{\theta}{2}
\(\theta = 90^\circ\) 時一半一半；\(\theta = 180^\circ\) 時是零（正好相反）。
出現半角是因為自旋 1/2 轉 360° 狀態只多一個負號，要轉 720° 才完全轉回來。`,
  bloch: S`
一個量子位元的一般狀態，兩個係數的機率加起來是 1 :: |\psi\rangle = \alpha|0\rangle + \beta|1\rangle,\qquad |\alpha|^2 + |\beta|^2 = 1
整體乘上一個相位沒有物理效果，可以讓 \(\alpha\) 是正實數；剩下兩個實數參數 :: \alpha = \cos\dfrac{\theta}{2},\qquad \beta = e^{i\phi}\sin\dfrac{\theta}{2}
用 \(\theta/2\) 是為了讓 \(\theta\) 從 0 到 \(\pi\) 時，\(|0\rangle\) 走到 \(|1\rangle\)：互相正交的兩個態在球上正好是北極和南極。
量到 0 的機率 :: P(0) = |\alpha|^2 = \cos^2\dfrac{\theta}{2}
球上那一點的座標剛好是三個方向自旋的平均值 :: \langle\sigma_x\rangle = \sin\theta\cos\phi,\qquad \langle\sigma_y\rangle = \sin\theta\sin\phi,\qquad \langle\sigma_z\rangle = \cos\theta`,
  entanglement: S`
自旋單重態：總自旋為零，兩顆永遠相反，但各自是哪個方向不確定 :: |\Psi^-\rangle = \tfrac{1}{\sqrt2}\left(|\uparrow\downarrow\rangle - |\downarrow\uparrow\rangle\right)
兩邊沿 \(\hat a\)、\(\hat b\) 方向量，結果各是 ±1；關聯值是乘積的平均。單重態轉任何角度都長一樣，算出來只跟夾角有關 :: E(a,b) = \langle\Psi^-|(\vec\sigma\cdot\hat a)\otimes(\vec\sigma\cdot\hat b)|\Psi^-\rangle,\qquad E(a,b) = -\hat a\cdot\hat b = -\cos(a - b)
CHSH：兩邊各換兩種角度，組合成 :: S = \left|E(a,b) - E(a,b') + E(a',b) + E(a',b')\right|
區域隱變數：每次的結果 \(A, A', B, B'\) 事先都定好是 ±1；\(B - B'\) 和 \(B + B'\) 必有一個是 0、另一個是 ±2 :: A(B - B') + A'(B + B') = \pm 2 \;\Rightarrow\; S \le 2
量子力學：取 \(a = 0^\circ,\ a' = 90^\circ,\ b = 45^\circ,\ b' = 135^\circ\)，四項大小都是 \(\cos 45^\circ\) :: S = 4\times\dfrac{1}{\sqrt2} = 2\sqrt2 \approx 2.83 > 2
實驗量到 \(2\sqrt2\)，所以「事先定好答案」的區域理論被排除。`,
  timetravel: S`
這一輪成功回到過去的機率是 \(p\)；成功的話有 \(q\) 的機率阻止爸媽相遇，下一輪的馬蒂就不存在 :: p_{\text{下一輪}} = 1 - (\text{回去了且阻止成功}) = 1 - q\,p
直接一輪一輪算：\(q = 1\) 時 \(p\) 在 1 → 0 → 1 → 0 之間跳，永遠不一致，這就是祖父悖論。
Deutsch 的要求：時光迴圈裡的狀態必須跟自己一致（不動點） :: p = 1 - qp
解出 :: p^* = \dfrac{1}{1 + q}
最極端的 \(q = 1\) :: p^* = \tfrac12
一半的世界回去了、一半沒回去，是兩者的混合態，不矛盾。
量子版的一般寫法：迴圈裡的狀態 \(\rho\) 跟外面互動 \(U\) 之後，把外面的部分積掉，要變回自己 :: \rho = \operatorname{Tr}_{\text{外}}\!\left[U(\rho_{\text{外}}\otimes\rho)U^\dagger\right]
Deutsch 證明這個方程永遠至少有一個解（不動點定理），所以任何悖論都有自洽的結局。`,
};

export default Object.fromEntries(Object.entries(D).map(([id, s]) => [id,
  s.trim().split('\n').map(l => { const i = l.indexOf(' :: '); return i < 0 ? [l, ''] : [l.slice(0, i), l.slice(i + 4)]; })]));
