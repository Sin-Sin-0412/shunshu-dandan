import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { initWorld, updateWorld, setupUI, scene, camera } from './world.js';
import { createIntroController } from './animation.js'; 

let renderer, clock, composer;
let bloomPass, bokehPass, filmPass;
let baseCameraPos = new THREE.Vector3();
let cameraTime = 0;
let uiPos = {x: 0, y: 0, z: 0}; 
const uiElement = document.getElementById("ui-layer");
let isLoaded = false;
let minTimePassed = false;
const isMobile = window.innerWidth < 768;
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);


function init(){
  const canvas = document.querySelector("#canvas");

  clock = new THREE.Clock();

  if (isSafari) {
    const turbulence = document.querySelector('#erosion-filter feTurbulence');
    if (turbulence) {
      turbulence.setAttribute('numOctaves', '1');
    }
  }

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: isSafari ? false : true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 0.3;

  const intro = createIntroController();


  initWorld(canvas, () => {
    isLoaded = true;
    checkAndStart();
  });

  setTimeout(() => {
    minTimePassed = true;
    checkAndStart();
  }, 500);

  function checkAndStart() {
    if (isLoaded && minTimePassed) {
      intro.start();
    }
  }


  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);


  bokehPass = new BokehPass(scene, camera,{
    focus: 25.8,
    aperture: 0.0006,
    maxblur: 0.0029
  });

  composer.addPass(bokehPass);


  bloomPass = new UnrealBloomPass(
    undefined, 
    0.272, 
    0.751, 
    0.241
  );
  composer.addPass(bloomPass);

  function animateBloom() {
    gsap.to(bloomPass, {
      strength: 0.4,
      duration: gsap.utils.random(2, 12),
      repeat: 1,
      yoyo: true,
      ease: "sine.inOut",
      onComplete: ()=>{
        const nextDelay = gsap.utils.random(10, 20);
        gsap.delayedCall(nextDelay, animateBloom);
      }
    });
  }

  animateBloom();

  const noiseIntensity = isMobile ? 1 : 1.5;
  filmPass = new FilmPass(
    noiseIntensity,
    0,
    0,
    false
  );
  composer.addPass(filmPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  window.addEventListener("resize", onWindowResize);
  adjustCamera(window.innerWidth, window.innerHeight);
  setupUI();

  tick();
}


function adjustCamera(width, height) {
  const aspect = width / height;
  camera.aspect = aspect;

  const config = {
    mobile: {
      fov: 60,
      x: 3.8,
      y: 10.5,
      z: 13.38,
    },

    desktop: {
      fov: 55,
      x: 4.26,
      y: 11.58,
      z: 13.38,
    },

    ultrawide: {
      fov: 48,
      x: 4.26,
      y: 11.58,
      z: 13.38,
    },
  };

  const minAspect = 1.77;
  const maxAspect = 2.5;

  let targetFov, targetX, targetY, targetZ;
  let targetLookX, targetLookY, targetLookZ;

  if (aspect < 1) {
    targetFov = config.mobile.fov;
    targetX = config.mobile.x;
    targetY = config.mobile.y;
    targetZ = config.mobile.z;
  } else if (aspect <= minAspect) {
    targetFov = config.desktop.fov;
    targetX = config.desktop.x;
    targetY = config.desktop.y;
    targetZ = config.desktop.z;
  } else if (aspect >= maxAspect) {
    targetFov = config.ultrawide.fov;
    targetX = config.ultrawide.x;
    targetY = config.ultrawide.y;
    targetZ = config.ultrawide.z;
  } else {
    const t = (aspect - minAspect) / (maxAspect - minAspect);

    const lerp = (start, end, t) => start + (end - start) * t;

    targetFov = lerp(config.desktop.fov, config.ultrawide.fov, t);
    targetX = lerp(config.desktop.x, config.ultrawide.x, t);
    targetY = lerp(config.desktop.y, config.ultrawide.y, t);
    targetZ = lerp(config.desktop.z, config.ultrawide.z, t);
  }

  if (aspect > 2.5) {
    const vFovRad = (config.ultrawide.fov * Math.PI) / 180;
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * maxAspect);

    targetFov = (2 * Math.atan(Math.tan(hFovRad / 2) / aspect) * 180) / Math.PI;

    targetX = config.ultrawide.x;
    targetY = config.ultrawide.y;
    targetZ = config.ultrawide.z;
  }

  camera.fov = targetFov;
  baseCameraPos.set(targetX, targetY, targetZ);
  camera.position.copy(baseCameraPos); 

  camera.updateProjectionMatrix();
}

function onWindowResize(){
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  adjustCamera(width, height);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function tick(){
  const delta = clock.getDelta();

  if (isLoaded && minTimePassed) {

  updateWorld(delta);

  if (camera) {
    cameraTime += delta;

    const speed = 0.4; 
    const amp = 0.03;  

    const noiseX = (Math.sin(cameraTime * speed) + Math.sin(cameraTime * speed * 2.3) * 0.5) * amp;
    const noiseY = (Math.sin(cameraTime * speed * 1.2) + Math.sin(cameraTime * speed * 1.5) * 0.5) * amp;
    const noiseZ = (Math.cos(cameraTime * speed * 0.8) + Math.cos(cameraTime * speed * 0.7) * 0.5) * amp;

    camera.position.x = baseCameraPos.x + noiseX;
    camera.position.y = baseCameraPos.y + noiseY;
    camera.position.z = baseCameraPos.z + noiseZ;

    const targetPos = new THREE.Vector3(-0.12, 6.5, -0.33);
    camera.lookAt(targetPos);

    const targetUIX = noiseX * 50;
    const targetUIY = noiseY * 50;

    uiPos.x += (targetUIX - uiPos.x) * 0.05;
    uiPos.y += (targetUIY - uiPos.y) * 0.05;

    uiElement.style.transform = `translate(${uiPos.x}px, ${-uiPos.y}px) translateZ(0)`;
  }

    if (scene && camera) {
      composer.render(); 
    }
  }
  window.requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", init);