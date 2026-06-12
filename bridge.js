const BRIDGE_VERSION = "RepoFusion Bridge v1.0";

const panel = document.createElement("div");
panel.style.position = "fixed";
panel.style.top = "10px";
panel.style.left = "10px";
panel.style.background = "rgba(0,0,0,0.82)";
panel.style.color = "#00ff66";
panel.style.padding = "10px";
panel.style.fontFamily = "monospace";
panel.style.fontSize = "12px";
panel.style.whiteSpace = "pre";
panel.style.zIndex = "999999";
panel.style.maxHeight = "85vh";
panel.style.overflow = "auto";

document.body.appendChild(panel);

const fusionState = {
  tracking: "waiting",
  camera: null,
  marker: null,
  intrinsics: null,
  video: null
};

window.RepoFusion = fusionState;

function normalizeMarker(reality) {

  const img = reality?.detectedImages?.[0];

  if (!img) return null;

  return {

    name: img.name,

    position: {
      x: img.position?.x ?? 0,
      y: img.position?.y ?? 0,
      z: img.position?.z ?? 0
    },

    rotation: {
      x: img.rotation?.x ?? 0,
      y: img.rotation?.y ?? 0,
      z: img.rotation?.z ?? 0,
      w: img.rotation?.w ?? 1
    },

    scale: img.scale ?? 1
  };
}

function normalizeCamera(reality) {

  return {

    position: {
      x: reality?.position?.x ?? 0,
      y: reality?.position?.y ?? 0,
      z: reality?.position?.z ?? 0
    },

    rotation: {
      x: reality?.rotation?.x ?? 0,
      y: reality?.rotation?.y ?? 0,
      z: reality?.rotation?.z ?? 0,
      w: reality?.rotation?.w ?? 1
    }

  };
}

function installBridge() {

  if (!window.XR8) {

    panel.textContent =
      BRIDGE_VERSION + "\n\nXR8 NOT FOUND";

    return;
  }

  XR8.addCameraPipelineModule({

    name: "repofusion-export",

    onStart() {

      fusionState.video =
        document.querySelector("video") || null;
    },

    onUpdate({processCpuResult}) {

      const reality = processCpuResult?.reality;

      if (!reality) return;

      fusionState.tracking =
        reality.trackingStatus || "UNKNOWN";

      fusionState.camera =
        normalizeCamera(reality);

      fusionState.marker =
        normalizeMarker(reality);

      fusionState.intrinsics =
        reality.intrinsics || null;

      if (!fusionState.video) {

        fusionState.video =
          document.querySelector("video") || null;

      }

    }

  });

}

function drawPanel() {

  const videoOK =
    fusionState.video ? "YES" : "NO";

  panel.textContent =

`${BRIDGE_VERSION}

VIDEO : ${videoOK}

TRACK : ${fusionState.tracking}

CAMERA

${JSON.stringify(fusionState.camera, null, 2)}

MARKER

${JSON.stringify(fusionState.marker, null, 2)}

INTRINSICS

${JSON.stringify(fusionState.intrinsics, null, 2)}
`;

}

installBridge();

setInterval(drawPanel, 120);
