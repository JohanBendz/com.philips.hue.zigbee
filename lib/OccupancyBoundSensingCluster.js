'use strict';

const { BoundCluster } = require('zigbee-clusters');

class occupancySensingBoundCluster extends BoundCluster {
    constructor({
        onZoneStatusChangeNotification,
    }) {
        super();
        this._onZoneStatusChangeNotification = onZoneStatusChangeNotification;
    }
    zoneStatusChangeNotification(payload) {
        if (typeof this._onZoneStatusChangeNotification === 'function') {
        this._onZoneStatusChangeNotification(payload);
        }
    }
}

module.exports = occupancySensingBoundCluster;