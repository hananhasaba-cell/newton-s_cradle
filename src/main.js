///
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

const airDrag = 0.02;        // مقاومة الهواء (قوة تعاكس السرعة)
const pivotFriction = 0.01;  // احتكاك نقطة التعليق (يعاكس السرعة الزاوية)

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
    thetaZ: 0, // زاوية التذبذب الجانبي
    omegaZ: 0, // سرعة التذبذب الجانبي
    alphaZ: 0, // تسارع التذبذب الجانبي
    length: stringLength,
    pivotX,
    index: i,
    prevTheta: 0,
    mass: 1, // كتلة الكرة (نفس الكتلة للجميع)
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
  airDrag: 0.02,
  pivotFriction: 0.01,
  initialPush: 0,
  removeBallIndex: -1,
  tiltAngle: 0, // زاوية الميل في اتجاه Z


};
params.anglesText = "";
params.velocitiesText = "";
params.tension = 0;
params.energy = 0;
params.kinetic = 0;   // الطاقة الحركية
params.potential = 0; // الطاقة السكونية

params.collisionCount = 0;
params.collisionType = "—";

params.initialPush = 0; // دفعة ابتدائية

params.massFactor = 1.0;

params.materialType = "steel"; // المادة الافتراضية
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

// التحكم بزاوية السحب
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
   .name("معامل الارتداد");
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
gui.add(params, "tension").name("قوة الشد (N)").listen();

const energyFolder = gui.addFolder("الطاقة");
energyFolder.add(params, "kinetic").name("K الطاقة الحركية").listen();
energyFolder.add(params, "potential").name("U الطاقة السكونية").listen();
energyFolder.add(params, "energy").name("E الطاقة الكلية").listen();

gui.add(params, "collisionCount").name("عدد التصادمات").listen();
gui.add(params, "collisionType").name("نوع التصادم").listen();
// نوع مادة الكرات
gui.add(params, "materialType", {
  "فولاذ": "steel",
  "مطاط": "rubber",
  "بلاستيك": "plastic",
  "إسفنج": "foam"
}).name("مادة الكرة").onChange(updateMaterial);
gui.add(params, "initialPush").min(-2).max(2).step(0.1).name("دفعة ابتدائية");
gui.add(params, "airDrag").min(0).max(0.05).step(0.001).name("مقاومة الهواء");
gui.add(params, "pivotFriction").min(0).max(0.05).step(0.001).name("احتكاك نقطة التعليق");
gui.add(params, "timeScale").min(0.1).max(3).step(0.1).name("سرعة الزمن");

 // التحكم بزاوية الميل الجانبي
gui.add(params, "tiltAngle").min(-0.8).max(0.8).step(0.05).name("زاوية الميل (Z)");
  //التحكم بكتلة كرة واحدة لإظهار أن القوانين تعمل بشكل صحيح
gui.add(params, "massFactor").min(0.5).max(3).step(0.1).name("كتلة الكرة الأولى");
// التحكم بإزالة كرة معينة
gui.add(params, "removeBallIndex").min(-1).max(ballCount-1).step(1).name("إزالة كرة من البندول").onChange(removeBall);
// التحكم بطول الخيوط لكل كرة
const lengthFolder = gui.addFolder("أطوال الخيوط");
  balls.forEach((b, i) => {
  lengthFolder.add(b, "length").min(2).max(5).step(0.1).name(`طول الخيط ${i+1}`).onChange(() => updateBallPosition(b));
});

const anglesFolder = gui.addFolder("زوايا الكرات");
const velocitiesFolder = gui.addFolder("سرعات الكرات");
balls.forEach((b, i) => {
  const idx = i + 1;
  params[`theta${idx}`] = 0;
  params[`vel${idx}`] = 0;
  anglesFolder.add(params, `theta${idx}`).name(`θ${idx}`).listen();
  velocitiesFolder.add(params, `vel${idx}`).name(`v${idx}`).listen();
   });
 
