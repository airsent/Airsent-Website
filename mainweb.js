// ── Device profiling: lighter rendering on phones ──
const IS_TOUCH = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
const IS_SMALL = window.matchMedia('(max-width: 600px)').matches;
const MAX_DPR  = IS_SMALL ? 1.5 : 2;

// PARTICLES
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);
const PARTICLE_COUNT = IS_SMALL ? 32 : 80;
const LINK_DIST = IS_SMALL ? 90 : 110;
for (let i=0; i<PARTICLE_COUNT; i++) particles.push({
 x: Math.random()*2000, y: Math.random()*900,
 vx: (Math.random()-.5)*.12, vy: (Math.random()-.5)*.12,
 r: Math.random()*1.4+.3, o: Math.random()*.4+.1
});
// Pause particles when the hero section scrolls out of view
let particlesVisible = true;
const heroSec = document.getElementById('hero');
if (heroSec && 'IntersectionObserver' in window) {
 new IntersectionObserver(es => { particlesVisible = es[0].isIntersecting; }).observe(heroSec);
}
(function draw() {
 requestAnimationFrame(draw);
 if (!particlesVisible || document.hidden) return;
 ctx.clearRect(0,0,W,H);
 particles.forEach(p => {
 p.x+=p.vx; p.y+=p.vy;
 if(p.x<0)p.x=W; if(p.x>W)p.x=0;
 if(p.y<0)p.y=H; if(p.y>H)p.y=0;
 ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
 ctx.fillStyle=`rgba(108,99,255,${p.o})`; ctx.fill();
 });
 particles.forEach((a,i) => particles.slice(i+1).forEach(b => {
 const d = Math.hypot(a.x-b.x, a.y-b.y);
 if(d<LINK_DIST) {
 ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
 ctx.strokeStyle=`rgba(108,99,255,${.05*(1-d/LINK_DIST)})`; ctx.lineWidth=.5; ctx.stroke();
 }
 }));
})();

