/**
 * محاكي الشمس والأرض والقمر المتقدم
 * Advanced Sun-Earth-Moon Celestial & Eclipse Simulator
 * Features:
 * - 3D Celestial mechanics with 5.14° lunar orbital inclination and nodal line
 * - Accurate Solar & Lunar Eclipse simulation with Umbra & Penumbra shadow cones
 * - Blood Moon (خسوف القمر الدموي) atmospheric Rayleigh scattering simulation
 * - Solar Eclipse corona reveal in Earth Observer mode
 * - Observer Hemisphere & Latitude support (Mecca, Cairo, Equator, Sydney)
 * - Lunar Libration (تمايل القمر) simulation
 * - Hijri calendar & traditional Arabic phase nomenclature
 * - Realistic vs Schematic scale toggling
 * - Procedural Earth (Day/Night city lights), Clouds, Moon maria & craters, and Sun corona
 */

// ==========================================
// 1. الثوابت الرياضية والفلكية (Constants)
// ==========================================
const TAU = Math.PI * 2;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const SYNODIC_MONTH = 29.530588; // الشهر القمري باليوم
const SIDEREAL_YEAR = 365.25636;  // السنة باليوم
const EARTH_AXIAL_TILT = 23.44 * DEG2RAD; // ميل محور الأرض
const MOON_ORBIT_INCLINATION = 5.14 * DEG2RAD; // ميلان مدار القمر

// مقاييس العرض التوضيحية
const SCALE_SCHEMATIC = {
  earthOrbitRadius: 36,
  moonOrbitRadius: 6.2,
  earthRadius: 1.6,
  cloudsRadius: 1.64,
  moonRadius: 0.46,
  sunRadius: 6.5,
  name: 'توضيحي'
};

// مقاييس شبه واقعية للمقارنة
const SCALE_REALISTIC = {
  earthOrbitRadius: 75,
  moonOrbitRadius: 18.0,
  earthRadius: 1.2,
  cloudsRadius: 1.23,
  moonRadius: 0.33,
  sunRadius: 7.0,
  name: 'واقعي نسبي'
};

let currentScale = SCALE_SCHEMATIC;

// سرعات المحاكاة
const SPEEDS = [
  { val: 1 / 86400, label: 'الزمن الحقيقي' },
  { val: 1 / 24, label: 'ساعة / ثانية' },
  { val: 0.25, label: '6 ساعات / ثانية' },
  { val: 1.0, label: 'يوم / ثانية' },
  { val: 3.0, label: '3 أيام / ثانية' },
  { val: 7.0, label: 'أسبوع / ثانية' },
  { val: SYNODIC_MONTH / 3, label: 'شهر في 3 ثوانٍ' }
];

// تسميات الأطوار العربية الرسمية والتراثية
const PHASES = [
  { name: 'المحاق (ولادة القمر)', trad: 'ليلة السَّرَر والفَحْم', icon: '🌑', cres: 'مستحيلة (محاق)' },
  { name: 'الهلال المتزايد', trad: 'ليالي الغُرَر والنَّفَل', icon: '🌒', cres: 'ممكنة بالعين' },
  { name: 'التربيع الأول', trad: 'قمر نصف مشرق', icon: '🌓', cres: 'واضحة جداً' },
  { name: 'الأحدب المتزايد', trad: 'ليالي الفجر والبهر', icon: '🌔', cres: 'واضحة طوال المساء' },
  { name: 'البدر الكامل', trad: 'ليالي البيض (13، 14، 15)', icon: '🌕', cres: 'طوال الليل' },
  { name: 'الأحدب المتناقص', trad: 'ليالي الدَّرَع', icon: '🌖', cres: 'بعد منتصف الليل' },
  { name: 'التربيع الأخير', trad: 'ليالي الظُّلَم', icon: '🌗', cres: 'فجراً' },
  { name: 'الهلال المتناقص (العرجون)', trad: 'ليالي الدأدأ', icon: '🌘', cres: 'فجراً قبل الشروق' }
];

const CAPTIONS = {
  1: 'النظام الفضائي: اسحب بإصبع/فأرة للتدوير، واقرص/العجلة للتكبير. يمكنك استكشاف دوران الأرض والقمر حول الشمس.',
  2: 'منظور الأرض: هكذا يرى الراصد القمر والشمس من الأرض. لاحظ تأثير خط العرض على ميلان الهلال وشروق الشمس وغروبها!',
  3: 'التفسير العلمي: منظر عمودي يُثبت أن نصف القمر المواجه للشمس مضاء دائماً، وأن الأطوار تنتج فقط عن زاوية رؤيتنا له من الأرض.',
  4: 'مختبر الكسوف والخسوف: لاحظ مخروط ظل الأرض (الأحمر الداكن) ومخروط شبه الظل. لا يحدث الكسوف إلا عند تقاطع مدار القمر مع خط العقدتين!'
};

