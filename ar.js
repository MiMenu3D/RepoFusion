// AR module v151.0
// Arquitectura dual-canvas:
//   - xr8Canvas (z-index 0): XR8 renderiza solo el feed de cámara, provee tracking vía bridge
//   - a-scene   (z-index 1): A-Frame artesanal con alpha:true, HDR y light estimation
// Sin xrweb → A-Frame es completamente nuestro.
// version 151.0

window.RepoFusionVersions = window.RepoFusionVersions || {};
window.RepoFusionVersions.ar = "151.0";

window.AR = window.AR || {};
window.AR.isReady = false;

let originalEnv = null;
let cameraEnv = null;
let envMode = "hdr";
let pmremGenerator = null;
let cameraRT = null;
let envInterval = null;
let arIntervalId = null;
let xrLoadPromise = null;
let envTexture = null;
let envCanvas = null;
let video = null;

function loadScript({ id, src, async = false, attrs = {} }) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = async;
  Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
  document.body.appendChild(script);
}

function loadXR8Assets() {
  loadScript({ id: "runtimeScript", src: "./external/runtime/runtime.js" });
  loadScript({ id: "xrScript", src: "./external/xr/xr.js", async: true, attrs: { "data-preload-chunks": "face, slam" } });
  loadScript({ id: "bundleScript", src: "bundle.js" });
  loadScript({ id: "bridgeScript", src: "bridge.js?t=" + Date.now() });
}

function waitForXR8() {
  if (!xrLoadPromise) {
    xrLoadPromise = new Promise((resolve) => {
      if (window.XR8) {
        resolve(window.XR8);
      } else {
        const onXRLoaded = () => resolve(window.XR8);
        window.addEventListener("xrloaded", onXRLoaded, { once: true });
        window.addEventListener("XRloaded", onXRLoaded, { once: true });
      }
    });
  }
  return xrLoadPromise;
}

