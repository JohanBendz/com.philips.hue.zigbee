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

test('Node 22 Homey compatibility is aligned with the generated manifest', () => {
  const compose = require('../.homeycompose/app.json');
  const pkg = require('../package.json');

  assert.equal(pkg.engines.node, '>=22');
  assert.equal(compose.compatibility, '>=12.9.0');
  assert.equal(manifest.compatibility, compose.compatibility);
  assert.equal(manifest.version, compose.version);
});
