const { LevelControlCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificLevelControlCluster extends LevelControlCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      powerOnCtrl: {
          id: 16384,
          type: ZCLDataTypes.uint8
      }, // default = 255 values = 0-255
    };
  }

}

module.exports = HueSpecificLevelControlCluster;