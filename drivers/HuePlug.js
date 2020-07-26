"use strict";

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');

class HuePlug extends ZigBeeDevice {
    async onNodeInit({ zclNode }) {
        if (this.hasCapability('onoff')) this.registerCapability('onoff', CLUSTER.ON_OFF);
    }
}

module.exports = HuePlug;
