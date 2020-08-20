'use strict';

const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');

class OutDoorSensor extends ZigBeeDevice {

	async onNodeInit({ zclNode }) {

		if (this.isFirstInit()){

			// alarm_motion
			if (this.hasCapability('alarm_motion')) {
				this.registerCapability('alarm_motion', CLUSTER.OCCUPANCY_SENSING);

				zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
					onWithTimedOff: this._onWithTimedOffCommandHandler.bind(this),
				}));
			}

			// measure_temperature
			if (this.hasCapability('measure_temperature')) {
				const minReportTemp = this.getSetting('minReportTemp') || 60;
				const maxReportTemp = this.getSetting('maxReportTemp') || 300;

				await this.configureAttributeReporting([
					{
					endpointId: 2,
					cluster: CLUSTER.TEMPERATURE_MEASUREMENT,
					attributeName: 'measuredValue',
					minInterval: minReportTemp,
					maxInterval: maxReportTemp,
					minChange: 1,
					}
				]);

				zclNode.endpoints[2].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME]
				.on('attr.measuredValue', (currentTempValue) => {
					const temperatureOffset = this.getSetting('temperature_offset') || 0;
					const temperature = Math.round((currentTempValue / 100) * 10) / 10;
					this.log('Temperature: ', temperature, ', Offset: ', temperatureOffset);
					this.setCapabilityValue('measure_temperature', temperature + temperatureOffset);
				});

			}

			// measure_luminance
			if (this.hasCapability('measure_luminance')) {
				const minReportLux = this.getSetting('minReportLux') || 60;
				const maxReportLux = this.getSetting('maxReportLux') || 300;

				await this.configureAttributeReporting([
					{
					endpointId: 2,
					cluster: CLUSTER.ILLUMINANCE_MEASUREMENT,
					attributeName: 'measuredValue',
					minInterval: minReportLux,
					maxInterval: maxReportLux,
					minChange: 1,
					},
				]);

				zclNode.endpoints[2].clusters[CLUSTER.ILLUMINANCE_MEASUREMENT.NAME]
				.on('attr.measuredValue', (currentLuxValue) => {
					const luminance = Math.round(Math.pow(10, (currentLuxValue - 1) / 10000));
					this.log('lux: ', luminance);
					this.setCapabilityValue('measure_luminance', luminance);
				});

			}

			// measure_battery
			if (this.hasCapability('measure_battery')) {				
				this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
					getOpts: {
					getOnStart: true,
					},
					reportOpts: {
						configureAttributeReporting: {
							minInterval: 300,
							maxInterval: 60000,
							minChange: 1,
						},
					},
				});

			}

			// alarm_battery
			if (this.hasCapability('alarm_battery')) {				
				this.batteryThreshold = this.getSetting('batteryThreshold') * 10;
					this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
						getOpts: {
						getOnStart: true,
						},
						reportOpts: {
							configureAttributeReporting: {
								minInterval: 300,
								maxInterval: 60000,
								minChange: 1,
							},
						},
				});

			}

		}
		else {
			// alarm_motion
			if (this.hasCapability('alarm_motion')) {
				this.registerCapability('alarm_motion', CLUSTER.OCCUPANCY_SENSING);

				zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
					onWithTimedOff: this._onWithTimedOffCommandHandler.bind(this),
				}));
			}

			// measure_temperature
			if (this.hasCapability('measure_temperature')) {

				zclNode.endpoints[2].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME]
				.on('attr.measuredValue', (currentTempValue) => {
					const temperatureOffset = this.getSetting('temperature_offset') || 0;
					const temperature = Math.round((currentTempValue / 100) * 10) / 10;
					this.log('temp: ', temperature);
					this.setCapabilityValue('measure_temperature', temperature + temperatureOffset);
				});

			}

			// measure_luminance
			if (this.hasCapability('measure_luminance')) {

				zclNode.endpoints[2].clusters[CLUSTER.ILLUMINANCE_MEASUREMENT.NAME]
				.on('attr.measuredValue', (currentLuxValue) => {
					const luminance = Math.round(Math.pow(10, (currentLuxValue - 1) / 10000));
					this.log('lux: ', luminance);
					this.setCapabilityValue('measure_luminance', luminance);
				});

			}

		}
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
		}, onTime);
	}


	async onSettings({ oldSettings, newSettings, changedKeys }) {
 		
		this.log('changed keys: ', changedKeys);
		this.log('newSettings: ', newSettings);
		this.log('oldSettings: ', oldSettings);
		
		if ((newSettings.minReportTemp < newSettings.maxReportTemp) &&
			(newSettings.minReportLux < newSettings.maxReportLux)) {
				this.log('minReport settings smaller then maxReport settings');

				// measure_temperature report settings changed
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

					}
				}

				// measure_luminance report settings changed
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
							},
						]);

					}
				}

		}

	}

}

module.exports = OutDoorSensor;