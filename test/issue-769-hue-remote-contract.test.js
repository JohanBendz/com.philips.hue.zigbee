'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Cluster, ZCLNode, BoundCluster } = require('zigbee-clusters');
const HueSpecificCluster = require('../lib/HueSpecificCluster');
const HueSpecificBoundCluster = require('../lib/HueSpecificBoundCluster');
const { remote } = require('./helpers');

test('Hue manufacturer cluster retains its registered identity and command ID', () => {
  assert.equal(HueSpecificCluster.ID, 0xfc00);
  assert.equal(HueSpecificCluster.NAME, 'hue');
  assert.equal(HueSpecificCluster.COMMANDS.button.id, 0);
  assert.ok(HueSpecificBoundCluster.prototype instanceof BoundCluster);
});

test('real ZCL endpoint can bind the Hue-specific BoundCluster', async () => {
  Cluster.addCluster(HueSpecificCluster);
  const sent = [];
  const node = {
    endpointDescriptors: [{
      endpointId: 1, inputClusters: [0xfc00], outputClusters: [0xfc00],
    }],
    sendFrame: async (...args) => { sent.push(args); },
  };
  const zclNode = new ZCLNode(node);
  const input = Object.freeze({
    button: 20,
    action: 'rotary',
    direction: 'left',
    rawValue: 0x1234,
  });
  const received = [];
  const bound = new HueSpecificBoundCluster({
    onButton: async payload => {
      received.push(payload);
      return 'forwarded';
    },
  });

  zclNode.endpoints[1].bind(HueSpecificCluster.NAME, bound);
  assert.equal(zclNode.endpoints[1].bindings.hue, bound);
  assert.equal(bound.cluster, HueSpecificCluster);
  assert.equal(await bound.button(input), 'forwarded');
  assert.equal(received[0], input, 'do not discard unknown fields, including rotary data');
  assert.deepEqual(sent, [], 'the callback itself must not produce outgoing traffic');
});

test('Hue-specific BoundCluster propagates callback failures to its caller', async () => {
  const expected = new Error('button dispatch failed');
  const bound = new HueSpecificBoundCluster({
    onButton: async () => { throw expected; },
  });

  await assert.rejects(() => bound.button({ button: 1 }), err => err === expected);
  assert.equal(new HueSpecificBoundCluster({}).button({ button: 1 }), undefined);
});

test('Tap Dial preserves the existing ring direction and speed Flow action IDs', async () => {
  const { device, calls } = remote('RDM002');
  await device.onNodeInit({ zclNode: device.zclNode });

  const ring = (direction, time, length = 18) => {
    // Synthetic LEGACY raw-frame offsets, NOT captured hardware frames.
    const frame = Buffer.alloc(length);
    frame[5] = 20;
    if (length >= 18) {
      frame[12] = direction;
      frame[17] = time;
    }
    return frame;
  };

  const cases = [
    [0xff, 231, 'Ring-RotateLeftStep'],
    [0x00, 25, 'Ring-RotateRightStep'],
    [0x00, 50, 'Ring-RotateRightSlow'],
    [0x00, 100, 'Ring-RotateRightFast'],
  ];
  for (const [direction, time] of cases) {
    await device._buttonCommandParser(ring(direction, time));
  }
  assert.deepEqual(calls.map(call => call.state.action), cases.map(testCase => testCase[2]));

  await device._buttonCommandParser(ring(0x7f, 25));
  await device._buttonCommandParser(ring(0x00, 25, 17));
  assert.equal(calls.length, cases.length, 'unknown/truncated rotations must not emit a Flow event');
});
