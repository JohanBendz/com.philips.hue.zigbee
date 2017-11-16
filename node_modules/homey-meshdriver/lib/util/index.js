'use strict';

const color = require('./color');

/**
 * Map a range of values to a different range of values.
 * @param inputStart
 * @param inputEnd
 * @param outputStart
 * @param outputEnd
 * @param input
 * @returns {number}
 * @memberof Util
 */
function mapValueRange(inputStart, inputEnd, outputStart, outputEnd, input) {
	if (typeof inputStart !== 'number' || typeof inputEnd !== 'number' ||
		typeof outputStart !== 'number' || typeof outputEnd !== 'number' ||
		typeof input !== 'number') {
		return null;
	}
	return outputStart + ((outputEnd - outputStart) / (inputEnd - inputStart)) * (input - inputStart);
}

/**
 * Calculate a duration value for SWITCH_MULTILEVEL and SWITCH_BINARY from an input value in milliseconds. Below 127
 * the value is in seconds, above the value is in minutes. Hence, above 127 some rounding might occur. If a value larger
 * than 254 is entered it will be maxed at 254 (longest duration possible).
 * @param {number} duration - Dim duration in milliseconds
 * @returns {number} Range 0 - 254 (short to long)
 */
function calculateZwaveDimDuration(duration) {
	const seconds = duration / 1000;
	if (seconds <= 127) return seconds;
	else if (seconds > 127 && seconds <= 254) {
		return Math.round(128 + (seconds / 60));
	}
	return 254;
}


/**
 * Utility class with several color and range conversion methods.
 * @class Util
 */
module.exports = {
	convertRGBToCIE: color.convertRGBToCIE,
	convertHSVToCIE: color.convertHSVToCIE,
	convertHSVToRGB: color.convertHSVToRGB,
	convertRGBToHSV: color.convertRGBToHSV,
	mapValueRange,
	calculateZwaveDimDuration,
};
