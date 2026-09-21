'use strict';

const Light = require('../Light.js');

class LWE004 extends Light {
  async onNodeInit({ zclNode }) {
    // LTE005 used to be incorrectly matched by this dim-only LWE004 driver.
    // Keep already-paired devices working in place after the model moved to
    // its dedicated White Ambiance driver.
    if (this.getSetting('zb_product_id') === 'LTE005') {
      if (!this.hasCapability('light_temperature')) {
        await this.addCapability('light_temperature');
      }
      if (!this.hasCapability('light_mode')) {
        await this.addCapability('light_mode');
      }
    }

    await super.onNodeInit({ zclNode });
  }
}

module.exports = LWE004;
