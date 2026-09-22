'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Pillar black/white single spots share the White Ambiance driver', () => {
  const driver = manifest.drivers.find(item => item.id === '5633031P9');
  assert.deepEqual(driver.zigbee.productId, ['5633030P9', '5633031P9']);
  assert.ok(driver.capabilities.includes('light_temperature'));
  assert.equal(driver.capabilities.includes('light_hue'), false);
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
