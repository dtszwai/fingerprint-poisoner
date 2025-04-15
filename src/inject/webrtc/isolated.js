/**
 * WebRTC Fingerprint Poisoner - Isolated World Content Script
 *
 * This script runs in the ISOLATED world and captures any attempts
 * to use WebRTC technology at the DOM level.
 */

(function () {
  // This script runs in an isolated world, so we focus on DOM modifications
  // that might be used to detect our WebRTC poisoning

  // Watch for changes to navigator or window properties that could be used to detect
  // if we've modified the WebRTC APIs

  // Options for the isolated world
  const isolatedOptions = {
    preventDetection: true,
    simulateRealBehavior: true,
  };

  // Create a MutationObserver to watch for script tags being added to the page
  if (isolatedOptions.preventDetection) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.tagName === "SCRIPT") {
              // Look for scripts that might be trying to detect our WebRTC modifications
              const scriptContent = node.textContent || "";
              if (
                scriptContent.includes("RTCPeerConnection") ||
                scriptContent.includes("webkitRTCPeerConnection") ||
                scriptContent.includes("mozRTCPeerConnection") ||
                scriptContent.includes("mediaDevices.enumerateDevices") ||
                scriptContent.includes("fingerprint") ||
                scriptContent.includes("Object.getOwnPropertyDescriptor") ||
                scriptContent.includes("navigator.__proto__")
              ) {
                // This script might be trying to detect our modifications
                // Replace it with a safe version that behaves naturally
                const safeScript = scriptContent
                  // Make sure any fingerprinting checks pass
                  .replace(
                    /Object\.getOwnPropertyDescriptor\s*\(\s*(window|navigator|RTCPeerConnection)/,
                    "Object.getOwnPropertyDescriptor(window.originalObjects || $1",
                  )
                  .replace(/\.__proto__/g, ".protoReference");

                // Only replace if we changed something
                if (safeScript !== scriptContent) {
                  node.textContent = safeScript;
                  console.log("[FingerprintPoisoner] Neutralized WebRTC detection script");
                }
              }
            }
          }
        }
      }
    });

    // Start observing the document
    observer.observe(document, {
      childList: true,
      subtree: true,
    });
  }

  // Simulate some randomized WebRTC behavior if needed
  if (isolatedOptions.simulateRealBehavior) {
    // Create some fake data
    const simulateWebRTCActivity = () => {
      // Randomly simulate some WebRTC traffic to mask our behavior
      if (Math.random() < 0.01) {
        // Very occasional simulation
        const simulatedEvent = new CustomEvent("webrtcactivity", {
          detail: {
            timestamp: Date.now(),
            activityType: Math.random() < 0.5 ? "incoming" : "outgoing",
            dataSize: Math.floor(Math.random() * 1024),
          },
        });
        document.dispatchEvent(simulatedEvent);
      }
    };

    // Run the simulator occasionally
    setInterval(simulateWebRTCActivity, 5000);
  }
})();
