// FingerprintPoisoner stats collector
// Tracks fingerprinting attempts and modifications

// Stats storage format
// {
//   totalSites: number,
//   siteData: {
//     [domain]: {
//       firstVisit: timestamp,
//       lastVisit: timestamp,
//       fingerprintingDetected: boolean,
//       modifications: {
//         userAgent: number,
//         canvas: number,
//         webGL: number,
//         audioContext: number,
//         clientRects: number,
//         fonts: number
//       }
//     }
//   }
// }

/**
 * Initialize stats storage
 */
function initStats() {
  chrome.storage.local.get(["fingerprintStats"], function (result) {
    if (!result.fingerprintStats) {
      chrome.storage.local.set({
        fingerprintStats: {
          totalSites: 0,
          siteData: {},
        },
      });
    }
  });
}

/**
 * Record a site visit
 * @param {string} domain - Site domain
 * @param {boolean} fingerprintingDetected - Whether fingerprinting was detected
 */
function recordSiteVisit(domain, fingerprintingDetected = false) {
  chrome.storage.local.get(["fingerprintStats"], function (result) {
    const stats = result.fingerprintStats || {
      totalSites: 0,
      siteData: {},
    };

    const timestamp = Date.now();

    // Create site entry if it doesn't exist
    if (!stats.siteData[domain]) {
      stats.siteData[domain] = {
        firstVisit: timestamp,
        lastVisit: timestamp,
        fingerprintingDetected: fingerprintingDetected,
        modifications: {
          userAgent: 0,
          canvas: 0,
          webGL: 0,
          audioContext: 0,
          clientRects: 0,
          fonts: 0,
        },
      };

      // Increment total sites
      stats.totalSites++;
    } else {
      // Update existing site data
      stats.siteData[domain].lastVisit = timestamp;

      // Update fingerprinting flag if detected
      if (fingerprintingDetected) {
        stats.siteData[domain].fingerprintingDetected = true;
      }
    }

    // Save updated stats
    chrome.storage.local.set({ fingerprintStats: stats });
  });
}

/**
 * Record a fingerprinting modification
 * @param {string} domain - Site domain
 * @param {string} type - Type of modification
 */
function recordModification(domain, type) {
  chrome.storage.local.get(["fingerprintStats"], function (result) {
    const stats = result.fingerprintStats;

    if (!stats || !stats.siteData[domain]) {
      return;
    }

    // Increment modification counter
    if (stats.siteData[domain].modifications[type] !== undefined) {
      stats.siteData[domain].modifications[type]++;
    }

    // Save updated stats
    chrome.storage.local.set({ fingerprintStats: stats });
  });
}

/**
 * Get summary statistics
 * @param {function} callback - Callback function with stats
 */
function getStatsSummary(callback) {
  chrome.storage.local.get(["fingerprintStats"], function (result) {
    const stats = result.fingerprintStats || {
      totalSites: 0,
      siteData: {},
    };

    const summary = {
      totalSites: stats.totalSites,
      sitesWithFingerprinting: 0,
      totalModifications: 0,
      modificationsByType: {
        userAgent: 0,
        canvas: 0,
        webGL: 0,
        audioContext: 0,
        clientRects: 0,
        fonts: 0,
      },
    };

    // Calculate summary statistics
    for (const domain in stats.siteData) {
      const site = stats.siteData[domain];

      // Count sites with fingerprinting
      if (site.fingerprintingDetected) {
        summary.sitesWithFingerprinting++;
      }

      // Sum modifications
      for (const type in site.modifications) {
        const count = site.modifications[type];
        summary.totalModifications += count;
        summary.modificationsByType[type] += count;
      }
    }

    callback(summary);
  });
}

/**
 * Clear statistics data
 * @param {function} callback - Callback function when complete
 */
function clearStats(callback) {
  chrome.storage.local.set(
    {
      fingerprintStats: {
        totalSites: 0,
        siteData: {},
      },
    },
    callback,
  );
}

// Export functions
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initStats,
    recordSiteVisit,
    recordModification,
    getStatsSummary,
    clearStats,
  };
}
