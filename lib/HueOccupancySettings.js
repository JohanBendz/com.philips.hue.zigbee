'use strict';

const EXTENDED_SENSITIVITY_MODELS = new Set([
  'SML003',
  '9290030657',
  'SML004',
]);

const OCCUPANCY_SETTING_DEFAULTS = Object.freeze({
  motion_sensitivity: '2',
  ledIndicator: 'false',
  temperature_offset: 0,
  temperature_decimals: '1',
  batteryThreshold: 20,
  minReportLux: 60,
  maxReportLux: 300,
  minReportTemp: 60,
  maxReportTemp: 300,
});

function getMotionSensitivityMax(productId) {
  return EXTENDED_SENSITIVITY_MODELS.has(productId) ? 4 : 2;
}

async function migrateMissingOccupancySettings(device) {
  const missing = {};

  for (const [key, defaultValue] of Object.entries(OCCUPANCY_SETTING_DEFAULTS)) {
    const currentValue = device.getSetting(key);
    if (currentValue === undefined || currentValue === null) {
      missing[key] = defaultValue;
    }
  }

  if (!Object.keys(missing).length) {
    return missing;
  }

  // Preserve a previously selected LED preference stored by older app versions.
  if (Object.prototype.hasOwnProperty.call(missing, 'ledIndicator')) {
    const storedLedIndicator = device.getStoreValue('ledIndicator');
    if (storedLedIndicator !== undefined && storedLedIndicator !== null) {
      missing.ledIndicator = (
        storedLedIndicator === true
        || storedLedIndicator === 1
        || storedLedIndicator === 'true'
      ) ? 'true' : 'false';
    }
  }

  // Set every missing value in one call. Homey has historically rejected a
  // partial setSettings() update while another declared setting remained unset.
  await device.setSettings(missing);
  return missing;
}

module.exports = {
  OCCUPANCY_SETTING_DEFAULTS,
  getMotionSensitivityMax,
  migrateMissingOccupancySettings,
};
