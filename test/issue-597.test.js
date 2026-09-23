'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('issue #597: LWA024 uses the 9W dimmable white A60 driver', () => {
  const a60 = require('../drivers/LWA001/driver.compose.json');
  const legacy = require('../drivers/LWB000/driver.compose.json');

  assert.ok(a60.zigbee.productId.includes('LWA024'));
  assert.deepEqual(a60.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8]);

  // An earlier unmerged attempt guessed LWF004 from the retail name.
  // Keep that unsupported guess out unless a real Zigbee interview proves it.
  assert.equal(legacy.zigbee.productId.includes('LWF004'), false);
});
