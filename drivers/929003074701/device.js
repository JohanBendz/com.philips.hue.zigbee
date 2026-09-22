'use strict';

const Light = require('../Light.js');

const MAX_LEVEL = 254;

class HueXamentoSpotDevice extends Light {
  async changeDimLevel(dim, opts = {}) {
    // This Xamento variant switches off when sent Zigbee level 1.
    // Keep zero as a real off command, but skip the device-specific dead level.
    if (typeof dim === 'number' && dim > 0 && Math.round(dim * MAX_LEVEL) === 1) {
      return super.changeDimLevel(2 / MAX_LEVEL, opts);
    }
    return super.changeDimLevel(dim, opts);
  }
}

module.exports = HueXamentoSpotDevice;
