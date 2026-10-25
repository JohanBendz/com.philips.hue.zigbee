'use strict';

const Light = require('../Light.js');
const { applyHueLightModelProfile } = require('../../lib/HueLightModelProfiles');

class LCG002 extends Light {
  get energyMap() {
    // Signify specifications for these exact models; keep manifest fallback for
    // every older/unknown product ID. Sources are recorded with #773 in the review.
    return {
      LCG006: { approximation: { usageOn: 4.2, usageOff: 0.25 } },
      LCG008: { approximation: { usageOn: 4.7, usageOff: 0.5 } },
    };
  }

  async onNodeInit({ zclNode }) {
    await applyHueLightModelProfile(this);
    await super.onNodeInit({ zclNode });
  }
}

module.exports = LCG002;
