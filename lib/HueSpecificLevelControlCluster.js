const { LevelControlCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificLevelControlCluster extends LevelControlCluster {

  static get ATTRIBUTES() {
    return {
        powerOnCtrl: {
            id: 16384,
            type: ZCLDataTypes.uint8,
            manufacturerId: 0x100B,
        },
    ...super.ATTRIBUTES,
    };
  }

}

module.exports = HueSpecificLevelControlCluster;