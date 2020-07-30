'use strict';

const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');

class MotionSensor extends ZigBeeDevice {
	async onNodeInit({ zclNode }) {

		this.enableDebug();
		this.printNode();

		if (this.hasCapability('alarm_battery')) {
			// alarm_battery
			this.batteryThreshold = this.getSetting('batteryThreshold') * 10;
			
			this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
				getOpts: {
				  getOnStart: true,
				},
				reportOpts: {
				  configureAttributeReporting: {
					minInterval: 0, // No minimum reporting interval
					maxInterval: 60000, // Maximally every ~16 hours
					minChange: 5, // Report when value changed by 5
				  },
				},
			});
		}

		if (this.hasCapability('measure_battery')) {
			this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
			  getOpts: {
				getOnStart: true,
			  },
			  reportOpts: {
				configureAttributeReporting: {
				  minInterval: 0, // No minimum reporting interval
				  maxInterval: 60000, // Maximally every ~16 hours
				  minChange: 5, // Report when value changed by 5
				},
			  },
			});
		}

		// alarm_motion
		this.minReportMotion = this.getSetting('minReportMotion') || 1;
		this.maxReportMotion = this.getSetting('maxReportMotion') || 300;

		if (this.hasCapability('alarm_motion')) {
			this.registerCapability('alarm_motion', CLUSTER.OCCUPANCY_SENSING);
	    }
		
		// measure_temperature
		this.minReportTemp = this.getSetting('minReportTemp') || 300;
		this.maxReportTemp= this.getSetting('maxReportTemp') || 3600;		
		if (this.hasCapability('measure_temperature')) this.registerCapability('measure_temperature', CLUSTER.TEMPERATURE_MEASUREMENT);

		// measure_luminance
		this.minReportLux = this.getSetting('minReportLux') || 300;
		this.maxReportLux= this.getSetting('maxReportLux') || 900;
		if (this.hasCapability('measure_luminance')) this.registerCapability('measure_luminance', CLUSTER.ILLUMINANCE_MEASUREMENT);

		// Bind on/off button commands
		zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
			onWithTimedOff: this._onWithTimedOffCommandHandler.bind(this),
		}));
	}

	/**
	 * Handles `onWithTimedOff` commands, these indicate motion detected.
	 * @param {0|1} onOffControl - 1 if set to night mode, 0 if set to day mode
	 * @param {number} onTime - Time in 1/10th seconds for which the alarm should be active
	 * @param {number} offWaitTime - Time in 1/10th seconds for which the alarm should be off
	 */
	_onWithTimedOffCommandHandler({ onOffControl, onTime, offWaitTime }) {
		this.setCapabilityValue('alarm_motion', true)
		.catch(err => this.error('Error: could not set alarm_motion capability value', err));
		clearTimeout(this._motionAlarmTimeout);
		this._motionAlarmTimeout = setTimeout(() => {
		this.setCapabilityValue('alarm_motion', false)
			.catch(err => this.error('Error: could not set alarm_motion capability value', err));
		}, onTime );
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

module.exports = MotionSensor;