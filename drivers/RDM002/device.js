'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, Cluster, CLUSTER } = require('zigbee-clusters');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');
const HueSpecificBasicBoundCluster = require('../../lib/HueSpecificBasicBoundCluster');

// debug(true);
Cluster.addCluster(HueSpecificBasicCluster);
Cluster.addCluster(HueSpecificBasicBoundCluster);

class TapDialSwitch extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
  
    this.printNode();

    if (!this.hasCapability('measure_battery')) {
      await this.addCapability('measure_battery');
    }						
    this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
        getOpts: {
        getOnStart: false,
        getOnOnline: false,
        },
/*           reportOpts: {
          configureAttributeReporting: {
            minInterval: 0,
            maxInterval: 21600,
            minChange: 1,
          }
        } */
    });

    const node = await this.homey.zigbee.getNode(this);
    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this.log("endpointId: ", endpointId,", clusterId: ", clusterId,", frame: ", frame, ", meta: ", meta);
      if  ( clusterId === 64512 ) {
        this._buttonCommandParser(frame);
      } 
      if ( clusterId === 1 ) {
        this._powerParser(frame);
      }
    };
      
    this._switchTriggerDevice = this.homey.flow.getDeviceTriggerCard('RDM002_buttons')
    .registerRunListener(async (args, state) => {
      return (null, args.action === state.action);
    });
  
  }

  _powerParser(frame){
    if ( ( frame.readUInt8(2) == 0x0a ) &&
         ( frame.readUInt8(3) == 0x21 ) &&
         ( frame.readUInt8(4) == 0x00 )) {
      const percentage = frame.readUInt8(5);
      this.setCapabilityValue('measure_battery', percentage);
    }
  }
  
  _buttonCommandParser(frame) {
    if (frame.length < 7) {
        this.log(`Received frame with length ${frame.length}, expected at least 7.`);
        return;
    }

    const buttonValue = frame.readUInt8(5);
    const actionValue = (frame.length >= 9) ? frame.readUInt8(9) : null;

    let button = '';
    let action = '';
    switch (buttonValue) {
        case 1:
        case 2:
        case 3:
        case 4:
            button = `Button${buttonValue}`;
            if (actionValue !== null) {
                action = ['Press', 'Hold', 'Release', 'LongRelease'][actionValue] || 'Unknown';
            }
            break;
        case 20:
            button = 'Ring';
            if (frame.length >= 17) {
                const directionValue = frame.readUInt8(12).toString(16);
                switch (directionValue) {
                    case 'ff':
                        action = `RotateLeft`;
                        break;
                    case '0':
                        action = `RotateRight`;
                        break;
                    default:
                        this.log(`Unknown directionValue: ${directionValue}`);
                        return;
                }
                const timeValue = frame.readUInt8(17);
                const adjustedTime = directionValue === '0' ? timeValue : 256 - timeValue;
                const speed = adjustedTime <= 25 ? 'Step' : adjustedTime <= 75 ? 'Slow' : 'Fast';
                action += speed;
            }
            break;
        default:
            this.log(`Unknown buttonValue: ${buttonValue}`);
            return;
    }

    if (action) {
        return this._switchTriggerDevice.trigger(this, {}, { action: `${button}-${action}` })
            .then(() => this.log(`triggered RDM002_buttons, action=${button}-${action}`))
            .catch(err => this.error('Error triggering RDM002_buttons', err));
    }

  }
  
}

module.exports = TapDialSwitch;



/* "ids": {
  "modelId": "RDM002",
  "manufacturerName": "Signify Netherlands B.V."
},
"endpoints": {
  "ieeeAddress": "00:17:88:01:0d:35:99:9a",
  "networkAddress": 60979,
  "modelId": "RDM002",
  "manufacturerName": "Signify Netherlands B.V.",
  "swBuildId": "2.59.19",
  "capabilities": {
    "type": "Buffer",
    "data": [
      128
    ]
  },
  "endpointDescriptors": [
    {
      "status": "SUCCESS",
      "nwkAddrOfInterest": 60979,
      "_reserved": 34,
      "endpointId": 1,
      "applicationProfileId": 260,
      "applicationDeviceId": 2096,
      "applicationDeviceVersion": 0,
      "_reserved1": 1,
      "inputClusters": [
        0,
        1,
        3,
        64512,
        4096
      ],
      "outputClusters": [
        25,
        0,
        3,
        4,
        6,
        8,
        5,
        4096
      ]
    }
  ],
  "touchlinkGroupIds": [
    2899
  ],
  "extendedEndpointDescriptors": {
    "1": {
      "clusters": {
        "basic": {
          "attributes": [
            {
              "id": 0,
              "name": "zclVersion",
              "value": 8
            },
            {
              "id": 1,
              "name": "appVersion",
              "value": 2
            },
            {
              "id": 2,
              "name": "stackVersion",
              "value": 1
            },
            {
              "id": 3,
              "name": "hwVersion",
              "value": 1
            },
            {
              "id": 4,
              "name": "manufacturerName",
              "value": "Signify Netherlands B.V."
            },
            {
              "id": 5,
              "name": "modelId",
              "value": "RDM002"
            },
            {
              "id": 6,
              "name": "dateCode",
              "value": "20220316"
            },
            {
              "id": 7,
              "name": "powerSource",
              "value": "battery"
            },
            {
              "id": 8,
              "name": "appProfileVersion",
              "value": 0
            },
            {
              "id": 9
            },
            {
              "id": 10
            },
            {
              "id": 11
            },
            {
              "id": 16384,
              "name": "swBuildId",
              "value": "2.59.19"
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 3
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "powerConfiguration": {
          "attributes": [
            {
              "id": 32,
              "name": "batteryVoltage",
              "value": 28
            },
            {
              "id": 33,
              "name": "batteryPercentageRemaining",
              "value": 193
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 2
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "identify": {
          "attributes": [
            {
              "id": 0,
              "name": "identifyTime",
              "value": 0
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 2
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "touchlink": {
          "attributes": [
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 3,
              "reportingConfiguration": {
                "status": "UNREPORTABLE_ATTRIBUTE",
                "direction": "reported"
              }
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        }
      },
      "bindings": {
        "basic": {
          "attributes": [
            {
              "id": 0,
              "name": "zclVersion",
              "value": 8
            },
            {
              "id": 1,
              "name": "appVersion",
              "value": 2
            },
            {
              "id": 2,
              "name": "stackVersion",
              "value": 1
            },
            {
              "id": 3,
              "name": "hwVersion",
              "value": 1
            },
            {
              "id": 4,
              "name": "manufacturerName",
              "value": "Signify Netherlands B.V."
            },
            {
              "id": 5,
              "name": "modelId",
              "value": "RDM002"
            },
            {
              "id": 6,
              "name": "dateCode",
              "value": "20220316"
            },
            {
              "id": 7,
              "name": "powerSource",
              "value": "battery"
            },
            {
              "id": 8,
              "name": "appProfileVersion",
              "value": 0
            },
            {
              "id": 9
            },
            {
              "id": 10
            },
            {
              "id": 11
            },
            {
              "id": 16384,
              "name": "swBuildId",
              "value": "2.59.19"
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 3
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "identify": {
          "attributes": [
            {
              "id": 0,
              "name": "identifyTime",
              "value": 0
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 2
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "touchlink": {
          "attributes": [
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 3,
              "reportingConfiguration": {
                "status": "UNREPORTABLE_ATTRIBUTE",
                "direction": "reported"
              }
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "ota": {},
        "groups": {},
        "onOff": {},
        "levelControl": {},
        "scenes": {}
      }
    }
  }
} */