'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class ContactSensor extends ZigBeeDevice {

  constructor(...args) {
    super(...args);
    this._contactCluster = null;
    this._powerCluster = null;
    this._contactListener = null;
    this._batteryListener = null;
    this._reportingConfigured = false;
  }

  async onNodeInit({ zclNode }) {
    this.log('Philips Hue Contact Sensor has been initialized');

    this._contactCluster = zclNode.endpoints[2].clusters[CLUSTER.ON_OFF.NAME];
    this._powerCluster = zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME];
    this._contactListener = this.onContactAlarmAttributeReport.bind(this);
    this._batteryListener = this.onBatteryPercentageAttributeReport.bind(this);

    this._contactCluster.on('attr.onOff', this._contactListener);
    this._powerCluster.on('attr.batteryPercentageRemaining', this._batteryListener);

    if (this.isFirstInit()) {
      await this._setupReporting()
        .catch(err => this.error('Initial SOC001 reporting setup failed:', err));
    }
  }

  async _setupReporting() {
    await this.configureAttributeReporting([
      {
        endpointId: 2,
        cluster: CLUSTER.ON_OFF,
        attributeName: 'onOff',
        minInterval: 0,
        maxInterval: 3600,
      },
      {
        endpointId: 2,
        cluster: CLUSTER.POWER_CONFIGURATION,
        attributeName: 'batteryPercentageRemaining',
        minInterval: 60,
        maxInterval: 21600,
        minChange: 1,
      },
    ]);

    try {
      const { onOff } = await this._contactCluster.readAttributes(['onOff']);
      if (typeof onOff === 'boolean' || typeof onOff === 'number') {
        await this.setCapabilityValue('alarm_contact', onOff === true || onOff === 1);
      }
    } catch (err) {
      this.error('Failed to read initial contact state:', err);
    }

    try {
      const { batteryPercentageRemaining } = await this._powerCluster
        .readAttributes(['batteryPercentageRemaining']);
      if (typeof batteryPercentageRemaining === 'number') {
        await this.setCapabilityValue('measure_battery', batteryPercentageRemaining / 2);
      }
    } catch (err) {
      this.error('Failed to read initial battery level:', err);
    }

    this._reportingConfigured = true;
  }

  async onEndDeviceAnnounce() {
    if (!this._reportingConfigured) {
      await this._setupReporting()
        .catch(err => this.error('SOC001 reporting setup on announce failed:', err));
    }
  }

  onContactAlarmAttributeReport(value) {
    this.log('Contact alarm attribute report received:', value);
    this.setCapabilityValue('alarm_contact', value === true || value === 1)
      .catch(err => this.error('Failed to update contact alarm:', err));
  }

  onBatteryPercentageAttributeReport(value) {
    const batteryPercentage = value / 2;
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
