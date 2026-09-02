'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class ContactSensor extends ZigBeeDevice {

  constructor(...args) {
    super(...args);
    this._previousHandleFrame = null;
    this._boundBatteryListener = null;
  }

  async onNodeInit({ zclNode }) {
    this.log('SOC001 driver started');
    this.printNode();

    if (!this._boundBatteryListener) {
      this._boundBatteryListener = this._handleBatteryReport.bind(this);
      zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME]
        .on('attr.batteryPercentageRemaining', this._boundBatteryListener);
    }

    try {
      await this.configureAttributeReporting([
        {
          endpointId: 2,
          cluster: CLUSTER.POWER_CONFIGURATION,
          attributeName: 'batteryPercentageRemaining',
          minInterval: 300,
          maxInterval: 60000,
          minChange: 1,
        },
      ]);
    } catch (error) {
      this.error('Error configuring battery reporting:', error);
    }

    try {
      const batteryStatus = await zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME]
        .readAttributes(['batteryPercentageRemaining']);
      this._handleBatteryReport(batteryStatus.batteryPercentageRemaining);
    } catch (error) {
      this.error('Error reading battery percentage:', error);
    }

    const node = await this.homey.zigbee.getNode(this);
    this._previousHandleFrame = node.handleFrame;
    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      if (typeof this._previousHandleFrame === 'function') {
        this._previousHandleFrame(endpointId, clusterId, frame, meta);
      }

      if (endpointId !== 2 || clusterId !== CLUSTER.ON_OFF.ID || !Buffer.isBuffer(frame) || frame.length < 3) {
        return;
      }

      this._handleOnOffFrame(frame, meta);
    };
  }

  async onUninit() {
    this.log('Cleaning up ContactSensor resources...');

    try {
      if (this._boundBatteryListener && this.zclNode && this.zclNode.endpoints[2]) {
        this.zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME]
          .removeListener('attr.batteryPercentageRemaining', this._boundBatteryListener);
      }

      const node = await this.homey.zigbee.getNode(this);
      node.handleFrame = this._previousHandleFrame;
    } catch (error) {
      this.error('Error restoring frame handler:', error);
    }
  }

  _handleOnOffFrame(frame, meta) {
    const frameControl = frame.readUInt8(0);
    const sequenceNumber = frame.readUInt8(1);
    const commandId = frame.readUInt8(2);

    // 0x18 means a global ZCL command. 0x0b is Default Response, not a contact event.
    if (frameControl === 0x18 && commandId === 0x0b && frame.length >= 5) {
      this.log('[FRAME] default response', JSON.stringify({
        sequenceNumber,
        responseToCommandId: frame.readUInt8(3),
        status: frame.readUInt8(4),
        frameHex: frame.toString('hex'),
        meta,
      }));
      return;
    }

    if (commandId === 0x01) {
      this.log('SOC001 frame: on -> contact open');
      this.setCapabilityValue('alarm_contact', true).catch(this.error);
      return;
    }

    if (commandId === 0x00) {
      this.log('SOC001 frame: off -> contact closed');
      this.setCapabilityValue('alarm_contact', false).catch(this.error);
      return;
    }

    if (commandId === 0x02) {
      const currentValue = this.getCapabilityValue('alarm_contact');
      this.log('SOC001 frame: toggle');
      this.setCapabilityValue('alarm_contact', !currentValue).catch(this.error);
      return;
    }

    this.log('[FRAME]', JSON.stringify({
      endpointId: 2,
      clusterId: CLUSTER.ON_OFF.ID,
      frameControl,
      sequenceNumber,
      commandId,
      frameHex: frame.toString('hex'),
      meta,
    }));
  }

  _handleBatteryReport(batteryPercentageRemaining) {
    const batteryPercentage = batteryPercentageRemaining / 2;
    this.log('SOC001 battery percentage:', batteryPercentage);
    this.setCapabilityValue('measure_battery', batteryPercentage).catch(this.error);
  }

}

module.exports = ContactSensor;