// 3D FOOD PICKUP SCENE — same tower, wireframe human collecting the package
(function () {
 const sceneEl = document.getElementById('pickupScene');
 if (!sceneEl) return;
 const replayBtn = document.getElementById('pickupReplay');

 sceneEl.innerHTML = '';

 import('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js').then(THREE => {
 const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
 renderer.setClearColor(0x000000, 0);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
 renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 sceneEl.appendChild(renderer.domElement);

 const scene = new THREE.Scene();
 const camera = new THREE.PerspectiveCamera(34, sceneEl.clientWidth / sceneEl.clientHeight, 0.1, 100);
 camera.position.set(3.55, 2.98, 8.75);
 camera.lookAt(0.45, 2.18, 0.28);

 const black = new THREE.MeshStandardMaterial({ color: 0x111518, roughness: 0.34, metalness: 0.68 });
 const satin = new THREE.MeshStandardMaterial({ color: 0x252b30, roughness: 0.4, metalness: 0.62 });
 const highlight = new THREE.MeshStandardMaterial({ color: 0x596167, roughness: 0.22, metalness: 0.82 });
 const deepBlack = new THREE.MeshStandardMaterial({ color: 0x050708, roughness: 0.36, metalness: 0.76 });
 const blue = new THREE.MeshStandardMaterial({
 color: 0x08a8ff, emissive: 0x00a6ff, emissiveIntensity: 3.8, roughness: 0.16, metalness: 0.22
 });
 const wireMat = new THREE.LineBasicMaterial({
 color: 0x8178ff, transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending
 });
 // Flat silhouette human — unlit uniform white so every part seam vanishes
 // (lit materials show shading at capsule overlaps, which reads as robot joints)
 const humanSkinMat = new THREE.MeshBasicMaterial({ color: 0xeceef5 });

 function box(w, h, d, mat, x=0, y=0, z=0) {
 const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
 m.position.set(x, y, z);
 m.castShadow = true;
 m.receiveShadow = true;
 return m;
 }

 function cyl(r1, r2, h, mat, x=0, y=0, z=0, seg=48) {
 const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
 m.position.set(x, y, z);
 m.castShadow = true;
 m.receiveShadow = true;
 return m;
 }

 function makeCabinet() {
 const g = new THREE.Group();

 g.add(box(2.55, 4.65, 2.12, black, 0, 2.32, 0));
 g.add(box(2.36, 4.42, 0.055, satin, 0, 2.32, 1.09));
 g.add(box(0.08, 4.5, 2.02, satin, 1.32, 2.35, 0));
 g.add(box(2.82, 0.22, 2.42, highlight, 0, 4.75, 0));
 g.add(box(2.14, 0.035, 1.72, deepBlack, 0, 4.89, 0));

 [
 box(2.72, 0.045, 0.04, blue, 0, 4.94, 1.18),
 box(2.72, 0.045, 0.04, blue, 0, 4.94, -1.18),
 box(0.04, 0.045, 2.35, blue, -1.39, 4.94, 0),
 box(0.04, 0.045, 2.35, blue, 1.39, 4.94, 0),
 box(2.46, 0.04, 0.04, blue, 0, 0.12, 1.1)
 ].forEach(m => g.add(m));

 const h1 = box(0.76, 0.025, 0.035, blue, -0.23, 4.955, 0);
 const h2 = box(0.76, 0.025, 0.035, blue, 0.23, 4.955, 0);
 const h3 = box(0.82, 0.025, 0.035, blue, 0, 4.955, 0);
 h1.rotation.y = Math.PI/2;
 h2.rotation.y = Math.PI/2;
 g.add(h1, h2, h3);

 const topHatchLeftEdge = box(0.04, 0.055, 0.88, blue, -0.02, 4.955, 0);
 const topHatchRightEdge = box(0.04, 0.055, 0.88, blue, 0.02, 4.955, 0);
 g.add(topHatchLeftEdge, topHatchRightEdge);

 g.add(box(0.70, 0.025, 0.04, blue, 0, 2.67, 1.18));
 g.add(box(0.70, 0.025, 0.04, blue, 0, 1.97, 1.18));
 g.add(box(0.025, 0.70, 0.04, blue, -0.35, 2.32, 1.18));
 g.add(box(0.025, 0.70, 0.04, blue, 0.35, 2.32, 1.18));

 const bottomDoorLeft = box(0.33, 0.66, 0.065, satin, -0.17, 2.32, 1.20);
 const bottomDoorRight = box(0.33, 0.66, 0.065, satin, 0.17, 2.32, 1.20);
 g.add(bottomDoorLeft, bottomDoorRight);
 g.userData.bottomDoorLeft = bottomDoorLeft;
 g.userData.bottomDoorRight = bottomDoorRight;
 g.userData.bottomDoorLeftHomeX = bottomDoorLeft.position.x;
 g.userData.bottomDoorRightHomeX = bottomDoorRight.position.x;

 const button = cyl(0.055, 0.055, 0.035, blue, 0.42, 1.72, 1.17, 32);
 button.rotation.x = Math.PI/2;
 g.add(button);

 const cornerGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.7, 32);
 [[-1.34,2.35,1.08],[1.34,2.35,1.08],[-1.34,2.35,-1.08],[1.34,2.35,-1.08]].forEach(p => {
 const c = new THREE.Mesh(cornerGeo, highlight);
 c.position.set(...p);
 c.castShadow = true;
 c.receiveShadow = true;
 g.add(c);
 });

 // AIRSENT logo on the tower face: use the same image asset as the navbar,
 // cropped through texture coordinates so the full image background does not shrink it.
 const logoTex = new THREE.TextureLoader().load(
 'weblogo.png',
 (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; },
 undefined,
 (err) => { console.error('weblogo.png failed to load — make sure it is in the same folder as index.html', err); }
 );
 logoTex.colorSpace = THREE.SRGBColorSpace;
 logoTex.repeat.set(0.70, 0.18);
 logoTex.offset.set(0.15, 0.43);
 const logoMat = new THREE.MeshBasicMaterial({
 map: logoTex,
 transparent: true,
 depthWrite: false,
 opacity: 1.0
 });
 const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.30), logoMat);
 logoPlane.position.set(0, 3.82, 1.165);
 g.add(logoPlane);

 return g;
 }

 function smoothstep(t) {
 t = Math.max(0, Math.min(1, t));
 return t * t * (3 - 2 * t);
 }

 function line(points) {
 const geo = new THREE.BufferGeometry().setFromPoints(points);
 return new THREE.Line(geo, wireMat);
 }

 function updateLine(l, points) {
 l.geometry.dispose();
 l.geometry = new THREE.BufferGeometry().setFromPoints(points);
 }

 function makeHuman() {
 const g = new THREE.Group();
 const M = humanSkinMat;

 function capsule(r, len, x, y, z, sx=1, sy=1, sz=1) {
 const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 24), M);
 m.position.set(x, y, z);
 m.scale.set(sx, sy, sz);
 return m;
 }
 function ball(r, x, y, z, sx=1, sy=1, sz=1) {
 const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), M);
 m.position.set(x, y, z);
 m.scale.set(sx, sy, sz);
 return m;
 }

 // Core body — overlapping capsules blend into one smooth form
 const pelvis = ball(0.155, 0, 0.98, 0, 1.18, 0.78, 0.82);
 const torso  = capsule(0.16, 0.30, 0, 1.27, 0, 1.10, 1, 0.74);
 const chest  = ball(0.185, 0, 1.43, 0, 1.16, 0.84, 0.80);
 const neck   = capsule(0.05, 0.07, 0, 1.585, 0);
 const head   = ball(0.115, 0, 1.74, 0, 0.92, 1.12, 0.98);
 g.add(pelvis, torso, chest, neck, head);

 // Arms — pivot at shoulder + elbow so they can swing
 function arm(side) {
 const shoulder = new THREE.Group();
 shoulder.position.set(side * 0.215, 1.50, 0);
 shoulder.add(ball(0.07, 0, 0, 0));
 shoulder.add(capsule(0.052, 0.20, 0, -0.155, 0));
 const elbow = new THREE.Group();
 elbow.position.set(0, -0.30, 0);
 elbow.add(ball(0.046, 0, 0, 0)); // bridges the bend
 elbow.add(capsule(0.043, 0.19, 0, -0.135, 0));
 const handMesh = ball(0.05, 0, -0.27, 0, 0.9, 1.25, 0.55); // hand
 elbow.add(handMesh);
 const handAnchor = new THREE.Object3D(); // grip point just past the palm
 handAnchor.position.set(0, -0.30, 0.04);
 elbow.add(handAnchor);
 shoulder.add(elbow);
 g.add(shoulder);
 return { shoulder, elbow, handAnchor };
 }

 // Legs — pivot at hip + knee for the walk gait
 function leg(side) {
 const hip = new THREE.Group();
 hip.position.set(side * 0.10, 0.96, 0);
 hip.add(capsule(0.072, 0.26, 0, -0.185, 0));
 const knee = new THREE.Group();
 knee.position.set(0, -0.42, 0);
 knee.add(ball(0.060, 0, 0, 0)); // bridges the bend
 knee.add(capsule(0.055, 0.26, 0, -0.175, 0));
 knee.add(ball(0.062, 0, -0.40, 0.045, 0.95, 0.55, 1.7)); // foot
 hip.add(knee);
 g.add(hip);
 return { hip, knee };
 }

 const L = arm(-1), R = arm(1);
 const LL = leg(-1), RL = leg(1);

 g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });

 g.userData = {
 lShoulder: L.shoulder, rShoulder: R.shoulder,
 lElbow: L.elbow, rElbow: R.elbow,
 lHand: L.handAnchor, rHand: R.handAnchor,
 lHip: LL.hip, rHip: RL.hip,
 lKnee: LL.knee, rKnee: RL.knee,
 startX: -1.85, pickupX: -0.18
 };
 g.position.set(g.userData.startX, 0, 1.18);
 g.rotation.y = 1.62; // facing the tower
 g.scale.setScalar(1.06);
 return g;
 }

 const cabinet = makeCabinet();
 cabinet.scale.setScalar(0.72);
 cabinet.position.set(0.60, -0.18, 0);
 scene.add(cabinet);

 const bayY = 2.32 * 0.72 - 0.18;
 const bayZ = 1.20 * 0.72 + 0.16;
 const bayX = 0.60;

 // ── Real hero drone (with landing legs) ported into the pickup scene ──
 const rotorDiscMat = new THREE.MeshBasicMaterial({ color: 0xdcecff, transparent: true, opacity: 0.11, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
 const rotorBladeMat = new THREE.MeshBasicMaterial({ color: 0xb8c8d6, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
 const rotorRingMat = new THREE.MeshBasicMaterial({ color: 0x71d8ff, transparent: true, opacity: 0.23, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });

 function makeBladeGeometry() {
 const shape = new THREE.Shape();
 const l = 1.18, w = 0.16;
 shape.moveTo(-l/2, 0);
 shape.bezierCurveTo(-l*0.38, w, l*0.36, w, l/2, 0);
 shape.bezierCurveTo( l*0.36, -w, -l*0.38, -w, -l/2, 0);
 return new THREE.ShapeGeometry(shape, 32);
 }
 function makeRotor(x, y, z, radius, dir) {
 const rg = new THREE.Group(); rg.position.set(x, y, z); rg.userData.dir = dir;
 const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 128), rotorDiscMat);
 disc.rotation.x = -Math.PI/2; disc.scale.z = 0.16; rg.add(disc);
 const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(radius*0.72, 96), rotorDiscMat.clone());
 innerDisc.material.opacity = 0.07; innerDisc.rotation.x = -Math.PI/2; innerDisc.position.y = 0.003; rg.add(innerDisc);
 const ring = new THREE.Mesh(new THREE.TorusGeometry(radius*0.96, 0.006, 8, 128), rotorRingMat);
 ring.rotation.x = -Math.PI/2; ring.position.y = 0.006; rg.add(ring);
 const bladeGeo = makeBladeGeometry();
 for (let i=0; i<4; i++) {
 const blade = new THREE.Mesh(bladeGeo, rotorBladeMat);
 blade.rotation.x = -Math.PI/2; blade.rotation.z = i*Math.PI/2; blade.position.y = 0.012 + i*0.001; rg.add(blade);
 }
 rg.add(cyl(radius*0.11, radius*0.11, 0.045, blue, 0, 0.035, 0, 32));
 return rg;
 }
 function armBetween(x1,y1,z1,x2,y2,z2,thickness,mat) {
 const dx=x2-x1, dz=z2-z1, len=Math.sqrt(dx*dx+dz*dz);
 const arm = box(len, thickness, thickness*1.35, mat, (x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
 arm.rotation.y = -Math.atan2(dz, dx);
 return arm;
 }
 function makeDrone() {
 const g = new THREE.Group();
 const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 24), black);
 body.scale.set(1.28, 0.34, 0.82); body.position.set(0, 0.18, 0); body.castShadow = true; g.add(body);
 const topShell = new THREE.Mesh(new THREE.SphereGeometry(0.54, 48, 18), highlight);
 topShell.scale.set(1.18, 0.24, 0.7); topShell.position.set(0.03, 0.36, -0.03); topShell.castShadow = true; g.add(topShell);
 const nose = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 16), satin);
 nose.scale.set(1.0, 0.46, 0.9); nose.position.set(0.66, 0.17, 0); nose.castShadow = true; g.add(nose);
 g.add(box(0.44, 0.035, 0.025, blue, -0.18, -0.05, 0.43));
 function addLeg(x) {
 const front = cyl(0.025, 0.025, 0.9, deepBlack, x, -0.55, 0.38, 16);
 front.rotation.z = x > 0 ? -0.33 : 0.33; front.rotation.x = 0.3;
 const back = cyl(0.025, 0.025, 0.9, deepBlack, x, -0.55, -0.38, 16);
 back.rotation.z = x > 0 ? -0.33 : 0.33; back.rotation.x = -0.3;
 const foot = cyl(0.026, 0.026, 0.92, deepBlack, x, -1.02, 0, 16);
 foot.rotation.x = Math.PI/2;
 g.add(front, back, foot);
 }
 addLeg(-0.58); addLeg(0.58);
 const motorPositions = [[-1.78,0.18,-0.94],[1.78,0.18,-0.94],[-1.78,0.04,0.94],[1.78,0.04,0.94]];
 const rotors = [];
 motorPositions.forEach(([x,y,z], i) => {
 const rootX = x*0.32, rootZ = z*0.32;
 g.add(armBetween(rootX, y, rootZ, x, y, z, 0.09, satin));
 g.add(armBetween(rootX, y+0.055, rootZ, x, y+0.055, z, 0.022, highlight));
 g.add(cyl(0.18, 0.18, 0.22, deepBlack, x, y, z, 56));
 g.add(cyl(0.21, 0.21, 0.045, highlight, x, y-0.1, z, 56));
 g.add(cyl(0.12, 0.12, 0.12, satin, x, y+0.16, z, 40));
 g.add(cyl(0.075, 0.075, 0.09, blue, x, y+0.27, z, 32));
 const rotor = makeRotor(x, y+0.34, z, 0.66, i%2===0 ? 1 : -1);
 rotors.push(rotor); g.add(rotor);
 });
 g.userData.rotors = rotors;
 return g;
 }
 const drone = makeDrone();
 drone.scale.setScalar(0.42);
 // Parked on the tower top — legs reach down ~0.43 to rest on the cabinet roof (~3.4)
 const droneParkY = 3.82;
 drone.position.set(bayX, droneParkY, 0);
 scene.add(drone);

 const packageBox = box(0.38, 0.38, 0.14, deepBlack, bayX, bayY, bayZ);
 const packageLight = box(0.26, 0.028, 0.024, blue, bayX, bayY - 0.07, bayZ + 0.08);
 scene.add(packageBox, packageLight);

 const human = makeHuman();
 scene.add(human);

 const floor = new THREE.Mesh(
 new THREE.PlaneGeometry(8, 8),
 new THREE.ShadowMaterial({ opacity: 0.18 })
 );
 floor.rotation.x = -Math.PI/2;
 floor.receiveShadow = true;
 scene.add(floor);

 scene.add(new THREE.AmbientLight(0xb8c7d8, 1.2));
 scene.add(new THREE.HemisphereLight(0xd9ecff, 0x11151a, 1.45));
 const key = new THREE.DirectionalLight(0xffffff, 4.8);
 key.position.set(3.8, 8.4, 6.2);
 key.castShadow = true;
 scene.add(key);
 const frontFill = new THREE.DirectionalLight(0xbfdfff, 2.7);
 frontFill.position.set(-3.6, 4.2, 7.2);
 scene.add(frontFill);
 const blueLight = new THREE.PointLight(0x009dff, 10, 10);
 blueLight.position.set(0, 3.7, 2.1);
 scene.add(blueLight);
 const humanLight = new THREE.PointLight(0x8178ff, 8, 8);
 humanLight.position.set(-0.75, 2.5, 2.2);
 scene.add(humanLight);

 const clock = new THREE.Clock();
 const _v = new THREE.Vector3();

 function setBottomBay(open) {
 const p = smoothstep(open);
 cabinet.userData.bottomDoorLeft.position.x = cabinet.userData.bottomDoorLeftHomeX - 0.30*p;
 cabinet.userData.bottomDoorRight.position.x = cabinet.userData.bottomDoorRightHomeX + 0.30*p;
 }

 let sceneVisible = true;
 let animStart = null;   // set when the scene first scrolls into view (+0.5s delay)
 if ('IntersectionObserver' in window) {
 sceneVisible = false;
 new IntersectionObserver(es => {
 const inView = es[0].isIntersecting;
 sceneVisible = inView;
 // First time it comes into view, schedule the animation to begin after 0.5s
 if (inView && animStart === null) {
 setTimeout(() => { animStart = clock.getElapsedTime(); }, 500);
 }

 if (replayBtn) {
 replayBtn.addEventListener('click', () => {
 animStart = clock.getElapsedTime();
 sceneVisible = true;
 });
 }
 }, { rootMargin: '0px 0px -10% 0px', threshold: 0.25 }).observe(sceneEl);
 }

 // Choreography timeline (fractions of one full loop)
 // Drone starts PARKED on the tower. As the human walks in, it lifts off
 // slowly and flies away. Then the human opens the bay and collects the box.
 // 0.00–0.40 human walks in │ 0.12–0.52 drone slow takeoff + fly away
 // 0.42–0.52 doors open │ 0.52–0.64 reach │ 0.64–0.72 grab │ 0.72–0.85 carry │ hold+reset
 function seg(c, a, b) { return smoothstep(Math.max(0, Math.min(1, (c - a) / (b - a)))); }

 const droneParkRestY = droneParkY;
 const droneFlyY = 12.0; // off-screen high

 function animate() {
 requestAnimationFrame(animate);
 if (!sceneVisible || document.hidden) return;
 // Hold on frame 0 until the start has been triggered (after scroll-in + delay)
 const elapsed = animStart === null ? 0 : (clock.getElapsedTime() - animStart);
 const cycle = (elapsed % 10.5) / 10.5;

 // ── Human phases ──
 const walkIn   = seg(cycle, 0.00, 0.40);
 const walking  = cycle < 0.40 ? 1 - seg(cycle, 0.32, 0.40) : 0;
 const doorOpen = seg(cycle, 0.42, 0.52) * (1 - seg(cycle, 0.90, 0.98));
 const reachOut = seg(cycle, 0.52, 0.64);
 const grab     = seg(cycle, 0.64, 0.72);
 const draw     = seg(cycle, 0.72, 0.85);
 const release  = seg(cycle, 0.94, 1.0);

 // ── Drone: parked, then slow lift-off + fly away (starts as human nears) ──
 const liftoff = seg(cycle, 0.12, 0.52);   // long, slow window
 drone.position.y = droneParkRestY + (droneFlyY - droneParkRestY) * liftoff;
 drone.position.x = bayX + 4.2 * liftoff * liftoff;   // ease outward to the right
 drone.position.z = -1.0 * liftoff;
 drone.rotation.z = -0.16 * seg(cycle, 0.18, 0.52);   // gentle bank once airborne
 drone.visible = cycle < 0.54;
 // rotors spin faster as it powers up for takeoff, idle slow while parked
 const spin = 0.10 + 0.85 * seg(cycle, 0.08, 0.20);
 if (drone.visible) drone.userData.rotors.forEach(r => { r.rotation.y += r.userData.dir * spin; });

 setBottomBay(doorOpen);

 const h = human.userData;

 // ── Body locomotion ──
 human.position.x = h.startX + (h.pickupX - h.startX) * walkIn;
 const stride = Math.sin(elapsed * 7.2);
 human.position.y = Math.abs(Math.cos(elapsed * 7.2)) * 0.035 * walking;
 human.rotation.y = 1.62;

 // ── Legs (walk gait) ──
 h.lHip.rotation.x = -0.55 * stride * walking;
 h.rHip.rotation.x =  0.55 * stride * walking;
 h.lKnee.rotation.x = Math.max(0,  stride) * 0.9 * walking;
 h.rKnee.rotation.x = Math.max(0, -stride) * 0.9 * walking;

 // ── Arms ──
 // Blend: walking counter-swing → reach forward → draw back holding box
 const extend = reachOut * (1 - draw);   // peak when fully reached, eases as drawn back
 const hold   = Math.max(grab * (1 - release), draw * (1 - release)); // holding the box

 // Shoulders: raise forward to reach, settle to a carry angle when holding
 const reachAngle = -1.35;   // arm forward/up toward bay
 const carryAngle = -0.85;   // forearm-up carry pose
 h.lShoulder.rotation.x =  0.45 * stride * walking + reachAngle * extend + carryAngle * (hold * (1 - extend));
 h.rShoulder.rotation.x = -0.45 * stride * walking + reachAngle * extend + carryAngle * (hold * (1 - extend));
 // Slight inward gather so hands meet at the box
 h.lShoulder.rotation.z =  0.10 * extend + 0.16 * hold;
 h.rShoulder.rotation.z = -0.10 * extend - 0.16 * hold;

 // Elbows: straighter on reach, bent on carry
 h.lElbow.rotation.x = -0.10 - 0.22 * walking - 0.10 * extend - 1.05 * hold;
 h.rElbow.rotation.x = -0.10 - 0.22 * walking - 0.10 * extend - 1.05 * hold;

 // ── Package: already inside → revealed when doors open → into hands → carried ──
 const handsActive = grab > 0.02 || draw > 0.02 || release < 1;
 packageBox.visible = (doorOpen > 0.2 && cycle < 0.92) || handsActive;
 packageLight.visible = packageBox.visible;

 if (packageBox.visible) {
 // Midpoint between the two hand anchors (world space)
 human.updateMatrixWorld();
 const lp = _v.set(0,0,0); h.lHand.getWorldPosition(lp);
 const handMid = lp.clone();
 h.rHand.getWorldPosition(_v); handMid.add(_v).multiplyScalar(0.5);
 // Nudge the cradle point slightly forward (+x, the body's facing) and down
 handMid.x += 0.12; handMid.y -= 0.04;

 // Box stays in bay until grab begins, then lerps to hands and follows them
 const toHands = smoothstep(Math.max(grab, draw));
 packageBox.position.set(
 bayX + (handMid.x - bayX) * toHands,
 bayY + (handMid.y - bayY) * toHands,
 bayZ + (handMid.z - bayZ) * toHands
 );
 packageBox.rotation.y = 0.0 + 0.10 * toHands;
 packageLight.position.set(packageBox.position.x, packageBox.position.y - 0.07, packageBox.position.z + 0.08);
 }

 renderer.render(scene, camera);
 }

 function onResize() {
 const w = sceneEl.clientWidth;
 const h = sceneEl.clientHeight;
 renderer.setSize(w, h);
 camera.aspect = w / h;
 camera.updateProjectionMatrix();
 }

 window.addEventListener('resize', onResize);
 animate();
 }).catch(err => {
 console.error(err);
 sceneEl.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#1ccfff;font-family:monospace;font-size:12px;letter-spacing:.12em;text-align:center;padding:24px;">PICKUP SCENE FAILED TO LOAD</div>';
 });
})();

