'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('issue #598: Hue White and Color Ambiance GU10 variants share LCG002 driver', () => {
  const compose = require('../drivers/LCG002/driver.compose.json');
  const models = [
    'LCG002',
    '929003047701',
    '929003526202_01',
    '929003526202_02',
    '929003526202_03',
    '929003526101',
  ];

  for (const model of models) {
    assert.ok(compose.zigbee.productId.includes(model), model);
  }

  assert.deepEqual(compose.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
