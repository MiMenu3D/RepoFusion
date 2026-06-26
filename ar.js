// AR module v150.4
// Generated as part of the AR refactor.
// version 150.4

window.RepoFusionVersions = window.RepoFusionVersions || {};
window.RepoFusionVersions.ar = "150.4";

window.AR = window.AR || {};
window.AR.isReady = false;

let envEnabled = true;
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
      const onXRLoaded = () => resolve(window.XR8);
      if (window.XR8) {
        resolve(window.XR8);
      } else {
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
  container.innerHTML = `
    <a-scene
      xrweb
      xrconfig="cameraDirection: back; delayRun: true"
      renderer="alpha: true; physicallyCorrectLights: true; colorManagement: true; exposure: 1.01; toneMapping: ACESFilmicToneMapping;"
      color-space="sRGB"
      embedded
      vr-mode-ui="enabled:false"
      device-orientation-permission-ui="enabled:false">
      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>
      <a-entity id="trackingRoot">
        <a-gltf-model id="aframeModel" src="${modelSrc}" rotation="90 0 0" scale="8 8 8"></a-gltf-model>
      </a-entity>
    </a-scene>`;

  const sceneEl = container.querySelector("a-scene");
  sceneEl.addEventListener("loaded", () => {
    if (arIntervalId) {
      clearInterval(arIntervalId);
    }
    arIntervalId = setInterval(() => {
      const root = document.getElementById("trackingRoot");
      if (!root || !window.RepoFusion || !window.RepoFusion.pose.marker) return;
      const marker = window.RepoFusion.pose.marker;
      if (!marker.position || !marker.rotation) return;
      root.object3D.position.set(marker.position.x, marker.position.y, marker.position.z);
      root.object3D.quaternion.set(marker.rotation.x, marker.rotation.y, marker.rotation.z, marker.rotation.w);
    }, 30);

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

    new THREE.RGBELoader().load("cinema_lobby_B-N.hdr", (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      originalEnv = hdr;
      sceneEl.object3D.environment = hdr;
    });

    if (sceneEl.hasLoaded) {
      sceneEl.emit("runreality");
    } else {
      sceneEl.addEventListener("loaded", () => sceneEl.emit("runreality"), { once: true });
    }
  }, {once:true});
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
  return waitForXR8().then(() => {
    createARScene(modelSrc);
  });
}

function stopAR() {
  if (window.XR8) {
    try { window.XR8.pause(); } catch (err) { console.warn("XR8.pause failed:", err); }
    try { window.XR8.stop(); } catch (err) { console.warn("XR8.stop failed:", err); }
    if (window.XR8.clearCameraPipelineModules) {
      try { window.XR8.clearCameraPipelineModules(); } catch (err) { console.warn("XR8.clearCameraPipelineModules failed:", err); }
    }
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
