'use strict';

const Light = require('../Light.js');
const { applyHueLightModelProfile } = require('../../lib/HueLightModelProfiles');

class LTA011 extends Light {
  get energyMap() {
    // Exact LTA016 E27/12NC 929003855001 specification; older models keep
    // their manifest fallback. Source: docs/2.5-issue-review-2026-10-25.md.
    return { LTA016: { approximation: { usageOn: 11.8, usageOff: 0.2 } } };
  }

  async onNodeInit({ zclNode }) {
    await applyHueLightModelProfile(this);
    await super.onNodeInit({ zclNode });
  }
}

module.exports = LTA011;
