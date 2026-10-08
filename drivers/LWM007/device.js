'use strict';

const { Cluster } = require('zigbee-clusters');
const Light = require('../Light.js');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');

Cluster.addCluster(HueSpecificBasicCluster);

const SUPPORTED_SWITCH_MODES = new Set([
  'singlerocker',
  'singlepushbutton',
]);

class HueWiredDimmerSwitchDevice extends Light {

  _switchModeCluster() {
    return this.zclNode?.endpoints?.[1]?.clusters?.[HueSpecificBasicCluster.NAME] || null;
  }

  _normaliseSwitchMode(value) {
    if (SUPPORTED_SWITCH_MODES.has(value)) {
      return value;
    }
    if (value === 0) {
      return 'singlerocker';
    }
    if (value === 1) {
      return 'singlepushbutton';
    }
    return null;
  }

  async _syncSwitchModeFromDevice() {
    const cluster = this._switchModeCluster();
    if (!cluster?.readAttributes) {
      return null;
    }

    try {
      const { deviceMode } = await cluster.readAttributes(['deviceMode']);
      const mode = this._normaliseSwitchMode(deviceMode);
      if (!mode) {
        this.log('LWM007 returned unsupported switch mode:', deviceMode);
        return null;
      }

      if (this.getSetting('mode') !== mode) {
        // setSettings() deliberately does not invoke onSettings(), so reading
        // the current hardware state cannot cause a write back to the device.
        await this.setSettings({ mode });
      }
      return mode;
    } catch (error) {
      this.log('Could not read LWM007 switch type:', error);
      return null;
    }
  }

  async onNodeInit({ zclNode }) {
    await super.onNodeInit({ zclNode });
    await this._syncSwitchModeFromDevice();
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('mode')) {
      const mode = this._normaliseSwitchMode(newSettings.mode);
      if (!mode) {
        throw new Error('Unsupported LWM007 switch type.');
      }

      const cluster = this._switchModeCluster();
      if (!cluster?.writeAttributes) {
        throw new Error('LWM007 switch configuration endpoint is unavailable.');
      }

      await cluster.writeAttributes({ deviceMode: mode });
      this.log('Updated LWM007 switch type:', mode);
    }

    return super.onSettings({ oldSettings, newSettings, changedKeys });
  }

}

module.exports = HueWiredDimmerSwitchDevice;
