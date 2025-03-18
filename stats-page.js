// FingerprintPoisoner stats page script
// Displays statistics about fingerprinting protection

document.addEventListener("DOMContentLoaded", function () {
  // Load and display stats
  loadStats();

  // Add event listeners for buttons
  document.getElementById("export-stats").addEventListener("click", exportStats);
  document.getElementById("clear-stats").addEventListener("click", clearStats);
});

// Load statistics from storage
function loadStats() {
  chrome.storage.local.get(["fingerprintStats"], function (result) {
    const stats = result.fingerprintStats || {
      totalSites: 0,
      siteData: {},
    };

    // Calculate summary statistics
    const summary = calculateSummary(stats);

    // Update the overview stats
    updateOverviewStats(summary);

    // Create the chart
    createModificationsChart(summary.modificationsByType);

    // Update the sites table
    updateSitesTable(stats.siteData);
  });
}

// Calculate summary statistics
function calculateSummary(stats) {
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

  return summary;
}

// Update the overview stats cards
function updateOverviewStats(summary) {
  document.getElementById("total-sites").textContent = summary.totalSites;
  document.getElementById("sites-with-fingerprinting").textContent = summary.sitesWithFingerprinting;
  document.getElementById("total-modifications").textContent = summary.totalModifications;

  // Calculate protection rate
  const protectionRate =
    summary.totalSites > 0 ? Math.round((summary.sitesWithFingerprinting / summary.totalSites) * 100) : 0;

  document.getElementById("protection-rate").textContent = `${protectionRate}%`;
}

// Create chart for modifications by type
function createModificationsChart(modificationsByType) {
  const canvas = document.getElementById("modifications-chart");
  const ctx = canvas.getContext("2d");

  // Define colors for each type
  const colors = {
    userAgent: "#4285F4", // Google Blue
    canvas: "#EA4335", // Google Red
    webGL: "#FBBC05", // Google Yellow
    audioContext: "#34A853", // Google Green
    clientRects: "#9C27B0", // Purple
    fonts: "#FF9800", // Orange
  };

  // Format data for chart
  const data = [];
  const labels = [];
  const bgColors = [];

  // Convert to better display names
  const typeDisplayNames = {
    userAgent: "User Agent",
    canvas: "Canvas",
    webGL: "WebGL",
    audioContext: "Audio",
    clientRects: "Client Rects",
    fonts: "Fonts",
  };

  for (const type in modificationsByType) {
    data.push(modificationsByType[type]);
    labels.push(typeDisplayNames[type] || type);
    bgColors.push(colors[type] || "#999999");
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the bar chart
  const barWidth = 80;
  const spacing = 40;
  const startX = 50;
  const chartHeight = 300;
  const startY = 350;

  // Find the maximum value for scaling
  const maxValue = Math.max(...data, 1);

  // Draw axes
  ctx.beginPath();
  ctx.moveTo(startX, 50);
  ctx.lineTo(startX, startY);
  ctx.lineTo(startX + (barWidth + spacing) * data.length, startY);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw y-axis labels
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#666";
  ctx.font = "12px sans-serif";

  const yLabels = 5;
  for (let i = 0; i <= yLabels; i++) {
    const value = Math.round(maxValue * (i / yLabels));
    const y = startY - (i / yLabels) * chartHeight;

    ctx.beginPath();
    ctx.moveTo(startX - 5, y);
    ctx.lineTo(startX, y);
    ctx.stroke();

    ctx.fillText(value, startX - 10, y);
  }

  // Draw bars and labels
  for (let i = 0; i < data.length; i++) {
    const x = startX + i * (barWidth + spacing) + spacing / 2;
    const barHeight = (data[i] / maxValue) * chartHeight;

    // Draw bar
    ctx.fillStyle = bgColors[i];
    ctx.fillRect(x, startY - barHeight, barWidth, barHeight);

    // Draw value on top of bar
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#333";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(data[i], x + barWidth / 2, startY - barHeight - 5);

    // Draw label below the bar
    ctx.textBaseline = "top";
    ctx.fillStyle = "#666";
    ctx.font = "14px sans-serif";
    ctx.fillText(labels[i], x + barWidth / 2, startY + 10);
  }
}

// Update the sites table
function updateSitesTable(siteData) {
  const tbody = document.getElementById("sites-tbody");
  tbody.innerHTML = "";

  // Get domains and sort by last visit (most recent first)
  const domains = Object.keys(siteData).sort((a, b) => {
    return siteData[b].lastVisit - siteData[a].lastVisit;
  });

  // Limit to 100 most recent sites
  const recentDomains = domains.slice(0, 100);

  // Create table rows
  for (const domain of recentDomains) {
    const site = siteData[domain];

    // Calculate total modifications
    let totalModifications = 0;
    for (const type in site.modifications) {
      totalModifications += site.modifications[type];
    }

    // Create table row
    const tr = document.createElement("tr");

    // Domain cell
    const domainCell = document.createElement("td");
    domainCell.textContent = domain;
    tr.appendChild(domainCell);

    // Last visit cell
    const lastVisitCell = document.createElement("td");
    lastVisitCell.textContent = new Date(site.lastVisit).toLocaleString();
    tr.appendChild(lastVisitCell);

    // Fingerprinting detected cell
    const fingerprintingCell = document.createElement("td");
    fingerprintingCell.textContent = site.fingerprintingDetected ? "Yes" : "No";
    fingerprintingCell.style.color = site.fingerprintingDetected ? "#EA4335" : "#34A853";
    tr.appendChild(fingerprintingCell);

    // Modifications cell
    const modificationsCell = document.createElement("td");

    // Create a progress bar
    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-bar";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-value";

    // Scale the width based on the number of modifications (max 100)
    const width = Math.min(totalModifications, 100);
    progressBar.style.width = `${width}%`;

    progressContainer.appendChild(progressBar);

    // Add progress bar and text
    modificationsCell.appendChild(progressContainer);
    modificationsCell.appendChild(document.createTextNode(" " + totalModifications));

    tr.appendChild(modificationsCell);

    // Add row to table
    tbody.appendChild(tr);
  }

  // Show message if no data
  if (recentDomains.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "No data available yet. Visit some websites with the extension enabled.";
    td.style.textAlign = "center";
    td.style.padding = "24px";
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

// Export statistics to JSON file
function exportStats() {
  chrome.storage.local.get(["fingerprintStats"], function (result) {
    const stats = result.fingerprintStats || { totalSites: 0, siteData: {} };

    // Create a JSON blob
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a link to download the file
    const a = document.createElement("a");
    a.href = url;
    a.download = `fingerprint-stats-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
  });
}

// Clear statistics
function clearStats() {
  if (confirm("Are you sure you want to clear all statistics? This cannot be undone.")) {
    chrome.storage.local.set(
      {
        fingerprintStats: {
          totalSites: 0,
          siteData: {},
        },
      },
      function () {
        loadStats(); // Reload the stats display

        // Show confirmation
        alert("Statistics have been cleared.");
      },
    );
  }
}
