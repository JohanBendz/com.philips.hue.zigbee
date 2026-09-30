'use strict';

function markHueSensorAvailable(device) {
  return device.setAvailable()
    .catch(error => device.error('Could not mark Hue sensor available after report', error));
}

module.exports = { markHueSensorAvailable };