// SCROLL — nav + scroll-driven hero (Apple-style)
(function () {
 const nav = document.getElementById('nav');
 const hero = document.getElementById('hero');
 const overlay = document.getElementById('heroOverlay');
 const hint = document.getElementById('heroScrollHint');
 const vizCenter = document.getElementById('heroVizCenter');

 function ss(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

 // Elements that stagger in as you scroll
 const layers = overlay ? [
 { sel: '.title-line-1', s: 0.11, e: 0.25 },
 { sel: '.title-line-2', s: 0.17, e: 0.31 },
 { sel: '.hero-sub', s: 0.24, e: 0.40 },
 { sel: '.hero-actions', s: 0.31, e: 0.47 },
 ].map(l => ({ ...l, el: overlay.querySelector(l.sel) })) : [];

 let targetP = 0, curP = 0;

 function readScroll() {
 const sy = window.scrollY;

 // Nav glass effect
 nav.classList.toggle('scrolled', sy > 60);

 if (!hero || !overlay) return;
 const maxScroll = Math.max(hero.offsetHeight - window.innerHeight, 1);
 targetP = Math.max(0, Math.min(1, sy / maxScroll));
 }

 function apply(p) {
 // Gradient backdrop fades in first
 const bgT = ss(Math.max(0, Math.min(1, (p - 0.02) / 0.12)));
 overlay.style.setProperty('--overlay-bg', bgT);

 // Staggered text elements slide up
 layers.forEach(({ el, s, e }) => {
 if (!el) return;
 const t = ss(Math.max(0, Math.min(1, (p - s) / (e - s))));
 el.style.opacity = t;
 el.style.transform = `translateY(${(1 - t) * 32}px)`;
 });

 // Drone drifts subtly right as text takes the stage (desktop only)
 if (vizCenter && !IS_SMALL) {
 const driftT = ss(Math.max(0, Math.min(1, (p - 0.08) / 0.44)));
 const maxDrift = window.innerWidth > 900 ? 320 : 22;
 vizCenter.style.transform = `translateX(${driftT * maxDrift}px)`;
 }

 // Enable pointer events once text is readable
 overlay.classList.toggle('revealed', p > 0.45);

 // Scroll hint fades out on first scroll
 if (hint) hint.style.opacity = Math.max(0, 1 - p * 14);
 }

 window.addEventListener('scroll', readScroll, { passive: true });
 readScroll();
 curP = targetP;
 apply(curP);

 // Inertia loop — eases toward the scroll target for a buttery scrub
 (function smoothLoop() {
 if (Math.abs(targetP - curP) > 0.0004) {
 curP += (targetP - curP) * 0.16;
 apply(curP);
 }
 requestAnimationFrame(smoothLoop);
 })();
})();

// REVEAL ON SCROLL
const ro = new IntersectionObserver(entries => entries.forEach(e => {
 if (e.isIntersecting) e.target.classList.add('show');
}), { threshold: .08 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// GLITCH
const gl = document.querySelectorAll('.title-line');
setInterval(() => {
 const e = gl[Math.floor(Math.random()*gl.length)];
 e.classList.add('glitch');
 setTimeout(() => e.classList.remove('glitch'), 150);
}, 3500);

// FORM SUBMIT
(function () {
 const form = document.getElementById('contactForm');
 const success = document.getElementById('formSuccess');
 if (!form || !success) return;

 form.addEventListener('submit', async e => {
 e.preventDefault();

 const submitBtn = form.querySelector('.btn-submit');
 const originalHtml = submitBtn ? submitBtn.innerHTML : '';
 if (submitBtn) {
 submitBtn.disabled = true;
 submitBtn.innerHTML = 'SENDING';
 }

 try {
 const formData = new FormData(form);
 const firstName = (formData.get('first_name') || '').trim();
 const lastName = (formData.get('last_name') || '').trim();
 const name = [firstName, lastName].filter(Boolean).join(' ') || 'Website visitor';
 formData.append('name', name);
 formData.append('from_name', name);

 const res = await fetch('https://api.web3forms.com/submit', {
 method: 'POST',
 body: formData
 });
 const result = await res.json();
 if (!res.ok || !result.success) throw new Error(result.message || 'Message failed');

 form.style.display = 'none';
 success.classList.add('show');
 form.reset();
 } catch (err) {
 console.error(err);
 alert('Message could not be sent. Please email team@airsent.tech directly.');
 if (submitBtn) {
 submitBtn.disabled = false;
 submitBtn.innerHTML = originalHtml;
 }
 }
 });
})();

// STATIC SLEEK 3D DRONE + LANDING TOWER
(function () {
 const sceneEl = document.getElementById('vizScene');
 if (!sceneEl) return;

 sceneEl.innerHTML = '';
 // background intentionally transparent — blends with site background

 import('https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js').then(THREE => {
 const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
 renderer.setClearColor(0x000000, 0);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
 renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 sceneEl.appendChild(renderer.domElement);

 const scene = new THREE.Scene();
 // No fog — background is now transparent

 const camera = new THREE.PerspectiveCamera(35, sceneEl.clientWidth / sceneEl.clientHeight, 0.1, 100);
 camera.position.set(4.7, 4.25, 10.8);
 camera.lookAt(0, 2.8, 0);

 // Frame the scene so the drone+tower fill the view on any aspect ratio
 function frameCamera() {
 const aspect = sceneEl.clientWidth / Math.max(sceneEl.clientHeight, 1);
 // portrait/narrow → pull closer + widen; landscape → default
 const t = Math.max(0, Math.min(1, (1.0 - aspect) / 0.7)); // 0 at square, 1 at very tall
 const dist = 1 + t * 0.14;           // up to 14% further (slightly smaller subject)
 camera.position.set(4.23 * dist, 3.83 * dist, 9.72 * dist);
 camera.fov = 35 + t * 6;             // widen FOV up to 41°
 camera.lookAt(0, 2.8 - t * 1.0, 0);  // portrait: look lower so subject sits higher
 camera.updateProjectionMatrix();
 }
 frameCamera();

 const black = new THREE.MeshStandardMaterial({ color: 0x111518, roughness: 0.34, metalness: 0.68 });
 const satin = new THREE.MeshStandardMaterial({ color: 0x252b30, roughness: 0.4, metalness: 0.62 });
 const highlight = new THREE.MeshStandardMaterial({ color: 0x596167, roughness: 0.22, metalness: 0.82 });
 const deepBlack = new THREE.MeshStandardMaterial({ color: 0x050708, roughness: 0.36, metalness: 0.76 });
 const blue = new THREE.MeshStandardMaterial({
 color: 0x08a8ff, emissive: 0x00a6ff, emissiveIntensity: 3.8, roughness: 0.16, metalness: 0.22
 });

 const rotorDiscMat = new THREE.MeshBasicMaterial({
 color: 0xdcecff, transparent: true, opacity: 0.11,
 side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
 });
 const rotorBladeMat = new THREE.MeshBasicMaterial({
 color: 0xb8c8d6, transparent: true, opacity: 0.22,
 side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
 });
 const rotorRingMat = new THREE.MeshBasicMaterial({
 color: 0x71d8ff, transparent: true, opacity: 0.23,
 side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
 });

 function box(w, h, d, mat, x=0, y=0, z=0) {
 const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
 m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
 }
 function cyl(r1, r2, h, mat, x=0, y=0, z=0, seg=48) {
 const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
 m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
 }

 function makeBladeGeometry() {
 const shape = new THREE.Shape();
 const l = 1.18, w = 0.16;
 shape.moveTo(-l/2, 0);
 shape.bezierCurveTo(-l*0.38, w, l*0.36, w, l/2, 0);
 shape.bezierCurveTo( l*0.36, -w, -l*0.38, -w, -l/2, 0);
 return new THREE.ShapeGeometry(shape, 32);
 }

 function makeRotor(x, y, z, radius, dir) {
 const g = new THREE.Group();
 g.position.set(x, y, z);
 g.userData.dir = dir;

 const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 128), rotorDiscMat);
 disc.rotation.x = -Math.PI/2; disc.scale.z = 0.16; g.add(disc);

 const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(radius*0.72, 96), rotorDiscMat.clone());
 innerDisc.material.opacity = 0.07;
 innerDisc.rotation.x = -Math.PI/2; innerDisc.position.y = 0.003; g.add(innerDisc);

 const ring = new THREE.Mesh(new THREE.TorusGeometry(radius*0.96, 0.006, 8, 128), rotorRingMat);
 ring.rotation.x = -Math.PI/2; ring.position.y = 0.006; g.add(ring);

 const bladeGeo = makeBladeGeometry();
 for (let i=0; i<4; i++) {
 const blade = new THREE.Mesh(bladeGeo, rotorBladeMat);
 blade.rotation.x = -Math.PI/2;
 blade.rotation.z = i*Math.PI/2;
 blade.position.y = 0.012 + i*0.001;
 g.add(blade);
 }
 const hubGlow = cyl(radius*0.11, radius*0.11, 0.045, blue, 0, 0.035, 0, 32);
 g.add(hubGlow);
 return g;
 }

 function makeCabinet() {
 const g = new THREE.Group();

 // Main body
 g.add(box(2.55, 4.65, 2.12, black, 0, 2.32, 0));
 g.add(box(2.36, 4.42, 0.055, satin, 0, 2.32, 1.09));
 g.add(box(0.08, 4.5, 2.02, satin, 1.32, 2.35, 0));
 g.add(box(2.82, 0.22, 2.42, highlight, 0, 4.75, 0));
 g.add(box(2.14, 0.035,1.72, deepBlack, 0, 4.89, 0));

 // Top hatch blue edges
 [
 box(2.72, 0.045, 0.04, blue, 0, 4.94, 1.18),
 box(2.72, 0.045, 0.04, blue, 0, 4.94, -1.18),
 box(0.04, 0.045, 2.35, blue, -1.39, 4.94, 0),
 box(0.04, 0.045, 2.35, blue, 1.39, 4.94, 0),
 box(2.46, 0.04, 0.04, blue, 0, 0.12, 1.1)
 ].forEach(m => g.add(m));

 const h1 = box(0.76, 0.025, 0.035, blue, -0.23, 4.955, 0);
 const h2 = box(0.76, 0.025, 0.035, blue, 0.23, 4.955, 0);
 const h3 = box(0.82, 0.025, 0.035, blue, 0, 4.955, 0);
 h1.rotation.y = Math.PI/2;
 h2.rotation.y = Math.PI/2;
 g.add(h1, h2, h3);

 // Top hatch split panels (animated)
 const topHatchLeftEdge = box(0.04, 0.055, 0.88, blue, -0.02, 4.955, 0);
 const topHatchRightEdge = box(0.04, 0.055, 0.88, blue, 0.02, 4.955, 0);
 g.add(topHatchLeftEdge, topHatchRightEdge);
 g.userData.topHatchLeftEdge = topHatchLeftEdge;
 g.userData.topHatchRightEdge = topHatchRightEdge;
 g.userData.topHatchLeftEdgeHomeX = topHatchLeftEdge.position.x;
 g.userData.topHatchRightEdgeHomeX = topHatchRightEdge.position.x;

 // RECEIVING BAY
 g.add(box(0.70, 0.025, 0.04, blue, 0, 2.67, 1.18));
 g.add(box(0.70, 0.025, 0.04, blue, 0, 1.97, 1.18));
 g.add(box(0.025, 0.70, 0.04, blue, -0.35, 2.32, 1.18));
 g.add(box(0.025, 0.70, 0.04, blue, 0.35, 2.32, 1.18));

 // Bay doors (split, animate open/close)
 const bottomDoorLeft = box(0.33, 0.66, 0.065, satin, -0.17, 2.32, 1.20);
 const bottomDoorRight = box(0.33, 0.66, 0.065, satin, 0.17, 2.32, 1.20);
 g.add(bottomDoorLeft, bottomDoorRight);
 g.userData.bottomDoorLeft = bottomDoorLeft;
 g.userData.bottomDoorRight = bottomDoorRight;
 g.userData.bottomDoorLeftHomeX = bottomDoorLeft.position.x;
 g.userData.bottomDoorRightHomeX = bottomDoorRight.position.x;

 // Button below bay
 const button = cyl(0.055, 0.055, 0.035, blue, 0.42, 1.72, 1.17, 32);
 button.rotation.x = Math.PI/2;
 g.add(button);

 // Corner pillars
 const cornerGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.7, 32);
 [[-1.34,2.35,1.08],[1.34,2.35,1.08],[-1.34,2.35,-1.08],[1.34,2.35,-1.08]].forEach(p => {
 const c = new THREE.Mesh(cornerGeo, highlight);
 c.position.set(...p); c.castShadow = true; c.receiveShadow = true; g.add(c);
 });

 // AIRSENT logo on the tower face: use the same image asset as the navbar,
 // cropped through texture coordinates so the full image background does not shrink it.
 const logoTex = new THREE.TextureLoader().load(
 'weblogo.png',
 (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; },
 undefined,
 (err) => { console.error('weblogo.png failed to load — make sure it is in the same folder as index.html', err); }
 );
 logoTex.colorSpace = THREE.SRGBColorSpace;
 logoTex.repeat.set(0.70, 0.18);
 logoTex.offset.set(0.15, 0.43);
 const logoMat = new THREE.MeshBasicMaterial({
 map: logoTex,
 transparent: true,
 depthWrite: false,
 opacity: 1.0
 });
 const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.30), logoMat);
 logoPlane.position.set(0, 3.82, 1.165);
 g.add(logoPlane);

 return g;
 }

 function armBetween(x1,y1,z1,x2,y2,z2,thickness,mat) {
 const dx=x2-x1, dz=z2-z1, len=Math.sqrt(dx*dx+dz*dz);
 const arm = box(len, thickness, thickness*1.35, mat, (x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
 arm.rotation.y = -Math.atan2(dz, dx);
 return arm;
 }

 function makeDrone() {
 const g = new THREE.Group();

 const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 24), black);
 body.scale.set(1.28, 0.34, 0.82); body.position.set(0, 0.18, 0); body.castShadow = true; g.add(body);

 const topShell = new THREE.Mesh(new THREE.SphereGeometry(0.54, 48, 18), highlight);
 topShell.scale.set(1.18, 0.24, 0.7); topShell.position.set(0.03, 0.36, -0.03); topShell.castShadow = true; g.add(topShell);

 const nose = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 16), satin);
 nose.scale.set(1.0, 0.46, 0.9); nose.position.set(0.66, 0.17, 0); nose.castShadow = true; g.add(nose);

 const bodyLight = box(0.44, 0.035, 0.025, blue, -0.18, -0.05, 0.43); g.add(bodyLight);

 const payload = box(0.58, 0.58, 0.58, deepBlack, 0, -0.56, 0);
 const payloadLight = box(0.28, 0.04, 0.03, blue, 0, -0.58, 0.305);
 g.add(payload, payloadLight);
 g.userData.payload = payload;
 g.userData.payloadLight = payloadLight;
 g.userData.payloadHomeY = -0.56;

 function addLeg(x) {
 const front = cyl(0.025, 0.025, 0.9, deepBlack, x, -0.55, 0.38, 16);
 front.rotation.z = x > 0 ? -0.33 : 0.33; front.rotation.x = 0.3;
 const back = cyl(0.025, 0.025, 0.9, deepBlack, x, -0.55, -0.38, 16);
 back.rotation.z = x > 0 ? -0.33 : 0.33; back.rotation.x = -0.3;
 const foot = cyl(0.026, 0.026, 0.92, deepBlack, x, -1.02, 0, 16);
 foot.rotation.x = Math.PI/2;
 g.add(front, back, foot);
 }
 addLeg(-0.58); addLeg(0.58);

 const motorPositions = [
 [-1.78, 0.18, -0.94],[1.78, 0.18, -0.94],
 [-1.78, 0.04, 0.94],[1.78, 0.04, 0.94]
 ];
 const rotors = [];
 motorPositions.forEach(([x,y,z], i) => {
 const rootX = x*0.32, rootZ = z*0.32;
 g.add(armBetween(rootX, y, rootZ, x, y, z, 0.09, satin));
 g.add(armBetween(rootX, y+0.055, rootZ, x, y+0.055, z, 0.022, highlight));
 g.add(cyl(0.18, 0.18, 0.22, deepBlack, x, y, z, 56));
 g.add(cyl(0.21, 0.21, 0.045, highlight, x, y-0.1, z, 56));
 g.add(cyl(0.12, 0.12, 0.12, satin, x, y+0.16, z, 40));
 g.add(cyl(0.075, 0.075, 0.09, blue, x, y+0.27, z, 32));
 const rotor = makeRotor(x, y+0.34, z, 0.66, i%2===0 ? 1 : -1);
 rotors.push(rotor); g.add(rotor);
 });
 g.userData.rotors = rotors;
 return g;
 }

 const cabinet = makeCabinet();
 cabinet.scale.setScalar(0.72);
 cabinet.position.set(0, -0.18, 0);
 scene.add(cabinet);

 const drone = makeDrone();
 drone.scale.setScalar(IS_SMALL ? 0.74 : 0.80);
 drone.position.set(0, 4.98, 0.08);
 drone.rotation.y = -0.08;
 scene.add(drone);

 // Bay package: visible in front of the lower receiving bay door
 const bayY = 2.32 * 0.72 - 0.18;
 const bayZ = 1.20 * 0.72 + 0.16;

 const bayPkg = box(0.38, 0.38, 0.14, deepBlack, 0, bayY, bayZ);
 const bayPkgLight = box(0.26, 0.028, 0.024, blue, 0, bayY - 0.07, bayZ + 0.08);
 bayPkg.visible = false;
 bayPkgLight.visible = false;
 scene.add(bayPkg);
 scene.add(bayPkgLight);

 const floor = new THREE.Mesh(
 new THREE.PlaneGeometry(9, 9),
 new THREE.ShadowMaterial({ opacity: 0.2 })
 );
 floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

 scene.add(new THREE.AmbientLight(0xb8c7d8, 1.35));
 scene.add(new THREE.HemisphereLight(0xd9ecff, 0x11151a, 1.65));

 const key = new THREE.DirectionalLight(0xffffff, 5.8);
 key.position.set(3.8, 8.4, 6.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key);

 const frontFill = new THREE.DirectionalLight(0xbfdfff, 3.4);
 frontFill.position.set(-3.6, 4.2, 7.2); scene.add(frontFill);

 const blueLight = new THREE.PointLight(0x009dff, 12, 12);
 blueLight.position.set(0, 4.9, 1.8); scene.add(blueLight);

 const droneLight = new THREE.PointLight(0x9fdcff, 7, 7);
 droneLight.position.set(0, 5.2, 2.4); scene.add(droneLight);

 const rim = new THREE.PointLight(0x66baff, 8, 12);
 rim.position.set(-3.4, 4.6, -3.4); scene.add(rim);

 const clock = new THREE.Clock();

 function smoothstep(t) { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); }
 function lerp(a, b, t) { return a + (b-a)*t; }

 function setTopHatch(open) {
 const p = smoothstep(open);
 cabinet.userData.topHatchLeftEdge.position.x = cabinet.userData.topHatchLeftEdgeHomeX - 0.42*p;
 cabinet.userData.topHatchRightEdge.position.x = cabinet.userData.topHatchRightEdgeHomeX + 0.42*p;
 }

 function setBottomBay(open) {
 const p = smoothstep(open);
 cabinet.userData.bottomDoorLeft.position.x = cabinet.userData.bottomDoorLeftHomeX - 0.30*p;
 cabinet.userData.bottomDoorRight.position.x = cabinet.userData.bottomDoorRightHomeX + 0.30*p;
 }

 let heroVisible = true;
 if ('IntersectionObserver' in window) {
 new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(sceneEl);
 }

 function animate() {
 requestAnimationFrame(animate);
 if (!heroVisible || document.hidden) return;

 const elapsed = clock.getElapsedTime();
 const cycle = (elapsed % 10.5) / 10.5;

 const hoverHigh = 4.98;
 const landingY = 4.28;

 let droneY = hoverHigh;
 let payloadY = drone.userData.payloadHomeY;
 let payloadVis = true;
 let topOpen = 0;
 let bottomOpen = 0;
 let showBayPkg = false;

 if (cycle < 0.16) {
 // Hovering high
 droneY = hoverHigh + Math.sin(elapsed * 2.2) * 0.035;

 } else if (cycle < 0.34) {
 // Descending to base
 const p = smoothstep((cycle - 0.16) / 0.18);
 droneY = lerp(hoverHigh, landingY, p);

 } else if (cycle < 0.44) {
 // Landed — top hatch opens
 droneY = landingY + Math.sin(elapsed * 5.5) * 0.01;
 topOpen = smoothstep((cycle - 0.34) / 0.10);

 } else if (cycle < 0.58) {
 // Package drops down through top hatch into cabinet
 const p = smoothstep((cycle - 0.44) / 0.14);
 droneY = landingY;
 topOpen = 1;
 payloadY = lerp(drone.userData.payloadHomeY, -1.05, p);
 payloadVis = p < 0.68;

 } else if (cycle < 0.72) {
 // Top hatch closes, drone still on base
 const p = smoothstep((cycle - 0.58) / 0.14);
 droneY = landingY;
 topOpen = 1 - p;
 payloadVis = false;

 } else if (cycle < 0.84) {
 // Drone lifts off — bay door opens — package slides out
 const p = smoothstep((cycle - 0.72) / 0.12);
 droneY = lerp(landingY, hoverHigh, p);
 payloadVis = false;
 bottomOpen = p;
 showBayPkg = p > 0.40;

 } else {
 // Hovering high — package fully out — door slowly closes
 droneY = hoverHigh + Math.sin(elapsed * 2.2) * 0.025;
 payloadVis = false;
 showBayPkg = true;
 bottomOpen = cycle < 0.96 ? 1 : 1 - smoothstep((cycle - 0.96) / 0.04);
 }

 // Drone
 drone.position.y = droneY;
 drone.position.x = Math.sin(elapsed * 0.75) * 0.025;
 drone.rotation.z = Math.sin(elapsed * 1.1) * 0.01;

 // Payload on drone
 drone.userData.payload.position.y = payloadY;
 drone.userData.payloadLight.position.y = payloadY - 0.02;
 drone.userData.payload.visible = payloadVis;
 drone.userData.payloadLight.visible = payloadVis;

 // Bay package
 bayPkg.visible = showBayPkg;
 bayPkgLight.visible = showBayPkg;

 // Hatches
 setTopHatch(topOpen);
 setBottomBay(bottomOpen);

 // Rotors
 drone.userData.rotors.forEach((rotor, i) => {
 rotor.rotation.y += 0.9 * rotor.userData.dir;
 rotor.children.forEach(child => {
 if (child.material && child.material.transparent) {
 child.material.opacity = i%2===0
 ? 0.12 + Math.sin(elapsed*20)*0.025
 : 0.14 + Math.cos(elapsed*20)*0.025;
 }
 });
 });

 renderer.render(scene, camera);
 }

 function onResize() {
 const w = sceneEl.clientWidth, h = sceneEl.clientHeight;
 renderer.setSize(w, h); camera.aspect = w/h; frameCamera();
 }
 window.addEventListener('resize', onResize);
 animate();

 }).catch(err => {
 console.error(err);
 sceneEl.innerHTML = '<div style="position:absolute;inset:0;display:grid;place-items:center;color:#1ccfff;font-family:monospace;font-size:12px;letter-spacing:.12em;text-align:center;padding:24px;">3D SCENE FAILED TO LOAD</div>';
 });
})();
// SCROLLSPY — highlight the nav link for the section in view
(function () {
 const links = document.querySelectorAll('.nav-links a');
 if (!links.length) return;
 const spy = new IntersectionObserver(entries => entries.forEach(e => {
 if (!e.isIntersecting) return;
 links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
 }), { rootMargin: '-40% 0px -55% 0px' });
 ['what', 'usecase', 'vision', 'gcs', 'contact'].forEach(id => {
 const s = document.getElementById(id);
 if (s) spy.observe(s);
 });
})();

