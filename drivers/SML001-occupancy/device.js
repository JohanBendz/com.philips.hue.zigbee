'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');
const HueSpecificOccupancySensingCluster = require('../../lib/HueSpecificOccupancySensingCluster');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');
const {
  getMotionSensitivityMax,
  migrateMissingOccupancySettings,
} = require('../../lib/HueOccupancySettings');
const {
  applyHueSensorBattery,
  refreshHueSensorBattery,
} = require('../../lib/HueSensorBattery');
const { markHueSensorAvailable } = require('../../lib/HueSensorAvailability');

Cluster.addCluster(HueSpecificOccupancySensingCluster);
Cluster.addCluster(HueSpecificBasicCluster);

class OccupancySensor extends ZigBeeDevice {

  constructor(...args) {
		super(...args);
		this.isSuppressed = false;
		// Store bound listener references for cleanup
		this._boundOccupancyListener = null;
		this._boundTemperatureListener = null;
		this._boundLuminanceListener = null;
		this._boundBatteryListener = null;
		this._listenersRegistered = false;
	}

	async onNodeInit({ zclNode }) {
    await this._migrateMissingSettings();
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

    // Only register listeners if not already registered (prevents accumulation on reconnect)
    if (!this._listenersRegistered) {
      // Create bound listeners once and store references
      this._boundOccupancyListener = this.onOccupancyAttributeReport.bind(this);
      this._boundTemperatureListener = this.onTemperatureMeasuredAttributeReport.bind(this);
      this._boundLuminanceListener = this.onLuminanceMeasuredAttributeReport.bind(this);
      this._boundBatteryListener = this.onBatteryPercentageRemainingAttributeReport.bind(this);

      // alarm_motion
      zclNode.endpoints[2].clusters[CLUSTER.OCCUPANCY_SENSING.NAME]
      .on('attr.occupancy', this._boundOccupancyListener);

      // measure_temperature
      zclNode.endpoints[2].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME]
      .on('attr.measuredValue', this._boundTemperatureListener);

      // measure_luminance
      zclNode.endpoints[2].clusters[CLUSTER.ILLUMINANCE_MEASUREMENT.NAME]
      .on('attr.measuredValue', this._boundLuminanceListener);

      // measure_battery // alarm_battery
      zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME]
      .on('attr.batteryPercentageRemaining', this._boundBatteryListener);

