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

  static get COMMANDS() {
    return {
      ...super.COMMANDS,
      colorLoop: {
        id: 68, // 0x44
        args: {
          updateFlags: ZCLDataTypes.map8('action', 'direction', 'transitionTime', 'startHue'), // 0-7 bits, 4-7 reserved
          action: ZCLDataTypes.enum8({
            deactivate: 0,
            activateFromStart: 1,
            activateFromCurrent: 2,
          }),
          direction: ZCLDataTypes.enum8({
            decrementHue: 0,
            incrementHue: 1,
          }),
          transitionTime: ZCLDataTypes.uint16,
          startHue: ZCLDataTypes.uint16,
        },
      }
    };
  }

}

module.exports = HueSpecificColorControlCluster;