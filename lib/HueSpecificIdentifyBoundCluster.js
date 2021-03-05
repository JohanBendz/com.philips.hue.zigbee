'use strict';

const { BoundCluster } = require('zigbee-clusters');

class IdentifyBoundCluster extends BoundCluster {

  constructor({
    onTriggerEffectId,
  }) {
    super();
    this._onTriggerEffectId = onTriggerEffectId;
  }

  triggerEffectId(payload) {
      this._onTriggerEffectId(payload);
  }

}

module.exports = IdentifyBoundCluster;