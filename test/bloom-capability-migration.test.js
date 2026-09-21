'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');
const manifest = require('../app.json');

function livingColor(driverId, productId) {
  const Driver = loadDriver(driverId);
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

test('Bloom models in mixed LLC011 driver migrate light_temperature', async () => {
  for (const productId of ['LLC011', 'LLC012', '929002375901', '929002376001']) {
    const device = livingColor('LLC011', productId);
    await device.onNodeInit({ zclNode: device.zclNode });
    assert.equal(device.hasCapability('light_temperature'), true, productId);
    assert.equal(device.supportsColorTemperature, true, productId);
  }
});

test('LivingColors Aura LLC014 remains color-only in mixed LLC011 driver', async () => {
  const device = livingColor('LLC011', 'LLC014');
  await device.onNodeInit({ zclNode: device.zclNode });
  assert.equal(device.hasCapability('light_temperature'), false);
});

test('LLC013 Bloom advertises and migrates color temperature', async () => {
  const compose = require('../drivers/LLC013/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LLC013');
  assert.deepEqual(compose.$extends, ['light_color_ambiance']);
  assert.ok(generated.capabilities.includes('light_temperature'));

  const device = livingColor('LLC013', 'LLC013');
  await device.onNodeInit({ zclNode: device.zclNode });
  assert.equal(device.hasCapability('light_temperature'), true);
  assert.equal(device.supportsColorTemperature, true);
});
