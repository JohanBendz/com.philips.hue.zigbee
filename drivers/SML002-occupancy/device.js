'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');
// const HueSpecificOccupancySensingCluster = require('../../lib/HueSpecificOccupancySensingCluster');

// Cluster.addCluster(HueSpecificOccupancySensingCluster);

class OutDoorOccupancySensor extends ZigBeeDevice {
	
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

	}
	
}

module.exports = OutDoorOccupancySensor;

