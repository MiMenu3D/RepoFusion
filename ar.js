// ar.js - Monolito de AR (8th Wall + A-Frame)
window.initAR = (modelSrc) => {
  const container = document.getElementById("arContainer");
  container.innerHTML = `
    <a-scene
      xrweb
      xrconfig="cameraDirection: back; delayRun: true"
      renderer="alpha: true; physicallyCorrectLights: true; colorManagement: true; exposure: 1.01; toneMapping: ACESFilmicToneMapping;"
      color-space="sRGB"
      embedded
      vr-mode-ui="enabled:false">
      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>
      <a-entity id="trackingRoot">
        <a-gltf-model src="${modelSrc}" rotation="90 0 0" scale="8 8 8"></a-gltf-model>
      </a-entity>
    </a-scene>`;

  const sceneEl = container.querySelector("a-scene");
  sceneEl.addEventListener("loaded", () => {
    sceneEl.emit("runreality");
  }, {once: true});
};

window.cleanupAR = () => {
  if (window.XR8) {
    try { window.XR8.stop(); } catch (e) {}
  }
  const scene = document.querySelector("a-scene");
  if (scene) {
    if (scene.renderer) scene.renderer.dispose();
    scene.remove();
  }
  const videos = document.querySelectorAll("video");
  videos.forEach(v => {
    if (v.srcObject) v.srcObject.getTracks().forEach(t => t.stop());
    v.remove();
  });
};