      this._listenersRegistered = true;
      this.log("Event listeners registered");
    }

    // Battery is refreshed when the sleepy sensor actually announces/wakes.
  }

  async onUninit() {
    this.log("Cleaning up OccupancySensor resources...");

    // Clear suppress timeout
    if (this.suppressTimeout) {
      this.homey.clearTimeout(this.suppressTimeout);
      this.suppressTimeout = null;
    }

    // Remove event listeners to prevent memory leaks
    if (this._listenersRegistered && this.zclNode && this.zclNode.endpoints[2]) {
      try {
        if (this._boundOccupancyListener) {
          this.zclNode.endpoints[2].clusters[CLUSTER.OCCUPANCY_SENSING.NAME]
            .removeListener('attr.occupancy', this._boundOccupancyListener);
        }
        if (this._boundTemperatureListener) {
          this.zclNode.endpoints[2].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME]
            .removeListener('attr.measuredValue', this._boundTemperatureListener);
        }
        if (this._boundLuminanceListener) {
          this.zclNode.endpoints[2].clusters[CLUSTER.ILLUMINANCE_MEASUREMENT.NAME]
            .removeListener('attr.measuredValue', this._boundLuminanceListener);
        }
        if (this._boundBatteryListener) {
          this.zclNode.endpoints[2].clusters[CLUSTER.POWER_CONFIGURATION.NAME]
            .removeListener('attr.batteryPercentageRemaining', this._boundBatteryListener);
        }
        this.log("Event listeners removed");
      } catch (error) {
        this.error("Error removing event listeners:", error);
      }
    }

    this._listenersRegistered = false;
  }

  suppressSensor(args, state) {
    // Clear existing timeout before setting a new one
    if (this.suppressTimeout) {
      this.homey.clearTimeout(this.suppressTimeout);
    }
    this.isSuppressed = true;
    this.suppressTimeout = this.homey.setTimeout(() => {
      this.isSuppressed = false;
    }, args.duration * 1000);
  }

  onOccupancyAttributeReport(occupancyStatus) {
    markHueSensorAvailable(this);
    const parsedOccupancyStatus = Object.values(occupancyStatus);
    this.log("Occupancy status:", parsedOccupancyStatus[2]);
    if (parsedOccupancyStatus[2] == true) {
      if (this.isSuppressed) {
        return;
      }
      this.setCapabilityValue('alarm_motion', true)
      .catch(err => this.error('Error: could not set alarm_motion capability value', err));
    } else {
      this.setCapabilityValue('alarm_motion', false)
      .catch(err => this.error('Error: could not set alarm_motion capability value', err));
    }
  }

  onTemperatureMeasuredAttributeReport(measuredTempValue) {
    markHueSensorAvailable(this);
		const temperatureOffset = this.getSetting('temperature_offset') || 0;
		const parsedTempValue = this.getSetting('temperature_decimals') === '2' ? Math.round((measuredTempValue / 100) * 100) / 100 : Math.round((measuredTempValue / 100) * 10) / 10;
		this.log('Temperature:', parsedTempValue, '+ temperature offset', temperatureOffset);
		this.setCapabilityValue('measure_temperature', parsedTempValue + temperatureOffset).catch(this.error);
	}

	onLuminanceMeasuredAttributeReport(measuredLuxValue) {
    markHueSensorAvailable(this);
		const parsedLumValue = Math.round(Math.pow(10, (measuredLuxValue - 1) / 10000));
		this.log('measure_luminance:', parsedLumValue);
		this.setCapabilityValue('measure_luminance', parsedLumValue).catch(this.error);
  }

	onBatteryPercentageRemainingAttributeReport(batteryPercentageRemaining) {
    markHueSensorAvailable(this);
    applyHueSensorBattery(this, batteryPercentageRemaining)
      .catch(error => this.error('Could not apply Hue motion sensor battery report', error));
  }

  async _migrateMissingSettings() {
    try {
      return await migrateMissingOccupancySettings(this);
    } catch (error) {
      this.error('Could not initialize missing occupancy sensor settings', error);
      return {};
    }
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

    // motion sensitivity setting changed
    if (changedKeys.includes('motion_sensitivity')) {
      const sensitivity = Number.parseInt(newSettings.motion_sensitivity, 10);
      const productId = this.getSetting('zb_product_id');
      const maxSensitivity = getMotionSensitivityMax(productId);
      if (!Number.isInteger(sensitivity) || sensitivity < 0 || sensitivity > maxSensitivity) {
        throw new Error(`Motion sensitivity ${newSettings.motion_sensitivity} is not supported by ${productId || 'this sensor'}; supported range is 0-${maxSensitivity}.`);
      }
      await this.setStoreValue('sensitivity', sensitivity);
    }

    if (changedKeys.includes('ledIndicator')) {
      try {
        const ledindication = newSettings.ledIndicator === true || newSettings.ledIndicator === 'true';
        await this.setStoreValue('ledIndicator', ledindication);
      } catch (error) {
        this.log("Error setting LED indicator status");
      }
    }

    if (changedKeys.includes('occupancy_timeout')) {
      const occupancyTimeout = Number.parseInt(newSettings.occupancy_timeout, 10);
      if (!Number.isInteger(occupancyTimeout) || occupancyTimeout < 0 || occupancyTimeout > 65535) {
        throw new Error('Occupancy timeout must be an integer between 0 and 65535 seconds.');
      }
      await this.setStoreValue('occupancy_timeout', occupancyTimeout);
    }

	}

  async onEndDeviceAnnounce() {

    await this.setAvailable() // Mark the device as available upon re-announcement
    .then(() => this.log('Device is now available'))
    .catch(err => this.error('Error setting device available', err));

    await refreshHueSensorBattery(this);
    
    const ledIndicator = this.getStoreValue('ledIndicator');
    if (ledIndicator !== null && ledIndicator !== undefined) {
      try {
        await this.zclNode.endpoints[2].clusters[HueSpecificBasicCluster.NAME]
          .writeAttributes({ ledIndication: ledIndicator === true || ledIndicator === 1 });
        this.log("Setting LED indicator status to: ", ledIndicator);
      } catch (error) {
        this.log("This device does not support LED indicator setting");
      }
    }

    const sensitivity = this.getStoreValue('sensitivity');
    if (sensitivity !== null && sensitivity !== undefined) {
      try {
        await this.zclNode.endpoints[2].clusters[CLUSTER.OCCUPANCY_SENSING.NAME]
          .writeAttributes({ sensitivity });
        this.log("Setting sensitivity to: ", sensitivity);
      } catch (error) {
        this.log("This device does not support sensitivity setting");
      }
    }

    const occupancyTimeout = this.getStoreValue('occupancy_timeout');
    if (occupancyTimeout !== null && occupancyTimeout !== undefined) {
      try {
        await this.zclNode.endpoints[2].clusters[CLUSTER.OCCUPANCY_SENSING.NAME]
          .writeAttributes({ pirOccupiedToUnoccupiedDelay: occupancyTimeout });
        this.log("Setting occupancy timeout to: ", occupancyTimeout);
      } catch (error) {
        this.log("This device does not support occupancy timeout setting");
      }
    }

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
