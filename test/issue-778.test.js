'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('LWA033 is matched by the existing White A60 driver without gaining color capabilities', () => {
  const compose = require('../drivers/LWA001/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LWA001');

  assert.ok(compose.zigbee.productId.includes('LWA033'));
  assert.ok(generated.zigbee.productId.includes('LWA033'));
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8]);
  assert.equal(generated.capabilities.includes('light_temperature'), false);
  assert.equal(generated.capabilities.includes('light_hue'), false);
  assert.equal(generated.capabilities.includes('light_saturation'), false);
});

test('LTU001 uses a dedicated P45 E14 White Ambiance driver', () => {
  const compose = require('../drivers/LTU001/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LTU001');

  assert.deepEqual(compose.zigbee.productId, ['LTU001']);
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
  assert.ok(generated.capabilities.includes('onoff'));
  assert.ok(generated.capabilities.includes('dim'));
  assert.ok(generated.capabilities.includes('light_temperature'));
  assert.equal(generated.capabilities.includes('light_hue'), false);
  assert.equal(generated.capabilities.includes('light_saturation'), false);
});
