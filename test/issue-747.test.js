'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Festavia supports standard whole-string color controls without claiming gradient support', () => {
  const driver = manifest.drivers.find(item => item.id === 'LCX028');
  assert.deepEqual(driver.zigbee.productId, ['LCX024', 'LCX025', 'LCX028']);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
  assert.equal(driver.capabilities.some(capability => /gradient/i.test(capability)), false);
});
