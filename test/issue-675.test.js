'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Liane black/white variants share one color-ambiance driver', () => {
  const driver = manifest.drivers.find(item => item.id === 'LCW002');
  assert.deepEqual(driver.zigbee.productId, [
    'LCW002',
    '4090230P9',
    '4090231P9',
    '929003053101',
    '929003053201',
  ]);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
