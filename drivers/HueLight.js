"use strict";

const { ZigBeeLightDevice } = require('homey-zigbeedriver');

class HueLight extends ZigBeeLightDevice {}

module.exports = HueLight;
