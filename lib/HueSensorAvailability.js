'use strict';

const { markHueLastSeenFromTraffic } = require('./HueLastSeen');

// ZCL temperature is in 0.01 C; -32768 (0x8000) represents invalid.
const isValidHueTemperatureReport = value =>
  Number.isInteger(value) && value >= -27315 && value <= 32767;

// ZCL illuminance uses 0xFFFF for an invalid/unknown measurement.
const isValidHueLuminanceReport = value =>
  Number.isInteger(value) && value >= 0 && value <= 0xFFFE;

// Battery remaining is reported in half-percent units (0..200); 255 means unknown.
const isValidHueBatteryReport = value =>
  Number.isInteger(value) && value >= 0 && value <= 200;

const isValidHueOccupancyReport = value =>
  value !== null && typeof value === 'object' && typeof value.occupied === 'boolean';

// Keep existing availability recovery, including for malformed reports, unchanged.
// Only validated report callbacks are permitted to update Homey's last-seen.
function markHueSensorAvailable(device, { validReport = false } = {}) {
  const result = device.setAvailable()
    .catch(error => device.error('Could not mark Hue sensor available after report', error));
  if (validReport) {
    void markHueLastSeenFromTraffic(device);
  }
  return result;
}

// SOC001 previously did not change availability from contact/battery handlers.
// Keep this telemetry-only entry point for accepted inbound reports/commands.
function markHueSensorReportObserved(device) {
  void markHueLastSeenFromTraffic(device);
}

module.exports = {
  markHueSensorAvailable,
  markHueSensorReportObserved,
  isValidHueTemperatureReport,
  isValidHueLuminanceReport,
  isValidHueBatteryReport,
  isValidHueOccupancyReport,
};
