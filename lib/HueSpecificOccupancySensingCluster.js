const { OccupancySensingCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificOccupancySensingCluster extends OccupancySensingCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      sensitivity: { id: 48, type: ZCLDataTypes.uint8 }, // 0x0030 - 1 = Low, 2 = High
      sensitivityMax: { id: 49, type: ZCLDataTypes.uint8 }, // 0x0031
      // occupancyTimeout: { id: ??, type ZCLDataTypes.uint8}, // 0 - 65535 sec - occupancy_timeout ?
    };
  }

}

module.exports = HueSpecificOccupancySensingCluster;