const REPOFUSION_VERSION = "RepoFusion v2.0";

let current = 0;
let envEnabled = true;
let originalEnv = null;
let cameraEnv = null;
let envMode = "hdr";
let pmremGenerator = null;
let cameraRT = null;
let mv = null;

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

  let versionTag = document.getElementById("versionTag");

if (!versionTag) {

  versionTag = document.createElement("div");
  versionTag.id = "versionTag";

  versionTag.style.position = "fixed";
  versionTag.style.bottom = "10px";
  versionTag.style.left = "10px";
  versionTag.style.zIndex = "999999";
  versionTag.style.color = "white";
  versionTag.style.fontFamily = "Arial";
  versionTag.style.fontSize = "12px";
  versionTag.style.textShadow = "0 0 6px black";

  document.body.appendChild(versionTag);
}

versionTag.textContent = REPOFUSION_VERSION;
  
}

function destroyMV(){
  document.getElementById("mvContainer").innerHTML = "";
  mv = null;
}

function createAR(){

  const container = document.getElementById("arContainer");

  container.innerHTML = `
    <a-scene
      mindar-image="imageTargetSrc: margot_targets.mind; autoStart: true; filterMinCF: 0.0002; filterBeta: 0.004;"
      renderer="alpha: true; physicallyCorrectLights: true; colorManagement: true; exposure: 1.01; toneMapping: ACESFilmicToneMapping;"
      color-space="sRGB"
      vr-mode-ui="enabled:false"
      device-orientation-permission-ui="enabled:false">

      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>

      <a-entity mindar-image-target="targetIndex: 0">
        <a-gltf-model
          id="aframeModel"
          src="${models[current]}"
          rotation="90 0 0"
          scale="8 8 8">
        </a-gltf-model>
      </a-entity>

    </a-scene>`;

  const sceneEl = container.querySelector("a-scene");

  sceneEl.addEventListener("loaded", () => {

    console.log("A-Frame cargado");
    pmremGenerator =
  new THREE.PMREMGenerator(sceneEl.renderer);

pmremGenerator.compileEquirectangularShader();

console.log("PMREM listo");
    const prueba = document.getElementById("lightDebug");

setTimeout(() => {

  if (sceneEl.renderer) {
    prueba.style.display = "block";
    prueba.innerText = "RENDERER OK";
  } else {
    prueba.style.display = "block";
    prueba.innerText = "NO RENDERER";
  }

}, 1000);
    setTimeout(() => {

  const video = document.querySelector("video");
      if (video && window.THREE) {

  cameraEnv = new THREE.VideoTexture(video);

  cameraEnv.colorSpace = THREE.SRGBColorSpace;

  console.log("Camera texture lista");

}
  const prueba = document.getElementById("lightDebug");
prueba.style.display = "block";

  if (!video) {
    prueba.innerText = "NO VIDEO";
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const envTexture =
  new THREE.CanvasTexture(canvas);

envTexture.mapping =
  THREE.EquirectangularReflectionMapping;

  const ctx = canvas.getContext("2d");

  let smoothed = 120; // estabilidad inicial
const alpha = 0.08; // suavizado

envInterval = setInterval(() => {

  ctx.drawImage(video, 0, 0, 64, 64);
  envTexture.needsUpdate = true;
  if (pmremGenerator) {

  if (cameraRT) {
    cameraRT.dispose();
  }

  cameraRT =
    pmremGenerator.fromEquirectangular(envTexture);
    envTexture.needsUpdate = true;
    if (envMode === "cam") {

  sceneEl.object3D.environment =
    cameraRT.texture;

}

}

  const pixels = ctx.getImageData(0, 0, 64, 64).data;

  let total = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    total += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
  }

  const brightness = total / (pixels.length / 4);

  // suavizado (clave)
  smoothed = smoothed + (brightness - smoothed) * alpha;

  // mapping a exposure usable
  const exposure = 0.6 + (smoothed / 255) * 0.9;

  const scene = document.querySelector("a-scene");

  if (scene && scene.renderer) {
    scene.renderer.exposure = exposure;
  }
  if (envMode === "cam" && cameraRT) {

  scene.object3D.environment =
    cameraRT.texture;

}
  const target = document.querySelector("[mindar-image-target]");

if (target) {

  const p = target.object3D.position;
const q = target.object3D.quaternion;
const s = target.object3D.scale;

  target.object3D.matrixWorld.decompose(p, q, s);
  
  prueba.innerText =
`LIGHT ${Math.round(smoothed)} | EXP ${exposure.toFixed(2)}

PX ${p.x.toFixed(5)}
PY ${p.y.toFixed(5)}
PZ ${p.z.toFixed(5)}

SX ${s.x.toFixed(5)}

QX ${q.x.toFixed(5)}
QY ${q.y.toFixed(5)}
QZ ${q.z.toFixed(5)}
QW ${q.w.toFixed(5)}`;
}
  
}, 50);
      
}, 200);
    if (!window.THREE || !THREE.RGBELoader) {
      console.error("RGBELoader no disponible");
      return;
    }

    const loader = new THREE.RGBELoader();

    loader.load("cinema_lobby_B-N.hdr", function(hdrTexture){

      console.log("HDR cargado");

      hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

originalEnv = hdrTexture; // guardamos referencia

sceneEl.object3D.environment = hdrTexture;

      const model = document.getElementById("aframeModel");

      model.addEventListener("model-loaded", () => {

        model.object3D.traverse((obj) => {
          if (!obj.isMesh || !obj.material) return;
          obj.material.envMapIntensity = 0.9;
          obj.material.needsUpdate = true;
        });

        console.log("HDR aplicado");

      }, {once:true});

    }, undefined, function(err){
      console.error("Error HDR:", err);
    });

  }, {once:true});
}

function destroyAR(){
  if (envInterval) {
  clearInterval(envInterval);
  envInterval = null;
}
  document.getElementById("arContainer").innerHTML = "";
}

function prev(){
  current = (current - 1 + models.length) % models.length;
  updateMV();
}

function next(){
  current = (current + 1) % models.length;
  updateMV();
}

function startAR(){
  history.pushState({mode:"ar", current}, "");
  destroyMV();
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("arContainer").style.display = "block";
  createAR();
}

function stopAR(){
  destroyAR();
  document.getElementById("lightDebug").style.display = "none";
  document.querySelectorAll(".mindar-ui-scanning")
  .forEach(el => el.remove());
  document.getElementById("arContainer").style.display = "none";
  document.getElementById("startScreen").style.display = "flex";
  createMV();
}

window.addEventListener("popstate", () => stopAR());
createMV();

function toggleEnv(){

  const scene = document.querySelector("a-scene");
  const btn = document.getElementById("envToggle");

  if (!scene) return;

  if (envMode === "hdr") {

    if (cameraRT) {
  scene.object3D.environment =
    cameraRT.texture;
}

    envMode = "cam";

    btn.innerText = "Env: CAM";

  }

  else if (envMode === "cam") {

    scene.object3D.environment = null;

    envMode = "off";

    btn.innerText = "Env: OFF";

  }

  else {

    scene.object3D.environment = originalEnv;

    envMode = "hdr";

    btn.innerText = "Env: HDR";

  }
}
