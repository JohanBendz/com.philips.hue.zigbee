'use strict';

const Light = require('../Light.js');

// Standard light controls are supported through Zigbee ZCL. The Signe's
// multi-zone gradient uses Philips manufacturer-specific cluster 0xFC01
// (64513) and is intentionally not exposed until that protocol is implemented.
class HueGradientSigneFloorDevice extends Light {}

module.exports = HueGradientSigneFloorDevice;
