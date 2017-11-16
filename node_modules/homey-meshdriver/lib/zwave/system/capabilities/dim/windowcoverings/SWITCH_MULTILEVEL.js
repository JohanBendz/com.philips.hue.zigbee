'use strict';

const util = require('./../../../../util');

const FACTORY_DEFAULT_DIMMING_DURATION = 'Factory Default';

module.exports = {
	get: 'SWITCH_MULTILEVEL_GET',
	set: 'SWITCH_MULTILEVEL_SET',
	setParserV1(value) {
		const invertDirection = !!this.getSetting('invertWindowCoveringsDirection');

		if (value >= 1) {
			if (invertDirection) value = 0;
			else value = 0.99;
		}
		return {
			Value: invertDirection ? Math.round((1 - value) * 100) : Math.round(value * 100),
		};
	},
	setParserV2(value, options) {
		const duration = (options.hasOwnProperty('duration') ? util.calculateZwaveDimDuration(options.duration) : FACTORY_DEFAULT_DIMMING_DURATION);

		const invertDirection = !!this.getSetting('invertWindowCoveringsDirection');

		if (value >= 1) {
			if (invertDirection) value = 0;
			else value = 0.99;
		}

		return {
			Value: invertDirection ? Math.round((1 - value) * 100) : Math.round(value * 100),
			'Dimming Duration': duration,
		};
	},
	report: 'SWITCH_MULTILEVEL_REPORT',
	reportParserV1(report) {
		const invertDirection = !!this.getSetting('invertWindowCoveringsDirection');

		if (report && report.hasOwnProperty('Value (Raw)')) {
			if (report['Value (Raw)'][0] === 255) return invertDirection ? 0 : 1;
			return invertDirection ? (100 - report['Value (Raw)'][0]) / 99 : report['Value (Raw)'][0] / 99;
		}
		return null;
	},
	reportParserV4(report) {
		const invertDirection = !!this.getSetting('invertWindowCoveringsDirection');

		if (report && report.hasOwnProperty('Current Value (Raw)')) {
			if (report['Current Value (Raw)'][0] === 255) return invertDirection ? 0 : 1;
			return invertDirection ? (100 - report['Current Value (Raw)'][0]) / 99 : report['Current Value (Raw)'][0] / 99;
		}
		return null;
	},
};
