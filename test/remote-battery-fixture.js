'use strict';

const { CLUSTER } = require('zigbee-clusters');
const { remote } = require('./helpers');

// The Homey host is unavailable in Node tests. Keep the real pinned SDK
// parseAttributeReport() method, substituting only the device-host registration
// and a controlled incoming ZCL attribute-report emitter.
function batteryFixture(id, readValue = 160) {
  const fixture = remote(id);
  const { device } = fixture;
  const cluster = device.zclNode.endpoints[1].clusters.powerConfiguration;
  const updates = [];
  const reads = [];
  let currentReadValue = readValue;
  let registration;

  const originalSet = device.setCapabilityValue.bind(device);
  device.setCapabilityValue = async (capability, value) => {
    updates.push({ capability, value });
    return originalSet(capability, value);
  };

  device.registerCapability = (capability, spec, opts) => {
    if (capability !== 'measure_battery') return;
    registration = { capability, spec, opts };
    cluster.on('attr.batteryPercentageRemaining', value => {
      void device.parseAttributeReport(capability, spec, { batteryPercentageRemaining: value });
    });
  };

  device._getClusterCapabilityConfiguration = (capability, spec) => {
    if (!registration || capability !== registration.capability || spec !== registration.spec) {
      throw new Error('Unregistered test capability');
    }
    return {
      ...registration.opts,
      endpoint: 1,
      get: 'batteryPercentageRemaining',
      report: 'batteryPercentageRemaining',
    };
  };

  cluster.readAttributes = async attributes => {
    reads.push(attributes);
    return { batteryPercentageRemaining: currentReadValue };
  };
  device.getClusterCapabilityValue = async (capability, spec) => {
    if (capability !== 'measure_battery' || spec !== CLUSTER.POWER_CONFIGURATION) {
      throw new Error('Unexpected battery refresh path');
    }
    const response = await cluster.readAttributes(['batteryPercentageRemaining']);
    return device.parseAttributeReport(capability, spec, response);
  };

  return {
    ...fixture,
    cluster,
    updates,
    reads,
    get registration() { return registration; },
    setReadValue(value) { currentReadValue = value; },
  };
}

module.exports = { batteryFixture };
