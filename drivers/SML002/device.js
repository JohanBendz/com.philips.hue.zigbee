'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class OutdoorSensor extends ZigBeeDevice {
	onMeshInit()
	{
		// this.printNode();
		
				if (this.hasCapability('alarm_motion')) this.registerCapability('alarm_motion', 'msOccupancySensing');
				if (this.hasCapability('alarm_battery')) this.registerCapability('alarm_battery', 'genPowerCfg');
				if (this.hasCapability('measure_temperature')) this.registerCapability('measure_temperature', 'msTemperatureMeasurement');
				if (this.hasCapability('measure_luminance')) this.registerCapability('measure_luminance', 'msIlluminanceMeasurement');
				if (this.hasCapability('measure_battery')) this.registerCapability('measure_battery', 'genPowerCfg');
		
				// alarm_motion
				this.minReportMotion = this.getSetting('minReportMotion') || 1;
				this.maxReportMotion = this.getSetting('maxReportMotion') || 300;
		
				this.registerAttrReportListener('msOccupancySensing', 'occupancy', this.minReportMotion, this.maxReportMotion, null, data => {
					this.log('occupancy', data);
					this.setCapabilityValue('alarm_motion', data === 1);
				}, 1).catch(err => this.error('Error registering report listener for Occupancy: ', err));
		
				// alarm_battery
				this.batteryThreshold = this.getSetting('batteryThreshold') * 10;
		
				this.registerAttrReportListener('genPowerCfg', 'batteryVoltage', 1, 3600, 1, data1 => {
					this.log('batteryVoltage', data1);
					this.log(this.batteryThreshold);
					if (data1 <= this.batteryThreshold * 10) {
						this.setCapabilityValue('alarm_battery', true);
					} else {
						this.setCapabilityValue('alarm_battery', false);
					}
				}, 1).catch(err => this.error('Error registering report listener for Battery Voltage: ', err));
		
				// measure_temperature
				this.minReportTemp = this.getSetting('minReportTemp') || 1800;
				this.maxReportTemp= this.getSetting('maxReportTemp') || 3600;
		
				this.registerAttrReportListener('msTemperatureMeasurement', 'measuredValue', this.minReportTemp, this.maxReportTemp, null, data2 => {
					const temperatureOffset = this.getSetting('temperature_offset') || 0;
					this.log('measuredValue temperature', data2, '+ temperature offset', temperatureOffset);
					const temperature = Math.round((data2 / 100) * 10) / 10;
					this.setCapabilityValue('measure_temperature', temperature + temperatureOffset);
				}, 1).catch(err => this.error('Error registering report listener for Temperature: ', err));
		
				// measure_luminance
				this.minReportLux = this.getSetting('minReportLux') || 300;
				this.maxReportLux= this.getSetting('maxReportLux') || 900;
		
				this.registerAttrReportListener('msIlluminanceMeasurement', 'measuredValue', this.minReportLux, this.maxReportLux, null, data3 => {
					this.log('measuredValue luminance', data3);
					const luminance = Math.round(Math.pow(10, (data3 - 1) / 10000));
					this.setCapabilityValue('measure_luminance', luminance);
				}, 1).catch(err => this.error('Error registering report listener for Illuminance: ', err));
		
				// measure_battery
				this.registerAttrReportListener('genPowerCfg', 'batteryPercentageRemaining', 1, 43200, 1, data4 => {
					this.log('measuredValue battery', data4);
					if (data4 <= 200 && data4 !== 255) {
						const percentageRemaining = Math.round(data4 / 2);
						this.setCapabilityValue('measure_battery', percentageRemaining);
					}
				}, 1).catch(err => this.error('Error registering report listener for Battery Percentage: ', err));
	}

	onSettings( oldSettingsObj, newSettingsObj, changedKeysArr, callback ) {
		
				this.log(changedKeysArr);
				this.log('newSettingsObj', newSettingsObj);
				this.log('oldSettingsObj', oldSettingsObj);
		
		if ((newSettingsObj.minReportMotion < newSettingsObj.maxReportMotion) &&
				(newSettingsObj.minReportTemp < newSettingsObj.maxReportTemp) &&
				(newSettingsObj.minReportLux < newSettingsObj.maxReportLux)) {
					this.log('minReport settings smaller then maxReport settings');
					callback( null, true );
		
					// alarm_motion report settings changed
					if ((changedKeysArr.includes('minReportMotion')) || (changedKeysArr.includes('maxReportMotion'))) {
							this.log('minReportMotion: ', newSettingsObj.minReportMotion);
							this.log('maxReportMotion: ', newSettingsObj.maxReportMotion);
							if (newSettingsObj.minReportMotion < newSettingsObj.maxReportMotion) {
								this.registerAttrReportListener('msOccupancySensing', 'occupancy', newSettingsObj.minReportMotion, newSettingsObj.maxReportMotion, null, data => {
									this.log('occupancy', data);
									this.setCapabilityValue('alarm_motion', data === 1);
								}, 1).catch(err => this.error('Error registering report listener for Occupancy: ', err));
							}
					}
		
					// measure_temperature report settings changed
					if ((changedKeysArr.includes('minReportTemp')) || (changedKeysArr.includes('maxReportTemp'))) {
						this.log('minReportTemp: ', newSettingsObj.minReportTemp);
						this.log('maxReportTemp: ', newSettingsObj.maxReportTemp);
						if (newSettingsObj.minReportTemp < newSettingsObj.maxReportTemp) {
							this.registerAttrReportListener('msTemperatureMeasurement', 'measuredValue', newSettingsObj.minReportTemp, newSettingsObj.maxReportTemp, null, data2 => {
								const temperatureOffset = this.getSetting('temperature_offset') || 0;
								this.log('measuredValue', data2, '+ temperature offset', temperatureOffset);
								const temperature = Math.round((data2 / 100) * 10) / 10;
								this.setCapabilityValue('measure_temperature', temperature + temperatureOffset);
							}, 1).catch(err => this.error('Error registering report listener for Temperature: ', err));
						}
					}
		
					// measure_luminance report settings changed
					if ((changedKeysArr.includes('minReportLux')) || (changedKeysArr.includes('manReportLux'))) {
						this.log('minReportLux: ', newSettingsObj.minReportLux);
						this.log('maxReportLux: ', newSettingsObj.maxReportLux);
						if (newSettingsObj.minReportLux < newSettingsObj.maxReportLux) {
							this.registerAttrReportListener('msIlluminanceMeasurement', 'measuredValue', newSettingsObj.minReportLux, newSettingsObj.maxReportLux, null, data3 => {
								this.log('measuredValue', data3);
								const luminance = Math.round(Math.pow(10, (data3 - 1) / 10000));
								this.setCapabilityValue('measure_luminance', luminance);
							}, 1).catch(err => this.error('Error registering report listener for Illuminance: ', err));
						}
					}
				}	else {
					callback( Homey.__("report interval settings error"), null );
				}
			}
}

module.exports = OutdoorSensor;