// ==========================================
// 2. أدوات التوليد الإجرائي للخامات (Procedural Textures)
// ==========================================
function pseudoRandom(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = pseudoRandom(xi, yi);
  const b = pseudoRandom(xi + 1, yi);
  const c = pseudoRandom(xi, yi + 1);
  const d = pseudoRandom(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fractalBrownianMotion(x, y, octaves = 4) {
  let val = 0, amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    val += amp * valueNoise(x, y);
    x *= 2.05;
    y *= 2.05;
    amp *= 0.5;
  }
  return val;
}

function createCanvasTexture(w, h, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const pixel = drawFn(x / w, y / h);
      imgData.data[idx] = pixel[0];
      imgData.data[idx + 1] = pixel[1];
      imgData.data[idx + 2] = pixel[2];
      imgData.data[idx + 3] = pixel[3] !== undefined ? pixel[3] : 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// 1. خامة النهار للأرض (Earth Day)
const earthDayTex = createCanvasTexture(512, 256, (u, v) => {
  const n = fractalBrownianMotion(Math.cos(TAU * u) * 2 + 10, Math.sin(TAU * u) * 2 + v * 3.5, 5);
  // قمم القطبين الجليدية
  if (Math.abs(v - 0.5) > 0.44) return [240, 246, 252];
  // اليابسة (تدرج بين الأخضر الخصيب والبني الصحراوي)
  if (n > 0.51) {
    const k = (n - 0.51) * 4.5;
    const isDesert = Math.abs(v - 0.5) < 0.22 && n < 0.62;
    if (isDesert) return [190 + k * 40, 155 + k * 30, 95];
    return [55 + k * 100, 115 + k * 50, 50 + k * 20];
  }
  // المحيطات (أزرق عميق مع شواطئ فيروزية)
  const depth = Math.min(1, (0.51 - n) * 3);
  return [12 + (1 - depth) * 25, 45 + (1 - depth) * 70, 115 + (1 - depth) * 60];
});

// 2. خامة سحب الأرض (Earth Clouds)
const earthCloudTex = createCanvasTexture(512, 256, (u, v) => {
  const n = fractalBrownianMotion(Math.cos(TAU * (u + 0.3)) * 2.5, Math.sin(TAU * (u + 0.3)) * 2.5 + v * 3, 4);
  const alpha = Math.max(0, (n - 0.48) * 3.8);
  return [255, 255, 255, Math.min(220, Math.floor(alpha * 255))];
});

// 3. خامة سطح القمر (Lunar Maria & Craters)
const moonTex = (function() {
  const w = 512, h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const n = fractalBrownianMotion(Math.cos(TAU * u) * 3 + 5, Math.sin(TAU * u) * 3 + v * 3.5, 5);
      const base = 145 + n * 75;
      const idx = (y * w + x) * 4;
      imgData.data[idx] = base;
      imgData.data[idx + 1] = base;
      imgData.data[idx + 2] = base * 0.96;
      imgData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // رسم بحار القمر الشهيرة (Maria) على الوجه المقابل للأرض (u حول 0.5)
  const maria = [
    { x: 230, y: 105, rx: 32, ry: 24 }, // بحر الأمطار (Mare Imbrium)
    { x: 300, y: 115, rx: 25, ry: 20 }, // بحر الهدوء (Mare Tranquillitatis)
    { x: 280, y: 95, rx: 22, ry: 18 },  // بحر الصفاء (Mare Serenitatis)
    { x: 190, y: 125, rx: 40, ry: 30 }, // محيط العواصف (Oceanus Procellarum)
    { x: 310, y: 145, rx: 20, ry: 18 }  // بحر الخصوبة (Mare Fecunditatis)
  ];
  maria.forEach(m => {
    const grad = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, m.rx);
    grad.addColorStop(0, 'rgba(40, 42, 50, 0.45)');
    grad.addColorStop(0.7, 'rgba(45, 48, 55, 0.28)');
    grad.addColorStop(1, 'rgba(45, 48, 55, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, TAU);
    ctx.fill();
  });

  // رسم فوهات واضحة مع أشعة انتشار (Tycho & Copernicus)
  function drawRayCrater(cx, cy, r, numRays) {
    ctx.fillStyle = 'rgba(230, 235, 245, 0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < numRays; i++) {
      const ang = (i / numRays) * TAU + Math.random() * 0.2;
      const len = r * (4 + Math.random() * 8);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      ctx.stroke();
    }
  }
  drawRayCrater(260, 190, 4, 16); // فوهة تيخو (Tycho)
  drawRayCrater(210, 115, 3.5, 12); // فوهة كوبرنيكوس (Copernicus)

  return new THREE.CanvasTexture(canvas);
})();

// 4. خامة الشمس وهالتها
const sunTex = createCanvasTexture(256, 128, (u, v) => {
  const n = fractalBrownianMotion(Math.cos(TAU * u) * 3, Math.sin(TAU * u) * 3 + v * 3, 3);
  return [255, 175 + n * 70, 30 + n * 60];
});

// ==========================================
// 3. تهيئة بيئة Three.js (Scene & Engine)
// ==========================================
const canvasEl = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas: canvasEl,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2500);

// الإضاءة العامة
const ambientLight = new THREE.AmbientLight(0x7588b0, 0.18);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xa5c2ff, 0x141824, 0.15);
scene.add(hemiLight);

const sunLight = new THREE.PointLight(0xfffdfa, 2.0, 0, 0);
scene.add(sunLight);

// حقل النجوم الخلفية
(function createStarfield() {
  const numStars = 1400;
  const positions = new Float32Array(numStars * 3);
  for (let i = 0; i < numStars; i++) {
    const theta = Math.random() * TAU;
    const phi = Math.acos(2 * Math.random() - 1);
    const rad = 1100 + Math.random() * 200;
    positions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = rad * Math.cos(phi);
    positions[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.7, sizeAttenuation: false });
  scene.add(new THREE.Points(geo, mat));
})();

// ==========================================
// 4. إنشاء الأجرام السماوية (Celestial Bodies)
// ==========================================

// أ) الشمس وهالتها
const sunGroup = new THREE.Group();
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(SCALE_SCHEMATIC.sunRadius, 48, 36),
  new THREE.MeshBasicMaterial({ map: sunTex })
);
sunGroup.add(sunMesh);

