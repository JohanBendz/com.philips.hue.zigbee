'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('Iris pairing instructions cover legacy LivingColors procedure', () => {
  const compose = require('../drivers/LLC010/driver.compose.json');
  const instruction = compose.zigbee.learnmode.instruction.en;
  assert.match(instruction, /ON \+ Favorite 1/);
  assert.match(instruction, /Gen 1.*do not support Zigbee/i);
  assert.ok(compose.zigbee.productId.includes('LLC010'));
});
