'use strict';

const { BoundCluster } = require('zigbee-clusters');

class BasicBoundCluster extends BoundCluster {

  constructor({
    onTriggerLedIndication,
    onTriggerDeviceMode,
  }) {
    super();
    this._onTriggerLedIndication = onTriggerLedIndication;
    this._onTriggerDeviceMode = onTriggerDeviceMode;
  }

  triggerLedIndication(payload) {
    this._onTriggerLedIndication(payload);
  }

  triggerDeviceMode(payload) {
    this._onTriggerDeviceMode(payload);
  }

}

module.exports = BasicBoundCluster;