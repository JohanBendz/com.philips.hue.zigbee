const { BasicCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificBasicCluster extends BasicCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      ledIndication: { id: 51, type: ZCLDataTypes.bool },
    };
  }

}

module.exports = HueSpecificBasicCluster;