// هالة التوهج الشمسي (Glow Sprite)
const sunGlowCanvas = document.createElement('canvas');
sunGlowCanvas.width = sunGlowCanvas.height = 256;
const sgCtx = sunGlowCanvas.getContext('2d');
const sGrad = sgCtx.createRadialGradient(128, 128, 15, 128, 128, 128);
sGrad.addColorStop(0, 'rgba(255, 235, 140, 1.0)');
sGrad.addColorStop(0.25, 'rgba(255, 165, 50, 0.55)');
sGrad.addColorStop(0.6, 'rgba(255, 100, 20, 0.15)');
sGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
sgCtx.fillStyle = sGrad;
sgCtx.fillRect(0, 0, 256, 256);

const sunGlowMat = new THREE.SpriteMaterial({
  map: new THREE.CanvasTexture(sunGlowCanvas),
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const sunGlowSprite = new THREE.Sprite(sunGlowMat);
sunGlowSprite.scale.set(40, 40, 1);
sunGroup.add(sunGlowSprite);

// هالة الكسوف الكلي (Solar Corona Sprite) تظهر أثناء الكسوف
const coronaCanvas = document.createElement('canvas');
coronaCanvas.width = coronaCanvas.height = 256;
const crCtx = coronaCanvas.getContext('2d');
const cGrad = crCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
cGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
cGrad.addColorStop(0.3, 'rgba(200, 230, 255, 0.6)');
cGrad.addColorStop(0.7, 'rgba(120, 170, 255, 0.2)');
cGrad.addColorStop(1, 'rgba(80, 130, 255, 0)');
crCtx.fillStyle = cGrad;
crCtx.fillRect(0, 0, 256, 256);

const coronaSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: new THREE.CanvasTexture(coronaCanvas),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0
}));
coronaSprite.scale.set(36, 36, 1);
sunGroup.add(coronaSprite);
scene.add(sunGroup);

// ب) الأرض والغلاف الجوي
const earthPivot = new THREE.Group();
const earthTiltGroup = new THREE.Group();
earthTiltGroup.rotation.z = EARTH_AXIAL_TILT; // ميلان محور الأرض نحو الشمال السماوي
earthPivot.add(earthTiltGroup);
scene.add(earthPivot);

const earthGlobe = new THREE.Mesh(
  new THREE.SphereGeometry(SCALE_SCHEMATIC.earthRadius, 48, 36),
  new THREE.MeshPhongMaterial({
    map: earthDayTex,
    shininess: 12,
    specular: 0x223344
  })
);

const earthClouds = new THREE.Mesh(
  new THREE.SphereGeometry(SCALE_SCHEMATIC.cloudsRadius, 40, 30),
  new THREE.MeshPhongMaterial({
    map: earthCloudTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.88
  })
);

// هالة الغلاف الجوي الزرقاء
const atmoCanvas = document.createElement('canvas');
atmoCanvas.width = atmoCanvas.height = 128;
const atCtx = atmoCanvas.getContext('2d');
const atGrad = atCtx.createRadialGradient(64, 64, 40, 64, 64, 64);
atGrad.addColorStop(0, 'rgba(100, 180, 255, 0.45)');
atGrad.addColorStop(0.7, 'rgba(70, 140, 255, 0.15)');
atGrad.addColorStop(1, 'rgba(40, 90, 255, 0)');
atCtx.fillStyle = atGrad;
atCtx.fillRect(0, 0, 128, 128);

const atmoSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: new THREE.CanvasTexture(atmoCanvas),
  blending: THREE.AdditiveBlending,
  depthWrite: false
}));
atmoSprite.scale.set(4.6, 4.6, 1);

// خط محور دوران الأرض
const axisLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -3.0, 0),
    new THREE.Vector3(0, 3.0, 0)
  ]),
  new THREE.LineBasicMaterial({ color: 0x4fa4ff, transparent: true, opacity: 0.75 })
);

earthTiltGroup.add(earthGlobe, earthClouds, atmoSprite, axisLine);

// ج) القمر
const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(SCALE_SCHEMATIC.moonRadius, 36, 28),
  new THREE.MeshLambertMaterial({ map: moonTex })
);
scene.add(moonMesh);

// د) المدارات ومخاريط الظل (Orbits & Shadow Cones)
function createOrbitLine(radius, color = 0x8a94a8, opacity = 0.35) {
  const pts = [];
  const segs = 140;
  for (let i = 0; i <= segs; i++) {
    const ang = (i / segs) * TAU;
    pts.push(new THREE.Vector3(radius * Math.cos(ang), 0, -radius * Math.sin(ang)));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

const earthOrbitRing = createOrbitLine(SCALE_SCHEMATIC.earthOrbitRadius, 0x5a7099, 0.3);
scene.add(earthOrbitRing);

// حلقة مدار القمر (يمكن إمالتها بـ 5.14 درجات)
const moonOrbitPivot = new THREE.Group();
const moonOrbitRing = createOrbitLine(SCALE_SCHEMATIC.moonOrbitRadius, 0x8fa4c4, 0.45);
moonOrbitPivot.add(moonOrbitRing);

// مؤشر العقدتين (العقدة الصاعدة والعقدة الهابطة)
const nodesLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-SCALE_SCHEMATIC.moonOrbitRadius * 1.08, 0, 0),
    new THREE.Vector3(SCALE_SCHEMATIC.moonOrbitRadius * 1.08, 0, 0)
  ]),
  new THREE.LineBasicMaterial({ color: 0xe6b747, transparent: true, opacity: 0.6 })
);
moonOrbitPivot.add(nodesLine);
scene.add(moonOrbitPivot);

