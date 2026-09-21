'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Runner double-spot model IDs use the existing Runner White Ambiance driver', () => {
  const compose = require('../drivers/5309031P9/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === '5309031P9');
  for (const id of ['929003045601_01', '929003045601_02']) {
    assert.ok(compose.zigbee.productId.includes(id));
    assert.ok(generated.zigbee.productId.includes(id));
  }
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