// CURSOR GLOW + 3D TILT — use-case cards follow the pointer
document.querySelectorAll('.app-card').forEach(card => {
 card.addEventListener('pointermove', e => {
 const r = card.getBoundingClientRect();
 const px = (e.clientX - r.left) / r.width;
 const py = (e.clientY - r.top) / r.height;
 card.style.setProperty('--mx', (px * 100) + '%');
 card.style.setProperty('--my', (py * 100) + '%');
 card.style.transform = `translateY(-6px) perspective(700px) rotateX(${(py - 0.5) * -5}deg) rotateY(${(px - 0.5) * 5}deg)`;
 });
 card.addEventListener('pointerleave', () => {
 card.style.transform = '';
 });
});

// SCROLL PROGRESS BAR — thin gradient line at the very top
(function () {
 const bar = document.createElement('div');
 bar.className = 'scroll-progress';
 document.body.appendChild(bar);
 function update() {
 const max = document.documentElement.scrollHeight - window.innerHeight;
 bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
 }
 window.addEventListener('scroll', update, { passive: true });
 window.addEventListener('resize', update);
 update();
})();

// MOBILE MENU — hamburger toggle + slide-in panel
(function () {
 const toggle = document.getElementById('navToggle');
 const menu = document.getElementById('mobileMenu');
 if (!toggle || !menu) return;

 function setOpen(open) {
 toggle.classList.toggle('open', open);
 menu.classList.toggle('open', open);
 document.body.classList.toggle('menu-open', open);
 toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
 }

 toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
 // Close when a link is tapped
 menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
 // Close on Escape
 document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
 // Auto-close if resized up to desktop
 window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
})();

