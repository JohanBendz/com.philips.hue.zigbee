'use strict';

const Light = require('../Light.js');

// Philips maps Twilight as:
//   endpoint 12 = front light
//   endpoint 11 = back light (also carries the gradient extension)
//   endpoint 1  = physical dot/Hue buttons (manufacturer cluster 0xfc00)
// Standard color-ambiance controls are isolated per Homey subdevice.
class HueTwilightDevice extends Light {
  async onNodeInit({ zclNode }) {
    await super.onNodeInit({ zclNode });

    // Only the root/front Homey device owns the physical button stream.
    if (this.getData().subDeviceId !== undefined) {
      return;
    }

    this._twilightTriggerDevice = this.homey.flow.getDeviceTriggerCard('LGT002_buttons')
      .registerRunListener(async (args, state) => args.action === state.action);

    this._node = await this.homey.zigbee.getNode(this);
    this._previousHandleFrame = this._node.handleFrame;
    this._rawHandleFrame = async (endpointId, clusterId, frame, meta) => {
      try {
        await this._previousHandleFrame.call(this._node, endpointId, clusterId, frame, meta);
      } catch (err) {
        this.error('ZCL frame handling failed:', err);
      }

      if (endpointId === 1 && clusterId === 0xfc00) {
        return this._buttonCommandParser(frame);
      }
    };
    this._node.handleFrame = this._rawHandleFrame;
  }

  getClusterEndpoint(cluster) {
    const { subDeviceId } = this.getData();
    if (subDeviceId !== undefined && subDeviceId !== 'back') {
      throw new Error(`Unknown Twilight subdevice: ${subDeviceId}`);
    }

    const endpoint = subDeviceId === 'back' ? 11 : 12;
    return this.zclNode.endpoints[endpoint]?.clusters?.[cluster.NAME] ? endpoint : null;
  }

  _buttonCommandParser(frame) {
    if (!Buffer.isBuffer(frame) || frame.length < 10 || !this._twilightTriggerDevice) {
      return;
    }

    const button = frame.readUInt8(5) === 1
      ? 'Dot'
      : frame.readUInt8(5) === 2
        ? 'Hue'
        : null;
    const action = ['Press', 'Hold', 'Release', 'LongRelease'][frame.readUInt8(9)];

    if (!button || !action) {
      return;
    }

    const event = `${button}-${action}`;
    return this._twilightTriggerDevice.trigger(this, {}, { action: event })
      .then(() => this.log(`triggered LGT002_buttons, action=${event}`))
      .catch(err => this.error('Error triggering LGT002_buttons', err));
  }

  async onUninit() {
    if (this._node && this._rawHandleFrame && this._node.handleFrame === this._rawHandleFrame) {
      this._node.handleFrame = this._previousHandleFrame;
    }
  }
}

module.exports = HueTwilightDevice;
