'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CLUSTER } = require('zigbee-clusters');
const { loadDriver } = require('./helpers');
const manifest = require('../app.json');

test('Twilight exposes independent front/back standard light zones', () => {
  const driver = manifest.drivers.find(item => item.id === 'LGT002');
  assert.ok(driver);
  assert.deepEqual(driver.zigbee.productId, ['LGT001', 'LGT002', 'LGT003']);
  assert.ok(driver.zigbee.devices.back);
  assert.ok(driver.zigbee.devices.back.capabilities.includes('light_temperature'));
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 5, 6, 8, 768]);
  assert.deepEqual(driver.zigbee.endpoints['12'].clusters, [0, 3, 4, 5, 6, 8, 768]);
});

test('Twilight shared Light routing stays isolated per zone', () => {
  const Driver = loadDriver('LGT002');
  const device = new Driver();
  device.zclNode = {
    endpoints: {
      11: {
        clusters: {
          onOff: {},
          levelControl: {},
          colorControl: {},
          identify: {},
        },
      },
      12: {
        clusters: {
          onOff: {},
          levelControl: {},
          colorControl: {},
          identify: {},
        },
      },
    },
  };

  device.getData = () => ({});
  assert.equal(device.getClusterEndpoint(CLUSTER.ON_OFF), 12);
  assert.equal(device.getClusterEndpoint(CLUSTER.COLOR_CONTROL), 12);

  device.getData = () => ({ subDeviceId: 'back' });
  assert.equal(device.getClusterEndpoint(CLUSTER.ON_OFF), 11);
  assert.equal(device.getClusterEndpoint(CLUSTER.COLOR_CONTROL), 11);

  device.getData = () => ({ subDeviceId: 'unexpected' });
  assert.throws(() => device.getClusterEndpoint(CLUSTER.ON_OFF), /Unknown Twilight subdevice/);
});
