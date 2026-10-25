'use strict';

// Homey's shipped powerOnCtrl_state identifiers are part of the installed
// settings contract. The standard ZCL startUpOnOff enum uses 'previous'
// where the legacy Hue-specific enum used 'recover'; both encode as 0xFF.
const STATES = Object.freeze({
  off: 'off',
  on: 'on',
  recover: 'previous',
});

function toStandardStartupState(value) {
  if (!Object.hasOwn(STATES, value)) {
    throw new RangeError(`Unsupported Hue power-on state: ${String(value)}`);
  }
  return STATES[value];
}

module.exports = { toStandardStartupState };
