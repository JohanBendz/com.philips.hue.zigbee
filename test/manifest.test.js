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


test('LCL007 is matched by the existing LCL001 Lightstrip Plus V4 driver', () => {
  const compose = require('../drivers/LCL001/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LCL001');
  assert.ok(compose.zigbee.productId.includes('LCL007'));
  assert.ok(generated.zigbee.productId.includes('LCL007'));
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});


test('5047131P9 is matched by the existing Buckram spotlight driver', () => {
  const compose = require('../drivers/5047131P6/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === '5047131P6');
  assert.ok(compose.zigbee.productId.includes('5047131P9'));
  assert.ok(generated.zigbee.productId.includes('5047131P9'));
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});


test('LWO005 is matched by the existing LWO001 G93 filament driver', () => {
  const compose = require('../drivers/LWO001/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LWO001');
  assert.deepEqual(compose.zigbee.productId, ['LWO001', 'LWO005']);
  assert.deepEqual(generated.zigbee.productId, ['LWO001', 'LWO005']);
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8]);
});


test('929003597801 is matched by the existing Aurelle square panel driver', () => {
  const compose = require('../drivers/LTC014/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LTC014');
  assert.ok(compose.zigbee.productId.includes('929003597801'));
  assert.ok(generated.zigbee.productId.includes('929003597801'));
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});


test('active driver product IDs do not collide unexpectedly', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const driversDir = path.resolve(__dirname, '../drivers');
  const owners = new Map();

  for (const id of fs.readdirSync(driversDir)) {
    const composePath = path.join(driversDir, id, 'driver.compose.json');
    if (!fs.existsSync(composePath)) continue;
    const compose = JSON.parse(fs.readFileSync(composePath, 'utf8'));
    if (compose.deprecated === true) continue;
    const productIds = Array.isArray(compose.zigbee?.productId)
      ? compose.zigbee.productId
      : compose.zigbee?.productId ? [compose.zigbee.productId] : [];
    for (const productId of productIds) {
      if (!owners.has(productId)) owners.set(productId, []);
      owners.get(productId).push(id);
    }
  }

  // Philips reused these Phoenix identifiers across historical fixture variants
  // in this app. Keep the ambiguity explicit until that family is split with
  // hardware-backed evidence.
  const allowed = new Set(['LLM010', 'LLM011', 'LLM012']);
  const collisions = [...owners.entries()]
    .filter(([productId, ids]) => ids.length > 1 && !allowed.has(productId))
    .map(([productId, ids]) => ({ productId, ids }));

  assert.deepEqual(collisions, []);
});

test('known product IDs are owned by their specific active driver', () => {
  const cases = [
    ['1742930P7', '1742930P7', '1743030P7'],
    ['LTC012', 'LTC012', 'LTC015'],
    ['LWA011', 'LWA001', 'LWA017'],
    ['LWF002', 'LWB000', 'LWW002'],
  ];

  for (const [productId, expectedDriver, wrongDriver] of cases) {
    const expected = require(`../drivers/${expectedDriver}/driver.compose.json`);
    const wrong = require(`../drivers/${wrongDriver}/driver.compose.json`);
    const expectedIds = Array.isArray(expected.zigbee.productId)
      ? expected.zigbee.productId : [expected.zigbee.productId];
    const wrongIds = Array.isArray(wrong.zigbee.productId)
      ? wrong.zigbee.productId : [wrong.zigbee.productId];
    assert.ok(expectedIds.includes(productId), `${productId} missing from ${expectedDriver}`);
    assert.equal(wrongIds.includes(productId), false, `${productId} still claimed by ${wrongDriver}`);
  }
});


test('LCL008 Solo Lightstrip uses a dedicated color-ambiance driver', () => {
  const compose = require('../drivers/LCL008/driver.compose.json');
  const generated = manifest.drivers.find(driver => driver.id === 'LCL008');
  assert.deepEqual(compose.zigbee.productId, ['LCL008']);
  assert.ok(generated.capabilities.includes('light_hue'));
  assert.ok(generated.capabilities.includes('light_saturation'));
  assert.ok(generated.capabilities.includes('light_temperature'));
  assert.deepEqual(generated.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
});
