'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');

function legacyLwe004(productId) {
  const Driver = loadDriver('LWE004');
  const device = new Driver();
  device.settings.zb_product_id = productId;
  device.capabilities = new Set(['onoff', 'dim']);
  device.registerCapabilityListener = () => {};
  device.registerMultipleCapabilities = () => {};
  device.homey = { setTimeout, clearTimeout };
  device.getClusterEndpoint = cluster => (
    device.zclNode.endpoints[11].clusters[cluster.NAME] ? 11 : null
  );
  device.zclNode = {
    endpoints: {
      11: {
        clusters: {
          onOff: {},
          levelControl: {},
          colorControl: {
            readAttributes: async () => ({
              colorCapabilities: { colorTemperature: true },
              colorTempPhysicalMinMireds: 153,
              colorTempPhysicalMaxMireds: 454,
            }),
          },
        },
      },
    },
  };
  return device;
}

test('legacy LTE005 paired under LWE004 migrates in place to White Ambiance capabilities', async () => {
  const device = legacyLwe004('LTE005');
  await device.onNodeInit({ zclNode: device.zclNode });
  assert.equal(device.hasCapability('light_temperature'), true);
  assert.equal(device.hasCapability('light_mode'), true);
  assert.equal(device.supportsColorTemperature, true);
});

test('real LWE004 remains a dim-only white filament bulb', async () => {
  const device = legacyLwe004('LWE004');
  delete device.zclNode.endpoints[11].clusters.colorControl;
  await device.onNodeInit({ zclNode: device.zclNode });
  assert.equal(device.hasCapability('light_temperature'), false);
  assert.equal(device.hasCapability('light_mode'), false);
});
