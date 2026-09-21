'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('Hue Slim recessed family is split by physical size without capability drift', () => {
  const slim90 = manifest.drivers.find(driver => driver.id === '929004291001');
  const slim170 = manifest.drivers.find(driver => driver.id === 'LCD010');

  assert.ok(slim90.zigbee.productId.includes('929004291001'));
  assert.ok(slim90.zigbee.productId.includes('LCD009'));

  assert.deepEqual(slim170.zigbee.productId, ['LCD010', 'LCD011']);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(slim170.capabilities.includes(capability), capability);
  }
  assert.deepEqual(slim170.zigbee.endpoints['11'].clusters, [0, 3, 4, 5, 6, 8, 768, 4096]);
});
