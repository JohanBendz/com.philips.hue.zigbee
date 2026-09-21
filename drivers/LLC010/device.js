'use strict';

const Light = require('../Light.js');

const COLOR_TEMPERATURE_MODELS = new Set([
  '929002376101',
  '929002376201',
  '929002376301',
  '929002376401',
  '929002376402',
]);

class LLC010 extends Light {
  async onNodeInit({ zclNode }) {
    const productId = this.getSetting('zb_product_id');

    // Legacy LLC010 is color-only, while later Iris generations expose
    // color temperature on the same Color Control cluster. Existing devices
    // do not receive manifest capability additions automatically, so migrate
    // only the product IDs for which color temperature is supported.
    if (COLOR_TEMPERATURE_MODELS.has(productId) && !this.hasCapability('light_temperature')) {
      await this.addCapability('light_temperature');
    }

    await super.onNodeInit({ zclNode });
  }
}

module.exports = LLC010;
