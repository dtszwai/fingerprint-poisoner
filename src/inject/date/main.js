/**
 * Date/Timezone Fingerprint Poisoner - Main World Script
 *
 * This script protects against fingerprinting based on date/timezone
 * by normalizing timezone information to UTC.
 */

(function () {
  // Date/Timezone protection implementation
  {
    // Store original Date methods
    const origGetDate = Date.prototype.getDate;
    const origGetDay = Date.prototype.getDay;
    const origGetFullYear = Date.prototype.getFullYear;
    const origGetHours = Date.prototype.getHours;
    const origGetMilliseconds = Date.prototype.getMilliseconds;
    const origGetMinutes = Date.prototype.getMinutes;
    const origGetMonth = Date.prototype.getMonth;
    const origGetSeconds = Date.prototype.getSeconds;
    const origGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    const origGetYear = Date.prototype.getYear;
    const origToLocaleDateString = Date.prototype.toLocaleDateString;
    const origToLocaleString = Date.prototype.toLocaleString;
    const origToLocaleTimeString = Date.prototype.toLocaleTimeString;
    const origToString = Date.prototype.toString;
    const origToTimeString = Date.prototype.toTimeString;

    // Override Date methods to use UTC values
    Date.prototype.getDate = Date.prototype.getUTCDate;
    Date.prototype.getDay = Date.prototype.getUTCDay;
    Date.prototype.getFullYear = Date.prototype.getUTCFullYear;
    Date.prototype.getHours = Date.prototype.getUTCHours;
    Date.prototype.getMilliseconds = Date.prototype.getUTCMilliseconds;
    Date.prototype.getMinutes = Date.prototype.getUTCMinutes;
    Date.prototype.getMonth = Date.prototype.getUTCMonth;
    Date.prototype.getSeconds = Date.prototype.getUTCSeconds;

    // Override getTimezoneOffset to return 0 (UTC)
    Date.prototype.getTimezoneOffset = function () {
      return 0;
    };

    // Override getYear to return fullYear - 1900
    Date.prototype.getYear = function () {
      return this.getUTCFullYear() - 1900;
    };

    // Override setters to use UTC values
    Date.prototype.setDate = Date.prototype.setUTCDate;
    Date.prototype.setFullYear = Date.prototype.setUTCFullYear;
    Date.prototype.setHours = Date.prototype.setUTCHours;
    Date.prototype.setMilliseconds = Date.prototype.setUTCMilliseconds;
    Date.prototype.setMinutes = Date.prototype.setUTCMinutes;
    Date.prototype.setMonth = Date.prototype.setUTCMonth;
    Date.prototype.setSeconds = Date.prototype.setUTCSeconds;

    // Override setYear to use setFullYear
    Date.prototype.setYear = function (year) {
      return this.setUTCFullYear(year < 100 ? year + 1900 : year);
    };

    // Helper function to format date in a consistent way
    const formatDate = (date) => {
      return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date
        .getUTCDate()
        .toString()
        .padStart(2, "0")}`;
    };

    // Helper function to format time in a consistent way
    const formatTime = (date) => {
      return `${date.getUTCHours().toString().padStart(2, "0")}:${date
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
    };

    // Helper function to format date and time in a consistent way
    const formatDateTime = (date) => {
      return `${formatDate(date)} ${formatTime(date)} UTC`;
    };

    Date.prototype.toLocaleDateString = function () {
      return formatDate(this);
    };

    Date.prototype.toLocaleString = function () {
      return formatDateTime(this);
    };

    Date.prototype.toLocaleTimeString = function () {
      return formatTime(this);
    };

    Date.prototype.toString = function () {
      return formatDateTime(this);
    };

    Date.prototype.toTimeString = function () {
      return `${formatTime(this)} UTC`;
    };

    // Override Intl to prevent timezone/locale fingerprinting
    if (window.Intl) {
      const origDateTimeFormat = window.Intl.DateTimeFormat;

      window.Intl.DateTimeFormat = function () {
        let locale = "en-US";
        let options = { timeZone: "UTC" };

        // Use user's locale for first argument if provided
        if (arguments.length > 0 && arguments[0]) {
          if (typeof arguments[0] === "string" || Array.isArray(arguments[0])) {
            locale = arguments[0];
          }
        }

        // Merge user's options but enforce UTC timezone
        if (arguments.length > 1 && arguments[1]) {
          options = { ...arguments[1], timeZone: "UTC" };
        }

        return new origDateTimeFormat(locale, options);
      };

      // Maintain toString behavior
      window.Intl.DateTimeFormat.toString = origDateTimeFormat.toString.bind(origDateTimeFormat);

      // Also modify Intl.NumberFormat to be consistent
      if (window.Intl.NumberFormat) {
        const origNumberFormat = window.Intl.NumberFormat;

        window.Intl.NumberFormat = function () {
          // Keep arguments but ensure consistent behavior
          return new origNumberFormat(...arguments);
        };

        window.Intl.NumberFormat.toString = origNumberFormat.toString.bind(origNumberFormat);
      }
    }
  }

  // Handle iframe communication
  {
    /**
     * Inject date protection into iframe source
     * @param {MessageEvent} e - The message event
     */
    const injectIntoSource = (e) => {
      if (e.source && e.data === "inject-date-into-source") {
        try {
          // Apply date protection to iframe source
          e.source.Date.prototype.getDate = Date.prototype.getDate;
          e.source.Date.prototype.getDay = Date.prototype.getDay;
          e.source.Date.prototype.getFullYear = Date.prototype.getFullYear;
          e.source.Date.prototype.getHours = Date.prototype.getHours;
          e.source.Date.prototype.getMilliseconds = Date.prototype.getMilliseconds;
          e.source.Date.prototype.getMinutes = Date.prototype.getMinutes;
          e.source.Date.prototype.getMonth = Date.prototype.getMonth;
          e.source.Date.prototype.getSeconds = Date.prototype.getSeconds;
          e.source.Date.prototype.getTimezoneOffset = Date.prototype.getTimezoneOffset;
          e.source.Date.prototype.getYear = Date.prototype.getYear;
          e.source.Date.prototype.setDate = Date.prototype.setDate;
          e.source.Date.prototype.setFullYear = Date.prototype.setFullYear;
          e.source.Date.prototype.setHours = Date.prototype.setHours;
          e.source.Date.prototype.setMilliseconds = Date.prototype.setMilliseconds;
          e.source.Date.prototype.setMinutes = Date.prototype.setMinutes;
          e.source.Date.prototype.setMonth = Date.prototype.setMonth;
          e.source.Date.prototype.setSeconds = Date.prototype.setSeconds;
          e.source.Date.prototype.setYear = Date.prototype.setYear;
          e.source.Date.prototype.toLocaleDateString = Date.prototype.toLocaleDateString;
          e.source.Date.prototype.toLocaleString = Date.prototype.toLocaleString;
          e.source.Date.prototype.toLocaleTimeString = Date.prototype.toLocaleTimeString;
          e.source.Date.prototype.toString = Date.prototype.toString;
          e.source.Date.prototype.toTimeString = Date.prototype.toTimeString;

          if (e.source.Intl && window.Intl) {
            e.source.Intl.DateTimeFormat = window.Intl.DateTimeFormat;
          }

          // Listen for messages from the iframe
          e.source.addEventListener("message", injectIntoSource);

          console.log("[FingerprintPoisoner] Date protection injected into iframe");
        } catch (e) {
          console.warn("[FingerprintPoisoner] Cannot inject date protection into source:", e);
        }
      }
    };

    // Listen for injection requests
    addEventListener("message", injectIntoSource);
  }
})();
