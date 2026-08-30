'use strict';

const { ZigBeeDriver } = require("homey-zigbeedriver");

class HueWallSwitchModuleDriver extends ZigBeeDriver {

    async onInit() {
        this.log('ROM002 driver has been initialized');
      }

}

module.exports = HueWallSwitchModuleDriver;
