'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('LTG003 MR16 exposes White Ambiance controls from the supplied interview', () => {
  const driver = manifest.drivers.find(item => item.id === 'LTG003');
  assert.deepEqual(driver.zigbee.productId, ['LTG003']);
  assert.ok(driver.capabilities.includes('light_temperature'));
  assert.equal(driver.capabilities.includes('light_hue'), false);
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
