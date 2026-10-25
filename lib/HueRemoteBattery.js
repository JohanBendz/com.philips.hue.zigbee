'use strict';

const { isValidHueBatteryReport } = require('./HueSensorAvailability');
const { markHueLastSeenFromTraffic } = require('./HueLastSeen');
const { markHueRemoteAvailable } = require('./HueRemoteAvailability');

// One report parser for the SDK's normal measure_battery registration.
// Keep the old strict invalid-range behavior; the SDK owns the one and only
// capability write, for both attribute reports and explicit wake-up reads.
function parseHueRemoteBattery(value) {
  if (!isValidHueBatteryReport(value)) return null;
  return Math.round(value / 2);
}

// 'attr.*' is emitted by the pinned ZCL library for unsolicited reports,
// not for normal readAttributes() responses. This listener is telemetry only:
// registerCapability('measure_battery', ...) already updates the capability.
function observeHueRemoteBatteryReports(device, cluster, { recoverAvailability = false } = {}) {
  const report = value => {
    if (parseHueRemoteBattery(value) === null) return;
    if (recoverAvailability) {
      markHueRemoteAvailable(device);
    } else {
      void markHueLastSeenFromTraffic(device);
    }
  };
  cluster.on('attr.batteryPercentageRemaining', report);
  return () => cluster.removeListener('attr.batteryPercentageRemaining', report);
}

module.exports = { parseHueRemoteBattery, observeHueRemoteBatteryReports };
