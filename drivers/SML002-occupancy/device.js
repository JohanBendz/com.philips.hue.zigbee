'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');
const HueSpecificOccupancySensingCluster = require('../../lib/HueSpecificOccupancySensingCluster');
const HueSpecificBasicCluster = require('../../lib/HueSpecificBasicCluster');

Cluster.addCluster(HueSpecificOccupancySensingCluster);
Cluster.addCluster(HueSpecificBasicCluster);

class OutDoorOccupancySensor extends ZigBeeDevice {

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
        maxInterval: 60000,
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

    const batteryStatus = await this.zclNode.endpoints[2].clusters.powerConfiguration.readAttributes(['batteryPercentageRemaining']);
    const batteryThreshold = this.getSetting('batteryThreshold') || 20;
    this.log("measure_battery | powerConfiguration - batteryPercentageRemaining (%): ", batteryStatus.batteryPercentageRemaining/2);
    this.setCapabilityValue('measure_battery', batteryStatus.batteryPercentageRemaining/2).catch(this.error);
    this.setCapabilityValue('alarm_battery', (batteryStatus.batteryPercentageRemaining/2 < batteryThreshold) ? true : false).catch(this.error);

  }

  async onUninit() {
    this.log("Cleaning up OutDoorOccupancySensor resources...");

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

        // motion sensitivity setting changed
		if (changedKeys.includes('motion_sensitivity')) {
      try {
        const sensitivity = parseInt(newSettings.motion_sensitivity);
        this.setStoreValue('sensitivity', sensitivity);
      } catch (error) {
        this.log("Error setting sensitivity");
      }
		}

    if (changedKeys.includes('ledIndicator')) {
      try {
        const ledindication = newSettings.ledIndicator === true ? 1 : 0;
        this.setStoreValue('ledIndicator', ledindication);
      } catch (error) {
        this.log("Error setting LED indicator status");
      }
    }

	}

    async onEndDeviceAnnounce() {

    await this.setAvailable() // Mark the device as available upon re-announcement
    .then(() => this.log('Device is now available'))
    .catch(err => this.error('Error setting device available', err));

    try {
      const batteryStatus = await this.zclNode.endpoints[2].clusters.powerConfiguration.readAttributes(['batteryPercentageRemaining']);
      const batteryThreshold = this.getSetting('batteryThreshold') || 20;
      this.log("measure_battery | powerConfiguration - batteryPercentageRemaining (%): ", batteryStatus.batteryPercentageRemaining/2);
      this.setCapabilityValue('measure_battery', batteryStatus.batteryPercentageRemaining/2);
      this.setCapabilityValue('alarm_battery', (batteryStatus.batteryPercentageRemaining/2 < batteryThreshold) ? true : false)
    } catch (error) {
      this.log("Error initializing PowerConfigurationCluster: ", error);
    }
    
    const ledIndicator = this.getStoreValue('ledIndicator');
    if (ledIndicator !== null) {
      try {
        const ledoccupancystatus = await this.zclNode.endpoints[2].clusters.occupancySensingCluster.readAttributes(['ledIndication']);
        const ledbasicstatus = await this.zclNode.endpoints[2].clusters.basic.readAttributes(['ledIndication']);
        await this.zclNode.endpoints[2].clusters.occupancySensingCluster.writeAttributes({ledIndication: ledIndicator});
        await this.zclNode.endpoints[2].clusters.basic.writeAttributes({ledIndication: ledIndicator});
        this.log("Setting LED indicator status to: ", ledIndicator);
      } catch (error) {
        this.log("This device does not support LED indicator setting");
      }
    }
    
    const sensitivity = this.getStoreValue('sensitivity');
    if (sensitivity !== null) {
      try {
        await this.zclNode.endpoints[2].clusters.occupancySensingCluster.writeAttributes({sensitivity: sensitivity});
        this.log("Setting sensitivity to: ", sensitivity);
      } catch (error) {
        this.log("This device does not support sensitivity setting");
      }
    }

  }
	
}

module.exports = OutDoorOccupancySensor;
