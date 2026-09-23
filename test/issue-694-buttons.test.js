'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver, buttonFrame } = require('./helpers');

function twilightFixture(data = { id: 'twilight' }) {
  const Driver = loadDriver('LGT002');
  const device = new Driver();
  const calls = [];
  const frames = [];
  const node = {
    async handleFrame(...args) { frames.push({ receiver: this, args }); },
  };
  const card = {
    registerRunListener(fn) { this.listener = fn; return this; },
    async trigger(target, tokens, state) { calls.push({ target, tokens, state }); },
  };

  device.data = data;
  device.capabilities = new Set();
  device.zclNode = { endpoints: {} };
  device.homey = {
    zigbee: { getNode: async () => node },
    flow: { getDeviceTriggerCard: () => card },
  };

  // This test targets the Twilight event layer only; standard light setup is
  // covered by the shared light tests.
  device.__proto__.__proto__.onNodeInit = async function noop() {};

  return { device, node, card, calls, frames };
}

test('issue #694: Twilight maps dot/Hue press lifecycle events', async () => {
  const { device, calls } = twilightFixture();
  const card = {
    registerRunListener(fn) { this.listener = fn; return this; },
    async trigger(target, tokens, state) { calls.push({ target, tokens, state }); },
  };
  device._twilightTriggerDevice = card;

  for (const [button, action] of [[1, 0], [1, 1], [1, 2], [1, 3], [2, 0], [2, 3]]) {
    await device._buttonCommandParser(buttonFrame(button, action));
  }

  assert.deepEqual(calls.map(call => call.state.action), [
    'Dot-Press',
    'Dot-Hold',
    'Dot-Release',
    'Dot-LongRelease',
    'Hue-Press',
    'Hue-LongRelease',
  ]);
  assert.equal(await card.listener?.({ action: 'Dot-Press' }, { action: 'Dot-Press' }), undefined);
});

test('issue #694: invalid Twilight frames are ignored', async () => {
  const { device, calls } = twilightFixture();
  device._twilightTriggerDevice = {
    async trigger(target, tokens, state) { calls.push({ target, tokens, state }); },
  };

  for (const frame of [null, Buffer.alloc(5), buttonFrame(3, 0), buttonFrame(1, 9)]) {
    await device._buttonCommandParser(frame);
  }
  assert.equal(calls.length, 0);
});
