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
  }

/*   buttonEvent: {
    id: 0,
    args: {
      activeButton: ZCLDataTypes.uint8,
      activeAction: ZCLDataTypes.uint8,
    }
  } */

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
