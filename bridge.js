const BRIDGE_VERSION = "Bridge v84.1 (Tracking API)";

const panel = document.createElement("div");
panel.style.position = "fixed";
panel.style.top = "10px";
panel.style.left = "10px";
panel.style.background = "rgba(0,0,0,0.85)";
panel.style.color = "lime";
panel.style.padding = "10px";
panel.style.fontFamily = "monospace";
panel.style.fontSize = "12px";
panel.style.whiteSpace = "pre";
panel.style.zIndex = "999999";
panel.style.maxHeight = "85vh";
panel.style.overflow = "auto";

document.body.appendChild(panel);

// ===================================================================
// TRACKING API GLOBAL
// ===================================================================

window.Tracking = {
    camera: null,
    marker: null,
    intrinsics: null,
    tracking: "waiting"
};

function normalizeMarker(reality) {

    const img = reality?.detectedImages?.[0];
    if (!img) return null;

    return {
        position: img.position || null,
        rotation: img.rotation || null,
        scale: img.scale || 1,
        name: img.name
    };
}

function extractCamera(reality) {

    return {
        rotation: reality?.rotation || null,
        position: reality?.position || null
    };
}

function install() {

    if (!window.XR8) {
        panel.textContent = BRIDGE_VERSION + "\nXR8 not found";
        return;
    }

    XR8.addCameraPipelineModule({

        name: "bridge-exporter",

        onUpdate: ({ processCpuResult }) => {

            const reality = processCpuResult?.reality;

            if (!reality) return;

            window.Tracking.camera = extractCamera(reality);
            window.Tracking.marker = normalizeMarker(reality);
            window.Tracking.intrinsics = reality.intrinsics || null;
            window.Tracking.tracking = reality.trackingStatus || "unknown";
        }

    });

    panel.textContent = BRIDGE_VERSION + "\ninstalled ✔";
}

function render() {

    let out = BRIDGE_VERSION + "\n\n";

    out += "TRACKING: " + window.Tracking.tracking + "\n\n";

    out += "CAMERA:\n";
    out += JSON.stringify(window.Tracking.camera, null, 2);
    out += "\n\n";

    out += "MARKER:\n";
    out += JSON.stringify(window.Tracking.marker, null, 2);
    out += "\n\n";

    out += "INTRINSICS:\n";
    out += JSON.stringify(window.Tracking.intrinsics, null, 2);

    out += "\n\n";

    const video = document.querySelector("video");
    out += "VIDEO: " + (video ? "YES" : "NO");

    panel.textContent = out;
}

install();
setInterval(render, 150);
