"use strict";

const Homey = require("homey");

// Enable zigbee-cluster logging
const { debug } = require('zigbee-clusters');

// debug(true);

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

    // Register listeners for Dynamic Scenes
/*     this.startDynamicScenesAction = this.homey.flow.getActionCard('DynamicScenes');
    this.startDynamicScenesAction.registerRunListener(async (args, state) => {
        if (typeof args.device.setDynamicScenes === 'function') {
            return args.device.setDynamicScenes(args.dynamicScene_mode);
        } else {
            throw new Error('This device does not support Dynamic Scenes');
        }
    }); */

  }
}

module.exports = PhilipsHueZigbeeApp;
