'use strict';

const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseHueRemoteBattery, observeHueRemoteBatteryReports } =
  require('../lib/HueRemoteBattery');
const { batteryFixture } = require('./remote-battery-fixture');

const tick = () => new Promise(resolve => setImmediate(resolve));

test('strict remote SDK battery report parser preserves all ZCL boundaries', () => {
  for (const [raw, homey] of [
    [0, 0], [1, 1], [50, 25], [100, 50], [150, 75],
    [199, 100], [200, 100],
    [255, null], [201, null], [-1, null], [NaN, null],
    [Infinity, null], [null, null], [undefined, null],
    [1.5, null], ['100', null],
  ]) {
    assert.equal(parseHueRemoteBattery(raw), homey, String(raw));
  }
});

test('report observer is telemetry only and never writes measure_battery', async () => {
  const cluster = new EventEmitter();
  const calls = { lastSeen: 0, available: 0, capability: 0 };
  const device = {
    setLastSeenAt: async () => { calls.lastSeen += 1; },
    setAvailable: async () => { calls.available += 1; },
    setCapabilityValue: async () => { calls.capability += 1; },
    error() {},
  };
  const remove = observeHueRemoteBatteryReports(device, cluster);
  cluster.emit('attr.batteryPercentageRemaining', 160);
  cluster.emit('attr.batteryPercentageRemaining', 255);
  await tick();
  assert.equal(calls.lastSeen, 1);
  assert.equal(calls.available, 0);
  assert.equal(calls.capability, 0);
  remove();
  cluster.emit('attr.batteryPercentageRemaining', 100);
  await tick();
  assert.equal(calls.lastSeen, 1);
});

test('report observer can preserve original availability recovery without duplicate battery writes', async () => {
  const cluster = new EventEmitter();
  const calls = { lastSeen: 0, available: 0, capability: 0 };
  const device = {
    setLastSeenAt: async () => { calls.lastSeen += 1; },
    setAvailable: async () => { calls.available += 1; },
    setCapabilityValue: async () => { calls.capability += 1; },
    error() {},
  };
  const remove = observeHueRemoteBatteryReports(device, cluster, { recoverAvailability: true });
  cluster.emit('attr.batteryPercentageRemaining', 0);
  cluster.emit('attr.batteryPercentageRemaining', 200);
  cluster.emit('attr.batteryPercentageRemaining', -1);
  cluster.emit('attr.batteryPercentageRemaining', 255);
  await tick();
  assert.equal(calls.available, 2, 'no availability recovery on malformed battery');
  assert.equal(calls.lastSeen, 1, 'shared one-minute throttle');
  assert.equal(calls.capability, 0, 'the SDK mapping owns capability updates');
  remove();
});

for (const id of ['RDM001', 'RDM002', 'RWL022']) {
  test(`${id}: remote uninit removes only our battery observer, not the SDK listener`, async () => {
    const { device, cluster, updates } = batteryFixture(id);
    let seen = 0;
    let availability = 0;
    device.setLastSeenAt = async () => { seen += 1; };
    device.setAvailable = async () => { availability += 1; };
    await device.onNodeInit({ zclNode: device.zclNode });
    const count = cluster.listenerCount('attr.batteryPercentageRemaining');
    assert.equal(count, 2, 'SDK report parser + app telemetry observer');

    await device.onUninit();
    assert.equal(cluster.listenerCount('attr.batteryPercentageRemaining'), 1);
    cluster.emit('attr.batteryPercentageRemaining', 100);
    await tick();
    assert.equal(updates.length, 1, 'SDK owns the one remaining capability parser');
    assert.equal(updates[0].value, 50);
    assert.equal(seen, 0);
    assert.equal(availability, 0);
  });
}