function createARScene(modelSrc) {
  const container = document.getElementById("arContainer");
  container.style.background = "transparent";

  // xr8Canvas: 8th Wall renderiza aquí el feed de cámara (z-index 0, debajo de todo)
  // a-scene: A-Frame artesanal con fondo transparente encima (z-index 1)
  container.innerHTML = `
    <canvas id="xr8Canvas" style="position:fixed; inset:0; width:100%; height:100%; z-index:0;"></canvas>
    <a-scene
      renderer="alpha: true; physicallyCorrectLights: true; colorManagement: true; exposure: 1.01; toneMapping: ACESFilmicToneMapping;"
      color-space="sRGB"
      embedded
      vr-mode-ui="enabled:false"
      device-orientation-permission-ui="enabled:false"
      style="position:fixed; inset:0; z-index:1;">
      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>
      <a-entity id="trackingRoot" visible="false">
        <a-gltf-model id="aframeModel" src="${modelSrc}" rotation="90 0 0" scale="8 8 8"></a-gltf-model>
      </a-entity>
    </a-scene>`;

  const sceneEl = container.querySelector("a-scene");

  sceneEl.addEventListener("loaded", () => {

    // --- Tracking: leer del bridge cada 30ms ---
    arIntervalId = setInterval(() => {
      const root = document.getElementById("trackingRoot");
      if (!root || !window.RepoFusion) return;
      const marker = window.RepoFusion.pose.marker;
      if (marker && marker.position && marker.rotation) {
        root.setAttribute("visible", "true");
        root.object3D.position.set(marker.position.x, marker.position.y, marker.position.z);
        root.object3D.quaternion.set(marker.rotation.x, marker.rotation.y, marker.rotation.z, marker.rotation.w);
      } else {
        root.setAttribute("visible", "false");
      }
    }, 30);

    // --- Light estimation con video de cámara ---
    pmremGenerator = new THREE.PMREMGenerator(sceneEl.renderer);
    pmremGenerator.compileEquirectangularShader();

    const waitForVideo = setInterval(() => {
      const candidate = document.querySelector("video");
      if (candidate && candidate.readyState >= 2) {
        clearInterval(waitForVideo);
        video = candidate;
        cameraEnv = new THREE.VideoTexture(video);
        cameraEnv.colorSpace = THREE.SRGBColorSpace;

        envCanvas = document.createElement("canvas");
        envCanvas.width = 64;
        envCanvas.height = 64;
        envTexture = new THREE.CanvasTexture(envCanvas);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        const ctx = envCanvas.getContext("2d");
        let smoothed = 120;

        envInterval = setInterval(() => {
          if (!video || video.readyState < 2) return;
          ctx.drawImage(video, 0, 0, 64, 64);
          envTexture.needsUpdate = true;
          if (pmremGenerator) {
            if (cameraRT) cameraRT.dispose();
            cameraRT = pmremGenerator.fromEquirectangular(envTexture);
            if (envMode === "cam") sceneEl.object3D.environment = cameraRT.texture;
          }
          const pixels = ctx.getImageData(0, 0, 64, 64).data;
          let total = 0;
          for (let i = 0; i < pixels.length; i += 4) total += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          const brightness = total / (pixels.length / 4);
          smoothed = smoothed + (brightness - smoothed) * 0.08;
          const exposure = 0.6 + (smoothed / 255) * 0.9;
          if (sceneEl.renderer) sceneEl.renderer.exposure = exposure;
        }, 50);
      }
    }, 500);

    // --- HDR environment ---
    new THREE.RGBELoader().load("cinema_lobby_B-N.hdr", (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      originalEnv = hdr;
      sceneEl.object3D.environment = hdr;
    });

    // --- Arrancar XR8 en su propio canvas para tracking ---
    // bridge.js ya añadió su pipeline module en xrloaded.
    // Añadimos GlTextureRenderer (feed de cámara en xr8Canvas) + XrController (image tracking).
    waitForXR8().then(() => {
      const xr8Canvas = document.getElementById("xr8Canvas");
      XR8.addCameraPipelineModule(XR8.GlTextureRenderer.pipelineModule());
      XR8.addCameraPipelineModule(XR8.XrController.pipelineModule());
      XR8.run({
        canvas: xr8Canvas,
        cameraConfig: { direction: "back" }
      });
    });

  }, { once: true });
}

function destroyARScene() {
  if (envInterval) {
    clearInterval(envInterval);
    envInterval = null;
  }
  if (arIntervalId) {
    clearInterval(arIntervalId);
    arIntervalId = null;
  }
  document.getElementById("arContainer").innerHTML = "";
}

function startAR(modelSrc) {
  loadXR8Assets();
  createARScene(modelSrc);
  return Promise.resolve();
}

function stopAR() {
  if (window.XR8) {
    try { window.XR8.pause(); } catch (err) { console.warn("XR8.pause failed:", err); }
    try { window.XR8.stop(); } catch (err) { console.warn("XR8.stop failed:", err); }
    if (window.XR8.clearCameraPipelineModules) {
      try { window.XR8.clearCameraPipelineModules(); } catch (err) { console.warn("XR8.clearCameraPipelineModules failed:", err); }
    }
    xrLoadPromise = null;
    const mediaNodes = document.querySelectorAll("video, canvas");
    mediaNodes.forEach((node) => {
      if (node.tagName === "VIDEO") {
        try { node.srcObject = null; } catch (err) { console.warn("clear video srcObject failed", err); }
      }
      if (!node.closest("#mvContainer")) {
        node.remove();
      }
    });
  }
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
    if (cameraRT) scene.object3D.environment = cameraRT.texture;
    envMode = "cam";
    btn.innerText = "Env: CAM";
  } else if (envMode === "cam") {
    scene.object3D.environment = null;
    envMode = "off";
    btn.innerText = "Env: OFF";
  } else {
    scene.object3D.environment = originalEnv;
    envMode = "hdr";
    btn.innerText = "Env: HDR";
  }
};
