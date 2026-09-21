'use strict';

const Light = require('../Light.js');

const COLOR_TEMPERATURE_MODELS = new Set([
  'LLC011',
  'LLC012',
  '929002375901',
  '929002376001',
]);

class LLC011 extends Light {
  async onNodeInit({ zclNode }) {
    const productId = this.getSetting('zb_product_id');

    // This historical driver also contains LLC014 (LivingColors Aura), which
    // is color-only. Add temperature only for the Bloom models that expose it.
    if (COLOR_TEMPERATURE_MODELS.has(productId) && !this.hasCapability('light_temperature')) {
      await this.addCapability('light_temperature');
    }

    await super.onNodeInit({ zclNode });
  }
}

module.exports = LLC011;