// شعاع اتجاه الرؤية من الأرض للقمر (للتفسير العلمي)
const viewRayGeo = new THREE.BufferGeometry();
viewRayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
const viewRayLine = new THREE.Line(viewRayGeo, new THREE.LineBasicMaterial({ color: 0x4de1ff, linewidth: 2 }));
viewRayLine.frustumCulled = false;
scene.add(viewRayLine);

// مخروط ظل الأرض التام (Earth Umbra Shadow Cone)
const umbraConeGeo = new THREE.CylinderGeometry(0.15, SCALE_SCHEMATIC.earthRadius, 14, 32, 1, true);
umbraConeGeo.translate(0, 7, 0);
umbraConeGeo.rotateX(Math.PI / 2);
const umbraCone = new THREE.Mesh(
  umbraConeGeo,
  new THREE.MeshBasicMaterial({
    color: 0x771122,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);
scene.add(umbraCone);

// مخروط ظل القمر (Moon Shadow Cone) لسقوط الظل على الأرض أثناء الكسوف
const moonShadowGeo = new THREE.ConeGeometry(SCALE_SCHEMATIC.moonRadius, 8, 24, 1, true);
moonShadowGeo.translate(0, -4, 0);
moonShadowGeo.rotateX(-Math.PI / 2);
const moonShadowCone = new THREE.Mesh(
  moonShadowGeo,
  new THREE.MeshBasicMaterial({
    color: 0x111122,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);
scene.add(moonShadowCone);

// ==========================================
// 5. حالة التطبيق والمستخدم (State Management)
// ==========================================
const state = {
  time: 0, // الزمن بالأيام
  speedIndex: 3, // سرعة البدء (1 يوم/ثانية)
  isPlaying: true,
  mode: 1, // 1: الفضاء, 2: الأرض, 3: الهندسي, 4: الكسوف
  observerLat: 21.4, // مكة المكرمة كافتراضي
  observerName: 'مكة المكرمة (21.4°N)',
  isSouthernHemi: false,
  inclinationEnabled: true,
  shadowsEnabled: true,
  librationEnabled: true,
  atmosphereEnabled: true,
  labelsEnabled: true,
  realScaleEnabled: false,
  // مؤشرات فيزيائية
  earthPos: new THREE.Vector3(),
  moonPos: new THREE.Vector3(),
  phaseAngle: 0,
  illumination: 0,
  lunarDay: 0,
  activeEclipse: null // null | 'lunar_total' | 'lunar_partial' | 'solar_total' | 'solar_partial'
};

// إعدادات الكاميرا لكل وضع
const cameraViews = {
  1: { theta: 0.65, phi: 1.1, dist: 78, pan: new THREE.Vector3() },
  3: { theta: 0.0, phi: 0.12, dist: 22, pan: new THREE.Vector3() },
  4: { theta: 1.55, phi: 1.45, dist: 28, pan: new THREE.Vector3() }
};

// معايير الإضاءة
const lightConfig = {
  target: { S: 80, E: 75, M: 75, A: 25 },
  current: { S: 80, E: 75, M: 75, A: 25 }
};

// ==========================================
// 6. الحسابات الفلكية والفيزيائية (Celestial Math)
// ==========================================
function updateCelestialPositions(t) {
  const scale = currentScale;

  // 1. زاوية دوران الأرض حول الشمس (المسار الكسوفي)
  const earthOrbitAngle = (TAU * t) / SIDEREAL_YEAR;
  state.earthPos.set(
    scale.earthOrbitRadius * Math.cos(earthOrbitAngle),
    0,
    -scale.earthOrbitRadius * Math.sin(earthOrbitAngle)
  );
  earthPivot.position.copy(state.earthPos);
  moonOrbitPivot.position.copy(state.earthPos);

  // دوران الأرض الذاتي حول محورها المائل (اليوم الشمسي)
  earthGlobe.rotation.y = TAU * t;
  earthClouds.rotation.y = TAU * t * 1.025; // حركة سحب نسبية خفيفة

  // 2. زاوية دوران القمر حول الأرض بالنسبة للشمس (الشهر الاقتراني Synodic)
  state.lunarDay = ((t % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  state.phaseAngle = (TAU * state.lunarDay) / SYNODIC_MONTH;

  // زاوية موقع القمر في الفضاء
  const moonSpatialAngle = earthOrbitAngle + Math.PI + state.phaseAngle;

  // تطبيق ميل مدار القمر (5.14°) إذا كان مفعلاً
  const inc = state.inclinationEnabled ? MOON_ORBIT_INCLINATION : 0;
  moonOrbitPivot.rotation.x = inc;
  // يمكن محاكاة تراجع العقد البطيء
  moonOrbitPivot.rotation.y = -t * 0.001;

  // موضع القمر النسبي حول الأرض
  const mx = scale.moonOrbitRadius * Math.cos(moonSpatialAngle);
  const my = state.inclinationEnabled ? scale.moonOrbitRadius * Math.sin(moonSpatialAngle) * Math.sin(inc) : 0;
  const mz = -scale.moonOrbitRadius * Math.sin(moonSpatialAngle) * Math.cos(inc);

  state.moonPos.set(state.earthPos.x + mx, state.earthPos.y + my, state.earthPos.z + mz);
  moonMesh.position.copy(state.moonPos);

  // تقييد القمر جزریاً (Tidal Locking) لمواجهة الأرض دائماً + الميسان (Libration)
  let librationLon = 0, librationLat = 0;
  if (state.librationEnabled) {
    librationLon = 0.11 * Math.sin((TAU * t) / 27.32); // ميسان الطول (~6.5 درجات)
    librationLat = 0.09 * Math.cos((TAU * t) / 27.32); // ميسان العرض (~5.1 درجات)
  }
  moonMesh.rotation.set(librationLat, moonSpatialAngle + Math.PI + librationLon, 0, 'YXZ');

  // تحديث خط الرؤية
  const rayArr = viewRayGeo.attributes.position.array;
  rayArr[0] = state.earthPos.x; rayArr[1] = state.earthPos.y; rayArr[2] = state.earthPos.z;
  rayArr[3] = state.moonPos.x;  rayArr[4] = state.moonPos.y;  rayArr[5] = state.moonPos.z;
  viewRayGeo.attributes.position.needsUpdate = true;

  // تحديث اتجاه مخروط ظل الأرض (يشير مباشرة بعيداً عن الشمس)
  umbraCone.position.copy(state.earthPos);
  const sunToEarthDir = state.earthPos.clone().normalize();
  umbraCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sunToEarthDir);

  // تحديث مخروط ظل القمر
  moonShadowCone.position.copy(state.moonPos);
  const sunToMoonDir = state.moonPos.clone().normalize();
  moonShadowCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sunToMoonDir);

  // 3. كشف الكسوف والخسوف بدقة فيزيائية (Eclipse Detection)
  detectEclipses(scale, sunToEarthDir, sunToMoonDir);
}

function detectEclipses(scale, sunToEarthDir, sunToMoonDir) {
  state.activeEclipse = null;

  // أ) فحص خسوف القمر (عندما يكون القمر في جهة البدر ومقابلاً للشمس خلف الأرض)
  const relMoon = state.moonPos.clone().sub(state.earthPos);
  const distAlongShadow = relMoon.dot(sunToEarthDir);

  if (distAlongShadow > 0) {
    // القمر خلف الأرض
    const perpVec = relMoon.clone().subScaledVector(sunToEarthDir, distAlongShadow);
    const distFromAxis = perpVec.length();

    // حساب نصف قطر مخروط الظل وشبه الظل عند مسافة القمر
    const umbraRadius = scale.earthRadius * (1 - distAlongShadow / (scale.earthOrbitRadius + 1));
    const penumbraRadius = scale.earthRadius + (scale.sunRadius + scale.earthRadius) * (distAlongShadow / scale.earthOrbitRadius);

    if (distFromAxis < umbraRadius * 0.95) {
      state.activeEclipse = 'lunar_total';
    } else if (distFromAxis < penumbraRadius) {
      state.activeEclipse = 'lunar_partial';
    }
  }

  // ب) فحص كسوف الشمس (عندما يكون القمر بين الأرض والشمس في جهة المحاق)
  const relEarthFromMoon = state.earthPos.clone().sub(state.moonPos);
  const distAlongMoonShadow = relEarthFromMoon.dot(sunToMoonDir);

  if (distAlongMoonShadow > 0) {
    const perpVec = relEarthFromMoon.clone().subScaledVector(sunToMoonDir, distAlongMoonShadow);
    const distFromAxis = perpVec.length();
    const moonUmbraOnEarth = scale.moonRadius * 1.2;

    if (distFromAxis < moonUmbraOnEarth) {
      state.activeEclipse = 'solar_total';
    } else if (distFromAxis < scale.earthRadius + scale.moonRadius) {
      state.activeEclipse = 'solar_partial';
    }
  }

  // تأثيرات الكسوف البصرية
  if (state.activeEclipse === 'lunar_total') {
    // القمر الدموي: يتوهج باللون الأحمر النحاسي بسبب انكسار أشعة الغلاف الجوي
    moonMesh.material.color.setRGB(0.72, 0.22, 0.12);
  } else if (state.activeEclipse === 'lunar_partial') {
    moonMesh.material.color.setRGB(0.55, 0.38, 0.32);
  } else {
    // اللون الطبيعي
    const mBri = (0.12 + 0.88 * (lightConfig.current.M / 75));
    moonMesh.material.color.setScalar(mBri);
  }

  // هالة الكسوف الشمسي
  if (state.mode === 2 && (state.activeEclipse === 'solar_total' || state.activeEclipse === 'solar_partial')) {
    coronaSprite.material.opacity = THREE.MathUtils.lerp(coronaSprite.material.opacity, 0.95, 0.1);
  } else {
    coronaSprite.material.opacity = THREE.MathUtils.lerp(coronaSprite.material.opacity, 0, 0.1);
  }

  // إظهار أو إخفاء مخاريط الظل
  umbraCone.visible = state.shadowsEnabled && state.mode !== 2;
  moonShadowCone.visible = state.shadowsEnabled && state.mode !== 2;
}

// ==========================================
// 7. تحريك الكاميرا والتفاعل (Camera & Input)
// ==========================================
function updateCamera(dt) {
  const asp = camera.aspect;

  if (state.mode === 2) {
    // منظور الراصد الأرضي:
    // الكاميرا على سطح الأرض موجهة نحو موضع القمر مع أخذ زاوية خط العرض بالحسبان
    const viewDir = state.moonPos.clone().sub(state.earthPos).normalize();
    camera.position.copy(state.earthPos).addScaledVector(viewDir, currentScale.earthRadius * 1.15);

    // زاوية المحاذاة حسب خط العرض
    const upVector = new THREE.Vector3(
      0,
      Math.cos(state.observerLat * DEG2RAD),
      Math.sin(state.observerLat * DEG2RAD)
    ).normalize();

    camera.up.copy(upVector);
    camera.lookAt(state.moonPos);

    // مجال الرؤية التلسكوبي لمنظور الأرض
    camera.fov = 2 * Math.atan(Math.tan(0.22) / Math.min(1, asp)) * RAD2DEG;
  } else {
    // المناظير الأخرى (فضاء، علمي، كسوف)
    const view = cameraViews[state.mode] || cameraViews[1];

    if (state.mode === 3) {
      // المنظور الهندسي: يتبع دوران الأرض بزاوية عمودية ثابتة
      const earthAngle = (TAU * state.time) / SIDEREAL_YEAR;
      view.theta = earthAngle;
    }

    const targetCenter = (state.mode === 3 || state.mode === 4)
      ? state.earthPos.clone().add(view.pan)
      : new THREE.Vector3().add(view.pan);

    camera.position.set(
      targetCenter.x + view.dist * Math.sin(view.phi) * Math.sin(view.theta),
      targetCenter.y + view.dist * Math.cos(view.phi),
      targetCenter.z + view.dist * Math.sin(view.phi) * Math.cos(view.theta)
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(targetCenter);
    camera.fov = 50;
  }

  camera.updateProjectionMatrix();
}

// التفاعل باللمس والفأرة
const pointerMap = new Map();
canvasEl.addEventListener('pointerdown', e => {
  canvasEl.setPointerCapture(e.pointerId);
  pointerMap.set(e.pointerId, [e.clientX, e.clientY]);
});

function onPointerUp(e) {
  pointerMap.delete(e.pointerId);
}
canvasEl.addEventListener('pointerup', onPointerUp);
canvasEl.addEventListener('pointercancel', onPointerUp);

canvasEl.addEventListener('pointermove', e => {
  if (!pointerMap.has(e.pointerId) || state.mode === 2) return;
  const oldPos = pointerMap.get(e.pointerId);
  const newPos = [e.clientX, e.clientY];
  const view = cameraViews[state.mode] || cameraViews[1];

  if (pointerMap.size === 1) {
    // تدوير المشهد
    view.theta -= (newPos[0] - oldPos[0]) * 0.007;
    view.phi = Math.min(3.08, Math.max(0.06, view.phi - (newPos[1] - oldPos[1]) * 0.007));
  } else if (pointerMap.size === 2) {
    // تكبير وقرص وإزاحة (Pinch / Pan)
    let otherPos;
    for (const [k, p] of pointerMap) {
      if (k !== e.pointerId) otherPos = p;
    }
    const dist0 = Math.hypot(oldPos[0] - otherPos[0], oldPos[1] - otherPos[1]);
    const dist1 = Math.hypot(newPos[0] - otherPos[0], newPos[1] - otherPos[1]);
    if (dist1 > 0) {
      view.dist = Math.min(260, Math.max(4, view.dist * (dist0 / dist1)));
    }
    const factor = view.dist * 0.0014;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    view.pan.addScaledVector(right, -((newPos[0] - oldPos[0]) / 2) * factor)
            .addScaledVector(up, ((newPos[1] - oldPos[1]) / 2) * factor);
  }
  pointerMap.set(e.pointerId, newPos);
});

canvasEl.addEventListener('wheel', e => {
  if (state.mode === 2) return;
  e.preventDefault();
  const view = cameraViews[state.mode] || cameraViews[1];
  view.dist = Math.min(260, Math.max(4, view.dist * (1 + e.deltaY * 0.001)));
}, { passive: false });

function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onWindowResize);
onWindowResize();

// ==========================================
// 8. إضاءة المشهد المخصصة (Lighting System)
// ==========================================
function applySceneLighting(dt) {
  const lerpFactor = 1 - Math.exp(-dt * 8);
  for (const k in lightConfig.current) {
    lightConfig.current[k] += (lightConfig.target[k] - lightConfig.current[k]) * lerpFactor;
  }

  const sIntensity = lightConfig.current.S / 80;
  sunLight.intensity = 2.0 * sIntensity;
  sunMesh.material.color.setScalar(0.15 + 0.85 * sIntensity);
  sunGlowSprite.material.opacity = 0.05 + 0.75 * sIntensity;
  sunGlowSprite.scale.setScalar(26 + 18 * sIntensity);

  const ambIntensity = 0.06 + 0.45 * (lightConfig.current.A / 100);
  ambientLight.intensity = ambIntensity;
  hemiLight.intensity = 0.04 + 0.28 * (lightConfig.current.A / 100);

  const eIntensity = lightConfig.current.E / 75;
  earthGlobe.material.color.setScalar(0.12 + 0.88 * eIntensity);
  earthClouds.material.color.setScalar(0.15 + 0.85 * eIntensity);
  atmoSprite.visible = state.atmosphereEnabled;
}

// ==========================================
// 9. ويدجت رسم طور القمر ثنائي الأبعاد (2D Moon Canvas)
// ==========================================
function draw2DMoonWidget(lunarDay) {
  const canvas = document.getElementById('mc');
  const ctx = canvas.getContext('2d');
  const W = 192, R = 84, cx = 96, cy = 96;

  ctx.clearRect(0, 0, W, W);

  // قرص القمر الأساسي المظلم
  ctx.fillStyle = '#1c2233';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.fill();

  // حساب النسبة المضاءة هندسياً
  const cosPsi = Math.cos(state.phaseAngle);
  const isWaxing = lunarDay < SYNODIC_MONTH / 2;
  state.illumination = Math.round(((1 - cosPsi) / 2) * 100);

  // في النصف الجنوبي، ينعكس اتجاه تزايد الهلال أفقياً
  const flip = state.isSouthernHemi;
  const waxRight = flip ? !isWaxing : isWaxing;

  // رسم الجزء المضاء بتظليل هندسي دقيق
  ctx.fillStyle = state.activeEclipse === 'lunar_total' ? '#c74424' : '#f0ecdc';

  for (let y = -R; y < R; y++) {
    const widthAtY = Math.sqrt(R * R - y * y);
    const terminatorX = cosPsi * widthAtY;
    const span = widthAtY - terminatorX;
    if (span <= 0) continue;

    const startX = waxRight ? cx + terminatorX : cx - widthAtY;
    ctx.fillRect(startX, cy + y, span, 1.25);
  }

  // هالة وحلقة خارجية أنيقة
  ctx.strokeStyle = 'rgba(160, 185, 240, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, TAU);
  ctx.stroke();
}

// ==========================================
// 10. واجهة المستخدم وتحديث البيانات (UI Updates)
// ==========================================
function setSimulationMode(newMode) {
  state.mode = newMode;
  document.querySelectorAll('#top button').forEach(b => {
    b.classList.toggle('on', Number(b.dataset.m) === newMode);
  });

  document.getElementById('cap').textContent = CAPTIONS[newMode] || '';

  // ضبط ظهور العناصر حسب الوضع
  earthPivot.visible = newMode !== 2;
  viewRayLine.visible = newMode === 3;
  earthOrbitRing.visible = newMode === 1;
  moonOrbitPivot.visible = newMode !== 2;
}

function updateUI() {
  const d = state.lunarDay;
  const phaseIndex = Math.floor((d + SYNODIC_MONTH / 16) / (SYNODIC_MONTH / 8)) % 8;
  const curPhase = PHASES[phaseIndex];

  // بطاقة 2D
  document.getElementById('mwPhaseName').textContent = curPhase.name;
  document.getElementById('mwIllum').textContent = `${state.illumination}% مضاء`;

  // اللوحة الفلكية
  document.getElementById('iPhase').textContent = curPhase.name;
  document.getElementById('iD').textContent = `${(d + 1).toFixed(1)} / 29.5 يوم`;
  document.getElementById('iIllum').textContent = `${state.illumination}%`;
  document.getElementById('iTrad').textContent = curPhase.trad;

  const cresEl = document.getElementById('iCresStatus');
  cresEl.textContent = curPhase.cres;
  cresEl.style.color = (phaseIndex === 1 || phaseIndex === 0) ? '#f6c85f' : '#cad8f8';

  // شريط التنبيه عن الكسوف أو الخسوف
  const eclipseBanner = document.getElementById('eclipseBanner');
  const eclipseText = document.getElementById('eclipseText');
  if (state.activeEclipse) {
    eclipseBanner.classList.remove('hidden');
    if (state.activeEclipse === 'lunar_total') {
      eclipseText.textContent = 'خسوف كلي للقمر (قمر دموي 🌕🔴)';
    } else if (state.activeEclipse === 'lunar_partial') {
      eclipseText.textContent = 'خسوف جزئي للقمر 🌖';
    } else if (state.activeEclipse === 'solar_total') {
      eclipseText.textContent = 'كسوف كلي للشمس (ظلام تام وهالة 🌑☀️)';
    } else if (state.activeEclipse === 'solar_partial') {
      eclipseText.textContent = 'كسوف جزئي للشمس 🌘';
    }
  } else {
    eclipseBanner.classList.add('hidden');
  }

  // تحديث شريط الأطوار السفلي والمزلاق
  const slider = document.getElementById('sl');
  if (document.activeElement !== slider) {
    slider.value = Math.round(d * 100);
  }

  const strip = document.getElementById('strip');
  [...strip.children].forEach((child, idx) => {
    child.classList.toggle('on', idx === phaseIndex);
  });

  document.getElementById('sp').textContent = SPEEDS[state.speedIndex].label;

  draw2DMoonWidget(d);
}

// قفز ذكي للكسوف أو الخسوف القادم
function jumpToNextEclipse() {
  // الكسوف والخسوف يحدثان عندما يقترب القمر من خط العقد أثناء البدر أو المحاق
  // نبحث في الأيام القادمة حتى 30 يوماً عن أقرب محاذاة
  const step = 0.05;
  for (let offset = 0.1; offset < 35; offset += step) {
    const testT = state.time + offset;
    const testDay = ((testT % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
    const isNearFull = Math.abs(testDay - SYNODIC_MONTH / 2) < 0.6;
    const isNearNew = testDay < 0.6 || testDay > SYNODIC_MONTH - 0.6;

    if (isNearFull || isNearNew) {
      // فحص ارتفاع القمر الرأسي عن مستوى مدار الأرض
      const moonSpatialAngle = (TAU * testT) / SIDEREAL_YEAR + Math.PI + (TAU * testDay) / SYNODIC_MONTH;
      const height = Math.abs(Math.sin(moonSpatialAngle) * Math.sin(MOON_ORBIT_INCLINATION));
      if (height < 0.035) {
        state.time = testT;
        setSimulationMode(4); // الانتقال لمختبر الكسوف
        return;
      }
    }
  }
}

// ==========================================
// 11. ربط أحداث العناصر (Event Listeners)
// ==========================================
function setupEventListeners() {
  // أزرار الأوضاع العلوية
  document.querySelectorAll('#top button').forEach(btn => {
    btn.onclick = () => setSimulationMode(Number(btn.dataset.m));
  });

  // شريط الأطوار السريعة
  const strip = document.getElementById('strip');
  PHASES.forEach((p, idx) => {
    const span = document.createElement('span');
    span.textContent = p.icon;
    span.title = p.name;
    span.onclick = () => {
      const curDay = ((state.time % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
      const targetDay = (idx * SYNODIC_MONTH) / 8;
      state.time = state.time - curDay + targetDay;
    };
    strip.appendChild(span);
  });

  // أزرار التحكم بالزمن
  document.getElementById('bPlay').onclick = () => { state.isPlaying = true; };
  document.getElementById('bStop').onclick = () => { state.isPlaying = false; };
  document.getElementById('bRst').onclick = () => { state.time = 0; };
  document.getElementById('bNextEclipse').onclick = jumpToNextEclipse;

  document.getElementById('bSlow').onclick = () => {
    state.speedIndex = Math.max(0, state.speedIndex - 1);
  };
  document.getElementById('bFast').onclick = () => {
    state.speedIndex = Math.min(SPEEDS.length - 1, state.speedIndex + 1);
  };

  document.getElementById('sl').oninput = e => {
    const curDay = ((state.time % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
    state.time = state.time - curDay + Number(e.target.value) / 100;
  };

  // تبديل نصف الكرة السريع
  const hemiBtn = document.getElementById('bHemiToggle');
  hemiBtn.onclick = () => {
    state.isSouthernHemi = !state.isSouthernHemi;
    state.observerLat = state.isSouthernHemi ? -33.8 : 21.4;
    hemiBtn.textContent = state.isSouthernHemi ? '📍 النصف الجنوبي (سيدني)' : '📍 النصف الشمالي (مكة)';
    document.getElementById('mwHemiBadge').textContent = state.isSouthernHemi ? 'جنوبي' : 'شمالي';
  };

  // تبديل مقياس العرض (واقعي / توضيحي)
  const scaleBtn = document.getElementById('bScaleToggle');
  scaleBtn.onclick = () => {
    state.realScaleEnabled = !state.realScaleEnabled;
    currentScale = state.realScaleEnabled ? SCALE_REALISTIC : SCALE_SCHEMATIC;
    scaleBtn.textContent = state.realScaleEnabled ? '📏 مقياس شبه واقعي' : '📏 مقياس توضيحي';
    document.getElementById('chkRealScale').checked = state.realScaleEnabled;
    // تحديث أقطار الحلقات
    earthOrbitRing.geometry.dispose();
    earthOrbitRing.geometry = createOrbitLine(currentScale.earthOrbitRadius, 0x5a7099, 0.3).geometry;
    moonOrbitRing.geometry.dispose();
    moonOrbitRing.geometry = createOrbitLine(currentScale.moonOrbitRadius, 0x8fa4c4, 0.45).geometry;
  };

  // أزرار المواقع الجغرافية بالدرج
  document.querySelectorAll('#locBtns button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#locBtns button').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      state.observerLat = Number(btn.dataset.lat);
      state.observerName = btn.dataset.name;
      state.isSouthernHemi = state.observerLat < 0;
      hemiBtn.textContent = `📍 ${state.observerName}`;
      document.getElementById('mwHemiBadge').textContent = state.isSouthernHemi ? 'جنوبي' : 'شمالي';
    };
  });

  // المفاتيح الكهربائية (Toggles)
  document.getElementById('chkInclination').onchange = e => {
    state.inclinationEnabled = e.target.checked;
  };
  document.getElementById('chkShadows').onchange = e => {
    state.shadowsEnabled = e.target.checked;
  };
  document.getElementById('chkLibration').onchange = e => {
    state.librationEnabled = e.target.checked;
  };
  document.getElementById('chkAtmosphere').onchange = e => {
    state.atmosphereEnabled = e.target.checked;
  };
  document.getElementById('chkRealScale').onchange = e => {
    scaleBtn.click();
  };

  // لوحة الإضاءة
  const lightSliders = { S: '#lS', E: '#lE', M: '#lM', A: '#lA' };
  Object.keys(lightSliders).forEach(key => {
    const el = document.querySelector(lightSliders[key]);
    el.oninput = () => {
      lightConfig.target[key] = Number(el.value);
      el.nextElementSibling.textContent = `${el.value}%`;
    };
  });
  document.getElementById('ltR').onclick = () => {
    const def = { S: 80, E: 75, M: 75, A: 25 };
    Object.keys(def).forEach(k => {
      const el = document.querySelector(lightSliders[k]);
      el.value = def[k];
      el.oninput();
    });
  };

  // الدرج وقائمة الدليل
  const drawer = document.getElementById('drawer');
  document.getElementById('bSettings').onclick = () => {
    drawer.classList.toggle('on');
  };
  document.getElementById('bCloseDrawer').onclick = () => {
    drawer.classList.remove('on');
  };

  const guideModal = document.getElementById('guideModal');
  document.getElementById('bGuide').onclick = () => {
    guideModal.classList.remove('hidden');
  };
  document.getElementById('bCloseGuide').onclick = () => {
    guideModal.classList.add('hidden');
  };
}

// ==========================================
// 12. حلقة العرض الرئيسية (Main Animation Loop)
// ==========================================
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (state.isPlaying) {
    state.time += SPEEDS[state.speedIndex].val * dt;
  }

  // تحديث الحركات الفيزيائية والكاميرا والإضاءة
  updateCelestialPositions(state.time);
  applySceneLighting(dt);
  updateCamera(dt);
  renderer.render(scene, camera);

  // تحديث واجهات المستخدم
  updateUI();
}

// بدء التطبيق
setupEventListeners();
setSimulationMode(1);
requestAnimationFrame(animate);
