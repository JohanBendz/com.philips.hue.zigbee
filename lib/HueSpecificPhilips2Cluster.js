'use strict';

const { Cluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificPhilips2Cluster extends Cluster {
  static get ID() { return 0xfc03; }
  static get NAME() { return 'huePhilips2'; }

  static get ATTRIBUTES() {
    return {
      state: {
        id: 0x0002,
        type: ZCLDataTypes.buffer8,
        manufacturerId: 0x100b,
      },
    };
  }

  static get COMMANDS() {
    return {
      multiColor: {
        id: 0x00,
        manufacturerId: 0x100b,
        args: {
          data: ZCLDataTypes.buffer,
        },
      },
    };
  }
}

module.exports = HueSpecificPhilips2Cluster;
