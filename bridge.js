const BRIDGE_VERSION = "Bridge v85.0 (Tracking API)";


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
            
            // Enviar los datos de tracking a A-Frame
            if (window.RepoFusion && window.RepoFusion.setPose) {
                window.RepoFusion.setPose({
                camera: window.Tracking.camera,
                marker: window.Tracking.marker,
                intrinsics: window.Tracking.intrinsics,
                tracking: window.Tracking.tracking
            });
        }
        }

    });

    panel.textContent = BRIDGE_VERSION + "\ninstalled ✔";
}
