'use strict';

const Light = require('../Light.js');

class LLC013 extends Light {
  async onNodeInit({ zclNode }) {
    // LLC013 is part of the Bloom family and supports color temperature.
    // Existing paired devices need the capability added explicitly.
    if (!this.hasCapability('light_temperature')) {
      await this.addCapability('light_temperature');
    }

    await super.onNodeInit({ zclNode });
  }
}

module.exports = LLC013;
