'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Datura small Rev1/Rev2 expose both standard color-light controllers', () => {
  const driver = manifest.drivers.find(item => item.id === '929003736201');
  assert.ok(driver);

  assert.deepEqual(driver.zigbee.productId, [
    '929003736201_01',
    '929003736201_02',
    '929003736601_01',
    '929003736601_02',
  ]);

  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }

  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
  assert.equal(driver.capabilities.some(capability => /gradient/i.test(capability)), false);
});
