"use strict";

const Homey = require("homey");

// Enable zigbee-cluster logging
// const { Util } = require('homey-zigbeedriver');
// Util.debugZigbeeClusters(true);

class PhilipsHueZigbeeApp extends Homey.App {
  onNodeInit() {
    this.log("Philips Hue Zigbee app initiating...");
  }
}

module.exports = PhilipsHueZigbeeApp;
