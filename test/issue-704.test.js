'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Hue Welcome P7/V7 stays a dimmable white floodlight', () => {
  const driver = manifest.drivers.find(item => item.id === '1743630P7');
  assert.deepEqual(driver.zigbee.productId, ['1743630P7', '1743630V7']);
  assert.deepEqual(driver.capabilities, ['onoff', 'dim']);
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8]);
});
