'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

class ContactSensor extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.log('Philips Hue Contact Sensor has been initialized');

    // Register capabilities
    this.registerCapability('alarm_contact', 'genOnOff');
    this.registerCapability('measure_battery', 'genPowerCfg');

    // Register attribute listeners
    zclNode.endpoints[2].clusters.genOnOff
      .on('attr.onOff', this.onContactAlarmAttributeReport.bind(this));
    
    zclNode.endpoints[2].clusters.genPowerCfg
      .on('attr.batteryPercentageRemaining', this.onBatteryPercentageAttributeReport.bind(this));
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

}

module.exports = ContactSensor;
