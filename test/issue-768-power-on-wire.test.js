'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OnOffCluster, LevelControlCluster, ColorControlCluster } = require('zigbee-clusters');
const { toStandardStartupState } = require('../lib/HuePowerOnStartup');

// Exercise the pinned zigbee-clusters@3.8.0 serializer that Cluster.writeAttributes
// actually calls. This verifies wire payloads, not just mocked method arguments.
function encodeWriteAttribute(clusterClass, id, value) {
  const output = Buffer.alloc(32);
  const length = clusterClass.attributeArrayDataType.toBuffer(output, [{ id, value }], 0);
  return output.subarray(0, length);
}

test('saved Off/On/Recover values encode correctly using standard startup On/Off', () => {
  for (const [saved, bytes] of [
    ['off', [0x03, 0x40, 0x30, 0x00]],
    ['on', [0x03, 0x40, 0x30, 0x01]],
    ['recover', [0x03, 0x40, 0x30, 0xff]],
  ]) {
    const result = encodeWriteAttribute(OnOffCluster, 0x4003, toStandardStartupState(saved));
    assert.deepEqual([...result], bytes, saved);
  }
});

test('standard startup brightness keeps existing 255 as uint8', () => {
  const encoded = encodeWriteAttribute(LevelControlCluster, 0x4000, 255);
  assert.deepEqual([...encoded], [0x00, 0x40, 0x20, 0xff]);
});

test('standard startup color temperature keeps 366 mired as little-endian uint16', () => {
  const encoded = encodeWriteAttribute(ColorControlCluster, 0x4010, 366);
  assert.deepEqual([...encoded], [0x10, 0x40, 0x21, 0x6e, 0x01]);
});
