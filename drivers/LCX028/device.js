'use strict';

const Light = require('../Light.js');

// Standard whole-string light controls use Zigbee ZCL. Festavia's per-segment
// gradient protocol uses Philips manufacturer-specific cluster 0xFC01 and is
// intentionally not exposed until that protocol is implemented and verified.
class FestaviaDevice extends Light {}

module.exports = FestaviaDevice;
