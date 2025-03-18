// FingerprintPoisoner injected script
// This is injected into the page context to poison fingerprinting APIs

(function () {
  // ===== Initialization =====

  // Get settings from the script element's data attributes
  const scriptElement = document.currentScript;
  const settingsJson = scriptElement.dataset.settings;
  const domain = scriptElement.dataset.domain;

  let settings;
  try {
    settings = JSON.parse(settingsJson);
  } catch (e) {
    // Default settings if parsing fails
    settings = {
      enabled: true,
      poisonCanvas: true,
      poisonWebGL: true,
      poisonAudioContext: true,
      poisonClientRects: true,
      poisonFonts: true,
      consistentNoise: true,
      noiseLevel: 2,
    };
  }

  // Only run if enabled
  if (!settings.enabled) {
    return;
  }

  // ===== Utility Functions =====

  // Generate consistent seed for a domain
  function generateSeed(domain) {
    let seed = 0;
    for (let i = 0; i < domain.length; i++) {
      seed += domain.charCodeAt(i);
    }
    return seed;
  }

  // Seeded random number generator
  function createSeededRandom(domain) {
    let seed = generateSeed(domain);

    return function () {
      if (!settings.consistentNoise) {
        return Math.random();
      }

      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  const seededRandom = createSeededRandom(domain);

  // Add controlled noise to a value
  function addValueNoise(value, noiseLevel) {
    const noise = (seededRandom() * 2 - 1) * (noiseLevel / 10);
    return value * (1 + noise);
  }

  // Add controlled noise to a pixel
  function addPixelNoise(pixel, noiseLevel) {
    return Math.min(255, Math.max(0, pixel + Math.floor((seededRandom() * 2 - 1) * noiseLevel * 5)));
  }

  // ===== Canvas Fingerprinting Protection =====

  if (settings.poisonCanvas) {
    // Store original toDataURL, toBlob and getImageData methods
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

    // Override toDataURL
    HTMLCanvasElement.prototype.toDataURL = function () {
      const noiseLevel = settings.noiseLevel;

      // Small canvases are often used for fingerprinting
      const potentialFingerprinting = this.width <= 500 && this.height <= 200;

      if (potentialFingerprinting) {
        // Get the context and image data
        const ctx = this.getContext("2d");
        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        // Add noise to the image data
        for (let i = 0; i < data.length; i += 4) {
          // Modify RGBA values with subtle noise
          data[i] = addPixelNoise(data[i], noiseLevel); // R
          data[i + 1] = addPixelNoise(data[i + 1], noiseLevel); // G
          data[i + 2] = addPixelNoise(data[i + 2], noiseLevel); // B
          // Leave alpha channel alone to avoid too obvious modifications
        }

        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
      }

      // Call the original method
      return originalToDataURL.apply(this, arguments);
    };

    // Override toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      const noiseLevel = settings.noiseLevel;

      // Small canvases are often used for fingerprinting
      const potentialFingerprinting = this.width <= 500 && this.height <= 200;

      if (potentialFingerprinting) {
        // Get the context and image data
        const ctx = this.getContext("2d");
        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        // Add noise to the image data
        for (let i = 0; i < data.length; i += 4) {
          data[i] = addPixelNoise(data[i], noiseLevel);
          data[i + 1] = addPixelNoise(data[i + 1], noiseLevel);
          data[i + 2] = addPixelNoise(data[i + 2], noiseLevel);
        }

        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
      }

      // Call the original method
      const args = Array.from(arguments);
      return originalToBlob.apply(this, args);
    };

    // Override getImageData
    CanvasRenderingContext2D.prototype.getImageData = function () {
      // Call the original method
      const imageData = originalGetImageData.apply(this, arguments);

      // Only poison if it looks like fingerprinting
      const potentialFingerprinting =
        arguments[2] <= 200 &&
        arguments[3] <= 200 && // Small area
        this.canvas.width <= 500 &&
        this.canvas.height <= 200; // Small canvas

      if (potentialFingerprinting) {
        const data = imageData.data;
        const noiseLevel = settings.noiseLevel;

        // Add noise to the image data
        for (let i = 0; i < data.length; i += 4) {
          data[i] = addPixelNoise(data[i], noiseLevel);
          data[i + 1] = addPixelNoise(data[i + 1], noiseLevel);
          data[i + 2] = addPixelNoise(data[i + 2], noiseLevel);
        }
      }

      return imageData;
    };
  }

  // ===== WebGL Fingerprinting Protection =====

  if (settings.poisonWebGL) {
    // WebGL parameters commonly used for fingerprinting
    const WEBGL_PARAMS = [
      "ALIENWARE_MAX_LIGHTS",
      "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
      "MAX_CUBE_MAP_TEXTURE_SIZE",
      "MAX_FRAGMENT_UNIFORM_VECTORS",
      "MAX_RENDERBUFFER_SIZE",
      "MAX_TEXTURE_IMAGE_UNITS",
      "MAX_TEXTURE_SIZE",
      "MAX_VARYING_VECTORS",
      "MAX_VERTEX_ATTRIBS",
      "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
      "MAX_VERTEX_UNIFORM_VECTORS",
      "MAX_VIEWPORT_DIMS",
      "SHADING_LANGUAGE_VERSION",
      "VENDOR",
      "VERSION",
    ];

    // Store original getParameter method
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;

    // Override getParameter
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      const result = originalGetParameter.call(this, parameter);

      // Only modify specific parameters used in fingerprinting
      if (WEBGL_PARAMS.includes(parameter) && result !== null && result !== undefined) {
        // Handle different types of return values
        if (typeof result === "number") {
          return addValueNoise(result, settings.noiseLevel);
        } else if (result instanceof Float32Array) {
          const modified = new Float32Array(result);
          for (let i = 0; i < modified.length; i++) {
            modified[i] = addValueNoise(modified[i], settings.noiseLevel);
          }
          return modified;
        } else if (result instanceof Int32Array) {
          const modified = new Int32Array(result);
          for (let i = 0; i < modified.length; i++) {
            modified[i] = Math.round(addValueNoise(modified[i], settings.noiseLevel));
          }
          return modified;
        }
      }

      return result;
    };

    // Do the same for WebGL2RenderingContext if it exists
    if (typeof WebGL2RenderingContext !== "undefined") {
      const originalGetParameterWebGL2 = WebGL2RenderingContext.prototype.getParameter;

      WebGL2RenderingContext.prototype.getParameter = function (parameter) {
        const result = originalGetParameterWebGL2.call(this, parameter);

        if (WEBGL_PARAMS.includes(parameter) && result !== null && result !== undefined) {
          if (typeof result === "number") {
            return addValueNoise(result, settings.noiseLevel);
          } else if (result instanceof Float32Array) {
            const modified = new Float32Array(result);
            for (let i = 0; i < modified.length; i++) {
              modified[i] = addValueNoise(modified[i], settings.noiseLevel);
            }
            return modified;
          } else if (result instanceof Int32Array) {
            const modified = new Int32Array(result);
            for (let i = 0; i < modified.length; i++) {
              modified[i] = Math.round(addValueNoise(modified[i], settings.noiseLevel));
            }
            return modified;
          }
        }

        return result;
      };
    }
  }

  // ===== Audio Fingerprinting Protection =====

  if (settings.poisonAudioContext) {
    // AudioContext methods used for fingerprinting
    if (typeof AudioContext !== "undefined") {
      const originalCreateOscillator = AudioContext.prototype.createOscillator;
      const originalGetChannelData = AudioBuffer.prototype.getChannelData;
      const originalCopyFromChannel = AudioBuffer.prototype.copyFromChannel;

      // Override createOscillator
      AudioContext.prototype.createOscillator = function () {
        const oscillator = originalCreateOscillator.apply(this, arguments);

        // Store original start method
        const originalStart = oscillator.start;

        // Override start method
        oscillator.start = function () {
          // Add subtle frequency noise before starting
          if (this.frequency && this.frequency.value) {
            this.frequency.value = addValueNoise(this.frequency.value, settings.noiseLevel / 2);
          }

          return originalStart.apply(this, arguments);
        };

        return oscillator;
      };

      // Override getChannelData
      AudioBuffer.prototype.getChannelData = function (channel) {
        const data = originalGetChannelData.call(this, channel);

        // Only modify short audio buffers (likely fingerprinting)
        if (this.length < 1000) {
          const noiseLevel = settings.noiseLevel * 0.0001; // Very subtle noise

          // Create copy to avoid modifying original
          const copy = new Float32Array(data.length);

          // Add noise to the data
          for (let i = 0; i < data.length; i++) {
            copy[i] = data[i] + (seededRandom() * 2 - 1) * noiseLevel;
          }

          return copy;
        }

        return data;
      };

      // Override copyFromChannel if it exists
      if (originalCopyFromChannel) {
        AudioBuffer.prototype.copyFromChannel = function (destination, channelNumber, startInChannel) {
          // Call original method
          originalCopyFromChannel.apply(this, arguments);

          // Only modify short audio buffers (likely fingerprinting)
          if (this.length < 1000) {
            const noiseLevel = settings.noiseLevel * 0.0001;

            // Add noise to the destination buffer
            for (let i = 0; i < destination.length; i++) {
              destination[i] += (seededRandom() * 2 - 1) * noiseLevel;
            }
          }
        };
      }
    }
  }

  // ===== ClientRects Fingerprinting Protection =====

  if (settings.poisonClientRects) {
    // Store original methods
    const originalGetClientRects = Element.prototype.getClientRects;
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

    // Override getClientRects
    Element.prototype.getClientRects = function () {
      const rects = originalGetClientRects.apply(this, arguments);

      // Create a modified copy
      const modifiedRects = Array.from(rects).map((rect) => {
        const modifiedRect = {};

        // Only modify dimensional properties
        for (const prop of ["x", "y", "width", "height", "top", "left", "right", "bottom"]) {
          if (rect[prop] !== undefined) {
            modifiedRect[prop] = addValueNoise(rect[prop], settings.noiseLevel / 20);
          }
        }

        // Copy non-dimensional properties unchanged
        for (const prop in rect) {
          if (modifiedRect[prop] === undefined) {
            modifiedRect[prop] = rect[prop];
          }
        }

        return modifiedRect;
      });

      // Make the array look like a ClientRectList
      modifiedRects.item = function (index) {
        return this[index];
      };

      return modifiedRects;
    };

    // Override getBoundingClientRect
    Element.prototype.getBoundingClientRect = function () {
      const rect = originalGetBoundingClientRect.apply(this, arguments);

      // Create a modified copy with noise
      const modifiedRect = {};

      for (const prop in rect) {
        if (typeof rect[prop] === "number") {
          // Add subtle noise to dimensional properties
          modifiedRect[prop] = addValueNoise(rect[prop], settings.noiseLevel / 20);
        } else {
          // Copy non-dimensional properties unchanged
          modifiedRect[prop] = rect[prop];
        }
      }

      return modifiedRect;
    };
  }

  // ===== Font Fingerprinting Protection =====

  if (settings.poisonFonts) {
    // Override font-detecting APIs
    if (typeof document.fonts !== "undefined" && document.fonts.check) {
      const originalCheck = document.fonts.check;

      document.fonts.check = function (font, text) {
        // Sometimes return a random result for uncommon fonts
        if (seededRandom() < settings.noiseLevel * 0.05) {
          return seededRandom() > 0.5;
        }

        return originalCheck.apply(this, arguments);
      };
    }

    // Override measureText
    if (CanvasRenderingContext2D.prototype.measureText) {
      const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;

      CanvasRenderingContext2D.prototype.measureText = function (text) {
        const result = originalMeasureText.apply(this, arguments);

        // Add noise to width measurement
        if (result.width) {
          result.width = addValueNoise(result.width, settings.noiseLevel / 15);
        }

        // Add noise to other text metrics if they exist
        for (const prop of [
          "actualBoundingBoxAscent",
          "actualBoundingBoxDescent",
          "actualBoundingBoxLeft",
          "actualBoundingBoxRight",
          "fontBoundingBoxAscent",
          "fontBoundingBoxDescent",
        ]) {
          if (result[prop] !== undefined) {
            result[prop] = addValueNoise(result[prop], settings.noiseLevel / 15);
          }
        }

        return result;
      };
    }
  }

  // Report that fingerprint poisoning is active
  window.postMessage(
    {
      type: "FINGERPRINT_POISONER_REPORT",
      data: {
        domain: domain,
        settings: settings,
        timestamp: new Date().toISOString(),
      },
    },
    "*",
  );
})();
