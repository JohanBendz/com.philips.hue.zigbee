"use strict";

const Homey = require("homey");

class PhilipsHueZigbeeApp extends Homey.App {
  onInit() {
    this.log("Philips Hue Zigbee app initiating...");
  }
}

module.exports = PhilipsHueZigbeeApp;
