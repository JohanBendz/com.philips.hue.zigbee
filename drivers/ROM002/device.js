'use strict';

const { isDeepStrictEqual } = require('node:util');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster } = require('zigbee-clusters');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');

Cluster.addCluster(HueSpecificBasicCluster);

class HueWallSwitchModule extends ZigBeeDevice {

  async onNodeInit() {
    this._holdInputs = new Set();

    if (this.isSubDevice()) {
      return;
    }

    this.deviceMode = this.getSettings().mode;
    await this._writeDeviceMode(this.deviceMode);

    this._triggerDevice = this.homey.flow
      .getDeviceTriggerCard('ROM002_button')
      .registerRunListener(async (args, state) => args.action === state.action);

    this._node = await this.homey.zigbee.getNode(this);
    this._previousHandleFrame = this._node.handleFrame;
    this._rawHandleFrame = async (endpointId, clusterId, frame, meta) => {
      try {
        await this._previousHandleFrame(endpointId, clusterId, frame, meta);
      } catch (err) {
        this.error('ZCL frame handling failed:', err);
      }

      if (clusterId === 64512) {
        return this._buttonCommandParser(frame);
      }
    };
    this._node.handleFrame = this._rawHandleFrame;
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('mode') && !this.isSubDevice()) {
      this.deviceMode = newSettings.mode;
      await this._writeDeviceMode(this.deviceMode);
    }
    return super.onSettings({ oldSettings, newSettings, changedKeys });
  }

  async _writeDeviceMode(deviceMode) {
    try {
      await this.zclNode.endpoints[1].clusters.HueSpecificBasicCluster.writeAttributes({
        deviceMode,
      });
    } catch (err) {
      if (err.message !== 'TimeoutError') {
        this.error('ROM002: failed to update device mode:', err);
      }
    }
  }

  _getInputDevice(inputNumber) {
    if (inputNumber === 1) {
      return this;
    }

    if (inputNumber !== 2) {
      return null;
    }

    const rootData = this.getData();
    const devices = Object.values(this.driver.getDevices());

    return devices.find(device => {
      const data = device.getData();
      if (data.subDeviceId !== 'secondInput') {
        return false;
      }

      return Object.entries(rootData)
        .every(([key, value]) => isDeepStrictEqual(data[key], value));
    }) || null;
  }

  _buttonCommandParser(frame) {
    if (!Buffer.isBuffer(frame) || frame.length < 10) {
      return;
    }

    const inputNumber = frame.readUInt8(5);
    if (inputNumber !== 1 && inputNumber !== 2) {
      return;
    }

    const actionValue = frame.readUInt8(9);
    const action = ['Press', 'Hold', 'Release', 'LongRelease'][actionValue];
    if (!action) {
      return;
    }

    if (action === 'Hold') {
      if (this._holdInputs.has(inputNumber)) {
        return;
      }
      this._holdInputs.add(inputNumber);
    } else {
      this._holdInputs.delete(inputNumber);
    }

    const targetDevice = this._getInputDevice(inputNumber);
    if (!targetDevice) {
      this.error(`ROM002: could not resolve input ${inputNumber} to a Homey device`);
      return;
    }

    const targetName = inputNumber === 1 ? 'firstInput' : 'secondInput';
    return this._triggerDevice.trigger(targetDevice, {}, { action })
      .then(() => this.log(`triggered ROM002_button, input=${targetName}, action=${action}`))
      .catch(err => this.error('ROM002: error triggering button action', err));
  }

  async onUninit() {
    if (this._node && this._rawHandleFrame && this._node.handleFrame === this._rawHandleFrame) {
      this._node.handleFrame = this._previousHandleFrame;
    }
  }

}

module.exports = HueWallSwitchModule;
