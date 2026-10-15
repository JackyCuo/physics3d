# 物理 3D 實驗室

59 個物理現象與方程式的互動 3D 預覽，分經典物理、理論物理、量子力學三區。每個主題有可旋轉的 3D 場景、方程式、參數滑桿與即時數值。手機、平板、桌機都能用。

**線上版：** https://kuoyoyo.github.io/physics3d/

純靜態網頁，沒有建置步驟。本機執行：

```sh
python3 -m http.server 8000   # 開 http://localhost:8000
node check.mjs                # 公式檢查
```

CuoYo 設計、Opus 5.5 製作。

## 第三方元件（皆在 `vendor/`）
- [three.js](https://threejs.org/) r170 — MIT
- [KaTeX](https://katex.org/) 0.16.11 — MIT
- [Geist / Geist Mono](https://vercel.com/font) 字型 — SIL Open Font License 1.1
