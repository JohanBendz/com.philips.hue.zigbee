'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Gradient Signe floor exposes standard controls and Philips2 gradient transport', () => {
  const driver = manifest.drivers.find(item => item.id === '915005987101');
  assert.deepEqual(driver.zigbee.productId, ['915005987101', '915005987201', '4080248U9']);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768, 64515]);
  // Gradient is exposed through the dedicated Flow action, not a fake Homey capability.
  assert.equal(driver.capabilities.some(capability => /gradient/i.test(capability)), false);
});
