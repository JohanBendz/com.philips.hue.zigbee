'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Xamento ceiling M/L models use one color-ambiance capability family', () => {
  const driver = manifest.drivers.find(item => item.id === '915005997801');
  assert.deepEqual(driver.zigbee.productId, ['915005997801', '915005997901']);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(driver.capabilities.includes(capability), capability);
  }
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
