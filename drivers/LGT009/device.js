'use strict';

const Light = require('../Light.js');

// Standard Zigbee light controls are supported here. Philips gradient control
// is manufacturer-specific and intentionally remains separate follow-up work.
class HuePlayWallWasherDevice extends Light {}

module.exports = HuePlayWallWasherDevice;
