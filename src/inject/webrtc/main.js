/**
 * WebRTC Fingerprint Poisoner - Main World Content Script
 *
 * This script runs in the MAIN world and overrides WebRTC methods
 * to prevent IP address leakage and add noise to WebRTC fingerprinting.
 */

(function () {
  // Generate a random private IP
  function generateRandomPrivateIP() {
    const privateRanges = [
      [192, 168, 0, 0, 255], // 192.168.0.0 - 192.168.255.255
      [172, 16, 0, 0, 31], // 172.16.0.0 - 172.31.255.255
      [10, 0, 0, 0, 255], // 10.0.0.0 - 10.255.255.255
    ];

    const range = privateRanges[Math.floor(Math.random() * privateRanges.length)];
    const ip = `${range[0]}.${range[1] + Math.floor(Math.random() * range[4])}.${Math.floor(
      Math.random() * 256,
    )}.${Math.floor(Math.random() * 256)}`;

    return ip;
  }

  // Random values for fingerprinting
  const privateIP = generateRandomPrivateIP();

  // Options for each session
  const options = {
    // Whether to completely disable WebRTC (most secure but may break functionality)
    disableWebRTC: false,

    // Whether to only return private IPs instead of public ones
    useOnlyPrivateIPs: true,

    // Whether to completely remove all IP addresses
    removeAllIPs: false,

    // Whether to add random noise to WebRTC stats and capabilities
    addNoise: true,
  };

  // Save original functions we'll be overriding
  const originalRTCPeerConnection =
    window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

  if (!originalRTCPeerConnection) {
    console.log("[FingerprintPoisoner] WebRTC not supported in this browser");
    return;
  }

  // Modify the RTCPeerConnection to protect against IP leakage
  class ProtectedRTCPeerConnection extends originalRTCPeerConnection {
    constructor(...args) {
      if (options.disableWebRTC) {
        // Throw an error that looks natural so it won't raise suspicion
        throw new Error("Failed to construct 'RTCPeerConnection': Not enough resources");
      }

      super(...args);
      const pc = this;

      // Override the original createOffer method
      const originalCreateOffer = pc.createOffer.bind(pc);
      pc.createOffer = function (options) {
        return originalCreateOffer(options)
          .then(modifySdpOffer)
          .catch((error) => Promise.reject(error));
      };

      // Override the original createAnswer method
      const originalCreateAnswer = pc.createAnswer.bind(pc);
      pc.createAnswer = function (options) {
        return originalCreateAnswer(options)
          .then(modifySdpAnswer)
          .catch((error) => Promise.reject(error));
      };

      // Override the original setLocalDescription method
      const originalSetLocalDescription = pc.setLocalDescription.bind(pc);
      pc.setLocalDescription = function (description) {
        if (description && description.sdp) {
          description.sdp = modifySdp(description.sdp);
        }
        return originalSetLocalDescription(description);
      };

      // Override the getStats method
      const originalGetStats = pc.getStats.bind(pc);
      pc.getStats = function (...args) {
        return originalGetStats(...args).then((stats) => {
          if (options.addNoise) {
            return modifyStats(stats);
          }
          return stats;
        });
      };
    }
  }

  // Modify SDP to remove IP addresses or replace with private ones
  function modifySdp(sdp) {
    if (options.removeAllIPs) {
      // Remove all IP addresses (may break functionality)
      sdp = sdp.replace(/IP4 \d+\.\d+\.\d+\.\d+/g, "IP4 0.0.0.0");
    } else if (options.useOnlyPrivateIPs) {
      // Replace public IPs with random private IPs
      sdp = sdp.replace(/IP4 \d+\.\d+\.\d+\.\d+/g, (match) => {
        const ip = match.split(" ")[1];
        // Check if public IP (very simplified check)
        if (!ip.startsWith("10.") && !ip.startsWith("172.16.") && !ip.startsWith("192.168.") && ip !== "127.0.0.1") {
          return "IP4 " + privateIP;
        }
        return match;
      });
    }

    // Add some noise to timing values
    if (options.addNoise) {
      sdp = sdp.replace(/a=rtpmap:\d+ \w+\/\d+/g, (match) => {
        const parts = match.split("/");
        // Don't modify if it doesn't match our expected format
        if (parts.length !== 2) return match;

        // Extract the sample rate and add minor noise (±5%)
        const baseRate = parseInt(parts[1], 10);
        if (!isNaN(baseRate)) {
          const noise = Math.floor(baseRate * 0.05 * (Math.random() * 2 - 1));
          const newRate = Math.max(baseRate + noise, 8000); // Ensure reasonable minimum
          return parts[0] + "/" + newRate;
        }
        return match;
      });
    }

    return sdp;
  }

  // Wrapper functions to help with sdp modification
  function modifySdpOffer(offer) {
    if (offer && offer.sdp) {
      offer.sdp = modifySdp(offer.sdp);
    }
    return offer;
  }

  function modifySdpAnswer(answer) {
    if (answer && answer.sdp) {
      answer.sdp = modifySdp(answer.sdp);
    }
    return answer;
  }

  // Add noise to WebRTC stats
  function modifyStats(stats) {
    if (!stats || typeof stats.forEach !== "function") {
      return stats;
    }

    stats.forEach((stat) => {
      // Add noise to timing values
      if (stat.timestamp) {
        stat.timestamp += Math.floor(Math.random() * 100) - 50;
      }

      // Add noise to RTT times
      if (stat.currentRoundTripTime) {
        const noise = Math.random() * 0.02 - 0.01; // ±10ms
        stat.currentRoundTripTime = Math.max(0.001, stat.currentRoundTripTime + noise);
      }

      // Add noise to bitrate/bandwidth values
      if (stat.bitrateMean) {
        const bitrateNoise = stat.bitrateMean * (0.1 * Math.random() - 0.05); // ±5%
        stat.bitrateMean += bitrateNoise;
      }

      // Add noise to jitter
      if (stat.jitter) {
        const jitterNoise = stat.jitter * (0.2 * Math.random() - 0.1); // ±10%
        stat.jitter = Math.max(0, stat.jitter + jitterNoise);
      }
    });

    return stats;
  }

  // Replace RTCPeerConnection with our protected version
  window.RTCPeerConnection = ProtectedRTCPeerConnection;
  window.webkitRTCPeerConnection = ProtectedRTCPeerConnection;
  window.mozRTCPeerConnection = ProtectedRTCPeerConnection;

  // Also block the MediaDevices API for additional protection
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
    navigator.mediaDevices.enumerateDevices = function () {
      // Either completely block or modify the device information
      if (Math.random() < 0.5) {
        // Sometimes just return an empty list (as if no devices were found)
        return Promise.resolve([]);
      } else {
        // Other times return the real list but with modified IDs
        return originalEnumerateDevices.apply(navigator.mediaDevices).then((devices) => {
          return devices.map((device) => {
            // Create a randomized but consistent device ID for this session
            const randomizedId =
              "fingerprint-poisoner-" +
              Math.random().toString(36).substring(2, 15) +
              Math.random().toString(36).substring(2, 15);

            // Clone the device info and modify the ID
            return {
              deviceId: randomizedId,
              groupId: randomizedId,
              kind: device.kind,
              label: device.kind + " (Protected)",
            };
          });
        });
      }
    };
  }
})();
