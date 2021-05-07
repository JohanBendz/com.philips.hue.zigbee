'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');
/* const HueSpecificOccupancySensingCluster = require('../../lib/HueSpecificOccupancySensingCluster');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');

Cluster.addCluster(HueSpecificOccupancySensingCluster);
Cluster.addCluster(HueSpecificBasicCluster); */

class OccupancySensor extends ZigBeeDevice {
	
	async onNodeInit({ zclNode }) {

  this.printNode();

  const minReportTemp = this.getSetting('minReportTemp') || 60;
  const maxReportTemp = this.getSetting('maxReportTemp') || 300;
  const minReportLux = this.getSetting('minReportLux') || 60;
  const maxReportLux = this.getSetting('maxReportLux') || 300;

    if (this.isFirstInit()){

      await this.configureAttributeReporting([
        {
        endpointId: 2,
        cluster: CLUSTER.OCCUPANCY_SENSING,
        attributeName: 'occupancy',
        minInterval: 0,
        maxInterval: 300,
        minChange: 0,
        },
        {
        endpointId: 2,
        cluster: CLUSTER.TEMPERATURE_MEASUREMENT,
        attributeName: 'measuredValue',
        minInterval: minReportTemp,
        maxInterval: maxReportTemp,
        minChange: 1,
        },
        {
        endpointId: 2,
        cluster: CLUSTER.ILLUMINANCE_MEASUREMENT,
        attributeName: 'measuredValue',
        minInterval: minReportLux,
        maxInterval: maxReportLux,
        minChange: 1,
        },
        {
        endpointId: 2,
        cluster: CLUSTER.POWER_CONFIGURATION,
        attributeName: 'batteryPercentageRemaining',
        minInterval: 300,
        maxInterval: 10800,
        minChange: 1,
        }
      ]);

      this.log("Config updated");

    }
    
    // alarm_motion
    zclNode.endpoints[2].clusters[CLUSTER.OCCUPANCY_SENSING.NAME]
    .on('attr.occupancy', this.onOccupancyAttributeReport.bind(this));

 		// measure_temperature
		zclNode.endpoints[2].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME]
    .on('attr.measuredValue', this.onTemperatureMeasuredAttributeReport.bind(this));
  
		// measure_humidity
		zclNode.endpoints[2].clusters[CLUSTER.ILLUMINANCE_MEASUREMENT.NAME]
    .on('attr.measuredValue', this.onLuminanceMeasuredAttributeReport.bind(this));

