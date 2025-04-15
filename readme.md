# FingerprintPoisoner

A browser extension that protects your privacy by poisoning browser fingerprinting attempts.

## Overview

FingerprintPoisoner is a comprehensive privacy tool that helps protect you against various browser fingerprinting techniques. Browser fingerprinting is a method websites use to identify and track users across the web without relying on cookies or local storage. This extension implements multiple strategies to randomize and alter your browser's fingerprint, making it difficult for sites to accurately track you.

## Features

### Header Modification

- Randomizes common HTTP headers used for fingerprinting:
  - User-Agent
  - Accept-Language
  - Accept
- Headers are automatically rotated periodically (every 30 minutes to 2 hours)
- Seamless header changes to prevent tracking across sessions

### Canvas Fingerprinting Protection

- Adds subtle noise to canvas data when read by scripts
- Preserves visual appearance for normal use
- Protects against one of the most common fingerprinting techniques
- Canvas modifications are designed to be difficult to detect

### WebRTC Protection

- Prevents IP address leakage through WebRTC
- Replaces public IP addresses with randomized private IPs
- Adds noise to WebRTC statistics and timing data
- Protects device information when enumerating media devices

### Date/Timezone Protection

- Normalizes timezone information to prevent geolocation tracking
- Makes all date methods return UTC values instead of local time
- Standardizes date formats to prevent locale-based fingerprinting
- Neutralizes `Intl.DateTimeFormat` for consistent results across users

### Font Detection Protection

- Adds random noise to element dimensions used for font detection
- Modifies font metrics reporting to prevent enumeration of installed fonts
- Alters element measurements in ways that are difficult to detect
- Preserves website functionality while blocking fingerprinting

### Screen Resolution Protection

- Normalizes screen dimensions to common values
- Adds subtle random noise to reported screen properties
- Provides consistent window dimensions that match modified screen size
- Prevents tracking based on unusual screen or window sizes

## How It Works

### Header Protection

The extension uses Chrome's declarativeNetRequest API to modify request headers on the fly. Headers are randomly selected from common configurations to maintain natural browsing behavior while preventing fingerprint consistency.

### Canvas Protection

When a site attempts to read data from an HTML canvas (a common fingerprinting technique), the extension:

1. Captures the original canvas data
2. Makes subtle, imperceptible modifications to pixel values
3. Returns the modified data to the requesting script
4. Restores the canvas to its original state for visual rendering

### WebRTC Protection

The extension intercepts WebRTC connections to:

1. Filter out public IP addresses from connection data
2. Replace addressing information with private IP addresses
3. Add minor statistical noise to connection data
4. Randomize device identifiers in a consistent way per session

### Date/Timezone Protection

The extension modifies JavaScript's Date object to:

1. Override local time methods to use UTC equivalents
2. Always report a timezone offset of 0 (UTC)
3. Standardize date string formatting to remove locale information
4. Present consistent date handling behavior regardless of location

### Font Detection Protection

To prevent font enumeration, the extension:

1. Adds subtle random noise to element dimensions
2. Modifies properties like offsetWidth and offsetHeight
3. Alters getBoundingClientRect() results slightly
4. Makes font detection tests return inconsistent results

### Screen Protection

The extension spoofs screen properties by:

1. Normalizing reported screen dimensions to common values
2. Adding subtle random variations to prevent exact matching
3. Ensuring consistent window dimensions relative to screen size
4. Presenting standard device pixel ratios

## Demo

A demonstration is available in the `/demo` directory that shows FingerprintPoisoner in action against FingerprintJS v4, one of the most popular browser fingerprinting libraries available today.

### Running the Demo

1. Navigate to the `/demo` directory
2. Open `index.html` in your browser
3. The page will generate your browser's visitor identifier and detailed fingerprinting information using FingerprintJS v4

The demo provides a simple interface to visualize how fingerprinting works and allows you to test the effectiveness of FingerprintPoisoner by running it with and without the extension enabled. You can compare the visitor identifiers and debug data to see exactly which fingerprinting signals are being poisoned by the extension.

## Installation

### Manual Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and active immediately

## Usage

Once installed, FingerprintPoisoner works automatically in the background. There are no settings to configure or buttons to press - the extension begins protecting your privacy immediately.

## Technical Details

### Content Script Isolation

The extension uses two separate contexts for content scripts:

- **MAIN world**: Direct access to modify page JavaScript objects and APIs
- **ISOLATED world**: Prevents detection of the modifications

### Periodic Updates

The extension randomizes headers on a variable schedule to prevent tracking based on header change patterns.

### Performance Considerations

- Canvas protection selectively modifies only a small percentage of pixels for efficiency
- Element dimension modifications use a probabilistic approach to minimize visual impacts
- Screen and date modifications are lightweight and have minimal performance impact
- All protection methods are designed to have minimal impact on browsing performance

## Privacy Notes

While FingerprintPoisoner significantly reduces fingerprinting effectiveness, no solution is perfect. Browser fingerprinting techniques constantly evolve, and this extension addresses the most common methods. For maximum privacy, consider using this extension alongside other privacy tools.
