'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');

test('Flux family matches verified Zigbee model IDs with standard light clusters only', () => {
  const compose = require('../drivers/929004610402/driver.compose.json');

  assert.deepEqual(compose.zigbee.productId, [
    '929004610401',
    '929004610402',
    '929004610403',
    '929004610502',
    '929004610601',
    '929004610602',
    '929004610702',
    '929004610802',
  ]);
  assert.deepEqual(compose.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
  assert.equal(compose.zigbee.productId.includes('929004610603'), false);
  assert.equal(compose.zigbee.endpoints['11'].clusters.includes(64513), false);
  assert.equal(compose.zigbee.endpoints['11'].clusters.includes(64515), false);
  assert.equal(compose.zigbee.endpoints['11'].clusters.includes(64516), false);
});

test('Flux pins its wide color-temperature profile', async () => {
  const Driver = loadDriver('929004610402');
  const device = new Driver();
  const stored = new Map();

  device.setStoreValue = async (key, value) => stored.set(key, value);
  await device._ensureFluxColorProfile();

  assert.deepEqual(stored.get('colorCapabilities'), {
    hueAndSaturation: true,
    enhancedHue: true,
    colorLoop: false,
    xy: true,
    colorTemperature: true,
  });
  assert.equal(stored.get('colorTempMin'), 50);
  assert.equal(stored.get('colorTempMax'), 1000);
  assert.equal(stored.get('colorClusterConfigured'), true);
});
