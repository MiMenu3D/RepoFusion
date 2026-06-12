const BRIDGE_VERSION = "Bridge 1.0";

/*
    ========================================

    RepoFusion Bridge

    8th Wall
        ↓
    window.Tracking
        ↓
    A-Frame / Three / Debug

    ========================================
*/

const DEBUG_PANEL = true;

window.Tracking = {

    tracking: "waiting",

    camera: null,

    marker: null,

    intrinsics: null

};

window.CameraVideo = null;



/* ------------------------------------ */
/*               PANEL                  */
/* ------------------------------------ */

let panel = null;

if (DEBUG_PANEL) {

    panel = document.createElement("div");

    panel.style.position = "fixed";
    panel.style.top = "10px";
    panel.style.left = "10px";

    panel.style.background = "rgba(0,0,0,0.82)";
    panel.style.color = "lime";

    panel.style.padding = "10px";

    panel.style.fontFamily = "monospace";
    panel.style.fontSize = "12px";

    panel.style.whiteSpace = "pre";

    panel.style.maxHeight = "85vh";
    panel.style.overflow = "auto";

    panel.style.zIndex = "999999";

    document.body.appendChild(panel);

}



/* ------------------------------------ */
/*           EXTRAER MARKER             */
/* ------------------------------------ */

function normalizeMarker(reality) {

    const img = reality?.detectedImages?.[0];

    if (!img) {

        return null;

    }

    return {

        name: img.name,

        position: img.position || null,

        rotation: img.rotation || null,

        scale: img.scale || 1

    };

}



/* ------------------------------------ */
/*          EXTRAER CAMERA              */
/* ------------------------------------ */

function normalizeCamera(reality) {

    return {

        position: reality?.position || null,

        rotation: reality?.rotation || null

    };

}



/* ------------------------------------ */
/*         BUSCAR VIDEO HTML            */
/* ------------------------------------ */

function updateVideoReference() {

    if (window.CameraVideo) {

        return;

    }

    const video = document.querySelector("video");

    if (video) {

        window.CameraVideo = video;

    }

}



/* ------------------------------------ */
/*           INSTALAR BRIDGE            */
/* ------------------------------------ */

function installBridge() {

    if (!window.XR8) {

        if (panel) {

            panel.textContent =
                BRIDGE_VERSION +
                "\n\nXR8 NOT FOUND";

        }

        return;

    }

    XR8.addCameraPipelineModule({

        name: "repofusion-bridge",

        onUpdate: ({ processCpuResult }) => {

            updateVideoReference();

            const reality =
                processCpuResult?.reality;

            if (!reality) {

                return;

            }

            window.Tracking.tracking =
                reality.trackingStatus || "unknown";

            window.Tracking.camera =
                normalizeCamera(reality);

            window.Tracking.marker =
                normalizeMarker(reality);

            window.Tracking.intrinsics =
                reality.intrinsics || null;

        }

    });

}



/* ------------------------------------ */
/*             DEBUG VIEW               */
/* ------------------------------------ */

function renderPanel() {

    if (!panel) {

        return;

    }

    let out = "";

    out += BRIDGE_VERSION;

    out += "\n\n";

    out +=
        "VIDEO: " +
        (window.CameraVideo ? "YES" : "NO");

    out += "\n\n";

    out +=
        "TRACKING: " +
        window.Tracking.tracking;

    out += "\n\n";

    out +=
        "CAMERA\n";

    out +=
        JSON.stringify(
            window.Tracking.camera,
            null,
            2
        );

    out += "\n\n";

    out +=
        "MARKER\n";

    out +=
        JSON.stringify(
            window.Tracking.marker,
            null,
            2
        );

    out += "\n\n";

    out +=
        "INTRINSICS\n";

    out +=
        JSON.stringify(
            window.Tracking.intrinsics,
            null,
            2
        );

    panel.textContent = out;

}



installBridge();

setInterval(renderPanel, 150);
