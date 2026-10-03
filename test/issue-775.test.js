'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');

test('OmniGlow family matches the verified model IDs with standard light clusters only', () => {
  const compose = require('../drivers/929004608001/driver.compose.json');

  assert.deepEqual(compose.zigbee.productId, [
    '929004608001',
    '929004608003',
    '929004608004',
    '929004608101',
    '929004608103',
    '929004608201',
  ]);
  assert.deepEqual(compose.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
  assert.equal(compose.zigbee.endpoints['11'].clusters.includes(64515), false);
  assert.equal(compose.zigbee.endpoints['11'].clusters.includes(64513), false);
  assert.equal(compose.zigbee.endpoints['11'].clusters.includes(64516), false);
});

test('OmniGlow pins its wide color-temperature profile before shared light initialization', async () => {
  const Driver = loadDriver('929004608001');
  const device = new Driver();
  const stored = new Map();

  device.setStoreValue = async (key, value) => stored.set(key, value);
  await device._ensureOmniGlowColorProfile();

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
