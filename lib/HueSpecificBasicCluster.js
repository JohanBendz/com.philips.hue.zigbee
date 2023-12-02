const { BasicCluster, ZCLDataTypes } = require('zigbee-clusters');

class HueSpecificBasicCluster extends BasicCluster {
  static get NAME() {
    return 'HueSpecificBasicCluster';
  }

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      philips: {id:49, type: ZCLDataTypes.map16, manufacturerId: 0x100b }, //0x0031
      ledIndication: { id: 51, type: ZCLDataTypes.bool, manufacturerId: 0x100b},
      deviceMode: { id:52, type: ZCLDataTypes.enum8({
                          singlerocker: 0, //0x00
                          singlepushbutton: 1, //0x01
                          dualrocker: 2, //0x02
                          dualpushbutton: 3, //0x03
                        }), 
                    manufacturerId: 0x100b,
                    disableDefaultResponse: true,
                  },
    };
  }

  static get COMMANDS() {
    return {
      ...super.COMMANDS,
      triggerLedIndication: { id: 51 }, //0x0033
      triggerDeviceMode: {
        id: 52, //0x0034
        args: {
          deviceMode: ZCLDataTypes.enum8({
            singlerocker: 0, //0x00
            singlepushbutton: 1, //0x01
            dualrocker: 2, //0x02
            dualpushbutton: 3, //0x03
          })
        }
      },
    };
  }

}

module.exports = HueSpecificBasicCluster;