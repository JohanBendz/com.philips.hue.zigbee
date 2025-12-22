'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');

//const {debug} = require('zigbee-clusters');
//debug(true);

class ContactSensor extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.log('Philips Hue Contact Sensor has been initialized');
    this.printNode();

    // The device has custom cluster 64518 (0xfc06) which delivers contact and tamper.
    // We currently implement cluster 6 instead. More information:
    // https://github.com/Koenkk/zigbee-herdsman-converters/pull/9668
    // https://github.com/zigpy/zha-device-handlers/pull/3432
    // https://github.com/zigpy/zha-device-handlers/issues/3314
    // https://github.com/dresden-elektronik/deconz-rest-plugin/issues/7226
    const node = await this.homey.zigbee.getNode(this);
    node.handleFrame = (endpointId, clusterId, frame, meta) => {
      this.log("endpointId: ", endpointId, ", clusterId: ", clusterId, ", frame: ", frame, ", meta: ", meta);
      if ((endpointId === 2)
          && (clusterId === 6) // onOff cluster
          && (frame.readUInt8(0) === 0x01) // attribute 1
      ) {
        // Buffer 01 3a 01
        // value 0 = "closed", value 1 = "open" ?!
        const value = frame.readUInt8(2);
        this.setCapabilityValue('alarm_contact', value === 1);
      }
      if ((endpointId === 2)
          && (clusterId === 1) // PowerConfigurationCluster
          && (frame.readUInt8(2) == 0x0a)
          && (frame.readUInt8(3) == 0x21) // 33 - "batteryPercentageRemaining"
          && (frame.readUInt8(4) == 0x00)
      ) {
          const percentage = frame.readUInt8(6) / 2; // translate incoming values 0..200 to 0..100 percent
          this.log("battery percentage remaining: ", percentage);
          this.setCapabilityValue('measure_battery', percentage);
      }
    };
  }
}

module.exports = ContactSensor;
