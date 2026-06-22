// Versión v83.0

// =====================================================
// RepoFusion bridge listener
// Este bloque es el mismo que estaba en el aframe.html original para recibir datos del bridge.js
// =====================================================

window.RepoFusion = window.RepoFusion || {};

window.RepoFusion.pose = {
  camera: null,
  marker: null,
  intrinsics: null,
  tracking: "waiting"
};

window.RepoFusion.setPose = function (data) {

  if (!data) return;

  window.RepoFusion.pose.camera =
    data.camera || null;

  window.RepoFusion.pose.marker =
    data.marker || null;

  window.RepoFusion.pose.intrinsics =
    data.intrinsics || null;

  window.RepoFusion.pose.tracking =
    data.tracking || "unknown";
};

// =====================================================
// Lógica de la aplicación A-Frame (originalmente de aframe.html)
// =====================================================

let current = 0;
let envEnabled = true;
let originalEnv = null;
let cameraEnv = null;
let envMode = "hdr";
let pmremGenerator = null;
let cameraRT = null;
let mv = null;
let envInterval = null; // Inicializar envInterval aquí

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

function createAR(){

  const container = document.getElementById("arContainer");

  // Eliminamos mindar-image del a-scene y mindar-image-target
  container.innerHTML = `
    <a-scene
      renderer="alpha: true; physicallyCorrectLights: true; colorManagement: true; exposure: 1.01; toneMapping: ACESFilmicToneMapping;"
      color-space="sRGB"
      vr-mode-ui="enabled:false"
      device-orientation-permission-ui="enabled:false">

      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>

      <a-entity id="trackingRoot">
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
    // Asumiendo que THREE está disponible globalmente
    pmremGenerator = new THREE.PMREMGenerator(sceneEl.renderer);
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

      // Aquí necesitamos obtener el video de la cámara de 8th Wall
      const video = document.querySelector("video"); // 8th Wall inyecta un video elemento
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
      const envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;

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
          cameraRT = pmremGenerator.fromEquirectangular(envTexture);
          envTexture.needsUpdate = true;
          if (envMode === "cam") {
            sceneEl.object3D.environment = cameraRT.texture;
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
          scene.object3D.environment = cameraRT.texture;
        }

        const trackingRoot = document.getElementById("trackingRoot");

        // Aquí usaremos los datos de window.RepoFusion.pose para posicionar el trackingRoot
        if (trackingRoot && window.RepoFusion && window.RepoFusion.pose.tracking === "found") {
            const p = window.RepoFusion.pose.marker.position;
            const q = window.RepoFusion.pose.marker.rotation;
            const s = window.RepoFusion.pose.marker.scale;

            // 8th Wall y A-Frame tienen diferentes sistemas de coordenadas.
            // Necesitamos aplicar una rotación para alinear el eje Z hacia arriba en A-Frame (que es Y-up por defecto)
            // Esto es una rotación de -90 grados en X, y luego aplicar la rotación de 8th Wall.
            // Para simplificar, vamos a aplicar directamente la rotación del marcador de 8th Wall,
            // y si el modelo está "mal" girado, lo ajustaremos en el a-gltf-model directamente.

            // Posición: 8th Wall reporta Y-up, A-Frame también es Y-up. Debería ser directo, pero quizás haya un offset.
            // Por ahora, usamos el position tal cual, y ajustamos rotación del modelo.
            trackingRoot.object3D.position.set(p.x, p.y, p.z);
            trackingRoot.object3D.quaternion.set(q.x, q.y, q.z, q.w);
            trackingRoot.object3D.scale.setScalar(s); // Asumimos escala uniforme

             prueba.innerText =
`TRACKING: ${window.RepoFusion.pose.tracking}
LIGHT ${Math.round(smoothed)} | EXP ${exposure.toFixed(2)}

PX ${p.x.toFixed(5)}
PY ${p.y.toFixed(5)}
PZ ${p.z.toFixed(5)}

SX ${s.toFixed(5)}

QX ${q.x.toFixed(5)}
QY ${q.y.toFixed(5)}
QZ ${q.z.toFixed(5)}
QW ${q.w.toFixed(5)}`;

        } else if (trackingRoot) {
          // Si no hay tracking, podemos ocultar el modelo o ponerlo en una posición neutral
          // O dejarlo como está si queremos que aparezca solo cuando encuentra el marcador
          // Por ahora, si no hay tracking, no actualizamos la posición.
            prueba.innerText =
`TRACKING: ${window.RepoFusion.pose.tracking}
LIGHT ${Math.round(smoothed)} | EXP ${exposure.toFixed(2)}`;
        }


      }, 50);

    }, 200);

    // THREE.RGBELoader debe estar disponible globalmente
    if (!window.THREE || !THREE.RGBELoader) {
      console.error("RGBELoader no disponible");
      return;
    }

    const loader = new THREE.RGBELoader();

    loader.load("terrace_sea.hdr", function(hdrTexture){ // Usamos terrace_sea.hdr
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
  console.log("RepoFusion v83.0 - startAR"); // Actualizado para versión
  createAR();
}

function stopAR(){
  destroyAR();
  document.getElementById("lightDebug").style.display = "none";
  document.querySelectorAll(".mindar-ui-scanning") // Mantener esto para limpiar si MindAR deja algo
  .forEach(el => el.remove());
  document.getElementById("arContainer").style.display = "none";
  document.getElementById("startScreen").style.display = "flex";
  createMV();
}

window.addEventListener("popstate", () => stopAR());

// La llamada inicial a createMV() se hará desde index.html para asegurar que el DOM está listo.
// createMV();
