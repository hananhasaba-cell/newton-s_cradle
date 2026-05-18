import * as THREE from "three";
import {HDRLoader} from 'three/examples/jsm/loaders/HDRLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from "lil-gui";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
// إعدادات عامة -------------------------
// الإطار الذي يضم كل شيء
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });
//إنشاء المشهد
const scene = new THREE.Scene();
scene.background = new THREE.Color("black");
// إعداد الكاميرا
const sizes = { width: window.innerWidth, height: window.innerHeight };
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 5, 30);
//إضافة الكاميرا للمشهد
scene.add(camera);
// إعداد أدوات التحكم   
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
//إعدادات الإضاءة
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 5, 10);
scene.add(light);
// إعداد الصوت
const listener = new THREE.AudioListener();
camera.add(listener);

const collisionSound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('/click.wav', buffer => {
  collisionSound.setBuffer(buffer);
  collisionSound.setVolume(0.4);
});

// نموذج بندول نيوتن -------------------------
const g = 9.81; //الجاذبية
const ballCount = 5; // عدد الكرات
const ballRadius = 0.5; // نصف قطر كل كرة
const stringLength = 5; // طول الخيط المعلقة به الكرة
const spacing = ballRadius * 2; // المسافة بين مراكز الكرات (تساوي قطر الكرة لضمان تلامسها دون تداخل)   

const damping = 0.999;          // فقدان تدريجي للطاقة
const collisionLoss = 0.99;     // فقدان طاقة عند التصادم

const balls = []; // وضع بيانات كل كرة
//---------------------------------------------------------------------------------------------------
// رسم الطاولة والعارضة والأعمدة

const tableGeo = new THREE.BoxGeometry(20, 1, 20);
const tableMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
const table = new THREE.Mesh(tableGeo, tableMat);
table.position.set(0, -stringLength - 2, -1);
scene.add(table);
// أقدام الطاولة
const legGeo = new THREE.BoxGeometry(0.9, 18, 0.5);
const legMat = new THREE.MeshStandardMaterial({ color: 0x111199 });
// رجل أمام يسار
const leg1 = new THREE.Mesh(legGeo, legMat);
leg1.position.set(-8, -stringLength - 12, 8);
scene.add(leg1);
// رجل أمام يمين
const leg2 = new THREE.Mesh(legGeo, legMat);
leg2.position.set(8, -stringLength - 12, 8);
scene.add(leg2);
// رجل خلف يسار
const leg3 = new THREE.Mesh(legGeo, legMat);
leg3.position.set(-8, -stringLength - 12, -8);
scene.add(leg3);
// رجل خلف يمين
const leg4 = new THREE.Mesh(legGeo, legMat);
leg4.position.set(8, -stringLength - 12, -8);
scene.add(leg4);



// العارضة العلوية 
const beamMat = new THREE.MeshStandardMaterial({ color: 0x556699 });
const beamWidth = ballCount * spacing + 5;
// العارضة اليسرى
const leftBeamGeo = new THREE.BoxGeometry(beamWidth, 0.3, 0.2);
const leftBeam = new THREE.Mesh(leftBeamGeo, beamMat);
leftBeam.position.set(0, 0.4, -1.8); // على المحور Z
scene.add(leftBeam);
// العارضة اليمنى
const rightBeamGeo = new THREE.BoxGeometry(beamWidth, 0.3, 0.2);
const rightBeam = new THREE.Mesh(rightBeamGeo, beamMat);
rightBeam.position.set(0, 0.4, 1.8); // على المحور Z
scene.add(rightBeam);

