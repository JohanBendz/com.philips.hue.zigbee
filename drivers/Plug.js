"use strict";

const { ZigBeeDevice } = require('homey-zigbeedriver');

const { CLUSTER } = require('zigbee-clusters');

class Plug extends ZigBeeDevice {

    async onNodeInit() {
        if (this.hasCapability('onoff')) this.registerCapability('onoff', CLUSTER.ON_OFF, {
			getOpts: {
				pollInterval: 15000,
				getOnOnline: true,
			},
		});
    }
}

module.exports = Plug;
