'use strict';

const { ZigBeeLightDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class HueDymeraDevice extends ZigBeeLightDevice {

  async onNodeInit({ zclNode }) {
    this.enableDebug();
    this.printNode();

    const { subDeviceId } = this.getData();
    const endpoint = subDeviceId === 'top' ? 11 : 12;

    this.registerCapability('onoff', CLUSTER.ON_OFF, { endpoint });
    this.registerCapability('dim', CLUSTER.LEVEL_CONTROL, { endpoint });
    this.registerCapability('light_hue', CLUSTER.COLOR_CONTROL, { endpoint });
    this.registerCapability('light_saturation', CLUSTER.COLOR_CONTROL, { endpoint });

    // Farbtemperatur (normale, nicht invertierte Zigbee-Konvention:
    // 153 Mireds = kalt, 500 Mireds = warm)
    this.registerCapability('light_temperature', CLUSTER.COLOR_CONTROL, {
      endpoint,
      get: 'colorTemperatureMireds',
      report: 'colorTemperatureMireds',
      reportParser: value => (value - 153) / (500 - 153),
      set: 'moveToColorTemperature',
      setParser: value => ({
        colorTemperature: Math.round(153 + value * (500 - 153)),
        transitionTime: 5,
      }),
    });
  }

}

module.exports = HueDymeraDevice;
