'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');
const { markHueRemoteAvailable } = require('../../lib/HueRemoteAvailability');

class DimmerSwitch extends ZigBeeDevice {

async onNodeInit({ zclNode }) {
    // Buttons
    zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
      onSetOn: this._onCommandParser.bind(this),
      onSetOff: this._offCommandParser.bind(this),
      offWithEffect: this._offCommandParser.bind(this)
    }));

    zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
      onStep: this._stepCommandParser.bind(this),
      onStepWithOnOff: this._stepCommandParser.bind(this),
      onStop: this._stopCommandParser.bind(this),
      onStopWithOnOff: this._stopCommandParser.bind(this),
    }));

    this._switchOnTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL000_on');
    this._switchOffTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL000_off');
    this._switchDimTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL000_dim')
      .registerRunListener(async (args, state) => {
        return (null, args.action === state.action);
      });

    if (!this.hasCapability('measure_battery')) {
      await this.addCapability('measure_battery');
    }
    this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
      getOpts: {
        // Sleepy remote: only refresh while it is awake (onEndDeviceAnnounce).
        getOnStart: false,
        getOnOnline: false,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 0,
          maxInterval: 60000,
          minChange: 1,
        },
      },
      endpoint: 2,
    });

    // alarm_battery
    if (this.hasCapability('alarm_battery')) {
      this.batteryThreshold = 20;
      this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
        getOpts: {},
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 0,
            maxInterval: 60000,
            minChange: 10,
          },
        },
        endpoint: 2,
      });
    }

  }

  async _refreshBattery() {
    try {
      const result = await this.zclNode.endpoints[2].clusters.powerConfiguration
        .readAttributes(['batteryPercentageRemaining']);
      const raw = result.batteryPercentageRemaining;
      if (typeof raw !== 'number' || raw < 0 || raw > 200 || raw === 255) {
        return null;
      }

      const percentage = Math.round(raw / 2);
      if (this.hasCapability('measure_battery')) {
        await this.setCapabilityValue('measure_battery', percentage);
      }
      if (this.hasCapability('alarm_battery')) {
        await this.setCapabilityValue('alarm_battery', percentage <= 20);
      }
      return percentage;
    } catch (error) {
      this.log('Could not refresh dimmer-switch battery state:', error);
      return null;
    }
  }

  async onEndDeviceAnnounce() {
    await this._refreshBattery();
    await this.setAvailable()
      .catch(err => this.error('Error setting dimmer switch available', err));
  }

  _onCommandParser() {
    markHueRemoteAvailable(this);
    return this._switchOnTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered RWL000_on'))
      .catch(err => this.error('Error triggering RWL000_on', err));
  }

  _offCommandParser() {
    markHueRemoteAvailable(this);
    return this._switchOffTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered RWL000_off'))
      .catch(err => this.error('Error triggering RWL000_off', err));
  }

  _stepCommandParser(payload) {
    markHueRemoteAvailable(this);
    var action = payload.stepSize === 30 ? 'press' : 'hold'; // 30=press,56=hold
    return this._switchDimTriggerDevice.trigger(this, {}, { action: `${payload.mode}-${action}` })
      .then(() => this.log(`triggered RWL000_dim, action=${payload.mode}-${action}`))
      .catch(err => this.error('Error triggering RWL000_dim', err));
  }

  _stopCommandParser() {
    markHueRemoteAvailable(this);
    return this._switchDimTriggerDevice.trigger(this, {}, { action: 'release' })
    .then(() => this.log('triggered RWL000_dim, action=release'))
    .catch(err => this.error('Error triggering RWL000_dim', err));
  }

}

module.exports = DimmerSwitch;