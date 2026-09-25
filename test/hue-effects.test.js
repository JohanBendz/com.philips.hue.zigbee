'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');
const HueSpecificPhilips2Cluster = require('../lib/HueSpecificPhilips2Cluster');

function effectFixture(withNativeEffects = true) {
  const Driver = loadDriver('LCA001');
  const device = new Driver();
  const payloads = [];

  device.capabilities = new Set(['onoff', 'dim', 'light_hue', 'light_saturation']);
  device.values = { onoff: false };
  device.zclNode = {
    endpoints: {
      11: {
        clusters: withNativeEffects ? {
          huePhilips2: {
            async multiColor({ data }) {
              payloads.push(Buffer.from(data));
            },
          },
        } : {},
      },
    },
  };

  return { device, payloads };
}

test('Hue Philips2 cluster matches Signify native effect protocol', () => {
  assert.equal(HueSpecificPhilips2Cluster.ID, 0xfc03);
  assert.equal(HueSpecificPhilips2Cluster.NAME, 'huePhilips2');
  assert.equal(HueSpecificPhilips2Cluster.COMMANDS.multiColor.id, 0x00);
  assert.equal(HueSpecificPhilips2Cluster.COMMANDS.multiColor.manufacturerId, 0x100b);
});

test('native Hue Candle and Fireplace use verified Bifrost payloads', async () => {
  const { device, payloads } = effectFixture();

  await device.setHueEffect({ effect: 'candle' });
  await device.setHueEffect({ effect: 'fireplace' });

  assert.deepEqual(payloads.map(buffer => buffer.toString('hex')), [
    '21000101',
    '21000102',
  ]);
  assert.equal(device.values.onoff, true);
});

test('stopping a native Hue effect uses the dedicated stop payload', async () => {
  const { device, payloads } = effectFixture();

  await device.setHueEffect({ effect: 'none' });

  assert.equal(payloads[0].toString('hex'), '200000');
});

test('Hue effects fail safely when the physical endpoint lacks cluster 0xfc03', async () => {
  const { device, payloads } = effectFixture(false);

  await assert.rejects(
    device.setHueEffect({ effect: 'candle' }),
    /does not support native Candle\/Fireplace effects/,
  );
  assert.equal(payloads.length, 0);
});

test('gradient color encoding matches upstream Bifrost for non-primary RGB', () => {
  const { device } = effectFixture();

  assert.equal(device._encodeGradientColor('#663399'), 'b9f642');
  assert.equal(device._encodeGradientColor('#336699'), '066556');
});

test('native Hue three-color gradient matches verified Bifrost encoding', async () => {
  const { device, payloads } = effectFixture();

  await device.setHueGradient({
    color1: '#FF0000',
    color2: '#00FF00',
    color3: '#0000FF',
  });

  assert.equal(
    payloads[0].toString('hex'),
    '500104000d30000000f3620cc153e741bf5c1800',
  );
  assert.equal(device.values.onoff, true);
});

test('Hue gradient fails safely without Philips2 cluster', async () => {
  const { device, payloads } = effectFixture(false);

  await assert.rejects(
    device.setHueGradient({
      color1: '#FF0000',
      color2: '#00FF00',
      color3: '#0000FF',
    }),
    /does not support native gradient control/,
  );
  assert.equal(payloads.length, 0);
});
