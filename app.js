"use strict";

const Homey = require("homey");

// Enable zigbee-cluster logging
const { debug } = require('zigbee-clusters');
debug(true);

class PhilipsHueZigbeeApp extends Homey.App {
  onInit() {
    this.log("Philips Hue Zigbee app initiating...");

    // Register listeners for Blink action
    this.startBlinkAction = this.homey.flow.getActionCard('Blink');
    this.startBlinkAction.registerRunListener(async (args, state) => {
        if (typeof args.device.blink === 'function') {
            return args.device.blink(args);
        } else {
            throw new Error('Device does not support blinking');
        }
    });

    // Register listeners for Alert action
    this.startAlertAction = this.homey.flow.getActionCard('Alert');
    this.startAlertAction.registerRunListener(async (args, state) => {
        if (typeof args.device.alert === 'function') {
            return args.device.alert(args);
        } else {
            throw new Error('Device does not support alerts');
        }
    });
  }
}

module.exports = PhilipsHueZigbeeApp;
