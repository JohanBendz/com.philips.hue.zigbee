const { ZigBeeDriver } = require("homey-zigbeedriver");

const RootDevice = require("./device.js");
//const SecondOutletDevice = require("./secondOutlet.device.js");

class Driver extends ZigBeeDriver {
    onInit() {
        super.onInit();
        this.subdevice = null
    }
  
    onMapDeviceClass(device) {
        if (device.getData().subDeviceId === "secondInput") {
        return RootDevice;
        } else {
        return RootDevice;
        }
    }
}

module.exports = Driver;