// عمودان جانبيان في كل جهة (٤ أعمدة)
const pillarGeo = new THREE.BoxGeometry(0.2, stringLength + 1.5, 0.2);
const pillarMat = new THREE.MeshStandardMaterial({ color: 0x556699 });
// يسار - أمام 
const leftFrontPillar = new THREE.Mesh(pillarGeo, pillarMat);
leftFrontPillar.position.set(-beamWidth / 2, -(stringLength / 1.8), 1.8);
scene.add(leftFrontPillar);
// يسار - خلف 
const leftBackPillar = new THREE.Mesh(pillarGeo, pillarMat);
leftBackPillar.position.set(-beamWidth / 2, -(stringLength / 1.8), -1.8);
scene.add(leftBackPillar);
// يمين - أمام
const rightFrontPillar = new THREE.Mesh(pillarGeo, pillarMat);
rightFrontPillar.position.set(beamWidth / 2, -(stringLength / 1.8), 1.8);
scene.add(rightFrontPillar);
// يمين - خلف
const rightBackPillar = new THREE.Mesh(pillarGeo, pillarMat);
rightBackPillar.position.set(beamWidth / 2, -(stringLength / 1.8), -1.8);
scene.add(rightBackPillar);

// القاعدة
const baseGeo = new THREE.BoxGeometry(beamWidth + 1, 0.6, 4);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x111179 });
const base = new THREE.Mesh(baseGeo, baseMat);
base.position.set(0, -stringLength - 1, 0);
scene.add(base);
//-------
// مادة الخيط
const stringMat = new THREE.LineBasicMaterial({ color: 0xffffff });
// رسم الكرات + الخيطين
const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 0.6,
  roughness: 0.2,
});
for (let i = 0; i < ballCount; i++) {

  const group = new THREE.Group();
  const pivotX = i * spacing - ((ballCount - 1) * spacing) / 2;
  group.position.set(pivotX, 0.4, 0); // تحت العارضة مباشرة

  // موضع الكرة داخل المجموعة (محلي)
  const x = 0;
  const y = -stringLength;

  // إنشاء الكرة
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set(x, y, 0);

  // نقاط التعليق (محلية داخل المجموعة)
  const leftAttach  = new THREE.Vector3(0, 0, -1.8); // العارضة اليسرى
  const rightAttach = new THREE.Vector3(0, 0,  1.8); // العارضة اليمنى

  // نقاط اتصال الخيط بالكرة
  const bottomLeft  = new THREE.Vector3(x, y, -0.15);
  const bottomRight = new THREE.Vector3(x, y,  0.15);

  // خيط يسار
  const stringGeo1 = new THREE.BufferGeometry().setFromPoints([leftAttach,bottomLeft,]);
  const string1 = new THREE.Line(stringGeo1, stringMat);
  // خيط يمين
  const stringGeo2 = new THREE.BufferGeometry().setFromPoints([rightAttach,bottomRight,]);
  const string2 = new THREE.Line(stringGeo2, stringMat);

  // تجميع
  group.add(string1);
  group.add(string2);
  group.add(ball);
  scene.add(group);

  // تخزين بيانات الكرة
  balls.push({
    group,
    string1,
    string2,
    ball,
    theta: 0, // الزاوية الحالية
    omega: 0, // السرعة الزاوية
    alpha: 0, // التسارع الزاوي
    length: stringLength,
    pivotX,
    index: i,
    prevTheta: 0,
  });
}
//----------------------------------------------------------------------------------------------------
// استخدام GUI controls
const params = {
  pulledCount: 1,
  pullAngle: 0.9,       // زاوية السحب
  damping: 0.999,       // التخميد
  collisionLoss: 0.99,  // فقدان التصادم
  stringLength: 5,      // طول الخيط
  ballRadius: 0.5,      // حجم الكرة
  timeScale: 1.0,        // سرعة الحركة
  frequency: 0,

};


// التحكم بعدد الكرات المسحوبة
const gui = new dat.GUI();
gui.add(params, "pulledCount")
   .min(1)
   .max(ballCount - 1)
   .step(1)
   .name("عدد الكرات المسحوبة");

const actions = {
  pullLeft: () => pullBalls("left"),
  pullRight: () => pullBalls("right"),
};

gui.add(actions, "pullLeft").name("سحب من اليسار");
gui.add(actions, "pullRight").name("سحب من اليمين");

// التحم بزاوية السحب
gui.add(params, "pullAngle")
   .min(0.1).max(1.5).step(0.05)
   .name("زاوية السحب");
//التخميد التدريجي للحركة
gui.add(params, "damping")
   .min(0.95).max(1.0).step(0.0005)
   .name("التخميد");
