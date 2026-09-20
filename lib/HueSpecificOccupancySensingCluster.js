const { OccupancySensingCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificOccupancySensingCluster extends OccupancySensingCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      sensitivity: { id: 48, type: ZCLDataTypes.uint8, manufacturerId: 0x100b },
      sensitivityMax: { id: 49, type: ZCLDataTypes.uint8, manufacturerId: 0x100b },
    };
  }

}

module.exports = HueSpecificOccupancySensingCluster;
