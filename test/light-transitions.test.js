'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');

function lightFixture() {
  const Driver = loadDriver('LCA001');
  const device = new Driver();
  const commands = { level: [], color: [], temperature: [] };

  device.capabilities = new Set([
    'onoff',
    'dim',
    'light_hue',
    'light_saturation',
    'light_temperature',
    'light_mode',
  ]);
  device.values = {
    onoff: true,
    dim: 0.5,
    light_hue: 0.2,
    light_saturation: 0.4,
    light_temperature: 0.5,
    light_mode: 'color',
  };
  device.store = {
    colorCapabilities: { hueAndSaturation: true, colorTemperature: true },
    colorTempMin: 153,
    colorTempMax: 500,
  };
  device.getClusterEndpoint = () => 11;
  device.zclNode = {
    endpoints: {
      11: {
        clusters: {
          levelControl: {
            async moveToLevelWithOnOff(command) { commands.level.push(command); },
          },
          colorControl: {
            async moveToHueAndSaturation(command) { commands.color.push(command); },
            async moveToColorTemperature(command) { commands.temperature.push(command); },
          },
          onOff: {},
        },
      },
    },
  };

  return { device, commands };
}

test('lights use Hue-like 400 ms fallback when Homey supplies no duration', async () => {
  const { device, commands } = lightFixture();

  await device.changeDimLevel(0.25);
  await device.changeColor({ hue: 0.3, saturation: 0.6 });
  await device.changeColorTemperature(0.7);

  assert.equal(commands.level[0].transitionTime, 4);
  assert.equal(commands.color[0].transitionTime, 4);
  assert.equal(commands.temperature[0].transitionTime, 4);
});

test('explicit transition duration always wins, including instant 0 ms', async () => {
  const { device, commands } = lightFixture();

  await device.changeDimLevel(0.25, { duration: 2500 });
  await device.changeColor({ hue: 0.3, saturation: 0.6 }, { duration: 0 });
  await device.changeColorTemperature(0.7, { duration: 1200 });

  assert.equal(commands.level[0].transitionTime, 25);
  assert.equal(commands.color[0].transitionTime, 0);
  assert.equal(commands.temperature[0].transitionTime, 12);
});
