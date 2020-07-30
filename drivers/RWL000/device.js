'use strict';

const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');

class HueDimmerSwitchZigBee extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {

    // Developer tools
		this.enableDebug();
    this.printNode();
    
    // Bind on/off button commands
    zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
      onSetOff: this.offCommandParser.bind(this),
      offWithEffect: this.offCommandParser.bind(this),
      onSetOn: this.onCommandParser.bind(this),
    }));

    // Bind long press dimm button commands
    zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
      onStop: this.stopCommandParser.bind(this),
      onStopWithOnOff: this.stopCommandParser.bind(this),
      onStep: this.stepCommandParser.bind(this),
      onStepWithOnOff: this.stepCommandParser.bind(this),
    }));

  
    this.switchOnTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL000_on');
    this.switchOffTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL000_off');
    this.switchDimTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL000_dim')
      .registerRunListener((args, state, callback) => {
        return callback(null, args.action === state.action);
      });

  }

  onCommandParser() {
    return this.switchOnTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered RWL000_on'))
      .catch(err => this.error('Error triggering RWL000_on', err));
  }

  offCommandParser() {
    return this.switchOffTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered RWL000_off'))
      .catch(err => this.error('Error triggering RWL000_off', err));
  }

  stepCommandParser(payload) {
    var action = payload.stepSize === 30 ? 'press' : 'hold'; // 30=press,56=hold
    return this.switchDimTriggerDevice.trigger(this, {}, { action: `${payload.mode}-${action}` })
      .then(() => this.log(`triggered RWL000_dim, action=${payload.mode}-${action}`))
      .catch(err => this.error('Error triggering RWL000_dim', err));
  }

  stopCommandParser() {
    return this.switchDimTriggerDevice.trigger(this, {}, { action: 'release' })
    .then(() => this.log('triggered RWL000_dim, action=release'))
    .catch(err => this.error('Error triggering RWL000_dim', err));
  }

}

module.exports = HueDimmerSwitchZigBee;
