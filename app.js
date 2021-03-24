"use strict";

const Homey = require("homey");

// Enable zigbee-cluster logging
// const { debug } = require('zigbee-clusters');
// debug(true);

class PhilipsHueZigbeeApp extends Homey.App {
  onInit() {
    this.log("Philips Hue Zigbee app initiating...");
  }
}

module.exports = PhilipsHueZigbeeApp;
