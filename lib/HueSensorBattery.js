'use strict';

function parseBatteryPercentage(rawValue) {
  if (typeof rawValue !== 'number' || rawValue < 0 || rawValue > 200 || rawValue === 255) {
    return null;
  }
  return Math.round(rawValue / 2);
}

async function applyHueSensorBattery(device, rawValue) {
  const percentage = parseBatteryPercentage(rawValue);
  if (percentage === null) {
    device.log('Ignoring invalid batteryPercentageRemaining value:', rawValue);
    return null;
  }

  const configuredThreshold = Number(device.getSetting('batteryThreshold'));
  const threshold = Number.isFinite(configuredThreshold) && configuredThreshold > 0
    ? configuredThreshold
    : 20;

  if (device.hasCapability('measure_battery')) {
    await device.setCapabilityValue('measure_battery', percentage);
  }
  if (device.hasCapability('alarm_battery')) {
    await device.setCapabilityValue('alarm_battery', percentage <= threshold);
  }

  return percentage;
}

async function refreshHueSensorBattery(device) {
  try {
    const cluster = device.zclNode?.endpoints?.[2]?.clusters?.powerConfiguration;
    if (!cluster) {
      return null;
    }
    const result = await cluster.readAttributes(['batteryPercentageRemaining']);
    return await applyHueSensorBattery(device, result.batteryPercentageRemaining);
  } catch (error) {
    device.log('Could not refresh Hue motion sensor battery state:', error);
    return null;
  }
}

module.exports = {
  applyHueSensorBattery,
  parseBatteryPercentage,
  refreshHueSensorBattery,
};
