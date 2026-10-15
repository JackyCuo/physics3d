// 《JoJo 的奇妙冒險》惡搞角色（只是外觀）：原點在腳底，臉朝 +z；g.face 是 U.face
export function dio(U, THREE) {
  const g = new THREE.Group(), gold = U.mat(0xf2c230, { rough: 0.5 });
  const body = U.cyl(0.32, 0.42, 1.55, gold); body.position.y = 0.78;
  const head = U.sphere(0.36, U.mat(0xf1d2b3, { rough: 0.6 })); head.position.y = 1.92;
  const face = U.face(0.36); face.position.y = 1.92;
  const hair = U.mesh(new THREE.SphereGeometry(0.39, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.38), U.mat(0xffe066, { rough: 0.4 })); hair.position.y = 1.92;
  const band = U.box(0.18, 0.12, 0.05, U.mat(0x3fbf5f)); band.position.set(0, 2.2, 0.25);   // 綠色愛心頭帶（簡化成一塊）
  g.add(body, head, face, hair, band); g.face = face;
  return g;
}
export function pucci(U, THREE) {
  const g = new THREE.Group();
  const robe = U.cyl(0.45, 1, 2.8, U.mat(0x15151c, { rough: 0.7 })); robe.position.y = 1.4;
  const collar = U.mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 24), U.mat(0xf2f4f8)); collar.rotation.x = Math.PI / 2; collar.position.y = 2.82;
  const crossV = U.box(0.12, 0.7, 0.05, U.glow(0xf2f4f8)), crossH = U.box(0.45, 0.12, 0.05, U.glow(0xf2f4f8));
  crossV.position.set(0, 1.9, 0.66); crossH.position.set(0, 2.05, 0.66);
  const head = U.sphere(0.5, U.mat(0x9a6a4a, { rough: 0.6 })); head.position.y = 3.35;
  const face = U.face(0.5); face.position.y = 3.35;
  const hair = U.mesh(new THREE.SphereGeometry(0.53, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.35), U.mat(0xe8e8e8, { rough: 0.8 })); hair.position.y = 3.35;
  g.add(robe, collar, crossV, crossH, head, face, hair); g.face = face;
  const bead = U.mat(0x3a3a44);   // 頭頂的辮子：三排小珠
  for (const lat of [-0.22, 0, 0.22]) for (let k = 0; k < 5; k++) {
    const a = -0.9 + k * 0.45, rr = Math.sqrt(0.53 ** 2 - lat * lat), b = U.sphere(0.06, bead);
    b.position.set(lat, 3.35 + rr * Math.cos(a), rr * Math.sin(a)); g.add(b);
  }
  return g;
}
export function jotaro(U, THREE) {
  const g = new THREE.Group(), coat = U.mat(0x1a1d2a, { rough: 0.7 });
  const body = U.cyl(0.38, 0.5, 1.9, coat); body.position.y = 0.95;
  const head = U.sphere(0.36, U.mat(0xf1d2b3, { rough: 0.6 })); head.position.y = 2.2;
  const face = U.face(0.36); face.position.y = 2.2;
  const cap = U.cyl(0.38, 0.38, 0.3, coat); cap.position.y = 2.48;
  const brim = U.cyl(0.5, 0.5, 0.04, coat); brim.position.set(0, 2.36, 0.12);
  const chain = U.box(0.04, 0.8, 0.04, U.mat(0xf2c230, { metal: 0.8 })); chain.position.set(0.3, 1.4, 0.36);
  g.add(body, head, face, cap, brim, chain); g.face = face;
  return g;
}
// 壓路機（ロードローラー）：底部在 y = 0，x 約 −1.3～1.55（長 2.85），滾筒朝 +x
export function roller(U, THREE) {
  const g = new THREE.Group(), yel = U.mat(0xf2c230, { rough: 0.5 });
  const drum = U.cyl(0.65, 0.65, 1.8, U.mat(0x8a8f99, { metal: 0.8, rough: 0.3 })); drum.rotation.x = Math.PI / 2; drum.position.set(0.9, 0.65, 0);
  const body = U.box(1.8, 0.9, 1.5, yel); body.position.set(-0.4, 0.75, 0);
  const cabin = U.box(0.8, 0.8, 1.1, yel); cabin.position.set(-0.6, 1.6, 0);
  const text = U.label('ROAD ROLLER', { size: 0.22, color: '#111' }); text.position.set(-0.4, 0.75, 0.8);
  g.add(drum, body, cabin, text);
  return g;
}
// 傑洛·齊貝林（第七部《飆馬野郎》）：綠大衣、帽子、金色辮子
export function gyro(U, THREE) {
  const g = new THREE.Group(), coat = U.mat(0x3d5a3a, { rough: 0.7 });
  const body = U.cyl(0.36, 0.48, 1.7, coat); body.position.y = 0.85;
  const head = U.sphere(0.34, U.mat(0xf1d2b3, { rough: 0.6 })); head.position.y = 2;
  const face = U.face(0.34); face.position.y = 2;
  const hat = U.cyl(0.3, 0.36, 0.4, U.mat(0x2a3a2a)); hat.position.y = 2.42;
  const brim = U.cyl(0.62, 0.62, 0.04, U.mat(0x2a3a2a)); brim.position.y = 2.24;
  const hair = U.cyl(0.08, 0.05, 0.9, U.mat(0xffe066)); hair.position.set(0, 1.6, -0.3);
  g.add(body, head, face, hat, brim, hair); g.face = face;
  return g;
}
// 傑洛的鋼球：球面上幾條溝紋，看得出在轉
export function steelBall(U, THREE, r = 1.1) {
  const g = new THREE.Group();
  g.add(U.sphere(r, U.mat(0xc8ccd4, { metal: 0.95, rough: 0.2 })));
  for (const a of [0, Math.PI / 3, 2 * Math.PI / 3]) { const t = U.mesh(new THREE.TorusGeometry(r * 1.01, r * 0.036, 6, 48), U.mat(0x555a66, { metal: 0.6 })); t.rotation.y = Math.PI / 2; t.rotation.x = a; g.add(t); }
  return g;
}
