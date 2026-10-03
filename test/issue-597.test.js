'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('LWF004 A60 E27 800 lm uses the existing dimmable white A60 driver', () => {
  const driver = manifest.drivers.find(item => item.id === 'LWB000');
  assert.ok(driver.zigbee.productId.includes('LWF004'));
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8]);
  assert.deepEqual(driver.capabilities, ['onoff', 'dim']);
});
