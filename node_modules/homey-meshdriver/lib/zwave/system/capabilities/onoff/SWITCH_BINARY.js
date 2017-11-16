'use strict';

const util = require('./../../../../util');

const FACTORY_DEFAULT_DIMMING_DURATION = 'Default';

module.exports = {
	get: 'SWITCH_BINARY_GET',
	set: 'SWITCH_BINARY_SET',
	setParserV1: value => ({
		'Switch Value': (value) ? 'on/enable' : 'off/disable',
	}),
	setParserV2(value, options) {
		const duration = (options.hasOwnProperty('duration') ? util.calculateZwaveDimDuration(options.duration) : FACTORY_DEFAULT_DIMMING_DURATION);
		return {
			'Switch Value': (value) ? 'on/enable' : 'off/disable',
			'Dimming Duration': duration,
		};
	},
	report: 'SWITCH_BINARY_REPORT',
	reportParser: report => {
		if (report && report.hasOwnProperty('Value')) {
			if (report.Value === 'on/enable') return true;
			else if (report.Value === 'off/disable') return false;
		}
		return null;
	},
};
