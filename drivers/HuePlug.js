"use strict";

const ZigBeeDevice = require("homey-meshdriver").ZigBeeDevice;

class HuePlug extends ZigBeeDevice {

    onMeshInit() {
        if (this.hasCapability('onoff')) this.registerCapability('onoff', 'genOnOff');
    }
}

module.exports = HuePlug;
