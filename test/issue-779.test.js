'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');

test('LWM007 manifest keeps load control on endpoint 11 and switch configuration on endpoint 1', () => {
  const compose = require('../drivers/LWM007/driver.compose.json');

  assert.deepEqual(compose.zigbee.productId, ['LWM007']);
  assert.deepEqual(compose.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8]);
  assert.deepEqual(compose.zigbee.endpoints['1'].clusters, [0, 3, 64512]);
});

test('LWM007 reads switch mode without writing it back automatically', async () => {
  const Driver = loadDriver('LWM007');
  const device = new Driver();
  const writes = [];
  const settingsWrites = [];

  device.settings.mode = 'singlerocker';
  device.zclNode = {
    endpoints: {
      1: {
        clusters: {
          basic: {
            readAttributes: async () => ({ deviceMode: 'singlepushbutton' }),
            writeAttributes: async value => writes.push(value),
          },
        },
      },
    },
  };
  device.setSettings = async value => {
    settingsWrites.push(value);
    Object.assign(device.settings, value);
  };

  assert.equal(await device._syncSwitchModeFromDevice(), 'singlepushbutton');
  assert.deepEqual(settingsWrites, [{ mode: 'singlepushbutton' }]);
  assert.deepEqual(writes, []);
});

test('LWM007 writes only the explicitly selected single-input switch mode', async () => {
  const Driver = loadDriver('LWM007');
  const device = new Driver();
  const writes = [];

  device.zclNode = {
    endpoints: {
      1: {
        clusters: {
          basic: {
            writeAttributes: async value => writes.push(value),
          },
        },
      },
    },
  };

  await device.onSettings({
    oldSettings: { mode: 'singlerocker' },
    newSettings: { mode: 'singlepushbutton' },
    changedKeys: ['mode'],
  });

  assert.deepEqual(writes, [{ deviceMode: 'singlepushbutton' }]);

  await assert.rejects(
    device.onSettings({
      oldSettings: { mode: 'singlepushbutton' },
      newSettings: { mode: 'dualpushbutton' },
      changedKeys: ['mode'],
    }),
    /Unsupported LWM007 switch type/,
  );
});
