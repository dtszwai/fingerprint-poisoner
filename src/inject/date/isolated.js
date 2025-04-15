/**
 * Date/Timezone Fingerprint Poisoner - Isolated World Script
 *
 * This script runs in the ISOLATED world and sends a message to the
 * main world to inject the date protection into the page.
 */

(function () {
  // Send message to the main world to inject date protection
  parent.postMessage("inject-date-into-source", "*");
})();
