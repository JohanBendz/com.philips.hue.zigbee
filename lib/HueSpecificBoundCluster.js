'use strict';

const { BoundCluster } = require('zigbee-clusters');

class HueSpecificBoundCluster extends BoundCluster {

  constructor({
    onButton,
  }) {
    super();
    this._onButton = onButton;
  }

  button(payload) {
    if (typeof this._onButton === 'function') {
      return this._onButton(payload);
    }
    return undefined;
  }

}

module.exports = HueSpecificBoundCluster;