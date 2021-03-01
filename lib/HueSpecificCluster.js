'use strict';

const { Cluster, ZCLDataTypes} = require('zigbee-clusters');

const ATTRIBUTES = {

};

const COMMANDS = {

  hueScene: {
    id: 0,
    args: {
      activeButton: ZCLDataTypes.uint8,
      activeAction: ZCLDataTypes.uint8,
    }
  }

};

class HueSpecificCluster extends Cluster {

    static get ID() {
        return 64512;
    }

    static get NAME() {
        return 'hue';
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES;
    }

    static get COMMANDS() {
        return COMMANDS;
    }

}

Cluster.addCluster(HueSpecificCluster);

module.exports = HueSpecificCluster;