///
//-----------------------------------------------------------------------------------------------
///
// تابع تغير مادة الكرات
function updateMaterial() {
  switch (params.materialType) {
    case "steel":
      params.collisionLoss = 0.98; // فولاذ: شبه مرن
      break;

    case "rubber":
      params.collisionLoss = 0.85; // مطاط: مرن جزئياً
      break;

    case "plastic":
      params.collisionLoss = 0.70; // بلاستيك: غير مرن
      break;

    case "foam":
      params.collisionLoss = 0.40; // إسفنج: غير مرن جداً
      break;
  }
}
//-----------------------------------------------------------------------------------------------
// تابع إزالة كرة
function removeBall(index) {
  // إعادة كل الكرات أولًا
  balls.forEach(b => {
    b.group.visible = true;
    b.removed = false;
  });
  // لو القيمة -1  لا نزيل أحد
  if (index < 0) return;
  // إخفاء الكرة المطلوبة فقط
  balls[index].group.visible = false;
  balls[index].removed = true;
}
//-----------------------------------------------------------------------------------------------
// تابع سحب الكرات
function pullBalls(side) {
  const n = params.pulledCount;

  // إعادة ضبط كل الكرات
  balls.forEach(b => {
    b.theta = 0;
    b.omega = 0;
    b.thetaZ = 0;
    b.omegaZ = 0;
  });

  // من اليسار
  if (side === "left" || side === "both") {
    for (let i = 0; i < n; i++) {
      const b = balls[i];
      b.theta = -params.pullAngle;      // سحب في X
      b.thetaZ = params.tiltAngle;      // ميل في Z
      b.omega = params.initialPush;
      b.omegaZ = params.initialPush;
    }
  }
 // من اليمين
  if (side === "right" || side === "both") {
    for (let i = 0; i < n; i++) {
      const idx = balls.length - 1 - i;
      const b = balls[idx];
      b.theta = params.pullAngle;
      b.thetaZ = params.tiltAngle;   
      b.omega = -params.initialPush;
      b.omegaZ = params.initialPush;
    }
  }
}
//----------------------------------------------------------------------
// تحديث موضع الكرة والخيطين
function updateBallPosition(b) {
  const x = b.length * Math.sin(b.theta);
  const z = b.length * Math.sin(b.thetaZ);
  const y = -Math.sqrt(Math.max(b.length * b.length - x * x - z * z, 0));

  b.ball.position.set(x, y, z);

  const leftAttach  = new THREE.Vector3(0, 0, -1.8);
  const rightAttach = new THREE.Vector3(0, 0,  1.8);

  const bottomLeft  = new THREE.Vector3(x, y, z - 0.15);
  const bottomRight = new THREE.Vector3(x, y, z + 0.15);

  b.string1.geometry.setFromPoints([leftAttach, bottomLeft]);
  b.string2.geometry.setFromPoints([rightAttach, bottomRight]);
}

//--------------------------------------------------------------------------------------------------
//معالجة التصادم
function handleCollisions(dt) {
  const R = params.ballRadius;
  const e = params.collisionLoss; // معامل الارتداد (0 < e ≤ 1)

  for (let i = 0; i < balls.length - 1; i++) {
    const b1 = balls[i];
    const b2 = balls[i + 1];

    // إذا كانت إحدى الكرتين محذوفة نتجاهل الزوج بالكامل
    if (b1.removed || b2.removed) continue;

    const m1 = b1.mass;
    const m2 = b2.mass;

    // مواضع مراكز الكرتين (x, y)
    const x1 = b1.group.position.x + b1.ball.position.x;
    const y1 = b1.group.position.y + b1.ball.position.y;

    const x2 = b2.group.position.x + b2.ball.position.x;
    const y2 = b2.group.position.y + b2.ball.position.y;

 const z1 = b1.group.position.z + b1.ball.position.z;
const z2 = b2.group.position.z + b2.ball.position.z;

const dx = x2 - x1;
const dy = y2 - y1;
const dz = z2 - z1;

const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const minDist = 2 * R;

    // هل الكرتان متلامستان أو متداخلتان قليلاً؟
    if (dist <= minDist + 1e-4) {

      // تصحيح تداخل بسيط لتجنب غرق الكرات
      if (dist < minDist) {
        const penetration = minDist - dist;
        const dir = dx >= 0 ? 1 : -1;
        const correction = penetration * 0.5;

        b1.ball.position.x -= correction * dir;
        b2.ball.position.x += correction * dir;
      }

      // السرعات الخطية على المحور x (v = L * omega)
      const v1 = b1.length * b1.omega;
      const v2 = b2.length * b2.omega;

      const relV = v2 - v1;

      // إذا الكرتان تبتعدان، لا نحتاج تصادم
      if (relV >= 0) continue;

      // معادلات التصادم لجسمين بكتل m1 و m2 ومعامل ارتداد e
      const v1After = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const v2After = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);

      // تحويل السرعات الخطية إلى سرعات زاوية
      b1.omega = v1After / b1.length;
      b2.omega = v2After / b2.length;

      // عدّ التصادمات القوية فقط
      if (Math.abs(relV) > 0.25) {
        params.collisionCount++;
      }

      // تشغيل الصوت بشكل واقعي
      const speedThreshold = 0.25;
      const now = performance.now();

      if (Math.abs(relV) > speedThreshold) {
        if (!handleCollisions.lastSoundTime || now - handleCollisions.lastSoundTime > 50) {
          if (collisionSound.isPlaying) collisionSound.stop();
          collisionSound.play();
          handleCollisions.lastSoundTime = now;
        }
      }
    }
  }
