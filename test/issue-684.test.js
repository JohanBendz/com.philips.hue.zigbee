'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('LCO005 G125 exposes the supplied color-ambiance capability set', () => {
  const driver = manifest.drivers.find(item => item.id === 'LCO005');
  assert.deepEqual(driver.zigbee.productId, ['LCO005']);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 5, 6, 8, 768, 4096]);
});
