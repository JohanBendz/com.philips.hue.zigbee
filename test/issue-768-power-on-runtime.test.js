'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');

function lightFixture(id, { colorTempMin = null, colorTempMax = null, failRead = false } = {}) {
  const Driver = loadDriver(id);
  const device = new Driver();
  const calls = [];
  const record = (cluster, operation) => async value => {
    calls.push({ cluster, operation, value });
    if (cluster === 'onOff' && operation === 'read' && failRead) {
      throw new Error('unsupported startup attribute');
    }
    return {};
  };

  device.zclNode = {
    endpoints: {
      11: {
        clusters: {
          onOff: {
            readAttributes: record('onOff', 'read'),
            writeAttributes: record('onOff', 'write'),
          },
          levelControl: { writeAttributes: record('levelControl', 'write') },
          colorControl: { writeAttributes: record('colorControl', 'write') },
        },
      },
    },
  };
  device.getClusterEndpoint = () => 11;
  device.store = { colorTempMin, colorTempMax };
  return { device, calls };
}

function powerOnSettings(state, brightness = 255, temperature = 366) {
  return {
    oldSettings: {},
    newSettings: {
      powerOnCtrl_state: state,
      powerOnCtrl_dimvalue: brightness,
      powerOnCtrl_colorvalue: temperature,
    },
    changedKeys: ['powerOnCtrl_state'],
  };
}

test('White light preserves Off/On/Recover settings using standard startup attributes', async () => {
  for (const [saved, standard] of [
    ['off', 'off'],
    ['on', 'on'],
    ['recover', 'previous'],
  ]) {
    const { device, calls } = lightFixture('LWB000');
    await device.onSettings(powerOnSettings(saved, 255));
    assert.deepEqual(calls, [
      { cluster: 'onOff', operation: 'read', value: ['startUpOnOff'] },
      { cluster: 'onOff', operation: 'write', value: { startUpOnOff: standard } },
      { cluster: 'levelControl', operation: 'write', value: { startUpCurrentLevel: 255 } },
    ]);
  }
});

test('White Ambiance and Color Ambiance preserve brightness and physical mired limits', async () => {
  for (const [id, limits, temperature, expected] of [
    ['LTA011', { colorTempMin: 153, colorTempMax: 454 }, 800, 454],
    ['LCA001', { colorTempMin: 153, colorTempMax: 500 }, 100, 153],
    ['LCA001', { colorTempMin: 153, colorTempMax: 500 }, 366, 366],
  ]) {
    const { device, calls } = lightFixture(id, limits);
    await device.onSettings(powerOnSettings('recover', 200, temperature));
    assert.deepEqual(calls.map(call => call.value), [
      ['startUpOnOff'],
      { startUpOnOff: 'previous' },
      { startUpCurrentLevel: 200 },
      { startUpColorTemperatureMireds: expected },
    ]);
  }
});

test('unsupported On/Off startup attribute preserves old best-effort handling', async () => {
  const { device, calls } = lightFixture('LCA001', {
    colorTempMin: 153, colorTempMax: 500, failRead: true,
  });
  await device.onSettings(powerOnSettings('on', 128, 366));
  assert.deepEqual(calls, [
    { cluster: 'onOff', operation: 'read', value: ['startUpOnOff'] },
    // As before, temperature is attempted independently of the On/Off read.
    { cluster: 'colorControl', operation: 'write', value: { startUpColorTemperatureMireds: 366 } },
  ]);
});

test('non-power-on settings cause no additional Zigbee traffic', async () => {
  const { device, calls } = lightFixture('LWB000');
  await device.onSettings({
    oldSettings: {},
    newSettings: { powerOnCtrl_state: 'on', powerOnCtrl_dimvalue: 255 },
    changedKeys: ['some_other_setting'],
  });
  assert.deepEqual(calls, []);
});

function plugFixture({ failRead = false } = {}) {
  const Driver = loadDriver('LOM002');
  const device = new Driver();
  const calls = [];
  const cluster = {
    async readAttributes(attrs) {
      calls.push({ operation: 'read', value: attrs });
      if (failRead) throw new Error('unsupported startup attribute');
      return {};
    },
    async writeAttributes(value) {
      calls.push({ operation: 'write', value });
    },
  };
  device.zclNode = { endpoints: { 1: { clusters: { onOff: cluster } } } };
  device.getClusterEndpoint = () => 1;
  return { device, calls };
}

test('Smart Plug sends only standard On/Off startup values', async () => {
  for (const [saved, standard] of [
    ['off', 'off'],
    ['on', 'on'],
    ['recover', 'previous'],
  ]) {
    const { device, calls } = plugFixture();
    await device.onSettings({
      oldSettings: {}, newSettings: { powerOnCtrl_state: saved }, changedKeys: ['powerOnCtrl_state'],
    });
    assert.deepEqual(calls, [
      { operation: 'read', value: ['startUpOnOff'] },
      { operation: 'write', value: { startUpOnOff: standard } },
    ]);
  }
});

test('Smart Plug does not write after an unsupported read or unrelated setting', async () => {
  const { device, calls } = plugFixture({ failRead: true });
  await device.onSettings({
    oldSettings: {}, newSettings: { powerOnCtrl_state: 'recover' }, changedKeys: ['powerOnCtrl_state'],
  });
  assert.deepEqual(calls, [{ operation: 'read', value: ['startUpOnOff'] }]);
  calls.length = 0;
  await device.onSettings({
    oldSettings: {}, newSettings: { powerOnCtrl_state: 'recover' }, changedKeys: ['unrelated'],
  });
  assert.deepEqual(calls, []);
});
