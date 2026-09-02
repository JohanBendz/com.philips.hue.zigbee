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

    this.homey.flow.getActionCard('start_dim')
    .registerRunListener(async (args) => {
        if (typeof args.device.startDim !== 'function') {
            throw new Error('This device does not support dimming');
        }
        return args.device.startDim(args);
    });

    this.homey.flow.getActionCard('stop_dim')
    .registerRunListener(async (args) => {
        if (typeof args.device.stopDim !== 'function') {
            throw new Error('This device does not support dimming');
        }
        return args.device.stopDim();
    });

    this.homey.flow.getActionCard('suppress_sensor')
    .registerRunListener((args, state) => {
        return args.device.suppressSensor(args, state);
    });

    this.homey.flow.getConditionCard('temperature_above')
    .registerRunListener((args, state) => {
    return args.device.getCapabilityValue('measure_temperature') > args.temperature;
    });

    this.homey.flow.getConditionCard('luminance_above')
    .registerRunListener((args, state) => {
    return args.device.getCapabilityValue('measure_luminance') > args.luminance;
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
