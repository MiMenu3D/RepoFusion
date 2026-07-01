// Menu module v1.2
// Generated as part of the AR refactor.
// version 1.2 TimeTravelx12
// Menu principal y UI general
window.RepoFusion = window.RepoFusion || {};
window.RepoFusion.pose = {
  camera: null,
  marker: null,
  intrinsics: null,
  tracking: "waiting"
};

window.RepoFusion.setPose = function (data) {
  if (!data) return;
  window.RepoFusion.pose.camera = data.camera || null;
  window.RepoFusion.pose.marker = data.marker || null;
  window.RepoFusion.pose.intrinsics = data.intrinsics || null;
  window.RepoFusion.pose.tracking = data.tracking || "unknown";
};

let current = 0;
let mv = null;
const APP_VERSION = "3.4-dreamteam";
const models = [
  "Plato_01.glb","Plato_02.glb","Plato_03.glb","Plato_04.glb",
  "Plato_05.glb","Plato_06.glb","Plato_07.glb","Plato_08.glb",
  "Plato_09.glb","Plato_10.glb","Plato_11.glb","Plato_12.glb",
  "Plato_13.glb","Plato_14.glb","Plato_15.glb"
];

function createMV(){
  const container = document.getElementById("mvContainer");
  container.innerHTML = `
    <model-viewer
      id="mv"
      src="${models[current]}"
      autoplay
      auto-rotate
      auto-rotate-delay="0"
      rotation-per-second="17deg"
      camera-orbit="0deg 70deg 45%"
      min-camera-orbit="0deg 0deg 45%"
      max-camera-orbit="360deg 90deg 45%"
      camera-controls="false"
      touch-action="none"
      disable-pan
      disable-zoom
      interaction-prompt="none"
      shadow-intensity="0.4"
      exposure="0.80"
      style="background-color:#1f1a17;">
    </model-viewer>`;

  mv = document.getElementById("mv");
  mv.addEventListener("load", () => mv.style.opacity = "1", {once:true});
  document.getElementById("label").innerText = "Plato " + (current + 1);
}

function updateMV(){
  if (!mv) return;
  mv.style.opacity = "0";
  mv.setAttribute("src", models[current]);
  mv.addEventListener("load", () => mv.style.opacity = "1", {once:true});
  document.getElementById("label").innerText = "Plato " + (current + 1);
}

function destroyMV(){
  document.getElementById("mvContainer").innerHTML = "";
  mv = null;
}

function prev(){
  current = (current - 1 + models.length) % models.length;
  if (!mv) {
    createMV();
  }
  updateMV();
}

function next(){
  current = (current + 1) % models.length;
  if (!mv) {
    createMV();
  }
  updateMV();
}

function ensureARModule() {
  return new Promise((resolve, reject) => {
    if (window.AR && window.AR.isReady) {
      return resolve(window.AR);
    }

    const existing = document.getElementById("arModuleScript");
    const finish = () => {
      if (window.AR && window.AR.isReady) {
        resolve(window.AR);
      } else {
        reject(new Error("AR module failed to initialize."));
      }
    };

    if (existing) {
      if (existing.readyState === "complete" || existing.readyState === "loaded") {
        return finish();
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load ar.js")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "arModuleScript";
    script.src = "ar.js";
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("Failed to load ar.js"));
    document.body.appendChild(script);
  });
}

function startAR() {
  // 1. Crear el contenedor de la escena directamente
  const container = document.getElementById("arContainer");
  container.style.display = "block";
  container.innerHTML = `
    <a-scene 
      mindar-image="imageTargetSrc: margot_targets.mind; autoStart: true; filterMinCF: 0.0002; filterBeta: 0.004;" 
      renderer="alpha: true; physicallyCorrectLights: true; colorManagement: true; exposure: 1.01; toneMapping: ACESFilmicToneMapping;" 
      vr-mode-ui="enabled:false">
      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>
      <a-entity id="trackingRoot" mindar-image-target="targetIndex: 0">
        <a-gltf-model id="aframeModel" src="${models[current]}" rotation="90 0 0" scale="8 8 8"></a-gltf-model>
      </a-entity>
    </a-scene>`;

  // 2. Configurar el PMREM y eventos tras la carga
  const sceneEl = container.querySelector("a-scene");
  sceneEl.addEventListener("loaded", () => {
    // Aquí iría tu lógica de PMREM y el bucle de luces que ya funciona
    console.log("Escena A-Frame montada y lista para PMREM");
    
    // --- Inicio bloque PMREM y Luces ---
    pmremGenerator = new THREE.PMREMGenerator(sceneEl.renderer);
    pmremGenerator.compileEquirectangularShader();

    const waitForVideo = setInterval(() => {
      const candidate = document.querySelector("video");
      if (candidate && candidate.readyState >= 2) {
        clearInterval(waitForVideo);
        const video = candidate;
        video.style.position = "fixed";
        video.style.top = "0"; video.style.left = "0";
        video.style.width = "100%"; video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.zIndex = "50";
        
        const envCanvas = document.createElement("canvas");
        envCanvas.width = 64; envCanvas.height = 64;
        const envTexture = new THREE.CanvasTexture(envCanvas);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        const ctx = envCanvas.getContext("2d");
        let smoothed = 120;

        window.envInterval = setInterval(() => {
          if (!video || video.readyState < 2) return;
          ctx.drawImage(video, 0, 0, 64, 64);
          envTexture.needsUpdate = true;
          if (pmremGenerator) {
            const cameraRT = pmremGenerator.fromEquirectangular(envTexture);
            // Si el modo es cam, aplicar textura al entorno
            sceneEl.object3D.environment = cameraRT.texture;
            cameraRT.dispose();
          }
        }, 50);
      }
    }, 500);

    new THREE.RGBELoader().load("cinema_lobby_B-N.hdr", (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      sceneEl.object3D.environment = hdr;
    });
// --- Fin bloque PMREM ---

  }, {once: true});

  destroyMV();
  document.getElementById("startScreen").style.display = "none";
}

function destroyAR() {
  if (window.envInterval) {
    clearInterval(window.envInterval);
    window.envInterval = null;
  }
  document.getElementById("arContainer").innerHTML = "";
}

function stopAR() {
  // 1. Limpieza total llamando a la función específica
  destroyAR();
  document.getElementById("arContainer").style.display = "none";

  // 2. Restaurar menú
  document.getElementById("startScreen").style.display = "flex";
  createMV();
}
