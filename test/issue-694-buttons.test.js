'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver, buttonFrame } = require('./helpers');

function twilightParserFixture() {
  const Driver = loadDriver('LGT002');
  const device = new Driver();
  const calls = [];

  device._twilightTriggerDevice = {
    async trigger(target, tokens, state) {
      calls.push({ target, tokens, state });
    },
  };

  return { device, calls };
}

test('issue #694: Twilight maps dot/Hue press lifecycle events', async () => {
  const { device, calls } = twilightParserFixture();

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
});

test('issue #694: invalid Twilight frames are ignored', async () => {
  const { device, calls } = twilightParserFixture();

  for (const frame of [null, Buffer.alloc(5), buttonFrame(3, 0), buttonFrame(1, 9)]) {
    await device._buttonCommandParser(frame);
  }

  assert.equal(calls.length, 0);
});
