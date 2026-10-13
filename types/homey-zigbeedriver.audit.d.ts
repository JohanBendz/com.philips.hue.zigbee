declare module 'homey-zigbeedriver' {
  import Homey = require('homey');

  export class ZigBeeDevice extends Homey.Device {
    constructor(...args: any[]);
    [key: string]: any;
  }

  export class ZigBeeLightDevice extends ZigBeeDevice {
    constructor(...args: any[]);
    [key: string]: any;
  }

  export class ZigBeeDriver extends Homey.Driver {
    constructor(...args: any[]);
    [key: string]: any;
  }
}
