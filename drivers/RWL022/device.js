'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');
Cluster.addCluster(HueSpecificBasicCluster);

class DimmerSwitchGen3 extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {

    this.printNode();

    if (!this.hasCapability('measure_battery')) {
      await this.addCapability('measure_battery');
    }

    const node = await this.homey.zigbee.getNode(this);

    // Normal operation: parse buttons from cluster 64512 and battery from cluster 1
    const customHandleFrame = (endpointId, clusterId, frame, meta) => {
      if (clusterId === 64512) this._buttonCommandParser(frame);
      if (clusterId === 1) this._powerParser(frame);
    };

    // Configure battery reporting and read current value.
    // Must run with ZCL layer active (pass-through mode), before customHandleFrame is set.
    const setupBatteryReporting = async () => {
      node.handleFrame = (epId, clId, fr, m) => zclNode.handleFrame(epId, clId, fr, m);
      try {
        await this.configureAttributeReporting([{
          endpointId: 1,
          cluster: CLUSTER.POWER_CONFIGURATION,
          attributeName: 'batteryPercentageRemaining',
          minInterval: 0,
          maxInterval: 21600,
          minChange: 1,
        }]);
        const result = await zclNode.endpoints[1].clusters.powerConfiguration
          .readAttributes(['batteryPercentageRemaining']);
        const percentage = result.batteryPercentageRemaining / 2;
        await this.setCapabilityValue('measure_battery', percentage);
        this.log('measure_battery:', percentage, '%');
      } catch (err) {
        this.error('Battery setup error:', err);
      }
      node.handleFrame = customHandleFrame;
    };

    if (this.isFirstInit()) {
      await setupBatteryReporting();
    } else {
      // Devices paired before this fix: configure on next network announce
      this.scheduleForNextEndDeviceAnnounce(() => setupBatteryReporting())
        .catch(err => this.error('Battery setup on announce failed:', err));
    }

    node.handleFrame = customHandleFrame;

    this._switchTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL022_buttons')
      .registerRunListener(async (args, state) => {
        return (null, args.action === state.action);
      });

  }

  _powerParser(frame) {
    const cmd = frame.readUInt8(2);
    const attrLo = frame.readUInt8(3);
    const attrHi = frame.readUInt8(4);

    // Only handle batteryPercentageRemaining (0x0021)
    if (attrLo !== 0x21 || attrHi !== 0x00) return;

    let percentage;
    if (cmd === 0x01 && frame.readUInt8(5) === 0x00 && frame.readUInt8(6) === 0x20) {
      // read attributes response: [cmd, attrLo, attrHi, status, type, value]
      percentage = frame.readUInt8(7) / 2;
    } else if (cmd === 0x0a && frame.readUInt8(5) === 0x20) {
      // report attributes: [cmd, attrLo, attrHi, type, value]
      percentage = frame.readUInt8(6) / 2;
    }

    if (percentage !== undefined) {
      this.log('measure_battery:', percentage, '%');
      this.setCapabilityValue('measure_battery', percentage).catch(this.error);
    }
  }

  _buttonCommandParser(payload) {
    var button = payload[5] === 1 ? 'OnOff' : payload[5] === 2 ? 'DimUp' : payload[5] === 3 ? 'DimDown' : 'Hue';
    var action = payload[9] === 0 ? 'ShortPress' : payload[9] === 1 ? 'LongPress' : payload[9] === 2 ? 'ShortRelease' : 'LongRelease';
    return this._switchTriggerDevice.trigger(this, {}, { action: `${button}-${action}` })
      .then(() => this.log(`triggered RWL022_buttons, action=${button}-${action}`))
      .catch(err => this.error('Error triggering RWL022_buttons', err));
  }

}

module.exports = DimmerSwitchGen3;
