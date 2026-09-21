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

test('PR #709 drivers have complete correctly sized PNG assets', () => {
  for (const id of ['929003665001', '929004291001']) {
    const driver = manifest.drivers.find(driver => driver.id === id);
    assert.ok(driver);
    for (const [name, size] of [['small', 75], ['large', 500]]) {
      const bytes = fs.readFileSync(path.join(root, driver.images[name]));
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.equal(bytes.readUInt32BE(16), size);
      assert.equal(bytes.readUInt32BE(20), size);
    }
    assert.ok(fs.existsSync(path.join(root, driver.icon)));
  }
});

test('Dymera keeps model matching and subdevice capabilities/settings consistent', () => {
  const driver = manifest.drivers.find(driver => driver.id === '929003665001');
  assert.deepEqual(driver.zigbee.productId, ['LCW004', 'LCW005']);
  assert.deepEqual(driver.zigbee.devices.top.capabilities, driver.capabilities);
  assert.deepEqual(driver.zigbee.devices.top.capabilitiesOptions, driver.capabilitiesOptions);
  // Homey copies omitted subdevice properties from the root, including settings.
  assert.equal(driver.zigbee.devices.top.settings, undefined);
  assert.ok(driver.settings.some(setting => setting.children?.some(child => child.id === 'powerOnCtrl_state')));
});

test('SOC001 manifest follows interviewed input clusters and manufacturer-report binding', () => {
  const driver = manifest.drivers.find(driver => driver.id === 'SOC001');
  assert.deepEqual(driver.zigbee.endpoints['2'].clusters, [0, 1, 3, 64518]);
  assert.deepEqual(driver.zigbee.endpoints['2'].bindings, [1, 64518]);
});


test('LCA011 is matched by the existing LCA001 color-ambiance driver', () => {
  const compose = require('../drivers/LCA001/driver.compose.json');
  assert.ok(compose.zigbee.productId.includes('LCA011'));
  assert.deepEqual(compose.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});


test('LWG005 is matched by the existing LWG004 white GU10 driver', () => {
  const compose = require('../drivers/LWG004/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LWG004');
  assert.deepEqual(compose.zigbee.productId, ['LWG004', 'LWG005']);
  assert.deepEqual(generated.zigbee.productId, ['LWG004', 'LWG005']);
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8]);
});
