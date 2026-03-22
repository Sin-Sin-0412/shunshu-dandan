import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export let scene, camera;
let actionChara, actionWind;
let headBone;
let mixer;

const params = {
  skyColor: "#abc8e2",
  groundColor: "#928a63",
  sunColor: "#fff4e0",
  fogColor: "#bdf2ff",
};

export function initWorld(canvas, onReady) {
  const manager = new THREE.LoadingManager();
  manager.onLoad = () => {
    if (onReady) onReady();
  };

  scene = new THREE.Scene();

  scene.fog = new THREE.Fog(params.fogColor, 15.58, 85.59);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(4.26, 11.58, 13.38);
  camera.lookAt(-0.12, 6.5, -0.33);

  const textureLoader = new THREE.TextureLoader();
  const bgTexture = textureLoader.load("image/haikei_v2.jpg");

  const bgGeometry = new THREE.PlaneGeometry(50, 50);
  const bgMaterial = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.DoubleSide,
    fog: false,
  });

  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.position.set(-8.52, 8.2, -27.66);

  scene.add(bgMesh);

  const hemiLight = new THREE.HemisphereLight(
    params.skyColor,
    params.groundColor,
    1.1,
  );
  scene.add(hemiLight);


  const dirLight = new THREE.DirectionalLight(params.sunColor, 9);
  dirLight.position.set(-10.56, 23.34, -24.6);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = 0.0005;
  dirLight.shadow.normalBias = 0.05;
  dirLight.shadow.camera.top = 14;
  dirLight.shadow.camera.bottom = -14;
  dirLight.shadow.camera.left = -14;
  dirLight.shadow.camera.right = 14;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 50;

  dirLight.target.position.set(0, 7.78, 0);
  scene.add(dirLight.target);
  scene.add(dirLight);


  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
  );

  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);

  loader.load("./model/stairs-v2.glb", (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    model.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        object.frustumCulled = false;

        if (object.name.includes("akira")) {
          object.geometry.computeVertexNormals();
          if (object.material) {
            object.material.flatShading = false;
            object.material.needsUpdate = true;
          }
        }

        if (object.name === "door_glass") {
          if (object.material) {
            object.material.transparent = true;
            object.material.opacity = 0.45;
            object.material.needsUpdate = true;
          }
        }
      }

      if (object.isBone && object.name === "atama") {
        headBone = object;
      }
    });

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);

      const windClip = gltf.animations.find((clip) => clip.name === "wind");
      const charaClip = gltf.animations.find((clip) => clip.name === "chara");

      if (charaClip) {
        actionChara = mixer.clipAction(charaClip);
        actionChara.play();
      }

      if (windClip) {
        actionWind = mixer.clipAction(windClip);
        actionWind.setEffectiveWeight(0);
        actionWind.play();
      }

      scheduleNextWind();
      scheduleNextHeadMove();
    }
  });

}


function scheduleNextHeadMove() {
  
  const delay = Math.random() * 20000 + 20000;

  setTimeout(() => {
    const mode = Math.random() > 0.3 ? "right" : "left";

    if (mode === "right") {
      triggerHeadMove();
    } else {
      triggerHeadMoveLeft();
    }
  }, delay);
}


function triggerHeadMove() {
  if (!headBone) return;
  gsap.killTweensOf(headBone.rotation);

  const tl = gsap.timeline({
    onComplete: () => scheduleNextHeadMove(), 
  });

  tl.to(headBone.rotation, { y: -1, duration: 1.5, ease: "power2.inOut" });
  tl.to({}, { duration: 3.0 });
  tl.to(headBone.rotation, { y: 0, duration: 1.5, ease: "power1.inOut" });
}

function triggerHeadMoveLeft() {
  if (!headBone) return;
  gsap.killTweensOf(headBone.rotation);

  const tl = gsap.timeline({
    onComplete: () => scheduleNextHeadMove(), 
  });

  tl.to(headBone.rotation, { y: 0.7, duration: 1.5, ease: "power2.inOut" });
  tl.to({}, { duration: 4.0 });
  tl.to(headBone.rotation, { y: 0, duration: 1.5, ease: "power1.inOut" });
}


function scheduleNextWind() {
  const delay = Math.random() * 10000 + 5000;

  setTimeout(() => {
    triggerWind();
  }, delay);
}

