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
      this._onButton(payload);
    }
  }

}

module.exports = HueSpecificBoundCluster;