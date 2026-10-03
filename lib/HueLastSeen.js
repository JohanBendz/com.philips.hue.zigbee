'use strict';

// Observational Homey telemetry only. No Zigbee reads, polling or rejoin work.
const MIN_UPDATE_INTERVAL_MS = 60 * 1000;
const lastAttemptByDevice = new WeakMap();

function markHueLastSeenFromTraffic(device, nowMs = Date.now()) {
  // The production 2.4 runtime is >= Homey 12.9.0, which exposes this
  // API (introduced in 12.6.1). Keep SDK test doubles backward compatible.
  if (!device || typeof device.setLastSeenAt !== 'function') {
    return Promise.resolve(false);
  }

  const lastAttempt = lastAttemptByDevice.get(device);
  if (
    lastAttempt !== undefined &&
    nowMs >= lastAttempt &&
    nowMs - lastAttempt < MIN_UPDATE_INTERVAL_MS
  ) {
    return Promise.resolve(false);
  }

  // Reserve the interval immediately so concurrent high-frequency reports
  // cannot queue duplicate Homey state writes.
  lastAttemptByDevice.set(device, nowMs);

  return Promise.resolve()
    .then(() => device.setLastSeenAt())
    .then(() => true)
    .catch(error => {
      if (lastAttemptByDevice.get(device) === nowMs) {
        lastAttemptByDevice.delete(device); // allow retry on later real traffic
      }
      if (typeof device.error === 'function') {
        device.error('Could not update Hue device last-seen after Zigbee traffic', error);
      }
      return false;
    });
}

module.exports = { markHueLastSeenFromTraffic, MIN_UPDATE_INTERVAL_MS };
