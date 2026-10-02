'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('all Zigbee drivers declare local-only platform and Zigbee connectivity', () => {
  assert.deepEqual(manifest.platforms, ['local']);
  const zigbeeDrivers = manifest.drivers.filter(driver => driver.zigbee);
  assert.ok(zigbeeDrivers.length > 100, 'expected full generated Hue driver coverage');

  const incorrect = zigbeeDrivers
    .filter(driver =>
      JSON.stringify(driver.platforms) !== JSON.stringify(['local']) ||
      JSON.stringify(driver.connectivity) !== JSON.stringify(['zigbee']))
    .map(driver => ({
      id: driver.id,
      platforms: driver.platforms || null,
      connectivity: driver.connectivity || null,
    }));
  assert.deepEqual(incorrect, [], 'all Hue Zigbee drivers must explicitly describe local Zigbee');
});
