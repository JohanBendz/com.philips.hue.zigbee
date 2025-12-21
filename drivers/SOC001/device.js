'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

class ContactSensor extends ZigBeeDevice {

  constructor(...args) {
    super(...args);
    // Store bound listener references for cleanup
    this._boundContactListener = null;
    this._boundBatteryListener = null;
    this._listenersRegistered = false;
  }

  async onNodeInit({ zclNode }) {
    this.log('Philips Hue Contact Sensor has been initialized');

    // Register capabilities
    this.registerCapability('alarm_contact', 'genOnOff');
    this.registerCapability('measure_battery', 'genPowerCfg');

    // Only register listeners if not already registered (prevents accumulation on reconnect)
    if (!this._listenersRegistered) {
      // Create bound listeners once and store references
      this._boundContactListener = this.onContactAlarmAttributeReport.bind(this);
      this._boundBatteryListener = this.onBatteryPercentageAttributeReport.bind(this);

      // Register attribute listeners
      zclNode.endpoints[2].clusters.genOnOff
        .on('attr.onOff', this._boundContactListener);

      zclNode.endpoints[2].clusters.genPowerCfg
        .on('attr.batteryPercentageRemaining', this._boundBatteryListener);

      this._listenersRegistered = true;
      this.log("Event listeners registered");
    }
  }

  async onUninit() {
    this.log("Cleaning up ContactSensor resources...");

    // Remove event listeners to prevent memory leaks
    if (this._listenersRegistered && this.zclNode && this.zclNode.endpoints[2]) {
      try {
        if (this._boundContactListener) {
          this.zclNode.endpoints[2].clusters.genOnOff
            .removeListener('attr.onOff', this._boundContactListener);
        }
        if (this._boundBatteryListener) {
          this.zclNode.endpoints[2].clusters.genPowerCfg
            .removeListener('attr.batteryPercentageRemaining', this._boundBatteryListener);
        }
        this.log("Event listeners removed");
      } catch (error) {
        this.error("Error removing event listeners:", error);
      }
    }

    this._listenersRegistered = false;
  }

  onContactAlarmAttributeReport(value) {
    this.log('Contact alarm attribute report received:', value);
    this.setCapabilityValue('alarm_contact', value === 1).catch(this.error);
  }

  onBatteryPercentageAttributeReport(value) {
    const batteryPercentage = value / 2; // Convert from half percent to percent
    this.log('Battery percentage attribute report received:', batteryPercentage);
    this.setCapabilityValue('measure_battery', batteryPercentage).catch(this.error);
  }

}

module.exports = ContactSensor;
