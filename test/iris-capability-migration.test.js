'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');
const manifest = require('../app.json');

function iris(productId) {
  const Driver = loadDriver('LLC010');
  const device = new Driver();
  device.settings.zb_product_id = productId;
  device.capabilities = new Set(['onoff', 'dim', 'light_hue', 'light_saturation', 'light_mode']);
  device.registerCapabilityListener = () => {};
  device.registerMultipleCapabilities = () => {};
  device.homey = { setTimeout, clearTimeout };
  device.getClusterEndpoint = () => 11;
  device.zclNode = {
    endpoints: {
      11: {
        clusters: {
          onOff: {},
          levelControl: {},
          colorControl: {
            readAttributes: async () => ({
              colorCapabilities: { hueAndSaturation: true, colorTemperature: true },
              colorTempPhysicalMinMireds: 153,
              colorTempPhysicalMaxMireds: 500,
            }),
          },
        },
      },
    },
  };
  return device;
}

test('modern Iris models migrate light_temperature before shared light initialization', async () => {
  for (const productId of [
    '929002376101',
    '929002376201',
    '929002376301',
    '929002376401',
    '929002376402',
  ]) {
    const device = iris(productId);
    await device.onNodeInit({ zclNode: device.zclNode });
    assert.equal(device.hasCapability('light_temperature'), true, productId);
    assert.equal(device.supportsColorTemperature, true, productId);
  }
});

test('legacy LLC010 Iris remains color-only', async () => {
  const device = iris('LLC010');
  await device.onNodeInit({ zclNode: device.zclNode });
  assert.equal(device.hasCapability('light_temperature'), false);
});

test('Hue Iris limited edition 929002376402 stays matched to LLC010', () => {
  const compose = require('../drivers/LLC010/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LLC010');
  assert.ok(compose.zigbee.productId.includes('929002376402'));
  assert.ok(generated.zigbee.productId.includes('929002376402'));
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
