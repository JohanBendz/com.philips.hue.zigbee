'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class HueDimmerSwitchZigBee extends ZigBeeDevice {

  onMeshInit() {

    // Developer tools
		// this.enableDebug();
    // this.printNode();
    
    // Buttons
    this.registerReportListener('genOnOff', 'on', this.onCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'onWithEffect', this.onCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'off', this.offCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'offWithEffect', this.offCommandParser.bind(this));
    this.registerReportListener('genLevelCtrl', 'step', this.stepCommandParser.bind(this));
    this.registerReportListener('genLevelCtrl', 'stop', this.stopCommandParser.bind(this));
    
    this.switchOnTriggerDevice = new Homey.FlowCardTriggerDevice('RWL000_on').register();
    this.switchOffTriggerDevice = new Homey.FlowCardTriggerDevice('RWL000_off').register();
    this.switchDimTriggerDevice = new Homey.FlowCardTriggerDevice('RWL000_dim').register()
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
    var direction = payload.stepmode === 0 ? 'up' : 'down'; // 0=up,1=down
    var mode = payload.stepsize === 30 ? 'press' : 'hold'; // 30=press,56=hold

    return this.switchDimTriggerDevice.trigger(this, {}, { action: `${direction}-${mode}` })
      .then(() => this.log(`triggered RWL000_dim, action=${direction}-${mode}`))
      .catch(err => this.error('Error triggering RWL000_dim', err));
  }

  stopCommandParser() {
    return this.switchDimTriggerDevice.trigger(this, {}, { action: 'release' })
    .then(() => this.log('triggered RWL000_dim, action=release'))
    .catch(err => this.error('Error triggering RWL000_dim', err));
  }

}

module.exports = HueDimmerSwitchZigBee;
