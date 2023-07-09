'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode, Cluster, CLUSTER } = require('zigbee-clusters');

// Extension of Basic cluster needs this
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');
Cluster.addCluster(HueSpecificBasicCluster);
const HueSpecificBasicBoundCluster = require('../../lib/HueSpecificBasicBoundCluster');
Cluster.addCluster(HueSpecificBasicBoundCluster);

class TapDialSwitch extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
  
    this.printNode();
  
    const node = await this.homey.zigbee.getNode(this);
    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this.log("endpointId: ", endpointId,", clusterId: ", clusterId,", frame: ", frame, ", meta: ", meta);
      this._buttonCommandParser(frame);
    };
      
    this._switchTriggerDevice = this.homey.flow.getDeviceTriggerCard('RDM002_buttons')
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

  _buttonCommandParser(frame) {
    const frameLength = frame.length;
    if (frameLength < 9) {
        this.log(`Received frame with length ${frameLength}, expected at least 9.`);
        return;
    }
  
    const buttonValue = frame.readUInt8(5);
    const counterValue = frame.readUInt8(3).toString(16);  // Read counter as hex
    const actionValue = frame.readUInt8(9);
    let directionValue;
    let timeValue;
  
    // Check if buffer is long enough for direction and rotation data
    if(frame.length >= 17) {
        directionValue = frame.readUInt8(12).toString(16);  // Read direction value as hex, from the 13th byte
        timeValue = frame.readUInt8(17);  // Read time value as decimal, from the 18th byte
    }
  
    const adjustedTime = directionValue === '0' ? timeValue : 256 - timeValue;
    const speed = adjustedTime <= 25 ? 'Step' : adjustedTime <= 75 ? 'Slow' : 'Fast';
  
    let button = '';
    let action = '';
    switch (buttonValue) {
        case 1:
        case 2:
        case 3:
        case 4:
            button = `Button${buttonValue}`;
            action = ['Press', 'Hold', 'Release', 'LongRelease'][actionValue] || 'Unknown';
            break;
        case 20:
            button = 'Ring';
            switch (directionValue) {
                case 'ff':
                    action = `RotateLeft${speed}`;
                    break;
                case '0':
                    action = `RotateRight${speed}`;
                    break;
                default:
                    this.log(`Unknown directionValue: ${directionValue}`);
                    return;
            }
            break;
        default:
            this.log(`Unknown buttonValue: ${buttonValue}`);
            return;
    }
  
    return this._switchTriggerDevice.trigger(this, {}, { action: `${button}-${action}` })
        .then(() => this.log(`triggered RDM002_buttons, action=${button}-${action}`))
        .catch(err => this.error('Error triggering RDM002_buttons', err));
  }
  
}

module.exports = TapDialSwitch;
