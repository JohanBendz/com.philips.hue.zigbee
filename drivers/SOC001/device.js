'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');
const HueContactCluster = require('../../lib/HueContactCluster');
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');

Cluster.addCluster(HueContactCluster);

class ContactSensor extends ZigBeeDevice {

  constructor(...args) {
    super(...args);
    this._contactCluster = null;
    this._powerCluster = null;
    this._contactListener = null;
    this._batteryListener = null;
    this._reportingConfigured = false;
    this._contactReportingConfigured = false;
    this._batteryReportingConfigured = false;
  }

  async onNodeInit({ zclNode }) {
    this.log('Philips Hue Contact Sensor has been initialized');

    await this.onUninit();
    this._endpoint = zclNode.endpoints[2];
    this._contactCluster = this._endpoint.clusters[HueContactCluster.NAME];
    this._powerCluster = zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME];
    this._contactListener = this.onContactAlarmAttributeReport.bind(this);
    this._batteryListener = this.onBatteryPercentageAttributeReport.bind(this);

    this._contactCluster.on('attr.contact', this._contactListener);
    this._powerCluster.on('attr.batteryPercentageRemaining', this._batteryListener);

    // Older configurations send On/Off COMMANDS from their output cluster.
    // Keep this compatibility path, without a raw handleFrame override.
    this._previousOnOffBinding = this._endpoint.bindings[CLUSTER.ON_OFF.NAME];
    this._onOffBinding = new OnOffBoundCluster({
      onSetOn: () => this.onContactAlarmAttributeReport('open'),
      onSetOff: () => this.onContactAlarmAttributeReport('closed'),
    });
    this._endpoint.bind(CLUSTER.ON_OFF.NAME, this._onOffBinding);

    if (this.isFirstInit()) {
      await this._setupReporting()
        .catch(err => this.error('Initial SOC001 reporting setup failed:', err));
    }
  }

  async _setupReporting() {
    if (this._reportingSetup) return this._reportingSetup;
    // Configure independently, but sequentially: the SDK persists both results
    // in the same store value. A failed contact request must not skip battery.
    this._reportingSetup = (async () => {
      await this._setupContactReporting().catch(err => this.error('Contact reporting setup failed:', err));
      await this._setupBatteryReporting().catch(err => this.error('Battery reporting setup failed:', err));
    })();
    try {
      await this._reportingSetup;
      this._reportingConfigured = this._contactReportingConfigured && this._batteryReportingConfigured;
    } finally {
      this._reportingSetup = null;
    }
  }

  async _setupContactReporting() {
    if (this._contactReportingConfigured) return;
    await this.configureAttributeReporting([{
      endpointId: 2,
      cluster: HueContactCluster,
      attributeName: 'contact',
      minInterval: 0,
      maxInterval: 14400,
      minChange: 1,
    }]);
    this._contactReportingConfigured = true;
    try {
      const { contact } = await this._contactCluster.readAttributes(['contact']);
      await this.onContactAlarmAttributeReport(contact);
    } catch (err) {
      this.error('Failed to read initial contact state:', err);
    }
  }

  async _setupBatteryReporting() {
    if (this._batteryReportingConfigured) return;
    await this.configureAttributeReporting([{
      endpointId: 2,
      cluster: CLUSTER.POWER_CONFIGURATION,
      attributeName: 'batteryPercentageRemaining',
      minInterval: 60,
      maxInterval: 21600,
      minChange: 1,
    }]);
    this._batteryReportingConfigured = true;
    try {
      const { batteryPercentageRemaining } = await this._powerCluster
        .readAttributes(['batteryPercentageRemaining']);
      await this.onBatteryPercentageAttributeReport(batteryPercentageRemaining);
    } catch (err) {
      this.error('Failed to read initial battery level:', err);
    }
  }

  async onEndDeviceAnnounce() {
    if (!this._reportingConfigured) {
      await this._setupReporting()
        .catch(err => this.error('SOC001 reporting setup on announce failed:', err));
    }
  }

  onContactAlarmAttributeReport(value) {
    if (!['open', 'closed', 0, 1, false, true].includes(value)) return;
    this.log('Contact alarm attribute report received:', value);
    return this.setCapabilityValue('alarm_contact', value === 'open' || value === true || value === 1)
      .catch(err => this.error('Failed to update contact alarm:', err));
  }

  onBatteryPercentageAttributeReport(value) {
    if (!Number.isFinite(value) || value < 0 || value > 200) return;
    const batteryPercentage = value / 2;
    this.log('Battery percentage attribute report received:', batteryPercentage);
    return this.setCapabilityValue('measure_battery', batteryPercentage)
      .catch(err => this.error('Failed to update battery level:', err));
  }

  async onUninit() {
    if (this._contactCluster && this._contactListener) {
      this._contactCluster.removeListener('attr.contact', this._contactListener);
    }
    if (this._powerCluster && this._batteryListener) {
      this._powerCluster.removeListener('attr.batteryPercentageRemaining', this._batteryListener);
    }
    if (this._endpoint && this._onOffBinding
      && this._endpoint.bindings[CLUSTER.ON_OFF.NAME] === this._onOffBinding) {
      if (this._previousOnOffBinding) {
        this._endpoint.bindings[CLUSTER.ON_OFF.NAME] = this._previousOnOffBinding;
      } else {
        delete this._endpoint.bindings[CLUSTER.ON_OFF.NAME];
      }
    }
  }

}

module.exports = ContactSensor;
