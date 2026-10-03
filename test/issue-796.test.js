'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../app.json');

const TENTO = [
  { id: '929003822901', name: 'Tento S White Ambiance', usageOn: 16.6 },
  { id: '929003823101', name: 'Tento M White Ambiance', usageOn: 23 },
];

test('Tento S/M expose White Ambiance controls from the supplied interviews', () => {
  for (const { id, name, usageOn } of TENTO) {
    const driver = manifest.drivers.find(item => item.id === id);
    assert.ok(driver, id);
    assert.equal(driver.name.en, name);
    assert.deepEqual(driver.zigbee.productId, [id]);

    // Both interviews report the light on endpoint 11, no color-capable clusters
    // beyond colour temperature.
    assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 6, 8, 768]);
    assert.deepEqual(driver.capabilities, ['onoff', 'dim', 'light_temperature']);
    assert.equal(driver.capabilities.includes('light_hue'), false);
    assert.equal(driver.capabilities.includes('light_mode'), false);

    assert.deepEqual(driver.energy.approximation, { usageOn, usageOff: 0.5 });
    assert.ok(driver.settings.some(setting =>
      setting.children?.some(child => child.id === 'powerOnCtrl_state')));
  }
});
