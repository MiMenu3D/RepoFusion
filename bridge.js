const BRIDGE_VERSION = "Bridge v87.3 (Tracking API)";
// version 87.3 TimeTravelx08

const panel = document.createElement("div");
panel.id = "bridgeDebugPanel";
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
panel.style.cursor = "pointer";
panel.title = "Tap para contraer/expandir";

document.body.appendChild(panel);

let panelCollapsed = false;
panel.addEventListener("click", () => {
    panelCollapsed = !panelCollapsed;
    panel.style.maxHeight = panelCollapsed ? "20px" : "85vh";
    panel.style.overflow = panelCollapsed ? "hidden" : "auto";
});

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

            // --- ESTO ES LO ÚNICO QUE AÑADIMOS ---
            if (window.RepoFusion && window.RepoFusion.setPose) {
                window.RepoFusion.setPose({
                    camera: window.Tracking.camera,
                    marker: window.Tracking.marker,
                    intrinsics: window.Tracking.intrinsics,
                    tracking: window.Tracking.tracking
                });
            }
            // -------------------------------------
        }

    });

    panel.textContent = BRIDGE_VERSION + "\ninstalled ✔";
}

function waitForXR8() {
    if (window.XR8) {
        install();
    } else {
        window.addEventListener("xrloaded", install, { once: true });
    }
}

waitForXR8();

function render() {
    let out = BRIDGE_VERSION + (panelCollapsed ? " [min]" : " [max]") + "\n\n";

    if (panelCollapsed) {
        out += "TRACKING: " + window.Tracking.tracking;
        panel.textContent = out;
        return;
    }

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

let renderInterval = setInterval(render, 150);

window.destroyBridge = function() {
    if (renderInterval) clearInterval(renderInterval);
    const panel = document.getElementById("bridgeDebugPanel");
    if (panel) panel.remove();
    window.Tracking = null;
};

