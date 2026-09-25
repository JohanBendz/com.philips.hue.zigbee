'use strict';

function markHueRemoteAvailable(device) {
  device.setAvailable()
    .catch(error => device.error('Could not mark Hue remote available after real Zigbee traffic', error));
}

module.exports = { markHueRemoteAvailable };
