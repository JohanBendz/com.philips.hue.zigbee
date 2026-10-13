declare module 'homey-zigbeedriver' {
  import Homey = require('homey');

  export class ZigBeeDevice extends Homey.Device {
    [key: string]: any;
  }

  export class ZigBeeLightDevice extends ZigBeeDevice {
    [key: string]: any;
  }

  export class ZigBeeDriver extends Homey.Driver {
    [key: string]: any;
  }
}
