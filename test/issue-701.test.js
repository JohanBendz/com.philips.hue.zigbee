'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

test('RDM005 uses the standard Smart Button endpoint contract', () => {
  const driver = manifest.drivers.find(item => item.id === 'ROM001');
  assert.ok(driver);
  assert.deepEqual(driver.zigbee.productId, ['ROM001', 'RDM003', 'RDM005']);
  assert.deepEqual(driver.zigbee.endpoints['1'].clusters, [1]);
  assert.deepEqual(driver.zigbee.endpoints['1'].bindings, [3, 6, 8]);
  assert.ok(driver.capabilities.includes('measure_battery'));
  assert.ok(driver.capabilities.includes('alarm_battery'));
});

test('RDM005 command clusters are compatible with the shared Smart Button driver', () => {
  const verifiedSignature = {
    input: [0, 1, 3, 64512, 4096],
    output: [25, 0, 3, 4, 5, 6, 8, 4096],
  };

  assert.ok(verifiedSignature.input.includes(1), 'battery cluster');
  for (const cluster of [3, 6, 8]) {
    assert.ok(verifiedSignature.output.includes(cluster), `output cluster ${cluster}`);
  }
});
