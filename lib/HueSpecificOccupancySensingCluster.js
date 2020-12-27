const { OccupancySensingCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificOccupancySensingCluster extends OccupancySensingCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      sensitivity: { id: 48, type: ZCLDataTypes.uint8 },
    };
  }

}

module.exports = HueSpecificOccupancySensingCluster;