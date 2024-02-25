'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, Cluster, CLUSTER } = require('zigbee-clusters');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');
const HueSpecificCluster = require('../../lib/HueSpecificCluster');

//debug(true);
Cluster.addCluster(HueSpecificBasicCluster);
Cluster.addCluster(HueSpecificCluster);

class WallSwitchModule extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this._deviceMode = -1;
    this._wakeupaction = false;

    // Set device mode based on settings
    this.driver.deviceMode = this.getSettings()['mode'];
    this._setNewConfig(this.driver.deviceMode);

    // Handle battery measurement if capability is available
    if (this.hasCapability('measure_battery')) {
      this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
        getOpts: {
          getOnStart: false,
          getOnOnline: false,
        },
        reportOpts: {
          configureAttributeReporting: {
            minInterval: 90000,
            maxInterval: 0,
            minChange: 1,
          },
        },
      });
    }

    const node = await this.homey.zigbee.getNode(this);

    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this._setmode();
      if (clusterId === 64512) {
        this._buttonCommandParser(frame);
      }
      if (clusterId === 1) {
        this._powerParser(frame);
      }
    };
  }

  async _setmode() {
    if (this._wakeupaction) {
      this._wakeupaction = false;
      try {
        await this.zclNode.endpoints[1].clusters.HueSpecificBasicCluster.writeAttributes({ deviceMode: this._deviceMode });
      } catch (err) {
        // Ignore timeout error
      }
    }
    return;
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('mode')) {
      this._setNewConfig(newSettings['mode']);
      this.driver.deviceMode = newSettings['mode'];
    }
    return super.onSettings({ oldSettings, newSettings, changedKeys });
  }

  _setNewConfig(deviceMode) {
    if (this._deviceMode != deviceMode) {
      this._deviceMode = deviceMode;
      this._wakeupaction = true;
      this._setTrigger(deviceMode);
    }
    return;
  }

  _setTrigger(deviceMode) {
    try {
      switch (deviceMode) {
        case 'singlerocker':
        case 'dualrocker':
          this.TriggerDevice = this.homey.flow.getDeviceTriggerCard('RDM001_rockerswitch')
            .registerRunListener(async (args, state) => {
              return args.action === state.action;
            });
          break;
        case 'singlepushbutton':
        case 'dualpushbutton':
          this.TriggerDevice = this.homey.flow.getDeviceTriggerCard('RDM001_pushbuttons')
            .registerRunListener(async (args, state) => {
              return args.button === state.button && args.action === state.action;
            });
          break;
      }
    } catch (error) {
      this.error('Error setting up triggers:', error.message);
    }
  }
  
  _triggerRockerSwitch(button) {
    if (this.TriggerDevice) {
      this.TriggerDevice.trigger(this, { button }, {})
        .then(() => this.log(`Triggered RDM001_rockerswitch, button=${button}`))
        .catch(err => this.error('Error triggering RDM001_rockerswitch', err));
    }
  }
  
  _triggerPushButton(button, action) {
    if (this.TriggerDevice) {
      this.TriggerDevice.trigger(this, { button }, { action: `${action}` })
        .then(() => this.log(`Triggered RDM001_pushbuttons, button=${button}, action=${action}`))
        .catch(err => this.error('Error triggering RDM001_pushbuttons', err));
    }
  }

  _powerParser(frame) {
    if ((frame.readUInt8(2) == 0x0a) &&
      (frame.readUInt8(3) == 0x21) &&
      (frame.readUInt8(4) == 0x00)) {
      const percentage = frame.readUInt8(5);
      this.setCapabilityValue('measure_battery', percentage);
    }
  }

  _buttonCommandParser(frame) {
    const frameLength = frame.length;
    if (frameLength < 9) {
      this.log(`Received frame with length ${frameLength}, expected at least 9.`);
      return;
    }
  
    const buttonValue = frame.readUInt8(5);
    const actionValue = frame.readUInt8(9);
    const action = ['Press', 'Hold', 'Release', 'LongRelease'][actionValue] || 'Unknown';
    const button = buttonValue === 1 ? 'first_input' : 'second_input';
  
    // Trigger appropriate method based on the device mode
    if (this.driver.deviceMode.includes('rocker')) {
      // For Rocker Switch Mode
      this._triggerRockerSwitch(button);
    } else if (this.driver.deviceMode.includes('pushbutton')) {
      // For PushButton Mode
      this._triggerPushButton(button, action);
    }
  }

}

