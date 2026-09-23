'use strict';

const { CLUSTER } = require('zigbee-clusters');

function getHueSensorMeasurementReporting(device) {
  const configurations = [];

  if (device.hasCapability('measure_temperature')) {
    configurations.push({
      endpointId: 2,
      cluster: CLUSTER.TEMPERATURE_MEASUREMENT,
      attributeName: 'measuredValue',
      minInterval: device.getSetting('minReportTemp') || 60,
      maxInterval: device.getSetting('maxReportTemp') || 300,
      minChange: 1,
    });
  }

  if (device.hasCapability('measure_luminance')) {
    configurations.push({
      endpointId: 2,
      cluster: CLUSTER.ILLUMINANCE_MEASUREMENT,
      attributeName: 'measuredValue',
      minInterval: device.getSetting('minReportLux') || 60,
      maxInterval: device.getSetting('maxReportLux') || 300,
      minChange: 1,
    });
  }

  return configurations;
}

async function refreshHueSensorMeasurementReporting(device) {
  const configurations = getHueSensorMeasurementReporting(device);
  if (configurations.length === 0) {
    return;
  }
  await device.configureAttributeReporting(configurations);
}

async function refreshHueSensorMeasurementReportingOnce(device) {
  if (device._measurementReportingRefreshPending !== true) {
    return false;
  }

  try {
    await refreshHueSensorMeasurementReporting(device);
    device._measurementReportingRefreshPending = false;
    device.log('Refreshed Hue sensor temperature/luminance reporting after wake');
    return true;
  } catch (error) {
    device.log('Could not refresh Hue sensor temperature/luminance reporting after wake:', error);
    return false;
  }
}

module.exports = {
  getHueSensorMeasurementReporting,
  refreshHueSensorMeasurementReporting,
  refreshHueSensorMeasurementReportingOnce,
};
