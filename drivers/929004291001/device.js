'use strict';

const Light = require('../Light');

// Inherit initialization (including zclNode) and all shared Hue light features.
class HueSlimLightDevice extends Light {}

module.exports = HueSlimLightDevice;
