'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster } = require('zigbee-clusters');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');

Cluster.addCluster(HueSpecificBasicCluster);

// The `subDeviceId` that Homey assigns to the second input, as declared
// under `zigbee.devices` in driver.compose.json.
const SECOND_INPUT_SUB_DEVICE_ID = 'secondInput';

class HueWallSwitchModule extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {

    this.printNode();

    // ROM002 is a wired module: it has no battery, so there is no
    // battery capability/parser here (unlike the battery powered RDM001).

    this._holdTriggered = false;
    this._deviceMode = -1;

    // Every device instance that Homey creates for this physical node
    // (the main device = Input 1, and the "secondInput" sub device =
    // Input 2) registers its own trigger-card reference, bound to
    // itself. This is what lets each tile fire only its own flows,
    // without needing an "input" argument on the flow card.
    this._registerTrigger();

    if (!this.isSubDevice()) {
      // Only the main device (Input 1) reads/writes settings and mode,
      // and only the main device listens to raw Zigbee frames - both
      // devices share the same physical Zigbee node, so only one
      // frame handler may be attached to it. Input 2 events are
      // routed to the sibling device from within that single handler.
      this._deviceMode = this.getSetting('mode');
      await this._writeDeviceMode(this._deviceMode);

      const node = await this.homey.zigbee.getNode(this);
      node.handleFrame = (endpointId, clusterId, frame, meta) => {
        if (clusterId === 64512) {
          this._buttonCommandParser(frame);
        }
      };
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('mode') && !this.isSubDevice()) {
      this._deviceMode = newSettings.mode;
      await this._writeDeviceMode(this._deviceMode);
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
        this.error('ROM002: failed to update device mode:', err.message);
      }
    }
  }

  _registerTrigger() {
    this.TriggerDevice = this.homey.flow
      .getDeviceTriggerCard('ROM002_button')
      .registerRunListener(async (args, state) => {
        return args.action === state.action;
      });
  }

  // Find the Homey device instance representing the second physical
  // input, sharing the same Zigbee node ("token") as this device.
  _getSecondInputDevice() {
    const { token } = this.getData();
    const allDevices = this.driver.getDevices();

    const candidates = allDevices.filter(
      (device) => device.getData().subDeviceId === SECOND_INPUT_SUB_DEVICE_ID,
    );

    if (candidates.length === 0) {
      return undefined;
    }

    // Normal case: only one physical ROM002 paired, so there is exactly
    // one "secondInput" device - no need to match the token.
    if (candidates.length === 1) {
      return candidates[0];
    }

    // Multiple ROM002 units paired: disambiguate using the shared token.
    const matchByToken = candidates.find((device) => device.getData().token === token);
    if (!matchByToken) {
      this.error(
        `ROM002: multiple secondInput devices found but none matched token ${token}. `
        + `Tokens seen: ${candidates.map((d) => d.getData().token).join(', ')}`,
      );
    }
    return matchByToken;
  }

  _buttonCommandParser(frame) {

    // The button frames we have observed are 13 bytes.
    if (frame.length < 13) {
      return;
    }

    const inputByte = frame.readUInt8(5);
    if (inputByte !== 0x01 && inputByte !== 0x02) {
      return;
    }

    const actionByte = frame.readUInt8(9);

    let action;
    switch (actionByte) {
      case 0x00:
        action = 'Press';
        break;
      case 0x01:
        action = 'Hold';
        break;
      case 0x02:
        action = 'Release';
        break;
      case 0x03:
        action = 'LongPress';
        break;
      default:
        return;
    }

    // During a hold, the module sends repeated Hold frames.
    // Only trigger the Flow card once per hold.
    if (action === 'Hold') {
      if (this._holdTriggered) {
        return;
      }
      this._holdTriggered = true;
    } else {
      this._holdTriggered = false;
    }

    // Route the event to the Homey device/tile that represents this
    // physical input: Input 1 is always `this` (the main device),
    // Input 2 is the paired "secondInput" sub device.
    const targetDevice = inputByte === 0x01 ? this : this._getSecondInputDevice();

    if (!targetDevice) {
      this.error(
        `ROM002: could not find target device for input ${inputByte} - `
        + 'is the "Second Input" tile still paired? Check Homey\'s device list.',
      );
      return;
    }

    if (!targetDevice.TriggerDevice) {
      this.error(
        `ROM002: TriggerDevice is not initialized yet on the device for input ${inputByte} `
        + `(data=${JSON.stringify(targetDevice.getData())}) - it may still be initializing.`,
      );
      return;
    }

    targetDevice.TriggerDevice
      .trigger(targetDevice, {}, { action })
      .catch((err) => this.error(`ROM002: error triggering ${action}`, err));
  }

}

module.exports = HueWallSwitchModule;
