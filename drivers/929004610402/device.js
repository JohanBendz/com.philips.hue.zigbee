'use strict';

const Light = require('../Light.js');

const FLUX_COLOR_CAPABILITIES = Object.freeze({
  hueAndSaturation: true,
  enhancedHue: true,
  colorLoop: false,
  xy: true,
  colorTemperature: true,
});

const FLUX_COLOR_TEMP_MIN_MIRED = 50;
const FLUX_COLOR_TEMP_MAX_MIRED = 1000;

class HueFluxLightstripDevice extends Light {

  async _ensureFluxColorProfile() {
    await this.setStoreValue('colorCapabilities', FLUX_COLOR_CAPABILITIES);
    await this.setStoreValue('colorTempMin', FLUX_COLOR_TEMP_MIN_MIRED);
    await this.setStoreValue('colorTempMax', FLUX_COLOR_TEMP_MAX_MIRED);
    await this.setStoreValue('colorClusterConfigured', true);
  }

  async onNodeInit({ zclNode }) {
    // Flux exposes a much wider color-temperature range than classic Hue
    // lights. Current Homey interviews do not expose the standard physical
    // min/max attributes, so pin the verified profile before shared init.
    await this._ensureFluxColorProfile();
    await super.onNodeInit({ zclNode });
  }

}

// Flux also exposes Philips manufacturer-specific gradient clusters. Keep
// them out of the Homey manifest until segment ordering/protocol is verified
// on real hardware.
module.exports = HueFluxLightstripDevice;
