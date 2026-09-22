'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');
const manifest = require('../app.json');

test('Xamento recessed spot exposes color ambiance and avoids Zigbee level 1', async () => {
  const generated = manifest.drivers.find(driver => driver.id === '929003074701');
  assert.deepEqual(generated.zigbee.productId, ['929003074701']);
  for (const capability of ['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature']) {
    assert.ok(generated.capabilities.includes(capability), capability);
  }

  const Driver = loadDriver('929003074701');
  const device = new Driver();
  device.capabilities = new Set(['onoff', 'dim']);
  device.values.onoff = true;
  const commands = [];
  Object.defineProperty(device, 'levelControlCluster', {
    value: {
      moveToLevelWithOnOff: async command => {
        commands.push(command);
      },
    },
  });

  await device.changeDimLevel(1 / 254);
  assert.equal(commands[0].level, 2);

  await device.changeDimLevel(0);
  assert.equal(commands[1].level, 0);
  assert.equal(device.values.onoff, false);
});
