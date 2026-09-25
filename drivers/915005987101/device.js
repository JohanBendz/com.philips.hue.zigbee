'use strict';

const Light = require('../Light.js');

// Standard light controls use Zigbee ZCL. Native multi-zone gradient commands
// are handled by the shared Light base through Signify cluster 0xFC03 (64515).
class HueGradientSigneFloorDevice extends Light {}

module.exports = HueGradientSigneFloorDevice;
