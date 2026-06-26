// Menu module v150.5
// Generated as part of the AR refactor.
// version 150.5

window.RepoFusion = window.RepoFusion || {};
window.RepoFusionVersions = window.RepoFusionVersions || {};
window.RepoFusionVersions.menu = "150.5";
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
let isARActive = false;
const menuNodes = { startScreen: null, mvContainer: null };
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

function getVersionValue(name) {
  return window.RepoFusionVersions && window.RepoFusionVersions[name]
    ? window.RepoFusionVersions[name]
    : "unknown";
}

function updateVersionList(list) {
  list.textContent =
    `index.html: ${getVersionValue("index")}\n` +
    `menu.js: ${getVersionValue("menu")}\n` +
    `bridge.js: ${getVersionValue("bridge")}\n` +
    `ar.js: ${getVersionValue("ar")}\n`;
}

function createVersionPanel() {
  if (document.getElementById("versionPanel")) return;
  const startScreen = document.getElementById("startScreen");
  if (!startScreen) return;
  const panel = document.createElement("div");
  panel.id = "versionPanel";
  panel.style.position = "absolute";
  panel.style.top = "10px";
  panel.style.left = "10px";
  panel.style.right = "10px";
  panel.style.zIndex = "100";
  panel.style.color = "white";
  panel.style.fontSize = "12px";
  panel.style.textAlign = "left";

  const button = document.createElement("button");
  button.id = "versionToggle";
  button.textContent = "Versiones";
  button.style.background = "rgba(255,255,255,0.1)";
  button.style.color = "white";
  button.style.border = "1px solid white";
  button.style.borderRadius = "12px";
  button.style.padding = "6px 10px";
  button.style.marginBottom = "8px";
  button.style.width = "auto";
  button.style.cursor = "pointer";

  const list = document.createElement("div");
  list.id = "versionList";
  list.style.display = "none";
  list.style.background = "rgba(0,0,0,0.7)";
  list.style.padding = "10px";
  list.style.borderRadius = "12px";
  list.style.whiteSpace = "pre-wrap";
  list.style.textAlign = "left";
  updateVersionList(list);

  button.addEventListener("click", () => {
    updateVersionList(list);
    list.style.display = list.style.display === "none" ? "block" : "none";
  });

  panel.appendChild(button);
  panel.appendChild(list);
  startScreen.insertBefore(panel, startScreen.firstChild);
}

function detachMenuNodes() {
  const startScreen = document.getElementById("startScreen");
  const mvContainer = document.getElementById("mvContainer");
  if (startScreen) {
    menuNodes.startScreen = startScreen;
    startScreen.remove();
  }
  if (mvContainer) {
    menuNodes.mvContainer = mvContainer;
    mvContainer.remove();
  }
}

function restoreMenuNodes() {
  const arContainer = document.getElementById("arContainer");
  if (!arContainer) return;
  if (menuNodes.startScreen && !document.getElementById("startScreen")) {
    document.body.insertBefore(menuNodes.startScreen, arContainer);
  }
  if (menuNodes.mvContainer && !document.getElementById("mvContainer")) {
    document.body.insertBefore(menuNodes.mvContainer, arContainer);
  }
  const versionList = document.getElementById("versionList");
  if (versionList) {
    updateVersionList(versionList);
  }
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

function startAR(){
  ensureARModule().then((AR) => {
    history.pushState({mode:"ar", current}, "");
    destroyMV();
    detachMenuNodes();
    document.getElementById("arContainer").style.display = "block";
    document.body.style.background = "transparent";
    const envToggle = document.getElementById("envToggle");
    if (envToggle) envToggle.style.display = "block";
    isARActive = true;
    AR.startAR(models[current]).catch((err) => {
      console.warn("AR.startAR failed:", err);
      isARActive = false;
      restoreMenuNodes();
      createMV();
      history.replaceState({mode:"menu", current}, "");
    });
  }).catch((err) => {
    console.warn("No se pudo cargar el módulo AR:", err);
  });
}

function stopAR(){
  isARActive = false;
  if (window.AR && typeof window.AR.stopAR === "function") {
    window.AR.stopAR();
  }

  document.getElementById("lightDebug").style.display = "none";
  document.querySelectorAll(".mindar-ui-scanning").forEach(el => el.remove());
  const bridgePanel = document.getElementById("bridgeDebugPanel");
  if (bridgePanel) bridgePanel.remove();
  const arContainer = document.getElementById("arContainer");
  if (arContainer) {
    arContainer.innerHTML = "";
    arContainer.style.display = "none";
  }
  const xrMedia = Array.from(document.querySelectorAll("video, canvas"));
  xrMedia.forEach((node) => {
    if (node.closest("#mvContainer") || node.closest("#versionPanel")) return;
    try {
      if (node.tagName === "VIDEO" && node.srcObject) {
        node.srcObject = null;
      }
    } catch (err) {
      console.warn("error clearing XR media node", err);
    }
    node.remove();
  });
  const envToggle = document.getElementById("envToggle");
  if (envToggle) envToggle.style.display = "none";
  document.body.style.background = "#1f1a17";
  restoreMenuNodes();
  createMV();
  history.replaceState({mode:"menu", current}, "");
}

window.addEventListener("popstate", (event) => {
  console.log("menu.js popstate", event.state, history.state);
  stopAR();
});

window.toggleEnv = function() {
  if (window.AR && typeof window.AR.toggleEnv === "function") {
    window.AR.toggleEnv();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  history.replaceState({mode:"menu", current}, "");
  document.getElementById("envToggle").style.display = "none";
  createVersionPanel();
  createMV();
});
