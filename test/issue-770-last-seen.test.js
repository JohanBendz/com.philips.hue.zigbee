'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { markHueLastSeenFromTraffic, MIN_UPDATE_INTERVAL_MS } = require('../lib/HueLastSeen');
const { remote, buttonFrame } = require('./helpers');

test('last-seen writes are per-device and throttled without extra Zigbee traffic', async () => {
  let writesA = 0;
  let writesB = 0;
  const a = { setLastSeenAt: async () => { writesA += 1; } };
  const b = { setLastSeenAt: async () => { writesB += 1; } };

  assert.equal(await markHueLastSeenFromTraffic(a, 1000), true);
  assert.equal(await markHueLastSeenFromTraffic(a, 1000), false);
  assert.equal(await markHueLastSeenFromTraffic(a, 1000 + MIN_UPDATE_INTERVAL_MS - 1), false);
  assert.equal(await markHueLastSeenFromTraffic(b, 1000), true);
  assert.equal(await markHueLastSeenFromTraffic(a, 1000 + MIN_UPDATE_INTERVAL_MS), true);
  assert.equal(writesA, 2);
  assert.equal(writesB, 1);
});

test('missing SDK method skips telemetry without touching availability', async () => {
  assert.equal(await markHueLastSeenFromTraffic({ setAvailable: async () => {
    throw new Error('must not be called');
  } }, 1000), false);
});

test('last-seen failures are handled independently and can retry on real traffic', async () => {
  const expected = new Error('Homey transient error');
  let attempts = 0;
  const errors = [];
  const device = {
    setLastSeenAt: async () => {
      attempts += 1;
      if (attempts === 1) throw expected;
    },
    error: (...args) => errors.push(args),
  };
  assert.equal(await markHueLastSeenFromTraffic(device, 3000), false);
  assert.equal(errors.length, 1);
  assert.equal(errors[0][1], expected);
  assert.equal(await markHueLastSeenFromTraffic(device, 3000), true);
  assert.equal(attempts, 2);
});

test('Tap Dial records genuine recognized button traffic but not invalid frames', async () => {
  const { device, calls } = remote('RDM002');
  let lastSeenUpdates = 0;
  device.setLastSeenAt = async () => { lastSeenUpdates += 1; };
  await device.onNodeInit({ zclNode: device.zclNode });

  await device._buttonCommandParser(Buffer.alloc(5)); // invalid
  await Promise.resolve();
  assert.equal(lastSeenUpdates, 0);

  await device._buttonCommandParser(buttonFrame(1, 0));
  await Promise.resolve();
  assert.equal(lastSeenUpdates, 1);
  assert.equal(calls[0].state.action, 'Button1-Press');

  await device._buttonCommandParser(buttonFrame(1, 1)); // high-frequency valid event
  await Promise.resolve();
  assert.equal(lastSeenUpdates, 1, 'no repeated telemetry write within one minute');
  assert.equal(calls[1].state.action, 'Button1-Hold');
});

test('RWL022 last-seen update only follows accepted incoming button traffic', async () => {
  const { device, calls } = remote('RWL022');
  let updates = 0;
  device.setLastSeenAt = async () => { updates += 1; };
  await device.onNodeInit({ zclNode: device.zclNode });
  await device._buttonCommandParser(Buffer.alloc(5));
  await Promise.resolve();
  assert.equal(updates, 0);

  await device._buttonCommandParser(buttonFrame(2, 0));
  await Promise.resolve();
  assert.equal(updates, 1);
  assert.equal(calls[0].state.action, 'DimUp-ShortPress');
});
