'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const manifest = require('../app.json');

test('generated manifest contains every Compose driver', () => {
  const composeIds = fs.readdirSync(path.join(root, 'drivers')).filter(id =>
    fs.existsSync(path.join(root, 'drivers', id, 'driver.compose.json'))).sort();
  assert.deepEqual(manifest.drivers.map(driver => driver.id).sort(), composeIds);
});

test('ROM002 bindings and both historical Flow action IDs stay in sync', () => {
  const compose = require('../drivers/ROM002/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'ROM002');
  assert.deepEqual(compose.zigbee.endpoints['1'].bindings, [6, 64512]);
  assert.deepEqual(generated.zigbee, JSON.parse(JSON.stringify(compose.zigbee)
    .replaceAll('{{driverAssetsPath}}', '/drivers/ROM002/assets')));
  const card = manifest.flow.triggers.find(trigger => trigger.id === 'ROM002_button');
  const actions = card.args.find(arg => arg.name === 'action').values.map(value => value.id);
  assert.ok(actions.includes('LongPress'));
  assert.ok(actions.includes('LongRelease'));
});
