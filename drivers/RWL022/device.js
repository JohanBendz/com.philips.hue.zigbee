'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, Cluster, CLUSTER } = require('zigbee-clusters');

const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');

// debug(true);
Cluster.addCluster(HueSpecificBasicCluster);

/* const HueSpecificCluster = require('../../lib/HueSpecificCluster');
const HueSpecificBoundCluster = require('../../lib/HueSpecificBoundCluster');
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');
Cluster.addCluster(HueSpecificCluster);
Cluster.addCluster(HueSpecificBoundCluster); */

class DimmerSwitchGen3 extends ZigBeeDevice {

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
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 0,
          maxInterval: 21600,
          minChange: 1,
        }
      }
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
    
/*     zclNode.endpoints[1].bind(HueSpecificCluster.NAME, new HueSpecificBoundCluster({
      // onButton: this._buttonCommandParser.bind(this),
      onButton: (payload) => {
        console.log("Payload: ", payload);
        console.log("Payload JSON: ", payload.JSON());
      }
    })); */

    this._switchTriggerDevice = this.homey.flow.getDeviceTriggerCard('RWL022_buttons')
    .registerRunListener(async (args, state) => {
      return (null, args.action === state.action);
    });

  }

/*   _buttonCommandParser(payload) {
    var button = payload.activeButton === 1 ? 'OnOff' : payload.activeButton === 2 ? 'DimUp' : payload.activeButton === 3 ? 'DimDown' : 'Hue';
    var action = payload.activeAction === 0 ? 'ShortPress' : payload.activeAction === 1 ? 'LongPress' : payload.activeAction === 2 ? 'ShortRelease' : 'LongRelease';
    return this._switchHueTriggerDevice.trigger(this, {}, { action: `${button}-${action}` })
      .then(() => this.log(`triggered RWL022_buttons, action=${payload.mode}-${action}`))
      .catch(err => this.error('Error triggering RWL022_buttons', err));
  } */

  _powerParser(frame){
    if ( ( frame.readUInt8(2) == 0x01 ) &&
         ( frame.readUInt8(3) == 0x21 ) &&
         ( frame.readUInt8(4) == 0x00 ) &&
         ( frame.readUInt8(5) == 0x20 )) {
      const percentage = frame.readUInt8(7) / 2;
      this.setCapabilityValue('measure_battery', percentage);
    }
  }

  _buttonCommandParser(payload) {
    var button = payload[5] === 1 ? 'OnOff' : payload[5] === 2 ? 'DimUp' : payload[5] === 3 ? 'DimDown' : 'Hue';
    var action = payload[9] === 0 ? 'ShortPress' : payload[9] === 1 ? 'LongPress' : payload[9] === 2 ? 'ShortRelease' : 'LongRelease';
    return this._switchTriggerDevice.trigger(this, {}, { action: `${button}-${action}` })
      .then(() => this.log(`triggered RWL022_buttons, action=${button}-${action}`))
      .catch(err => this.error('Error triggering RWL022_buttons', err));
  }

}

module.exports = DimmerSwitchGen3;


/* "ids": {
  "modelId": "RWL022",
  "manufacturerName": "Signify Netherlands B.V."
},
"endpoints": {
  "endpointDescriptors": [
    {
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
  "endpoints": {
    "1": {
      "clusters": {
        "basic": {
          "attributes": [
            {
              "id": 0,
              "name": "zclVersion",
              "value": 2
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
              "value": "RWL022"
            },
            {
              "id": 6,
              "name": "dateCode",
              "value": "20200622"
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
              "value": "2.42.0_h1F5E860"
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ]
        },
        "powerConfiguration": {
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "identify": {
          "attributes": [
            {
              "id": 0
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ],
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "touchlink": {
          "attributes": [
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 1,
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
              "value": 2
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
              "value": "RWL022"
            },
            {
              "id": 6,
              "name": "dateCode",
              "value": "20200622"
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
              "value": "2.42.0_h1F5E860"
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ]
        },
        "identify": {
          "attributes": [
            {
              "id": 0
            },
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ],
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "touchlink": {
          "attributes": [
            {
              "id": 65533,
              "name": "clusterRevision",
              "value": 1,
              "reportingConfiguration": {
                "status": "UNREPORTABLE_ATTRIBUTE",
                "direction": "reported"
              }
            }
          ],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "ota": {
          "attributes": [],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "groups": {
          "attributes": [],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "onOff": {
          "attributes": [],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "levelControl": {
          "attributes": [],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        },
        "scenes": {
          "attributes": [],
          "commandsGenerated": "UNSUP_GENERAL_COMMAND",
          "commandsReceived": "UNSUP_GENERAL_COMMAND"
        }
      }
    }
  }
} */


