'use strict';

const { BoundCluster } = require('zigbee-clusters');

class HueSpecificBoundCluster extends BoundCluster {

  constructor({
    hueScene,
  }) {
    super();
    this._hueScene = hueScene;
  }

  hueScene(payload) {
    if (typeof this._hueScene === 'function') {
      this._hueScene(payload);
    }
  }

}

module.exports = HueSpecificBoundCluster;