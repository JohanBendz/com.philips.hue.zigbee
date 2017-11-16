'use strict';

const Homey = require('homey');

class PhilipsHueApp extends Homey.App {
	
	onInit() {
		
		this.log('Philips Hue app initiating...');
		
	}
	
}

module.exports = PhilipsHueApp;