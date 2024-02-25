'use strict';

const Cluster = require('../node_modules/zigbee-clusters/lib/Cluster');
const { ZCLDataTypes } = require('../node_modules/zigbee-clusters/lib/zclTypes');

const ATTRIBUTES = {

};

const COMMANDS = {
  
  button: {
    id: 0,
    args: {
      button: ZCLDataTypes.uint16,
      type: ZCLDataTypes.enum8({
        push: 0, //0x00
        rotary: 1, //0x01
      }),
      action: ZCLDataTypes.enum8({
        press: 0, //0x00
        hold: 1, //0x01
        release: 2, //0x02
        longRelease: 3, //0x03
      }),
      duration: ZCLDataTypes.uint16,
    }
  },
  dynamicScenes: {
    id: 1,
    args: {
      scene: ZCLDataTypes.uint32({
        stop: 0x200000, // Hex-value - Stop Scene
        candle: 0x21000101, // Hex-value - Candle Scene
        fireplace: 0x21000102, // Hex-value - Fireplace Scene
        colorloop: 0x21000103 // Hex-value - Colorloop Scene
      }),
    }
  }

};

class HueSpecificCluster extends Cluster {

    static get ID() {
        return 64512;
    }

    static get NAME() {
        return 'hue';
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES;
    }

    static get COMMANDS() {
        return COMMANDS;
    }

}

Cluster.addCluster(HueSpecificCluster);

module.exports = HueSpecificCluster;