//---------------------
// 2) تصادم "عبر فجوة" بين i و i+2 إذا كانت الكرة الوسطى محذوفة أو مرفوعة
for (let i = 0; i < balls.length - 2; i++) {
  const b1 = balls[i];
  const mid = balls[i + 1];
  const b2 = balls[i + 2];

  if (b1.removed || b2.removed) continue;

  // ارتفاع الكرات
  const y1   = b1.group.position.y + b1.ball.position.y;
  const yMid = mid.group.position.y + mid.ball.position.y;
  const y2   = b2.group.position.y + b2.ball.position.y;

  const R = params.ballRadius;

  // هل الكرة الوسطى تعتبر فجوة؟
  const midIsGap =
    mid.removed === true ||
    (yMid - y1 > R && yMid - y2 > R);

  if (!midIsGap) continue;

  // حساب المسافة 3D
  const x1 = b1.group.position.x + b1.ball.position.x;
  const z1 = b1.group.position.z + b1.ball.position.z;

  const x2 = b2.group.position.x + b2.ball.position.x;
  const z2 = b2.group.position.z + b2.ball.position.z;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;

  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
  const minDist = 2 * R;

  if (dist <= minDist + 1e-4) {

    // تصحيح التداخل
    if (dist < minDist) {
      const penetration = minDist - dist;
      const dir = dx >= 0 ? 1 : -1;
      const correction = penetration * 0.5;
      b1.ball.position.x -= correction * dir;
      b2.ball.position.x += correction * dir;
    }

    // حساب السرعات
    const m1 = b1.mass;
    const m2 = b2.mass;

    const v1 = b1.length * b1.omega;
    const v2 = b2.length * b2.omega;

    const relV = v2 - v1;
    if (relV >= 0) continue;

    const v1After = ((m1 - e*m2)*v1 + (1+e)*m2*v2) / (m1+m2);
    const v2After = ((m2 - e*m1)*v2 + (1+e)*m1*v1) / (m1+m2);

    b1.omega = v1After / b1.length;
    b2.omega = v2After / b2.length;

    // عدّ التصادمات
    if (Math.abs(relV) > 0.25) params.collisionCount++;

    // الصوت
    const speedThreshold = 0.25;
    const now = performance.now();
    if (Math.abs(relV) > speedThreshold) {
      if (!handleCollisions.lastSoundTime || now - handleCollisions.lastSoundTime > 50) {
        if (collisionSound.isPlaying) collisionSound.stop();
        collisionSound.play();
        handleCollisions.lastSoundTime = now;
      }
    }
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
  b.prevThetaZ = b.thetaZ;
  // تسارع زاوي من القوة الاسترجاعية
  b.alpha = -(g / b.length) * Math.sin(b.theta);
  b.omega += b.alpha * dt;
  
  // مقاومة الهواء: قوة تعاكس السرعة (Fdrag = -k v)
  b.omega -= airDrag * b.omega * dt;

  // احتكاك نقطة التعليق: عزم يعاكس السرعة الزاوية (τ = -c ω)
  b.omega -= pivotFriction * b.omega * dt;

  // تخميد عام قابل للتحكم من الواجهة
  b.omega *= params.damping;
  
  // تحديث الزاوية
  b.theta += b.omega * dt;
// تسارع زاوي في Z
b.alphaZ = -(g / b.length) * Math.sin(b.thetaZ);
b.omegaZ += b.alphaZ * dt;

// مقاومة الهواء واحتكاك نقطة التعليق في Z
b.omegaZ -= airDrag * b.omegaZ * dt;
b.omegaZ -= pivotFriction * b.omegaZ * dt;

// تخميد
b.omegaZ *= params.damping;

// تحديث الزاوية
b.thetaZ += b.omegaZ * dt;

  updateBallPosition(b);
});
// معلومات للعرض في GUI
// اختيار كرة مرجعية (مثلاً الكرة الوسطى)
const ref = balls[Math.floor(balls.length / 2)];
// حساب الزمن الدوري النظري للبندول البسيط
const T = 2 * Math.PI * Math.sqrt(ref.length / g);
params.period = T.toFixed(3);
// حساب التردد
params.frequency = (1 / T).toFixed(3);
//  حساب قوة الشد في الخيط
params.tension = (
  ref.mass * (g * Math.cos(ref.theta) + ref.length * ref.omega * ref.omega)
).toFixed(3);
// حساب الطاقة الكلية
let totalK = 0;
let totalU = 0;

balls.forEach(b => {
  const v = b.length * b.omega;
  const K = 0.5 * b.mass * v * v;
  const U = b.mass * g * b.length * (1 - Math.cos(b.theta));
  totalK += K;
  totalU += U;
});

params.kinetic = totalK.toFixed(3);
params.potential = totalU.toFixed(3);
params.energy = (totalK + totalU).toFixed(3);

// عرض نوع التصادم بناء على قيمة معامل الارتداد
params.collisionType =
  (params.collisionLoss > 0.95 ? "شبه مرن" :
   params.collisionLoss > 0.85 ? "غير مرن جزئياً" :
   "غير مرن") + ` (e=${params.collisionLoss.toFixed(2)})`;

   

// حساب زاوية وسرعة كل كرة
balls.forEach((b, i) => {
  const idx = i + 1;
  params[`theta${idx}`] = b.theta.toFixed(3);
  params[`vel${idx}`] = (b.length * b.omega).toFixed(3);
  


});
// تعديل كتلة الكرة الأولى لإظهار تأثير الكتلة المختلفة
  balls[0].mass = params.massFactor;
for (let i = 1; i < balls.length; i++) {
  balls[i].mass = 1;
}

 // تكرار حل التصادم عدة مرات لانتقال النبضة عبر الكرات الوسطى
for (let iter = 0; iter < 2; iter++) {
  handleCollisions(dt);
}

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
});///