const { ColorControlCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificColorControlCluster extends ColorControlCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      powerOnCtrl: {
          id: 16400,
          type: ZCLDataTypes.uint16
      }, // default = 366
    };
  }

}

module.exports = HueSpecificColorControlCluster;