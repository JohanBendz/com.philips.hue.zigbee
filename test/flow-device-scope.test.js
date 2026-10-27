'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const manifest = require('../app.json');
const flowDir = path.join(root, '.homeycompose', 'flow');

const flowFiles = ['actions', 'conditions', 'triggers']
  .flatMap(kind => {
    const dir = path.join(flowDir, kind);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(name => name.endsWith('.json'))
      .map(name => path.join(dir, name));
  });

function driverIdsFromFilter(filter) {
  const match = String(filter || '').match(/(?:^|&)driver_id=([^&]+)/);
  return match ? match[1].split('|').filter(Boolean).sort() : [];
}

function expectedDriverIds({ deviceClass, capabilities = [] }) {
  return manifest.drivers
    .filter(driver => driver.class === deviceClass)
    .filter(driver => capabilities.every(capability => (driver.capabilities || []).includes(capability)))
    .map(driver => driver.id)
    .sort();
}

const expectedByCard = {
  Alert_v2: expectedDriverIds({ deviceClass: 'light' }),
  Blink_v2: expectedDriverIds({ deviceClass: 'light' }),
  start_dim_v2: expectedDriverIds({ deviceClass: 'light', capabilities: ['dim'] }),
  stop_dim_v2: expectedDriverIds({ deviceClass: 'light', capabilities: ['dim'] }),
  set_light_state_v2: expectedDriverIds({ deviceClass: 'light', capabilities: ['dim', 'light_hue', 'light_saturation'] }),
  adjust_light_temperature_v2: expectedDriverIds({ deviceClass: 'light', capabilities: ['light_temperature'] }),
  hue_effect_v2: expectedDriverIds({ deviceClass: 'light', capabilities: ['light_hue', 'light_saturation'] }),
  hue_gradient_3_v2: expectedDriverIds({ deviceClass: 'light', capabilities: ['light_hue', 'light_saturation'] }),
  suppress_sensor_v2: ['SML001-occupancy', 'SML002-occupancy'],
  temperature_above_v2: expectedDriverIds({ deviceClass: 'sensor', capabilities: ['measure_temperature'] }),
  luminance_above_v2: expectedDriverIds({ deviceClass: 'sensor', capabilities: ['measure_luminance'] }),
};

test('every active app-global device Flow argument is scoped by driver_id', () => {
  for (const filename of flowFiles) {
    const card = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (card.deprecated === true) continue;

    for (const arg of card.args || []) {
      if (arg.type !== 'device') continue;

      assert.match(
        String(arg.filter || ''),
        /(?:^|&)driver_id=[^&]+/,
        `${path.relative(root, filename)}: global device argument must include driver_id`,
      );
    }
  }
});

test('active device-scoped Flow cards expose exactly the intended Hue drivers', () => {
  for (const filename of flowFiles) {
    const card = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (card.deprecated === true) continue;
    const deviceArg = (card.args || []).find(arg => arg.type === 'device');

    if (!deviceArg || !Object.hasOwn(expectedByCard, card.id)) continue;

    assert.deepEqual(
      driverIdsFromFilter(deviceArg.filter),
      expectedByCard[card.id],
      `${card.id}: driver_id scope must match the intended Hue driver set`,
    );
  }
});

test('known foreign driver IDs cannot be selected by active Hue global Flow cards', () => {
  const foreign = new Set(['motionsensor', 'bulb', 'motion.ac02', 'tunable_white_bulb']);

  for (const filename of flowFiles) {
    const card = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (card.deprecated === true) continue;

    for (const arg of card.args || []) {
      if (arg.type !== 'device') continue;

      for (const driverId of driverIdsFromFilter(arg.filter)) {
        assert.equal(
          foreign.has(driverId),
          false,
          `${card.id}: foreign driver ${driverId} leaked into Hue Flow scope`,
        );
      }
    }
  }
});

test('device-scoped global cards do not use [[device]] in titleFormatted', () => {
  for (const filename of flowFiles) {
    const card = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (card.deprecated === true) continue;
    const deviceArg = (card.args || []).find(arg => arg.type === 'device');

    if (!deviceArg || !/(?:^|&)driver_id=[^&]+/.test(String(deviceArg.filter || ''))) continue;

    for (const [language, title] of Object.entries(card.titleFormatted || {})) {
      assert.doesNotMatch(
        String(title),
        /\[\[device\]\]/,
        `${card.id} (${language}): driver-scoped cards must not render [[device]] in titleFormatted`,
      );
    }
  }
});