function triggerWind() {
  if (!actionChara || !actionWind) return;

  actionWind.enabled = true;
  actionWind.setEffectiveWeight(1);
  actionWind.fadeIn(1);

  setTimeout(() => {
    actionWind.fadeOut(1);
    scheduleNextWind();
  }, 3000);
}

export function updateWorld(delta) {
  if (mixer) {
    mixer.update(delta);
  }
}


const playlist = [
  {
    title: "All of Everything",
    artist: "Katy Kirby",
    url: "./audio/Katy Kirby - All of Everything.mp3",
  },
  {
    title: "Clearing Houses",
    artist: "Portraya",
    url: "./audio/Portrayal - Clearing Houses_v2.mp3",
  },
  {
    title: "lost love letters",
    artist: "Fog Lake",
    url: "./audio/Fog Lake - lost love letters_v4.mp3",
  },
];

let currentAudio = new Audio();
let currentIndex = -1;

export function setupUI() {
  const player = document.getElementById("music-player");
  const creditsPopup = document.getElementById("credits-popup");
  const trackItems = document.querySelectorAll(".track-item");

  function togglePanel(panel, filterId) {
    const blurElement = document.querySelector(`#${filterId} feGaussianBlur`);
    const matrixElement = document.querySelector(`#${filterId} feColorMatrix`);

    const isOpening = !panel.classList.contains("is-open");
    panel.classList.toggle("is-open");

    gsap.killTweensOf([panel, blurElement, matrixElement]);

    if (isOpening) {
      panel.style.visibility = "visible";

      gsap.to(panel, {
        opacity: 0.5,
        duration: 1.2,
        ease: "power2.out",
      });
      gsap.to(blurElement, {
        attr: { stdDeviation: 0 },
        duration: 1,
        ease: "power2.out",
      });

      const proxy = { contrast: 90, bias: -10 };
      gsap.to(proxy, {
        contrast: 1,
        bias: 0,
        duration: 1,
        ease: "power2.out",
        onUpdate: () =>
          matrixElement.setAttribute(
            "values",
            `0.5 0 0.6 0 0  0 1.5 0 0 0  0 0 1.9 0 0  0 0 0 ${proxy.contrast} ${proxy.bias}`,
          ),
      });
    } else {
      gsap.to(panel, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
          panel.style.visibility = "hidden";
        },
      });
      gsap.to(blurElement, {
        attr: { stdDeviation: 10 },
        duration: 0.8,
        ease: "power2.in",
      });

      const proxy = { contrast: 1, bias: 0 };
      gsap.to(proxy, {
        contrast: 20,
        bias: -10,
        duration: 0.8,
        ease: "power2.in",
        onUpdate: () =>
          matrixElement.setAttribute(
            "values",
            `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${proxy.contrast} ${proxy.bias}`,
          ),
      });
    }
  }


  document.getElementById("sound-trigger").onclick = (e) => {
    e.stopPropagation();
    togglePanel(player, "misty-player");
  };

  document.getElementById("credits-trigger").onclick = (e) => {
    e.stopPropagation();
    togglePanel(creditsPopup, "misty-credits");
  };

  window.onclick = () => {
    if (player.classList.contains("is-open"))
      togglePanel(player, "misty-player");
    if (creditsPopup.classList.contains("is-open"))
      togglePanel(creditsPopup, "misty-credits");
  };

  player.onclick = (e) => e.stopPropagation();
  creditsPopup.onclick = (e) => e.stopPropagation();

  trackItems.forEach((item, index) => {
    item.onclick = (e) => {
      e.stopPropagation();
      if (currentIndex === index) {
        if (currentAudio.paused) {
          currentAudio.play();
          item.classList.add("playing");
        } else {
          currentAudio.pause();
          item.classList.remove("playing");
        }
      } else {
        trackItems.forEach((i) => i.classList.remove("playing"));
        currentIndex = index;
        currentAudio.src = playlist[index].url;
        currentAudio.play();
        item.classList.add("playing");
      }
    };

    const resetBtn = item.querySelector(".reset-btn");

    resetBtn.onclick = (e) => {
      e.stopPropagation(); 

      if (currentIndex === index) {
        currentAudio.currentTime = 0;
      } else {
        currentIndex = index;
        currentAudio.src = playlist[index].url;
        currentAudio.currentTime = 0;
        currentAudio.play();

        trackItems.forEach((i) => i.classList.remove("playing"));
        item.classList.add("playing");
      }
    };
  });
}
