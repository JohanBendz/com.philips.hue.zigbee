const { OccupancySensingCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificOccupancySensingCluster extends OccupancySensingCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      sensitivity: { id: 48, type: ZCLDataTypes.uint8 }, // 0x0030 - 0 = Low, 1 = Medium, 2 = High
      sensitivityMax: { id: 49, type: ZCLDataTypes.uint8 }, // 0x0031 - 0 = Low, 1 = Medium, 2 = High
    };
  }

}

module.exports = HueSpecificOccupancySensingCluster;