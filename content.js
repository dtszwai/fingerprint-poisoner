// FingerprintPoisoner content script
// Injects the poisoning script at document_start

// Function to inject our script
function injectScript() {
  chrome.storage.local.get(["settings"], (result) => {
    const settings = result.settings || {
      enabled: true,
      poisonCanvas: true,
      poisonWebGL: true,
      poisonAudioContext: true,
      poisonClientRects: true,
      poisonFonts: true,
      consistentNoise: true,
      noiseLevel: 2,
    };

    if (!settings.enabled) {
      return;
    }

    // Create a script element to inject our poisoning code
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject.js");

    // Pass settings to the injected script
    script.dataset.settings = JSON.stringify(settings);
    script.dataset.domain = window.location.hostname;

    // Add the script to the document
    (document.head || document.documentElement).appendChild(script);

    // Remove the script after it's loaded (optional)
    script.onload = function () {
      script.remove();
    };
  });
}

// Inject as early as possible
injectScript();

// Listen for messages from the injected script
window.addEventListener("message", function (event) {
  // Only accept messages from this window
  if (event.source !== window) return;

  if (event.data.type && event.data.type === "FINGERPRINT_POISONER_REPORT") {
    // Forward report to background script if needed
    chrome.runtime.sendMessage({
      type: "fingerprintReport",
      data: event.data.data,
    });
  }
});
