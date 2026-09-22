'use strict';

const Light = require('../Light.js');

// Philips maps Twilight as:
//   endpoint 12 = front light
//   endpoint 11 = back light (also carries the gradient extension)
// Standard color-ambiance controls are isolated per Homey subdevice.
// Gradient control and the physical switch endpoint are intentionally separate work.
class HueTwilightDevice extends Light {
  getClusterEndpoint(cluster) {
    const { subDeviceId } = this.getData();
    if (subDeviceId !== undefined && subDeviceId !== 'back') {
      throw new Error(`Unknown Twilight subdevice: ${subDeviceId}`);
    }

    const endpoint = subDeviceId === 'back' ? 11 : 12;
    return this.zclNode.endpoints[endpoint]?.clusters?.[cluster.NAME] ? endpoint : null;
  }
}

module.exports = HueTwilightDevice;
