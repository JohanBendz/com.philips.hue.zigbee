'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Hue Play Wall Washer exposes standard color controls without claiming gradient support', () => {
  const driver = manifest.drivers.find(item => item.id === 'LGT009');
  assert.deepEqual(driver.zigbee.productId, [
    'LGT009',
    'LGT010',
    'LGT011',
    'LGT012',
    'LGT016',
    '046677590161',
    '046677590130',
  ]);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }
  assert.equal(driver.capabilities.some(capability => /gradient/i.test(capability)), false);
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
