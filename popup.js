// popup.js
document.addEventListener("DOMContentLoaded", function () {
  // Get UI elements
  const enabledToggle = document.getElementById("enabledToggle");
  const userAgentToggle = document.getElementById("userAgentToggle");
  const userAgentSelect = document.getElementById("userAgentSelect");
  const timezoneToggle = document.getElementById("timezoneToggle");
  const timezoneSelect = document.getElementById("timezoneSelect");
  const canvasToggle = document.getElementById("canvasToggle");
  const webrtcToggle = document.getElementById("webrtcToggle");
  const webglToggle = document.getElementById("webglToggle");
  const audioToggle = document.getElementById("audioToggle");
  const randomizeToggle = document.getElementById("randomizeToggle");
  const saveButton = document.getElementById("saveButton");

  // Load current configuration
  chrome.runtime.sendMessage({ action: "getConfig" }, (config) => {
    // Set toggle states
    enabledToggle.checked = config.enabled;
    userAgentToggle.checked = config.spoofUserAgent;
    timezoneToggle.checked = config.spoofTimezone;
    canvasToggle.checked = config.blockCanvas;
    webrtcToggle.checked = config.blockWebRTC;
    webglToggle.checked = config.blockWebGL;
    audioToggle.checked = config.spoofAudioContext;
    randomizeToggle.checked = config.randomize;

    // Populate User-Agent select
    config.userAgents.forEach((agent, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = formatUserAgent(agent);
      userAgentSelect.appendChild(option);
    });
    userAgentSelect.value = config.selectedUserAgent;

    // Populate Timezone select
    config.timezones.forEach((tz, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = tz;
      timezoneSelect.appendChild(option);
    });
    timezoneSelect.value = config.selectedTimezone;

    // Update disabled state for selects based on toggles and randomize setting
    updateSelectDisabledState();
  });

  // Helper function to format user agent for display
  function formatUserAgent(ua) {
    if (ua.includes("Windows")) return "Windows - Chrome";
    if (ua.includes("Macintosh") && ua.includes("Chrome")) return "macOS - Chrome";
    if (ua.includes("Linux")) return "Linux - Chrome";
    if (ua.includes("Safari/605")) return "macOS - Safari";
    return ua.substring(0, 40) + "...";
  }

  // Update disabled state for selects
  function updateSelectDisabledState() {
    userAgentSelect.disabled = !userAgentToggle.checked || randomizeToggle.checked;
    timezoneSelect.disabled = !timezoneToggle.checked || randomizeToggle.checked;
  }

  // Add event listeners for toggles
  userAgentToggle.addEventListener("change", updateSelectDisabledState);
  timezoneToggle.addEventListener("change", updateSelectDisabledState);
  randomizeToggle.addEventListener("change", updateSelectDisabledState);

  // Save button click handler
  saveButton.addEventListener("click", () => {
    const updatedConfig = {
      enabled: enabledToggle.checked,
      spoofUserAgent: userAgentToggle.checked,
      spoofTimezone: timezoneToggle.checked,
      blockCanvas: canvasToggle.checked,
      blockWebRTC: webrtcToggle.checked,
      blockWebGL: webglToggle.checked,
      spoofAudioContext: audioToggle.checked,
      randomize: randomizeToggle.checked,
      selectedUserAgent: parseInt(userAgentSelect.value),
      selectedTimezone: parseInt(timezoneSelect.value),
    };

    chrome.runtime.sendMessage(
      {
        action: "updateConfig",
        config: updatedConfig,
      },
      (response) => {
        if (response.success) {
          // Show success message
          saveButton.textContent = "Saved!";
          setTimeout(() => {
            saveButton.textContent = "Save Settings";
          }, 1500);
        }
      },
    );
  });
});

// icons folder - you'll need to create these icons or use placeholders
// icons/icon16.png  (16x16 pixels)
// icons/icon48.png  (48x48 pixels)
// icons/icon128.png (128x128 pixels)