// فقدان الطاقة عند التصادم 
gui.add(params, "collisionLoss")
   .min(0.8).max(1.0).step(0.01)
   .name("فقدان التصادم");
// طول الخيط
gui.add(params, "stringLength")
   .min(2).max(5.6).step(0.1)
   .name("طول الخيط")
   .onChange(updateStringLength);
// حجم الكرة
gui.add(params, "ballRadius")
   .min(0.2).max(1.0).step(0.1)
   .name("حجم الكرة")
   .onChange(updateBallRadius);
//-------   
params.frequency = 0;
params.period = 0;
params.velocity = 0;
params.thetaDisplay = 0;

gui.add(params, "frequency").name("التردد  (Hz)").listen();
gui.add(params, "period").name("الزمن الدوري (s)").listen();
gui.add(params, "velocity").name("سرعة الكرة").listen();
gui.add(params, "thetaDisplay").name("زاوية الكرة (rad)").listen();

//-----------------------------------------------------------------------------------------------
// تابع سحب الكرات
function pullBalls(side) {
  const n = params.pulledCount;

  // إعادة ضبط كل الكرات
  balls.forEach(b => {
    b.theta = 0;
    b.omega = 0;
  });

  if (side === "left" || side === "both") {
    for (let i = 0; i < n; i++) {
     balls[i].theta = -params.pullAngle; // سحب من اليسار
    }
  }

  if (side === "right" || side === "both") {
    for (let i = 0; i < n; i++) {
      const idx = balls.length - 1 - i;
     balls[idx].theta = params.pullAngle; // سحب من اليمين
    }
  }
}
//----------------------------------------------------------------------
// تحديث موضع الكرة والخيطين
function updateBallPosition(b) {
  const x = b.length * Math.sin(b.theta);
  const y = -b.length * Math.cos(b.theta);

  b.ball.position.set(x, y, 0);

  const leftAttach  = new THREE.Vector3(0, 0, -1.8);
  const rightAttach = new THREE.Vector3(0, 0,  1.8);

  const bottomLeft  = new THREE.Vector3(x, y, -0.15);
  const bottomRight = new THREE.Vector3(x, y,  0.15);

  b.string1.geometry.setFromPoints([leftAttach, bottomLeft]);
  b.string2.geometry.setFromPoints([rightAttach, bottomRight]);
}
//--------------------------------------------------------------------------------------------------
function handleCollisions() {
  const left = balls[0];
  const right = balls[balls.length - 1];
//حساب ما إذا مرت الكرة من المنتصف (من اليسار إلى اليمين أو العكس) بين الإطارين الحالي والسابق    
  const crossedCenterLeft =
    (left.prevTheta > 0 && left.theta <= 0) ||
    (left.prevTheta < 0 && left.theta >= 0);

  const crossedCenterRight =
    (right.prevTheta > 0 && right.theta <= 0) ||
    (right.prevTheta < 0 && right.theta >= 0);

  const n = params.pulledCount; // عدد الكرات المسحوبة

  // تصادم من اليسار → اليمين
  if (crossedCenterLeft && Math.abs(left.omega) > 0.005) {
     if (collisionSound.isPlaying) collisionSound.stop();
    collisionSound.play();
    for (let i = 0; i < n; i++) {
      const from = balls[i];                         // من اليسار
      const to   = balls[balls.length - 1 - i];      // إلى اليمين

      const v = from.length * from.omega;
      to.omega = (v / to.length) * params.collisionLoss;

      from.omega = 0;
      from.theta = 0;
    }
    // اهتزاز بسيط للكرات الوسطى
    for (let i = n; i < balls.length - n; i++) {
      const mid = balls[i];
      mid.theta += (Math.random() - 0.5) * 0.04;
    }
  }
  //-------------------------
  // تصادم من اليمين → اليسار
  if (crossedCenterRight && Math.abs(right.omega) > 0.005) {
     if (collisionSound.isPlaying) collisionSound.stop();
    collisionSound.play();

    for (let i = 0; i < n; i++) {
      const from = balls[balls.length - 1 - i]; // من اليمين
      const to   = balls[i];                    // إلى اليسار

      const v = from.length * from.omega;
      to.omega = (v / to.length) * params.collisionLoss;

      from.omega = 0;
      from.theta = 0;
    }

    for (let i = n; i < balls.length - n; i++) {
      const mid = balls[i];
      mid.theta += (Math.random() - 0.5) * 0.02;
    }
  }
}
//-----------------------------------------------------------------------------------------------------
// تحديث طول الخيط عند تغييره من الواجهة
function updateStringLength() {
  const maxLength = Math.abs(base.position.y) - 1.0; 

  if (params.stringLength > maxLength) {
    params.stringLength = maxLength;
  }

  balls.forEach(b => {
    b.length = params.stringLength;
  });
}
//--------------------------------------------
// تغيير حجم الكرة عند تعديله من الواجهة
function updateBallRadius() {
  //  تحديث نصف القطر
  const r = params.ballRadius;
  //  تحديث المسافة بين الكرات
  const spacing = r * 2;
  //  تحديث عرض العارضة
  const beamWidth = ballCount * spacing + 5;
  //  تحديث هندسة الكرة
  balls.forEach((b, i) => {
    b.ball.geometry.dispose();
    b.ball.geometry = new THREE.SphereGeometry(r, 32, 32);
    //  تحديث موضع المجموعة (مركز الكرة)
    const pivotX = i * spacing - ((ballCount - 1) * spacing) / 2;
    b.group.position.x = pivotX;
    //  تحديث طول الخيط
    b.length = params.stringLength;
    //  تحديث الخيوط
    updateBallPosition(b);
  });
  //  تحديث العارضة اليسرى واليمنى
  leftBeam.scale.x = beamWidth / leftBeam.geometry.parameters.width;
  rightBeam.scale.x = beamWidth / rightBeam.geometry.parameters.width;

  leftBeam.position.x = 0;
  rightBeam.position.x = 0;
  //  تحديث الأعمدة
  leftFrontPillar.position.x = -beamWidth / 2;
  leftBackPillar.position.x  = -beamWidth / 2;
  rightFrontPillar.position.x = beamWidth / 2;
  rightBackPillar.position.x  = beamWidth / 2;
  //  تحديث القاعدة
  base.scale.x = (beamWidth + 1) / base.geometry.parameters.width;
}
//-----------------------------------------------------------------------------------------------------
//إضافة الصورة environment map
const loader = new HDRLoader();
loader.load('/wooden_studio_09_2k.hdr', (texture)=>
{
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
});
//-----------------------------------------------------------------------------------------------------
//تابع الرسوم المتحركة لتحديث موضع الكرات ومعالجة التصادمات في كل إطار
const clock = new THREE.Clock();
function animate() {
  const dt = clock.getDelta() * params.timeScale;

  balls.forEach((b, i) => {
    b.prevTheta = b.theta;
    b.alpha = -(g / b.length) * Math.sin(b.theta);
    b.omega += b.alpha * dt;
    b.omega *= params.damping;
    b.theta += b.omega * dt;

    // تحديث القيم الفيزيائية للعرض
// إيجاد الكرة التي تتحرك فعليًا
let activeBall = balls[0];
let maxOmega = Math.abs(balls[0].omega);

balls.forEach(b => {
  if (Math.abs(b.omega) > maxOmega) {
    maxOmega = Math.abs(b.omega);
    activeBall = b;
  }
});

// تحديث القيم الفيزيائية
params.frequency = ((1 / (2 * Math.PI)) * Math.sqrt(g / params.stringLength)).toFixed(3);
params.period = (2 * Math.PI * Math.sqrt(params.stringLength / g)).toFixed(3);
params.velocity = (activeBall.length * activeBall.omega).toFixed(3);
params.thetaDisplay = activeBall.theta.toFixed(3);


    updateBallPosition(b);
  });

  handleCollisions();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
//-----------------------------------------------------------------------------------------------------
// تحديث حجم العرض عند تغيير حجم النافذة لضمان تناسب العرض مع الكاميرا
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});