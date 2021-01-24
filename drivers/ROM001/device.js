'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class SmartButton extends ZigBeeDevice {

  onMeshInit() {

    // Developer tools
		this.enableDebug();
    this.printNode();
    
    // Buttons
    this.registerReportListener('genOnOff', 'on', this.onCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'onWithEffect', this.onCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'off', this.offCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'offWithEffect', this.offCommandParser.bind(this));
    this.registerReportListener('genLevelCtrl', 'step', this.stepCommandParser.bind(this));
    this.registerReportListener('genLevelCtrl', 'stop', this.stopCommandParser.bind(this));
    
    this.switchOnTriggerDevice = new Homey.FlowCardTriggerDevice('ROM001_on').register();
    this.switchOffTriggerDevice = new Homey.FlowCardTriggerDevice('ROM001_off').register();
    this.switchDimTriggerDevice = new Homey.FlowCardTriggerDevice('ROM001_dim').register()
      .registerRunListener((args, state, callback) => {
        return callback(null, args.action === state.action);
      });

  }

  onCommandParser() {
    return this.switchOnTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered ROM001_on'))
      .catch(err => this.error('Error triggering ROM001_on', err));
  }

  offCommandParser() {
    return this.switchOffTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered ROM001_off'))
      .catch(err => this.error('Error triggering ROM001_off', err));
  }

  stepCommandParser(payload) {
    var direction = payload.stepmode === 0 ? 'up' : 'down'; // 0=up,1=down
    var mode = payload.stepsize === 30 ? 'press' : 'hold'; // 30=press,56=hold

    return this.switchDimTriggerDevice.trigger(this, {}, { action: `${direction}-${mode}` })
      .then(() => this.log(`triggered ROM001_dim, action=${direction}-${mode}`))
      .catch(err => this.error('Error triggering ROM001_dim', err));
  }

  stopCommandParser() {
    return this.switchDimTriggerDevice.trigger(this, {}, { action: 'release' })
    .then(() => this.log('triggered ROM001_dim, action=release'))
    .catch(err => this.error('Error triggering ROM001_dim', err));
  }

}

module.exports = SmartButton;
