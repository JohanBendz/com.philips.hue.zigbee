'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CLUSTER } = require('zigbee-clusters');
const { loadDriver } = require('./helpers');
const HueSpecificPhilips2Cluster = require('../lib/HueSpecificPhilips2Cluster');
const manifest = require('../app.json');

test('Twilight exposes independent front/back standard light zones', () => {
  const driver = manifest.drivers.find(item => item.id === 'LGT002');
  assert.ok(driver);
  assert.deepEqual(driver.zigbee.productId, ['LGT001', 'LGT002', 'LGT003']);
  assert.ok(driver.zigbee.devices.back);
  assert.ok(driver.zigbee.devices.back.capabilities.includes('light_temperature'));
  assert.deepEqual(driver.zigbee.endpoints['11'].clusters, [0, 3, 4, 5, 6, 8, 768, 64515]);
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

test('Twilight native gradient/effect routing is back-zone only', async () => {
  const Driver = loadDriver('LGT002');
  const device = new Driver();
  const payloads = [];
  device.capabilities = new Set(['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature', 'light_mode']);
  device.values = {};
  device.zclNode = {
    endpoints: {
      11: {
        clusters: {
          huePhilips2: {
            async multiColor({ data }) { payloads.push(Buffer.from(data)); },
          },
        },
      },
      12: { clusters: {} },
    },
  };

  device.getData = () => ({});
  assert.equal(device.getClusterEndpoint(HueSpecificPhilips2Cluster), null);
  await assert.rejects(
    device.setHueGradient({ color1: '#FF0000', color2: '#00FF00', color3: '#0000FF' }),
    /does not support native gradient control/,
  );
  assert.equal(payloads.length, 0);

  device.getData = () => ({ subDeviceId: 'back' });
  assert.equal(device.getClusterEndpoint(HueSpecificPhilips2Cluster), 11);
  await device.setHueGradient({ color1: '#FF0000', color2: '#00FF00', color3: '#0000FF' });
  assert.equal(payloads.length, 1);
});