// DELIVERY MAP — start the drone/car race only when it scrolls into view
(function () {
 const map = document.querySelector('.delivery-map');
 const carMotion = document.getElementById('carMotion');
 const droneMotion = document.getElementById('droneMotion');
 const replayBtn = document.getElementById('routeReplay');
 if (!map || !carMotion || !droneMotion) return;

 let started = false;
 let mapVisible = false;
 let startTimer = null;

 function resetRoute() {
 try {
 carMotion.endElement();
 droneMotion.endElement();
 } catch (_) {}
 started = false;
 }

 function replayRoute() {
 try {
 carMotion.endElement();
 droneMotion.endElement();
 } catch (_) {}
 try {
 carMotion.beginElement();
 droneMotion.beginElement();
 started = true;
 } catch (_) {}
 }

 const io = new IntersectionObserver(entries => {
 entries.forEach(e => {
 mapVisible = e.isIntersecting;
 if (!mapVisible) {
 if (startTimer) {
 clearTimeout(startTimer);
 startTimer = null;
 }
 resetRoute();
 return;
 }
 if (mapVisible && !started && !startTimer) {
 startTimer = window.setTimeout(() => {
 startTimer = null;
 if (!mapVisible || started || document.hidden) return;
 started = true;
 // Begin both on the same tick so they stay perfectly in sync.
 replayRoute();
 }, 500);
 }
 });
 }, { threshold: 0.55 });
 io.observe(map);

 if (replayBtn) replayBtn.addEventListener('click', replayRoute);
})();
(function () {
 const gcsTabs = document.querySelectorAll('.gcs-tab');
 const sidebar = document.querySelector('.gcs-sidebar');
 const scrollIndicator = document.querySelector('.gcs-scroll-indicator');
 const image = document.getElementById('gcsImage');
 const title = document.getElementById('gcsTitle');
 const desc = document.getElementById('gcsDesc');
 if (!gcsTabs.length || !image || !title || !desc) return;

 function updateGcsScrollIndicator() {
 if (!sidebar || !scrollIndicator) return;
 const maxScroll = sidebar.scrollWidth - sidebar.clientWidth;
 const maxThumb = scrollIndicator.clientWidth - 16;
 const x = maxScroll > 0 ? (sidebar.scrollLeft / maxScroll) * maxThumb : 0;
 scrollIndicator.style.setProperty('--gcs-scroll', `${x}px`);
 }

 if (sidebar) {
 sidebar.addEventListener('scroll', updateGcsScrollIndicator, { passive: true });
 window.addEventListener('resize', updateGcsScrollIndicator);
 updateGcsScrollIndicator();
 }

 gcsTabs.forEach(tab => {
  tab.addEventListener('click', () => {
   if (tab.classList.contains('active')) return;

   gcsTabs.forEach(t => t.classList.remove('active'));
   tab.classList.add('active');

   image.classList.add('is-switching');
   window.setTimeout(() => {
    image.src = tab.dataset.img;
    image.alt = tab.dataset.alt || `Airsent ${tab.dataset.title} screen`;
    title.textContent = tab.dataset.title;
    desc.textContent = tab.dataset.desc;
    image.classList.remove('is-switching');
   }, 120);
  });
 });
})();