'use strict';

const { markHueLastSeenFromTraffic } = require('./HueLastSeen');

function markHueRemoteAvailable(device) {
  device.setAvailable()
    .catch(error => device.error('Could not mark Hue remote available after real Zigbee traffic', error));

  // All current call sites in RDM002/RWL022 follow actual button traffic,
  // validated battery reports or an incoming end-device announcement.
  // Telemetry must not block or affect availability recovery.
  void markHueLastSeenFromTraffic(device);
}

module.exports = { markHueRemoteAvailable };
