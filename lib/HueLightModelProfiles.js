'use strict';

// Exact-model exceptions only. Existing models keep the SDK's device-discovered
// profile. Evidence: docs/2.5-issue-review-2026-10-25.md.
const PROFILES = Object.freeze({
  LTA016: {
    min: 50,
    max: 1000,
    capabilities: {
      hueAndSaturation: false, enhancedHue: false, colorLoop: false,
      xy: false, colorTemperature: true,
    },
  },
  LCG008: {
    min: 153,
    max: 447,
    capabilities: {
      hueAndSaturation: true, enhancedHue: true, colorLoop: false,
      xy: true, colorTemperature: true,
    },
  },
});

async function applyHueLightModelProfile(device) {
  const productId = device.getSetting('zb_product_id');
  if (!Object.hasOwn(PROFILES, productId)) return false;
  const profile = PROFILES[productId];

  await device.setStoreValue('colorCapabilities', { ...profile.capabilities });
  await device.setStoreValue('colorTempMin', profile.min);
  await device.setStoreValue('colorTempMax', profile.max);
  await device.setStoreValue('colorClusterConfigured', true);
  return true;
}

module.exports = { applyHueLightModelProfile };
