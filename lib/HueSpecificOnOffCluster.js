const { OnOffCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificOnOffCluster extends OnOffCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      powerOnCtrl: {
          id: 16387,
          type: ZCLDataTypes.enum8({
            off: 0, // OFF (0) - off after power loss
            on: 1, // ON (1) - on after power loss with configured level (bri), color temp, color (default)
            recover: 255, // RECOVER (255) - on after power loss with last state
          })
      },
    };
  }

}

module.exports = HueSpecificOnOffCluster;