// Frame data
// Cluster 6 & 8
// On/off Button
// First push = clusterId: 6 , frame: <Buffer 01 01 40 00 00>
// Second push = clusterId: 6 , frame: <Buffer 01 02 01>
// Multiple push not supported, hold not supported
//
// Dim up button
// Push = clusterId: 8 , frame: <Buffer 01 d2 02 00 1e 09 00>
// Hold = clusterId: 8 , frame: <Buffer 01 df 02 00 3f 09 00>
// Release = clusterId: 8 , frame: <Buffer 01 bc 03>
// Multiple push not supported
//
// Dim down button
// Push = clusterId: 8 , frame: <Buffer 01 05 02 01 1e 09 00>
// Hold = clusterId: 8 , frame: <Buffer 01 06 02 01 3f 09 00>
// Release = clusterId: 8 , frame: <Buffer 01 07 03>
// Multiple push not supported
//
// hue button
// Push = Nothing
// Hold = Nothing

// Cluster 64512
// Bit 6 = button number from 01-04  / upper to lower
//
// On/off Button
// First push =
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 88 00 01 00 00 30 00 21 00 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 89 00 01 00 00 30 02 21 01 00>
// Second push = same
// Hold =
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 8c 00 01 00 00 30 01 21 40 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 8d 00 01 00 00 30 01 21 48 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 8e 00 01 00 00 30 01 21 50 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 8f 00 01 00 00 30 01 21 58 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 90 00 01 00 00 30 01 21 60 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 91 00 01 00 00 30 01 21 68 00>
// Release =
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 92 00 01 00 00 30 03 21 6a 00>
//
// Dim up button
// Push =
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 f4 00 02 00 00 30 00 21 00 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 f6 00 02 00 00 30 02 21 01 00>
// Second push = same
// Hold = 
// - 
// Release = 
// Multiple push not supported
//
// Dim down button
// Push = 
// Hold = 
// Release = 
// Multiple push not supported
//
// hue button
// Push = 
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 64 00 04 00 00 30 00 21 00 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 65 00 04 00 00 30 02 21 01 00>
// Hold = 
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 9e 00 04 00 00 30 00 21 00 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 9f 00 04 00 00 30 01 21 08 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 a0 00 04 00 00 30 01 21 10 00>
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 a1 00 04 00 00 30 01 21 18 00>
// Release =
// - clusterId: 64512 , frame: <Buffer 1d 0b 10 a2 00 04 00 00 30 03 21 18 00>
//

// SHORT PRESS, TURN ON: EVENT: 1000
// SHORT RELEASE, TURN ON: EVENT: 1002
// LONG PRESS, TURN ON: EVENT: 1001
// LONG RELEASE, TURN ON: EVENT: 1003
// SHORT PRESS, DIM UP: EVENT: 2000
// SHORT RELEASE, DIM UP: EVENT: 2002
// LONG PRESS, DIM UP: EVENT: 2001
// LONG RELEASE, DIM UP: EVENT: 2003
// SHORT PRESS, DIM DOWN: EVENT: 3000
// SHORT RELEASE, DIM DOWN: EVENT: 3002
// LONG PRESS, DIM DOWN: EVENT: 3001
// LONG RELEASE, DIM DOWN: EVENT: 3003
// SHORT PRESS, HUE: EVENT: 4000
// SHORT RELEASE, HUE: EVENT: 4002
// LONG PRESS, HUE: EVENT: 4001
// LONG RELEASE, HUE: EVENT: 4003
