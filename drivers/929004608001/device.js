'use strict';

const Light = require('../Light.js');

const OMNIGLOW_COLOR_CAPABILITIES = Object.freeze({
  hueAndSaturation: true,
  enhancedHue: true,
  colorLoop: false,
  xy: true,
  colorTemperature: true,
});

const OMNIGLOW_COLOR_TEMP_MIN_MIRED = 50;
const OMNIGLOW_COLOR_TEMP_MAX_MIRED = 1000;

class HueOmniGlowDevice extends Light {

  async _ensureOmniGlowColorProfile() {
    await this.setStoreValue('colorCapabilities', OMNIGLOW_COLOR_CAPABILITIES);
    await this.setStoreValue('colorTempMin', OMNIGLOW_COLOR_TEMP_MIN_MIRED);
    await this.setStoreValue('colorTempMax', OMNIGLOW_COLOR_TEMP_MAX_MIRED);
    await this.setStoreValue('colorClusterConfigured', true);
  }

  async onNodeInit({ zclNode }) {
    // OmniGlow exposes a much wider color-temperature range than classic Hue
    // lights. Keep this profile explicit because current interviews do not
    // expose the standard physical min/max attributes Homey's generic light
    // handling normally relies on.
    await this._ensureOmniGlowColorProfile();
    await super.onNodeInit({ zclNode });
  }

}

// OmniGlow also exposes Philips manufacturer-specific gradient clusters.
// They are deliberately not declared in the Homey manifest until the actual
// segment ordering/protocol has been verified on hardware.
module.exports = HueOmniGlowDevice;