		// measure_battery // alarm_battery
		zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME]
    .on('attr.batteryPercentageRemaining', this.onBatteryPercentageRemainingAttributeReport.bind(this));

    const batteryStatus = await this.zclNode.endpoints[2].clusters.powerConfiguration.readAttributes('batteryPercentageRemaining');
    const batteryThreshold = this.getSetting('batteryThreshold') || 20;
    this.log("measure_battery | powerConfiguration - batteryPercentageRemaining (%): ", batteryStatus.batteryPercentageRemaining/2);
    this.setCapabilityValue('measure_battery', batteryStatus.batteryPercentageRemaining/2);
    this.setCapabilityValue('alarm_battery', (batteryStatus.batteryPercentageRemaining/2 < batteryThreshold) ? true : false)
    
  }
  
  onOccupancyAttributeReport(occupancyStatus) {
    const parsedOccupancyStatus = Object.values(occupancyStatus);
    this.log("Occupancy status:", parsedOccupancyStatus[2]);
    if (parsedOccupancyStatus[2] == true) {
      this.setCapabilityValue('alarm_motion', true)
      .catch(err => this.error('Error: could not set alarm_motion capability value', err));
    } else {
      this.setCapabilityValue('alarm_motion', false)
      .catch(err => this.error('Error: could not set alarm_motion capability value', err));
    }
  }

  onTemperatureMeasuredAttributeReport(measuredTempValue) {
		const temperatureOffset = this.getSetting('temperature_offset') || 0;
		const parsedTempValue = this.getSetting('temperature_decimals') === '2' ? Math.round((measuredTempValue / 100) * 100) / 100 : Math.round((measuredTempValue / 100) * 10) / 10;
		this.log('Temperature:', parsedTempValue, '+ temperature offset', temperatureOffset);
		this.setCapabilityValue('measure_temperature', parsedTempValue + temperatureOffset);
	}

	onLuminanceMeasuredAttributeReport(measuredLuxValue) {
		const parsedLumValue = Math.round(Math.pow(10, (measuredLuxValue - 1) / 10000));
		this.log('measure_luminance:', parsedLumValue);
		this.setCapabilityValue('measure_luminance', parsedLumValue);
  }

	onBatteryPercentageRemainingAttributeReport(batteryPercentageRemaining) {
		const batteryThreshold = this.getSetting('batteryThreshold') || 20;
		this.log("measure_battery | powerConfiguration - batteryPercentageRemaining (%): ", batteryPercentageRemaining/2);
		this.setCapabilityValue('measure_battery', batteryPercentageRemaining/2);
		this.setCapabilityValue('alarm_battery', (batteryPercentageRemaining/2 < batteryThreshold) ? true : false)
  }

	async onSettings({ oldSettings, newSettings, changedKeys }) {
		
		this.log('changed keys: ', changedKeys);
		this.log('newSettings: ', newSettings);
    this.log('oldSettings: ', oldSettings);

    if ((changedKeys.includes('minReportTemp')) || (changedKeys.includes('maxReportTemp'))) {
      if (newSettings.minReportTemp < newSettings.maxReportTemp) {
          await this.configureAttributeReporting([
            {
            endpointId: 2,
            cluster: CLUSTER.TEMPERATURE_MEASUREMENT,
            attributeName: 'measuredValue',
            minInterval: newSettings.minReportTemp,
            maxInterval: newSettings.maxReportTemp,
            minChange: 1,
            }
          ]);
          this.log("Temperature config updated");
      }
      else {
        throw new Error('maxReportTemp smaller than minReportTemp');
      }
    }

    if ((changedKeys.includes('minReportLux')) || (changedKeys.includes('maxReportLux'))) {
      if (newSettings.minReportLux < newSettings.maxReportLux) {
        await this.configureAttributeReporting([
          {
          endpointId: 2,
          cluster: CLUSTER.ILLUMINANCE_MEASUREMENT,
          attributeName: 'measuredValue',
          minInterval: newSettings.minReportLux,
          maxInterval: newSettings.maxReportLux,
          minChange: 1,
          }
        ]);
        this.log("Luminance config updated");
      }
      else {
        throw new Error('maxReportLux smaller than minReportLux');
      }
    }

/*     if (changedKeys.includes('ledIndicator')) {
      const ledindication = newSettings.ledIndicator === true ? 1 : 0;
      await this.zclNode.endpoints[2].clusters.occupancySensing.writeAttributes({ledIndication: ledindication});
      await this.zclNode.endpoints[2].clusters.basic.writeAttributes({ledIndication: ledindication});
      this.log("Setting LED indicator status to: ", ledindication)
    } */

	}
	
}

module.exports = OccupancySensor;



