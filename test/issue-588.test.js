'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Enrave S white/black variants share White Ambiance support', () => {
  const driver = manifest.drivers.find(item => item.id === '915005996401');
  assert.ok(driver);
  assert.deepEqual(driver.zigbee.productId, ['915005996401', '915005996501']);
  for (const capability of ['onoff', 'dim', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }
  assert.equal(driver.capabilities.includes('light_hue'), false);
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
