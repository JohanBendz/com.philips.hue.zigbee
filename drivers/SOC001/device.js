'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

class ContactSensor extends ZigBeeDevice {

  constructor(...args) {
    super(...args);
    this._contactCluster = null;
    this._powerCluster = null;
    this._contactListener = null;
    this._batteryListener = null;
  }

  async onNodeInit({ zclNode }) {
    this.log('Philips Hue Contact Sensor has been initialized');

    // Register capabilities
    this.registerCapability('alarm_contact', 'genOnOff');
    this.registerCapability('measure_battery', 'genPowerCfg');

    // Register attribute listeners
    this._contactCluster = zclNode.endpoints[2].clusters.genOnOff;
    this._powerCluster = zclNode.endpoints[2].clusters.genPowerCfg;
    this._contactListener = this.onContactAlarmAttributeReport.bind(this);
    this._batteryListener = this.onBatteryPercentageAttributeReport.bind(this);

    this._contactCluster.on('attr.onOff', this._contactListener);
    this._powerCluster.on('attr.batteryPercentageRemaining', this._batteryListener);
  }

  onContactAlarmAttributeReport(value) {
    this.log('Contact alarm attribute report received:', value);
    this.setCapabilityValue('alarm_contact', value === 1)
      .catch(err => this.error('Failed to update contact alarm:', err));
  }

  onBatteryPercentageAttributeReport(value) {
    const batteryPercentage = value / 2; // Convert from half percent to percent
    this.log('Battery percentage attribute report received:', batteryPercentage);
    this.setCapabilityValue('measure_battery', batteryPercentage)
      .catch(err => this.error('Failed to update battery level:', err));
  }

  async onUninit() {
    if (this._contactCluster && this._contactListener) {
      this._contactCluster.removeListener('attr.onOff', this._contactListener);
    }
    if (this._powerCluster && this._batteryListener) {
      this._powerCluster.removeListener('attr.batteryPercentageRemaining', this._batteryListener);
    }
  }

}

module.exports = ContactSensor;
