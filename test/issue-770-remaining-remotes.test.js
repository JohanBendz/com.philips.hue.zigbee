'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver, remote, buttonFrame } = require('./helpers');
const { batteryFixture } = require('./remote-battery-fixture');

const tick = () => new Promise(resolve => setImmediate(resolve));
function watch(device) {
  let seen = 0;
  let availability = 0;
  device.setLastSeenAt = async () => { seen += 1; };
  device.setAvailable = async () => { availability += 1; };
  return { seen: () => seen, availability: () => availability };
}

test('RDM001: only recognized button input/action advances last-seen without altering Flow or availability', async () => {
  const { device, calls } = remote('RDM001');
  device.settings.mode = 'singlepushbutton';
  const t = watch(device);
  await device.onNodeInit({ zclNode: device.zclNode });

  await device._buttonCommandParser(Buffer.alloc(5));
  await device._buttonCommandParser(buttonFrame(9, 0)); // unknown input
  await device._buttonCommandParser(buttonFrame(1, 255)); // legacy Unknown Flow action
  await tick();
  assert.equal(t.seen(), 0);
  assert.equal(calls.at(-1).state.action, 'Unknown', 'do not change a shipped Flow behavior');

  await device._buttonCommandParser(buttonFrame(1, 0));
  await device._buttonCommandParser(buttonFrame(1, 1));
  await tick();
  assert.equal(t.seen(), 1, 'shared 60-second telemetry throttle');
  assert.equal(t.availability(), 0, 'no added setAvailable on RDM001');
  assert.deepEqual(calls.slice(-2).map(c => c.state.action), ['Press', 'Hold']);
});

test('RDM001: valid report counts, explicit battery refresh and invalid report do not', async () => {
  const fixture = batteryFixture('RDM001');
  const { device, cluster } = fixture;
  const t = watch(device);
  await device.onNodeInit({ zclNode: device.zclNode });
  // Same SDK capability path as production: a deliberate battery refresh
  // updates the capability but emits no attr report, hence no last-seen.
  await device._refreshBattery();
  cluster.emit('attr.batteryPercentageRemaining', 255);
  await tick();
  assert.equal(device.values.measure_battery, 80);
  assert.equal(t.seen(), 0);

  cluster.emit('attr.batteryPercentageRemaining', 150);
  await tick();
  assert.equal(t.seen(), 1);
  assert.equal(device.values.measure_battery, 75);
  assert.equal(t.availability(), 0);
  await device.onUninit();
});

test('RDM001: announce counts once; ensuing battery read cannot create a second observation', async () => {
  const fixture = batteryFixture('RDM001');
  const { device, reads } = fixture;
  const t = watch(device);
  await device.onNodeInit({ zclNode: device.zclNode });
  await device.onEndDeviceAnnounce();
  await tick();
  assert.equal(reads.length, 1, 'retain original on-announce battery refresh');
  assert.equal(t.seen(), 1);
  assert.equal(t.availability(), 0);
  assert.equal(device.values.measure_battery, 80);
  await device.onUninit();
});

test('ROM002: only supported, resolvable button actions count; hold de-duplication and Flow IDs survive', async () => {
  const { device, calls } = remote('ROM002');
  const t = watch(device);
  await device.onNodeInit({ zclNode: device.zclNode });
  await device._buttonCommandParser(Buffer.alloc(5));
  await device._buttonCommandParser(buttonFrame(9, 0));
  await device._buttonCommandParser(buttonFrame(1, 255));
  await tick();
  assert.equal(t.seen(), 0);

  for (const action of [0, 1, 1, 3]) {
    await device._buttonCommandParser(buttonFrame(1, action));
  }
  await tick();
  assert.equal(t.seen(), 1, 'repeated real hold is throttled as telemetry');
  assert.deepEqual(calls.map(c => c.state.action), ['Press', 'Hold', 'LongRelease']);
  assert.equal(t.availability(), 0);
});

test('ROM001: existing multi-trigger Smart Button actions stay identical; genuine bound callbacks count', async () => {
  const Driver = loadDriver('ROM001');
  const device = new Driver();
  const t = watch(device);
  const calls = [];
  device._buttonPressedTriggerDevice = {
    trigger: async (target, tokens, state) => { calls.push(state.action); },
  };
  device._onCommandParser();
  device._offCommandParser();
  device._stepCommandParser({ stepSize: 30, mode: 'up' });
  await device._stopCommandParser();
  await tick();
  assert.deepEqual(calls, [
    'pressed', 'pressed-odd', 'pressed', 'pressed-even',
    'hold', 'up', 'short-hold', 'released',
  ]);
  assert.equal(t.seen(), 1);
  assert.equal(t.availability(), 0, 'do not introduce availability recovery in ROM001');
});

test('ROM001: malformed step payload cannot independently advance last-seen', async () => {
  const Driver = loadDriver('ROM001');
  const device = new Driver();
  const t = watch(device);
  device._buttonPressedTriggerDevice = { trigger: async () => {} };
  device._stepCommandParser({ stepSize: 'invalid', mode: 'up' });
  await tick();
  assert.equal(t.seen(), 0);
});

test('RWL000: existing remote-availability helper already supplies shared last-seen once', async () => {
  const Driver = loadDriver('RWL000');
  const device = new Driver();
  const t = watch(device);
  const card = { trigger: async () => {} };
  device._switchOnTriggerDevice = card;
  device._switchOffTriggerDevice = card;
  device._switchDimTriggerDevice = card;
  await device._onCommandParser();
  await device._offCommandParser();
  await device._stepCommandParser({ stepSize: 30, mode: 'up' });
  await device._stopCommandParser();
  await tick();
  assert.equal(t.seen(), 1);
  assert.equal(t.availability(), 4, 'preserve one availability recovery per command');
});

test('LGT002 Twilight: recognized physical root button updates last-seen without touching lighting or availability', async () => {
  const Driver = loadDriver('LGT002');
  const device = new Driver();
  const t = watch(device);
  const calls = [];
  device._twilightTriggerDevice = {
    trigger: async (target, tokens, state) => { calls.push(state.action); },
  };
  await device._buttonCommandParser(Buffer.alloc(5));
  await device._buttonCommandParser(buttonFrame(3, 0)); // unsupported button
  await device._buttonCommandParser(buttonFrame(1, 255)); // unsupported action
  await tick();
  assert.equal(t.seen(), 0);
  await device._buttonCommandParser(buttonFrame(1, 0));
  await device._buttonCommandParser(buttonFrame(2, 3));
  await tick();
  assert.deepEqual(calls, ['Dot-Press', 'Hue-LongRelease']);
  assert.equal(t.seen(), 1);
  assert.equal(t.availability(), 0);
});

test('LGT002 Twilight: subdevice has no physical-button trigger and cannot mark telemetry via parser', async () => {
  const Driver = loadDriver('LGT002');
  const device = new Driver();
  const t = watch(device);
  device.data = { id: 'node-a', subDeviceId: 'back' };
  await device._buttonCommandParser(buttonFrame(1, 0));
  await tick();
  assert.equal(t.seen(), 0);
});
