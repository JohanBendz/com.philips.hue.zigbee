'use strict';

const Homey = require('homey');
const ZwaveDevice = require('./ZwaveDevice');

/**
 * The ZwaveMeteringDevice class has built-in functionality for the METER_RESET FlowCardAction.
 * @extends ZwaveDevice
 * @example
 *
 * // device.js
 * const ZwaveMeteringDevice = require('homey-meshdriver').ZwaveMeteringDevice;
 *
 * class myDevice extends ZwaveMeteringDevice {
 *
 *  async onMeshInit() {
 *      await super.onMeshInit();
 *      this.registerCapability('measure_power', 'METER');
 *      this.registerCapability('meter_power', 'METER');
 *  }
 * }
 *
 * // app.json (or see zwave/system/flows.json)
 * flow: {
 *      actions: [
 *          {
 *              "id": "resetMeter",
 *              "title": {
 *                  "en": "Reset meter values",
 *                  "nl": "Meter waarden opnieuw instellen"
 *              },
 *              "hint": {
 *                  "en": "Reset the accumulated power usage value (kWh), note that this can not be reversed.",
 *                  "nl": "Stel geaccumuleerde stroomverbruik waarde (kWh) opnieuw in, dit kan niet worden teruggedraaid."
 *              },
 *              "args": [
 *                  {
 *                      "name": "device",
 *                      "type": "device",
 *                      "filter": "<driver_id>"
 *                  }
 *              ]
 *          }
 *      ]
 * }
 */
class ZwaveMeteringDevice extends ZwaveDevice {
	async onMeshInit() {

		// If node has CC METER and METER_RESET functionality
		const commandClassMeter = this.getCommandClass('METER');
		if (!(commandClassMeter instanceof Error) && commandClassMeter.METER_RESET === 'function') {

			// Register FlowCardAction
			const resetMeterFlowAction = new Homey.FlowCardAction('resetMeter');
			resetMeterFlowAction.register();

			// Check if flow card is registered in app manifest
			if (!(resetMeterFlowAction instanceof Error)) {
				resetMeterFlowAction.registerRunListener(() => {
					commandClassMeter.METER_RESET({}, (err, result) => {
						if (err || result !== 'TRANSMIT_COMPLETE_OK') return Promise.reject(err || result);
						return Promise.resolve();
					});
				});
			} else this.error('missing_resetMeter_flow_card_in_manifest');
		}
	}
}

module.exports = ZwaveMeteringDevice;
