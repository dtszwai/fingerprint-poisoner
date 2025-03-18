// FingerprintPoisoner popup script
// Handles settings UI and saving

document.addEventListener("DOMContentLoaded", function () {
  // Get UI elements
  const enabledToggle = document.getElementById("enabled");
  const poisonUserAgentToggle = document.getElementById("poisonUserAgent");
  const poisonCanvasToggle = document.getElementById("poisonCanvas");
  const poisonWebGLToggle = document.getElementById("poisonWebGL");
  const poisonAudioContextToggle = document.getElementById("poisonAudioContext");
  const poisonClientRectsToggle = document.getElementById("poisonClientRects");
  const poisonFontsToggle = document.getElementById("poisonFonts");
  const consistentNoiseToggle = document.getElementById("consistentNoise");
  const noiseLevelSlider = document.getElementById("noiseLevel");
  const noiseLevelValue = document.getElementById("noiseLevelValue");
  const saveButton = document.getElementById("save");

  // Load current settings
  chrome.runtime.sendMessage({ type: "getSettings" }, function (response) {
    const settings = response.settings;

    // Set UI elements to match current settings
    enabledToggle.checked = settings.enabled;
    poisonUserAgentToggle.checked = settings.poisonUserAgent;
    poisonCanvasToggle.checked = settings.poisonCanvas;
    poisonWebGLToggle.checked = settings.poisonWebGL;
    poisonAudioContextToggle.checked = settings.poisonAudioContext;
    poisonClientRectsToggle.checked = settings.poisonClientRects;
    poisonFontsToggle.checked = settings.poisonFonts;
    consistentNoiseToggle.checked = settings.consistentNoise;
    noiseLevelSlider.value = settings.noiseLevel;
    noiseLevelValue.textContent = settings.noiseLevel;

    // Update enabled state
    updateEnabledState(settings.enabled);
  });

  // Handle noise level slider
  noiseLevelSlider.addEventListener("input", function () {
    noiseLevelValue.textContent = this.value;
  });

  // Handle enabled toggle
  enabledToggle.addEventListener("change", function () {
    updateEnabledState(this.checked);
  });

  // Function to update UI based on enabled state
  function updateEnabledState(enabled) {
    const settingsElements = [
      poisonUserAgentToggle,
      poisonCanvasToggle,
      poisonWebGLToggle,
      poisonAudioContextToggle,
      poisonClientRectsToggle,
      poisonFontsToggle,
      consistentNoiseToggle,
      noiseLevelSlider,
    ];

    settingsElements.forEach((element) => {
      element.disabled = !enabled;
      // Update parent container opacity to show disabled state
      const container = element.closest(".toggle-container, .range-container");
      if (container) {
        container.style.opacity = enabled ? "1" : "0.5";
      }
    });
  }

  // Handle view stats button
  document.getElementById("view-stats").addEventListener("click", function () {
    chrome.runtime.openOptionsPage();
  });

  // Handle save button
  saveButton.addEventListener("click", function () {
    const settings = {
      enabled: enabledToggle.checked,
      poisonUserAgent: poisonUserAgentToggle.checked,
      poisonCanvas: poisonCanvasToggle.checked,
      poisonWebGL: poisonWebGLToggle.checked,
      poisonAudioContext: poisonAudioContextToggle.checked,
      poisonClientRects: poisonClientRectsToggle.checked,
      poisonFonts: poisonFontsToggle.checked,
      consistentNoise: consistentNoiseToggle.checked,
      noiseLevel: parseInt(noiseLevelSlider.value),
    };

    // Save settings
    chrome.runtime.sendMessage(
      {
        type: "saveSettings",
        settings: settings,
      },
      function (response) {
        if (response.success) {
          // Show success indicator
          saveButton.textContent = "Saved!";
          saveButton.style.backgroundColor = "#4CAF50";

          // Reset button text after 2 seconds
          setTimeout(function () {
            saveButton.textContent = "Save Settings";
            saveButton.style.backgroundColor = "#2196F3";
          }, 2000);
        }
      },
    );
  });
});
