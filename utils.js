// FingerprintPoisoner utility functions
// Shared between background, content, and inject scripts

/**
 * Generate a consistent hash from a string
 * @param {string} str - String to hash
 * @return {number} Hash value
 */
function hashString(str) {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash);
}

/**
 * Create a seeded random number generator
 * @param {number} seed - Seed for the random number generator
 * @return {Function} Random number generator function
 */
function createSeededRandom(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Detect if a canvas operation is likely used for fingerprinting
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @return {boolean} Whether the canvas is likely used for fingerprinting
 */
function isLikelyFingerprinting(canvas) {
  // Small canvases are often used for fingerprinting
  if (canvas.width <= 500 && canvas.height <= 200) {
    return true;
  }

  // Check if canvas contains text (common fingerprinting technique)
  try {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Count non-transparent pixels
    let nonTransparentPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        nonTransparentPixels++;
      }
    }

    // If less than 20% of pixels are non-transparent, it's likely fingerprinting
    return nonTransparentPixels < canvas.width * canvas.height * 0.2;
  } catch (e) {
    // If we can't analyze the canvas, assume it's not fingerprinting
    return false;
  }
}

/**
 * Add controlled noise to a number
 * @param {number} value - Original value
 * @param {Function} randomFunc - Random function
 * @param {number} noiseLevel - Noise level (1-4)
 * @return {number} Value with noise
 */
function addNoise(value, randomFunc, noiseLevel) {
  const noise = (randomFunc() * 2 - 1) * (noiseLevel / 10);
  return value * (1 + noise);
}

/**
 * Check if the current page is likely performing fingerprinting
 * @return {boolean} Whether fingerprinting is detected
 */
function detectFingerprinting() {
  // Check for common fingerprinting libraries and techniques
  const indicators = [
    // Look for common fingerprinting library variable names
    typeof window.Fingerprint2 !== "undefined",
    typeof window.ClientJS !== "undefined",
    typeof window.FingerprintJS !== "undefined",

    // Check for fingerprinting APIs being accessed
    document.querySelectorAll("canvas").length > 0 &&
      document.querySelectorAll('canvas[width="16"][height="16"]').length > 0,

    // Check if WebRTC is being used (potentially for IP leaking)
    typeof window.RTCPeerConnection !== "undefined" && document.querySelectorAll("script:not([src])").length > 5,
  ];

  // If any indicators are true, fingerprinting might be happening
  return indicators.some((indicator) => indicator === true);
}

// Export functions if in a module context
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    hashString,
    createSeededRandom,
    isLikelyFingerprinting,
    addNoise,
    detectFingerprinting,
  };
}
