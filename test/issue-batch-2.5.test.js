'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDriver } = require('./helpers');
const { applyHueLightModelProfile } = require('../lib/HueLightModelProfiles');
const evidence = require('./fixtures/device-evidence-2.5.json');
const manifest = require('../app.json');

for (const [productId, row] of Object.entries(evidence)) {
  test(`${productId}: interview-backed alias keeps exact endpoint and has no inherited OTA`, () => {
    const matches = manifest.drivers.filter(d => [].concat(d.zigbee?.productId || []).includes(productId));
    assert.equal(matches.length, 1);
    const driver = matches[0];
    assert.equal(driver.id, row.driver);
    assert.ok([].concat(driver.zigbee.manufacturerName).includes(row.manufacturerName));
    for (const cluster of driver.zigbee.endpoints['11'].clusters) {
      assert.ok(row.inputClusters.includes(cluster), `${productId}: cluster ${cluster} absent from interview`);
    }
    for (const update of driver.firmwareUpdates?.updates || []) {
      assert.ok(![].concat(update.device.productId).includes(productId));
    }
    assert.ok(row.issue.startsWith('https://github.com/JohanBendz/com.philips.hue.zigbee/issues/'));
  });
}

function profileDevice(driverId, productId) {
  const Driver = loadDriver(driverId);
  const device = new Driver();
  device.settings.zb_product_id = productId;
  device.capabilities = new Set(['onoff', 'dim', 'light_temperature']);
  if (driverId === 'LCG002') device.capabilities.add('light_hue');
  device.registerCapabilityListener = () => {};
  device.registerMultipleCapabilities = () => {};
  device.getClusterEndpoint = () => 11;
  const calls = { reads: 0, temperatures: [] };
  const zclNode = { endpoints: { 11: { clusters: {
    onOff: {}, levelControl: {},
    colorControl: {
      async readAttributes() {
        calls.reads += 1;
        return { colorCapabilities: { hueAndSaturation: true, colorTemperature: true },
          colorTempPhysicalMinMireds: 200, colorTempPhysicalMaxMireds: 400 };
      },
      async moveToColorTemperature(value) { calls.temperatures.push(value); },
    },
  } } } };
  device.zclNode = zclNode;
  return { device, zclNode, calls };
}

for (const [driver, productId, min, max] of [
  ['LTA011', 'LTA016', 50, 1000],
  ['LCG002', 'LCG008', 153, 447],
]) {
  test(`${productId}: exact-model profile is ready before light initialization and controls full range`, async () => {
    const { device, zclNode, calls } = profileDevice(driver, productId);
    await device.onNodeInit({ zclNode });
    assert.equal(calls.reads, 0);
    assert.equal(device.getStoreValue('colorTempMin'), min);
    assert.equal(device.getStoreValue('colorTempMax'), max);
    await device.changeColorTemperature(0, { duration: 1000 });
    await device.changeColorTemperature(1, { duration: 1000 });
    assert.deepEqual(calls.temperatures.map(v => v.colorTemperature), [min, max]);
    assert.ok(calls.temperatures.every(v => v.transitionTime === 10));
  });
}

for (const [driver, productId] of [['LTA011', 'LTA011'], ['LTA011', 'LTA015'], ['LCG002', 'LCG002'], ['LCG002', 'LCG006']]) {
  test(`${productId}: existing light discovery is preserved`, async () => {
    const { device, zclNode, calls } = profileDevice(driver, productId);
    await device.onNodeInit({ zclNode });
    assert.equal(calls.reads, 1);
    assert.equal(device.getStoreValue('colorTempMin'), 200);
    assert.equal(device.getStoreValue('colorTempMax'), 400);
  });
}

test('unknown models leave stored color configuration untouched', async () => {
  const { device } = profileDevice('LTA011', 'constructor');
  device.store = { colorTempMin: 173, colorTempMax: 454, colorClusterConfigured: true };
  const before = structuredClone(device.store);
  assert.equal(await applyHueLightModelProfile(device), false);
  assert.deepEqual(device.store, before);
});

for (const [productId, usageOn, usageOff] of [['LCG006', 4.2, 0.25], ['LCG008', 4.7, 0.5]]) {
  test(`${productId}: SDK selects source-backed energy values and preserves other settings`, async () => {
    const { device } = profileDevice('LCG002', productId);
    device.getEnergy = () => ({ approximation: { usageOn: 6.5, usageOff: 0.2 }, customMarker: true });
    let applied;
    device.setEnergy = async value => { applied = value; };
    await device.updateEnergyConfiguration();
    assert.deepEqual(applied, { approximation: { usageOn, usageOff }, customMarker: true });
  });
}

test('LTA016 gets its E27 energy estimate without changing older White Ambiance models', async () => {
  const { device } = profileDevice('LTA011', 'LTA016');
  device.getEnergy = () => ({ approximation: { usageOn: 13, usageOff: 0.5 } });
  let applied;
  device.setEnergy = async value => { applied = value; };
  await device.updateEnergyConfiguration();
  assert.deepEqual(applied, { approximation: { usageOn: 11.8, usageOff: 0.2 } });
  device.settings.zb_product_id = 'LTA015';
  device.setEnergy = async () => { throw new Error('older model must retain fallback'); };
  await device.updateEnergyConfiguration();
});

test('older GU10 models retain their existing energy configuration', async () => {
  const { device } = profileDevice('LCG002', 'LCG002');
  device.getEnergy = () => ({ approximation: { usageOn: 6.5, usageOff: 0.2 } });
  device.setEnergy = async () => { throw new Error('existing model must retain fallback'); };
  await device.updateEnergyConfiguration();
});

for (const [requested, clamped] of [[50, 153], [300, 300], [999, 500]]) {
  test(`Power-on temperature rejection is contained after clamping ${requested} to ${clamped}`, async () => {
    const Driver = loadDriver('LCA001');
    const device = new Driver();
    device.store = { colorTempMin: 153, colorTempMax: 500 };
    device.getClusterEndpoint = () => 11;
    const writes = [];
    device.zclNode = { endpoints: { 11: { clusters: {
      onOff: { async readAttributes() { return { powerOnCtrl: 'on' }; }, async writeAttributes(v) { writes.push(['onOff', v]); } },
      levelControl: { async writeAttributes(v) { writes.push(['level', v]); } },
      colorControl: { async writeAttributes(v) { writes.push(['color', v]); throw new Error('UNSUPPORTED_ATTRIBUTE'); } },
    } } } };
    await assert.doesNotReject(device.onSettings({ oldSettings: {}, changedKeys: ['powerOnCtrl_colorvalue'],
      newSettings: { powerOnCtrl_state: 'recover', powerOnCtrl_dimvalue: 200, powerOnCtrl_colorvalue: requested } }));
    assert.deepEqual(writes, [['onOff', { powerOnCtrl: 'recover' }], ['level', { powerOnCtrl: 200 }], ['color', { powerOnCtrl: clamped }]]);
  });
}

test('native duration is enabled only on existing actions with duration-aware handlers', () => {
  for (const id of ['set_light_state', 'adjust_light_temperature']) {
    const card = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.homeycompose/flow/actions', `${id}.json`)));
    assert.equal(card.id, id);
    assert.equal(card.duration, true);
    assert.match(card.args.find(a => a.type === 'device').filter, /^driver_id=/);
  }
});
