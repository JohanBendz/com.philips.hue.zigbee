"use strict";

const Homey = require("homey");


class PhilipsHueZigbeeApp extends Homey.App {
  onInit() {
    this.log("Philips Hue Zigbee app initiating...");

    // Keep published legacy Flow card IDs alive for saved Flows. Register the
    // same runtime behavior for the new device-scoped variants.
    const registerActionPair = (id, listener) => {
      this.homey.flow.getActionCard(id).registerRunListener(listener);
      this.homey.flow.getActionCard(`${id}_v2`).registerRunListener(listener);
    };
    const registerConditionPair = (id, listener) => {
      this.homey.flow.getConditionCard(id).registerRunListener(listener);
      this.homey.flow.getConditionCard(`${id}_v2`).registerRunListener(listener);
    };


    // Register listeners for Blink action
    this.startBlinkAction = this.homey.flow.getActionCard('Blink');
    const blinkHandler = async (args, state) => {
        if (typeof args.device.blink === 'function') {
            return args.device.blink(args);
        } else {
            throw new Error('Device does not support blinking');
        }
    };
    this.startBlinkAction.registerRunListener(blinkHandler);
    this.homey.flow.getActionCard('Blink_v2').registerRunListener(blinkHandler);

    // Register listeners for Alert action
    this.startAlertAction = this.homey.flow.getActionCard('Alert');
    const alertHandler = async (args, state) => {
        if (typeof args.device.alert === 'function') {
            return args.device.alert(args);
        } else {
            throw new Error('Device does not support alerts');
        }
    };
    this.startAlertAction.registerRunListener(alertHandler);
    this.homey.flow.getActionCard('Alert_v2').registerRunListener(alertHandler);


    // Continuous dimming via Zigbee LevelControl move/stop commands.
    registerActionPair('start_dim', async (args) => {
        if (typeof args.device.startDim !== 'function') {
            throw new Error('This device does not support dimming');
        }
        return args.device.startDim(args);
    });

    registerActionPair('stop_dim', async (args) => {
        if (typeof args.device.stopDim !== 'function') {
            throw new Error('This device does not support dimming');
        }
        return args.device.stopDim();
    });

    registerActionPair('set_light_state', async (args) => {
        if (typeof args.device.setLightState !== 'function') {
            throw new Error('This device does not support combined light state');
        }
        return args.device.setLightState(args);
    });

    registerActionPair('adjust_light_temperature', async (args) => {
        if (typeof args.device.adjustLightTemperature !== 'function') {
            throw new Error('This device does not support color temperature');
        }
        return args.device.adjustLightTemperature(args);
    });

    registerActionPair('hue_effect', async (args) => {
        if (typeof args.device.setHueEffect !== 'function') {
            throw new Error('This device does not support Hue effects');
        }
        return args.device.setHueEffect(args);
    });

    registerActionPair('hue_gradient_3', async (args) => {
        if (typeof args.device.setHueGradient !== 'function') {
            throw new Error('This device does not support Hue gradients');
        }
        return args.device.setHueGradient(args);
    });

    registerActionPair('suppress_sensor', (args, state) => {
        return args.device.suppressSensor(args, state);
    });

    registerConditionPair('temperature_above', (args, state) => {
    return args.device.getCapabilityValue('measure_temperature') > args.temperature;
    });

    registerConditionPair('luminance_above', (args, state) => {
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