module.exports = WallSwitchModule;


/* "ids": {
  "modelId": "RDM001",
  "manufacturerName": "Signify Netherlands B.V."
},
"endpoints": {
  "endpointDescriptors": [
    {
      "endpointId": 1,
      "applicationProfileId": 260,
      "applicationDeviceId": 2080,
      "applicationDeviceVersion": 0,
      "_reserved1": 1,
      "inputClusters": [
        0,
        1,
        3,
        64512
      ],
      "outputClusters": [
        3,
        4,
        6,
        8,
        25
      ]
    }
  ],
  "endpoints": {
    "1": {
      "clusters": {
        "basic": {
          "attributes": [
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 0,
              "name": "zclVersion",
              "value": 2,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 1,
              "name": "appVersion",
              "value": 9,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 2,
              "name": "stackVersion",
              "value": 2,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 3,
              "name": "hwVersion",
              "value": 3,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 4,
              "name": "manufacturerName",
              "value": "Signify Netherlands B.V.",
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 5,
              "name": "modelId",
              "value": "RDM001",
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 6,
              "name": "dateCode",
              "value": "20210115",
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 7,
              "name": "powerSource",
              "value": "battery",
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 8,
              "name": "appProfileVersion",
              "value": 255,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 9,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 10,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 11,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "writable",
                "reportable"
              ],
              "id": 17,
              "name": "physicalEnv",
              "value": "Unspecified",
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 16384,
              "name": "swBuildId",
              "value": "1.0.3",
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            }
          ],
          "commandsGenerated": [],
          "commandsReceived": []
        },
        "powerConfiguration": {
          "attributes": [
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 32,
              "name": "batteryVoltage",
              "value": 30,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 33,
              "name": "batteryPercentageRemaining",
              "value": 200,
              "reportingConfiguration": {
                "direction": "reported",
                "attributeDataType": 32,
                "minInterval": 60,
                "maxInterval": 300,
                "minChange": 1,
                "status": "SUCCESS"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            }
          ],
          "commandsGenerated": [],
          "commandsReceived": []
        },
        "identify": {
          "attributes": [
            {
              "acl": [
                "readable",
                "writable",
                "reportable"
              ],
              "id": 0,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            }
          ],
          "commandsGenerated": [
            0
          ],
          "commandsReceived": [
            0,
            1
          ]
        }
      },
      "bindings": {
        "identify": {
          "attributes": [
            {
              "acl": [
                "readable",
                "writable",
                "reportable"
              ],
              "id": 0,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            },
            {
              "acl": [
                "readable",
                "reportable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1,
              "reportingConfiguration": {
                "status": "NOT_FOUND",
                "direction": "reported"
              }
            }
          ],
          "commandsGenerated": [
            0
          ],
          "commandsReceived": [
            0,
            1
          ]
        },
        "groups": {
          "attributes": [],
          "commandsGenerated": [],
          "commandsReceived": []
        },
        "onOff": {
          "attributes": [],
          "commandsGenerated": [],
          "commandsReceived": []
        },
        "levelControl": {
          "attributes": [],
          "commandsGenerated": [],
          "commandsReceived": []
        },
        "ota": {
          "attributes": [],
          "commandsGenerated": [],
          "commandsReceived": []
        }
      }
    }
  }
} 

Depending on your gateway, additional configuration might be required to enable the second switch input. The attribute mode (0x0034) might be changed to the correct value:

0 - single rocker type switch
1 - single push button type switch
2 - double rocker type switch
3 - double push button type switch

*/
