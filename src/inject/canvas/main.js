/**
 * Canvas Fingerprint Poisoner - Main World Script
 *
 * This script protects against canvas fingerprinting by adding subtle noise
 * to canvas data that's readable by scripts while preserving visual appearance.
 */

(function () {
  // Canvas protection implementation
  {
    // Storage for canvas manipulation
    const originalCanvasData = new WeakMap();
    let sessionShift;

    /**
     * Restore canvas to original state after protection has been applied
     * @param {HTMLCanvasElement} canvas - The canvas to restore
     */
    const restoreCanvas = (canvas) => {
      const { width, height } = canvas;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const imageData = getOriginalGetImageData.apply(context, [0, 0, width, height]);

      // Restore original pixel data
      imageData.data.set(originalCanvasData.get(canvas));
      originalCanvasData.delete(canvas);

      context.putImageData(imageData, 0, 0);
    };

    // Store the original method
    const getOriginalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

    /**
     * Apply fingerprint protection to a canvas
     * @param {HTMLCanvasElement} canvas - The canvas to protect
     */
    const applyCanvasProtection = (canvas) => {
      // Skip if already manipulated
      if (originalCanvasData.has(canvas)) {
        return;
      }

      const { width, height } = canvas;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const imageData = getOriginalGetImageData.apply(context, [0, 0, width, height]);

      // Store original canvas data for restoration
      originalCanvasData.set(canvas, new Uint8ClampedArray(imageData.data));

      // Determine color shift values (subtle shifts of -5 to +5)
      const shift = {
        r: Math.floor(Math.random() * 10) - 5,
        g: Math.floor(Math.random() * 10) - 5,
        b: Math.floor(Math.random() * 10) - 5,
      };

      // Save session shift for consistency when in session mode
      sessionShift = sessionShift || shift;

      // Apply subtle modifications to canvas data
      // Only modify a sampling of pixels for performance
      for (let i = 0; i < height; i += Math.max(1, parseInt(height / 10))) {
        for (let j = 0; j < width; j += Math.max(1, parseInt(width / 10))) {
          const pixelIndex = i * (width * 4) + j * 4;
          imageData.data[pixelIndex + 0] = Math.max(0, Math.min(255, imageData.data[pixelIndex + 0] + shift.r)); // Red
          imageData.data[pixelIndex + 1] = Math.max(0, Math.min(255, imageData.data[pixelIndex + 1] + shift.g)); // Green
          imageData.data[pixelIndex + 2] = Math.max(0, Math.min(255, imageData.data[pixelIndex + 2] + shift.b)); // Blue
          // Alpha channel (index + 3) is left untouched
        }
      }

      // Apply modified data
      context.putImageData(imageData, 0, 0);

      // Restore canvas after protection has been applied
      // Using setTimeout with 0 delay to restore after current execution completes
      setTimeout(restoreCanvas, 0, canvas);
    };

    // Proxy canvas methods to apply protection

    // Protect toBlob
    HTMLCanvasElement.prototype.toBlob = new Proxy(HTMLCanvasElement.prototype.toBlob, {
      apply(target, self, args) {
        try {
          applyCanvasProtection(self);
        } catch (e) {
          console.warn("[FingerprintPoisoner] Failed to apply canvas protection:", e);
        }
        return Reflect.apply(target, self, args);
      },
    });

    // Protect toDataURL
    HTMLCanvasElement.prototype.toDataURL = new Proxy(HTMLCanvasElement.prototype.toDataURL, {
      apply(target, self, args) {
        try {
          applyCanvasProtection(self);
        } catch (e) {
          console.warn("[FingerprintPoisoner] Failed to apply canvas protection:", e);
        }
        return Reflect.apply(target, self, args);
      },
    });

    // Protect getImageData
    CanvasRenderingContext2D.prototype.getImageData = new Proxy(CanvasRenderingContext2D.prototype.getImageData, {
      apply(target, self, args) {
        try {
          applyCanvasProtection(self.canvas);
        } catch (e) {
          console.warn("[FingerprintPoisoner] Failed to apply canvas protection:", e);
        }
        return Reflect.apply(target, self, args);
      },
    });

    // Optimize canvas for frequent reading
    HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
      apply(target, self, args) {
        if (args[0] === "2d") {
          args[1] = args[1] || {};
          args[1].willReadFrequently = true;
        }
        return Reflect.apply(target, self, args);
      },
    });
  }

  // Handle iframe communication
  {
    /**
     * Inject canvas protection into iframe source
     * @param {MessageEvent} e - The message event
     */
    const injectIntoSource = (e) => {
      if (e.source && e.data === "inject-script-into-source") {
        try {
          // Apply canvas protection to iframe source
          e.source.HTMLCanvasElement.prototype.toBlob = HTMLCanvasElement.prototype.toBlob;
          e.source.HTMLCanvasElement.prototype.toDataURL = HTMLCanvasElement.prototype.toDataURL;
          e.source.CanvasRenderingContext2D.prototype.getImageData = CanvasRenderingContext2D.prototype.getImageData;

          // Listen for messages from the iframe
          e.source.addEventListener("message", injectIntoSource);

          console.log("[FingerprintPoisoner] Canvas protection injected into iframe");
        } catch (e) {
          console.warn("[FingerprintPoisoner] Cannot inject canvas protection into source:", e);
        }
      }
    };

    // Listen for injection requests
    addEventListener("message", injectIntoSource);
  }
})();