/* "ids": {
    "modelId": "SML001",
    "manufacturerName": "Philips"
  },
  "endpoints": {
    "endpointDescriptors": [
      {
        "endpointId": 2,
        "applicationProfileId": 260,
        "applicationDeviceId": 263,
        "applicationDeviceVersion": 0,
        "_reserved1": 0,
        "inputClusters": [
          0,
          1,
          3,
          1030,
          1024,
          1026
        ],
        "outputClusters": [
          25
        ]
      },
      {
        "endpointId": 1,
        "applicationProfileId": 49246,
        "applicationDeviceId": 2128,
        "applicationDeviceVersion": 0,
        "_reserved1": 2,
        "inputClusters": [
          0
        ],
        "outputClusters": [
          0,
          3,
          4,
          6,
          8,
          768,
          5
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
                "value": 1
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
                "value": "Philips"
              },
              {
                "id": 5,
                "name": "modelId",
                "value": "SML001"
              },
              {
                "id": 6,
                "name": "dateCode",
                "value": "20160630"
              },
              {
                "id": 7,
                "name": "powerSource",
                "value": "battery"
              },
              {
                "id": 16384,
                "name": "swBuildId",
                "value": "6.1.0.18912"
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
                "value": 1
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
                "value": "Philips"
              },
              {
                "id": 5,
                "name": "modelId",
                "value": "SML001"
              },
              {
                "id": 6,
                "name": "dateCode",
                "value": "20160630"
              },
              {
                "id": 7,
                "name": "powerSource",
                "value": "battery"
              },
              {
                "id": 16384,
                "name": "swBuildId",
                "value": "6.1.0.18912"
              }
            ],
            "commandsGenerated": "UNSUP_GENERAL_COMMAND",
            "commandsReceived": "UNSUP_GENERAL_COMMAND"
          },
          "identify": {
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
          "colorControl": {
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
      },
      "2": {
        "clusters": {
          "basic": {
            "attributes": [
              {
                "id": 0,
                "name": "zclVersion",
                "value": 1
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
                "value": "Philips"
              },
              {
                "id": 5,
                "name": "modelId",
                "value": "SML001"
              },
              {
                "id": 6,
                "name": "dateCode",
                "value": "20160630"
              },
              {
                "id": 7,
                "name": "powerSource",
                "value": "battery"
              },
              {
                "id": 16384,
                "name": "swBuildId",
                "value": "6.1.0.18912"
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
                "value": 30,
                "reportingConfiguration": {
                  "status": "UNREPORTABLE_ATTRIBUTE",
                  "direction": "reported"
                }
              },
              {
                "id": 33,
                "name": "batteryPercentageRemaining",
                "value": 200,
                "reportingConfiguration": {
                  "direction": "reported",
                  "attributeDataType": 32,
                  "minInterval": 300,
                  "maxInterval": 60000,
                  "minChange": 1,
                  "status": "SUCCESS"
                }
              }
            ],
            "commandsGenerated": "UNSUP_GENERAL_COMMAND",
            "commandsReceived": "UNSUP_GENERAL_COMMAND"
          },
          "identify": {
            "attributes": [
              {
                "id": 0,
                "reportingConfiguration": {
                  "status": "UNREPORTABLE_ATTRIBUTE",
                  "direction": "reported"
                }
              }
            ],
            "commandsGenerated": "UNSUP_GENERAL_COMMAND",
            "commandsReceived": "UNSUP_GENERAL_COMMAND"
          },
          "occupancySensing": {
            "attributes": [
              {
                "id": 0,
                "name": "occupancy",
                "value": {
                  "type": "Buffer",
                  "data": [
                    0
                  ]
                }
              },
              {
                "id": 1,
                "name": "occupancySensorType",
                "value": "pir"
              },
              {
                "id": 16,
                "name": "pirOccupiedToUnoccupiedDelay",
                "value": 0
              }
            ],
            "commandsGenerated": "UNSUP_GENERAL_COMMAND",
            "commandsReceived": "UNSUP_GENERAL_COMMAND"
          },
          "illuminanceMeasurement": {
            "attributes": [
              {
                "id": 0,
                "name": "measuredValue",
                "value": 12184
              },
              {
                "id": 1,
                "name": "minMeasuredValue",
                "value": 1
              },
              {
                "id": 2,
                "name": "maxMeasuredValue",
                "value": 65534
              }
            ],
            "commandsGenerated": "UNSUP_GENERAL_COMMAND",
            "commandsReceived": "UNSUP_GENERAL_COMMAND"
          },
          "temperatureMeasurement": {
            "attributes": [
              {
                "id": 0,
                "name": "measuredValue",
                "value": 2327
              },
              {
                "id": 1,
                "name": "minMeasuredValue",
                "value": -27315
              },
              {
                "id": 2,
                "name": "maxMeasuredValue",
                "value": 32767
              }
            ],
            "commandsGenerated": "UNSUP_GENERAL_COMMAND",
            "commandsReceived": "UNSUP_GENERAL_COMMAND"
          }
        },
        "bindings": {
          "ota": {
            "attributes": [],
            "commandsGenerated": "UNSUP_GENERAL_COMMAND",
            "commandsReceived": "UNSUP_GENERAL_COMMAND"
          }
        }
      }
    }
  } */

/*   {
    "id": "ledIndicator",
    "type": "checkbox",
    "label": {
      "en": "LED indicator on movement"
    },
    "hint": {
      "en": "This setting determines if the LED indicates movement."
    },
    "value": false
  }, */