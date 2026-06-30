// 8th Wall image target configuration
// Only configure the tracker, do not auto-start the 8th Wall scene.
window.xrConfigData = {
  imageTargetData: [
    {
      type: "PLANAR",
      properties: {
        top: 0,
        left: 312,
        width: 1875,
        height: 2500,
        isRotated: false,
        originalWidth: 2500,
        originalHeight: 2500
      },
      imagePath: "image-targets/marker_luminance.png",
      metadata: null,
      name: "marker",
      resources: {
        originalImage: "marker_original.png",
        croppedImage: "marker_cropped.png",
        thumbnailImage: "marker_thumbnail.png",
        luminanceImage: "marker_luminance.png"
      },
      created: 1781091877698,
      updated: 1781091877698
    }
  ]
};

function configureXR8Targets() {
  if (window.XR8 && window.XR8.XrController && typeof window.XR8.XrController.configure === "function") {
    window.XR8.XrController.configure(window.xrConfigData);
  }
}

if (window.XR8) {
  configureXR8Targets();
} else {
  window.addEventListener("xrloaded", configureXR8Targets, { once: true });
  window.addEventListener("XRloaded", configureXR8Targets, { once: true });
}
