'use strict';

const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');

class SmartButton extends ZigBeeDevice {

async onNodeInit({ zclNode }) {
    
    // Buttons
    zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
      onSetOn: this._onCommandParser.bind(this),
      //onSetOff: this._offCommandParser.bind(this),
      offWithEffect: this._offCommandParser.bind(this)
    }));

    zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
      onStep: this._stepCommandParser.bind(this),
      //onStepWithOnOff: this._stepCommandParser.bind(this),
      onStop: this._stopCommandParser.bind(this),
      //onStopWithOnOff: this._stopCommandParser.bind(this),
    }));

    this._buttonPressedTriggerDevice = this.homey.flow.getDeviceTriggerCard('ROM001_button')
    .registerRunListener(async (args, state) => {
      return (null, args.action === state.action);
    });

		// alarm_battery
		if (this.hasCapability('alarm_battery')) {				
      this.batteryThreshold = 20;
			this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
				getOpts: {
				},
				reportOpts: {
					configureAttributeReporting: {
						minInterval: 0, // No minimum reporting interval
						maxInterval: 60000, // Maximally every ~16 hours
						minChange: 10, // Report when value changed by 10
					},
				},
      });
		}

  }

  _onCommandParser() {
    this._buttonPressedTriggerDevice.trigger(this, {}, { action: 'pressed' })
    .then(() => this.log(`triggered ROM001 button, action=pressed`))
    .catch(err => this.error('Error triggering ROM001 button', err));

    this._buttonPressedTriggerDevice.trigger(this, {}, { action: 'pressed-odd' })
    .then(() => this.log(`triggered ROM001 button, action=pressed-odd`))
    .catch(err => this.error('Error triggering ROM001 button', err));
    return;
  }

  _offCommandParser() {
    this._buttonPressedTriggerDevice.trigger(this, {}, { action: 'pressed' })
    .then(() => this.log(`triggered ROM001 button, action=pressed`))
    .catch(err => this.error('Error triggering ROM001 button', err));

    this._buttonPressedTriggerDevice.trigger(this, {}, { action: 'pressed-even' })
    .then(() => this.log(`triggered ROM001 button, action=pressed-even`))
    .catch(err => this.error('Error triggering ROM001 button', err));
    return;
  }

  _stepCommandParser(payload) {
    var action = payload.stepSize === 30 ? 'short-hold' : 'long-hold'; // 30=short-hold,56=long-hold
    var action2 = payload.mode;
    this._buttonPressedTriggerDevice.trigger(this, {}, { action: 'hold' })
    .then(() => this.log(`triggered ROM001 button, action=${action}`))
    .catch(err => this.error('Error triggering ROM001 button', err));

    this._buttonPressedTriggerDevice.trigger(this, {}, { action: `${action2}` })
    .then(() => this.log(`triggered ROM001 button, action=${action}`))
    .catch(err => this.error('Error triggering ROM001 button', err));

    this._buttonPressedTriggerDevice.trigger(this, {}, { action: `${action}` })
    .then(() => this.log(`triggered ROM001 button, action=${action}`))
    .catch(err => this.error('Error triggering ROM001 button', err));
    return;
  }

  _stopCommandParser() {
    return this._buttonPressedTriggerDevice.trigger(this, {}, { action: 'released' })
    .then(() => this.log(`triggered ROM001 button, action=released`))
    .catch(err => this.error('Error triggering ROM001 button', err));
  }

}

module.exports = SmartButton;

// button behaviour
//
// on
// <Buffer 01 xx 01>
// setOn undefined
// triggered ROM001_on
//
// off
// <Buffer 01 xx 40 00 00>
// onOff.offWithEffect { effectIdentifier: 0, effectVariant: 0 }
// triggered ROM001_off
//
// long press - while pressed
// <Buffer 01 xx 02 00 38 09 00>
// step levelControl.step { mode: 'down', stepSize: 30, transitionTime: 9 }
// triggered ROM001_dim, action=down-press
//
// long press - keep pressed, from 2nd command and until released, every (aprox) second
// levelControl (8) received command step levelControl.step { mode: 'down', stepSize: 56, transitionTime: 9 }
// triggered ROM001_dim, action=down-hold
//
// long press - when released when button status is on
// <Buffer 01 xx 03>
// stop undefined
// triggered ROM001_dim, action=release

