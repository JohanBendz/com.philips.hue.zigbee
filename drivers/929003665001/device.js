'use strict';

const Light = require('../Light');

// Keep PR #709's identities: root = bottom (12), subDeviceId "top" = top (11).
// Every inherited light operation must resolve within its own zone, including
// color discovery, settings, blink/alert and continuous dimming.
class HueDymeraDevice extends Light {
  getClusterEndpoint(cluster) {
    const { subDeviceId } = this.getData();
    if (subDeviceId !== undefined && subDeviceId !== 'top') {
      throw new Error(`Unknown Dymera subdevice: ${subDeviceId}`);
    }
    const endpoint = subDeviceId === 'top' ? 11 : 12;
    return this.zclNode.endpoints[endpoint]?.clusters?.[cluster.NAME] ? endpoint : null;
  }
}

module.exports = HueDymeraDevice;
