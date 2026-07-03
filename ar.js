// AR module v151.1
// FASE 1: A-Frame puro SIN XR8 (para verificar que funciona antes de integrar tracking).
// version 151.1

window.RepoFusionVersions = window.RepoFusionVersions || {};
window.RepoFusionVersions.ar = "151.1";

window.AR = window.AR || {};
window.AR.isReady = false;

let originalEnv = null;
let envMode = "hdr";
let pmremGenerator = null;
let cameraRT = null;
let envInterval = null;
let envTexture = null;
let envCanvas = null;

function createARScene(modelSrc) {
  const container = document.getElementById("arContainer");
  container.style.background = "#000000";

  // Solo A-Frame, sin XR8 todavía.
  container.innerHTML = `
    <a-scene
      renderer="alpha: true; physicallyCorrectLights: true; colorManagement: true; exposure: 1.01; toneMapping: ACESFilmicToneMapping;"
      color-space="sRGB"
      vr-mode-ui="enabled:false"
      device-orientation-permission-ui="enabled:false">
      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>
      <a-entity id="trackingRoot" position="0 0 -3" rotation="90 0 0">
        <a-gltf-model id="aframeModel" src="${modelSrc}" scale="0.5 0.5 0.5"></a-gltf-model>
      </a-entity>
    </a-scene>`;

  const sceneEl = container.querySelector("a-scene");

  sceneEl.addEventListener("loaded", () => {
    console.log("A-Frame loaded (no XR8 yet)");

    pmremGenerator = new THREE.PMREMGenerator(sceneEl.renderer);
    pmremGenerator.compileEquirectangularShader();

    // HDR environment
    new THREE.RGBELoader().load("cinema_lobby_B-N.hdr", (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      originalEnv = hdr;
      sceneEl.object3D.environment = hdr;
      console.log("HDR environment loaded");
    });

  }, { once: true });
}

function destroyARScene() {
  if (envInterval) {
    clearInterval(envInterval);
    envInterval = null;
  }
  document.getElementById("arContainer").innerHTML = "";
}

function startAR(modelSrc) {
  createARScene(modelSrc);
  return Promise.resolve();
}

function stopAR() {
  destroyARScene();
}

window.AR.isReady = true;
window.AR.startAR = startAR;
window.AR.stopAR = stopAR;
window.AR.toggleEnv = function() {
  const scene = document.querySelector("a-scene");
  const btn = document.getElementById("envToggle");
  if (!scene) return;
  if (envMode === "hdr") {
    scene.object3D.environment = null;
    envMode = "off";
    btn.innerText = "Env: OFF";
  } else {
    scene.object3D.environment = originalEnv;
    envMode = "hdr";
    btn.innerText = "Env: HDR";
  }
};
