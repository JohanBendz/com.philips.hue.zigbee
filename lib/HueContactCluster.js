'use strict';

const { Cluster, ZCLDataTypes } = require('zigbee-clusters');

// SOC001 reports contact on manufacturer cluster 0xfc06, not an On/Off attribute.
// Protocol reference: zigbee-herdsman-converters/src/lib/philips.ts.
class HueContactCluster extends Cluster {
  static get ID() { return 0xfc06; }
  static get NAME() { return 'hueContact'; }
  static get ATTRIBUTES() {
    return {
      contact: {
        id: 0x0100,
        type: ZCLDataTypes.enum8({ closed: 0, open: 1 }),
        manufacturerId: 0x100b,
      },
    };
  }
  static get COMMANDS() { return {}; }
}

module.exports = HueContactCluster;
