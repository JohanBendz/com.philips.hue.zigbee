const { OccupancySensingCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificOccupancySensingCluster extends OccupancySensingCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      sensitivity: { id: 48, type: ZCLDataTypes.uint8 }, // 0x0030 - 1 = Low, 2 = High (0..sensitivityMax)
      sensitivityMax: { id: 49, type: ZCLDataTypes.uint8 }, // 0x0031 - (2  for motion sensor, 3 for outdoor sensor)
      ledIndication: { id: 50, type: ZCLDataTypes.bool },
    };
  }

}

module.exports = HueSpecificOccupancySensingCluster;