'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver, remote, buttonFrame } = require('./helpers');
const { batteryFixture } = require('./remote-battery-fixture');
const tick = () => new Promise(resolve => setImmediate(resolve));

for (const id of ['RDM001', 'RDM002', 'RWL022', 'ROM002']) {
  test(`${id}: ZCL pass-through preserves receiver, arguments and cleanup`, async () => {
    const { device, node, frames, calls } = remote(id);
    const original = node.handleFrame;
    await device.onNodeInit({ zclNode: device.zclNode });
    const frame = buttonFrame(1, 0);
    const meta = { linkQuality: 100 };
    await node.handleFrame(1, 64512, frame, meta);
    assert.equal(frames.length, 1);
    assert.equal(frames[0].receiver, node);
    assert.deepEqual(frames[0].args, [1, 64512, frame, meta]);
    assert.equal(calls.length, 1);
    await device.onUninit();
    assert.equal(node.handleFrame, original);
  });

  test(`${id}: original-handler rejection does not suppress button events`, async () => {
    const { device, node, calls } = remote(id);
    node.handleFrame = async () => { throw new Error('unknown manufacturer command'); };
    await device.onNodeInit({ zclNode: device.zclNode });
    await node.handleFrame(1, 64512, buttonFrame(1, 0), {});
    assert.equal(calls.length, 1);
    assert.equal(device.errors.length, 1);
    // Do not overwrite a handler installed by another owner after initialization.
    const replacement = () => {};
    node.handleFrame = replacement;
    await device.onUninit();
    assert.equal(node.handleFrame, replacement);
  });

  test(`${id}: truncated/non-buffer button frames are ignored`, async () => {
    const { device, calls } = remote(id);
    await device.onNodeInit({ zclNode: device.zclNode });
    for (const frame of [null, {}, Buffer.alloc(0), Buffer.alloc(5)]) {
      await device._buttonCommandParser(frame);
    }
    assert.equal(calls.length, 0);
  });
}

for (const id of ['RDM001', 'ROM002']) {
  test(`${id}: two physical modules route second inputs independently`, async () => {
    const a = remote(id, { id: 'a', token: { ieee: 'a' } });
    const b = remote(id, { id: 'b', token: { ieee: 'b' } });
    const a2 = { getData: () => ({ id: 'a', token: { ieee: 'a' }, subDeviceId: 'secondInput' }) };
    const b2 = { getData: () => ({ id: 'b', token: { ieee: 'b' }, subDeviceId: 'secondInput' }) };
    for (const fixture of [a, b]) {
      fixture.device.driver.getDevices = () => [b2, a.device, a2, b.device];
      await fixture.device.onNodeInit({ zclNode: fixture.device.zclNode });
      await fixture.device._buttonCommandParser(buttonFrame(2, 0));
    }
    assert.equal(a.calls[0].target, a2);
    assert.equal(b.calls[0].target, b2);
    assert.equal(a.device._getInputDevice(1), a.device);
    assert.equal(a.device._getInputDevice(3), null);
  });
}

test('ROM002: hold deduplication, release and both saved Flow action IDs', async () => {
  const { device, calls, card } = remote('ROM002');
  await device.onNodeInit({ zclNode: device.zclNode });
  for (const action of [0, 1, 1, 3, 0, 1, 2]) {
    await device._buttonCommandParser(buttonFrame(1, action));
  }
  assert.deepEqual(calls.map(call => call.state.action),
    ['Press', 'Hold', 'LongRelease', 'Press', 'Hold', 'Release']);
  assert.equal(await card.listener({ action: 'LongPress' }, { action: 'LongRelease' }), true);
  assert.equal(await card.listener({ action: 'LongRelease' }, { action: 'LongRelease' }), true);
  assert.equal(await card.listener({ action: 'Hold' }, { action: 'LongRelease' }), false);
  await device._buttonCommandParser(buttonFrame(1, 255));
  assert.equal(calls.length, 6);
});

for (const id of ['RDM001', 'RDM002', 'RWL022']) {
  test(`${id}: SDK parses genuine battery reports exactly once and ignores unknown values`, async () => {
    const fixture = batteryFixture(id);
    const { device, cluster, updates } = fixture;
    let available = 0;
    device.setAvailable = async () => { available += 1; };
    await device.onNodeInit({ zclNode: device.zclNode });
    assert.equal(fixture.registration.opts.getOpts.getOnStart, false);
    assert.equal(fixture.registration.opts.getOpts.getOnOnline, false);

    for (const raw of [0, 100, 200, 255, -1, 201, NaN, 0.5]) {
      cluster.emit('attr.batteryPercentageRemaining', raw);
      await tick();
    }
    assert.deepEqual(updates.map(x => x.value), [0, 50, 100],
      'SDK is the only writer; invalid values must not overwrite battery');
    assert.equal(device.values.measure_battery, 100);
    if (id !== 'RDM001') {
      assert.equal(available, 3, 'only accepted report traffic restores availability');
    } else {
      assert.equal(available, 0, 'RDM001 does not acquire new availability behavior');
    }
    await device.onUninit();
  });
}

test('RWL022: all four buttons and four actions map to stable Flow action IDs', async () => {
  const { device, calls } = remote('RWL022');
  await device.onNodeInit({ zclNode: device.zclNode });

  const buttons = ['OnOff', 'DimUp', 'DimDown', 'Hue'];
  const actions = ['ShortPress', 'LongPress', 'ShortRelease', 'LongRelease'];

  for (let button = 1; button <= 4; button += 1) {
    for (let action = 0; action <= 3; action += 1) {
      await device._buttonCommandParser(buttonFrame(button, action));
    }
  }

  assert.deepEqual(
    calls.map(call => call.state.action),
    buttons.flatMap(button => actions.map(action => `${button}-${action}`)),
  );
});

for (const id of ['RDM001', 'RDM002']) {
  test(`${id}: announce retains one SDK-mapped wake read and last valid battery value`, async () => {
    const f = batteryFixture(id);
    const { device, reads, updates } = f;
    await device.onNodeInit({ zclNode: device.zclNode });
    await device.onEndDeviceAnnounce();
    assert.deepEqual(reads, [['batteryPercentageRemaining']]);
    assert.equal(device.values.measure_battery, 80);
    f.setReadValue(255);
    await device.onEndDeviceAnnounce();
    assert.deepEqual(reads, [['batteryPercentageRemaining'], ['batteryPercentageRemaining']]);
    assert.equal(device.values.measure_battery, 80);
    assert.deepEqual(updates.map(x => x.value), [80]);
    await device.onUninit();
  });
}

test('RWL000: legacy devices migrate measure_battery and refresh on wake', async () => {
  const Driver = loadDriver('RWL000');
  const device = new Driver();
  device.capabilities = new Set(['alarm_battery']);
  device.isFirstInit = () => false;

  const registered = [];
  device.registerCapability = (id, cluster, options) => registered.push({ id, cluster, options });
  const card = {
    registerRunListener() { return this; },
    async trigger() {},
  };
  device.homey = {
    flow: { getDeviceTriggerCard: () => card },
  };
  device.zclNode = {
    endpoints: {
      1: { bind() {} },
      2: {
        clusters: {
          powerConfiguration: {
            readAttributes: async () => ({ batteryPercentageRemaining: 150 }),
          },
        },
      },
    },
  };

  await device.onNodeInit({ zclNode: device.zclNode });
  assert.equal(device.hasCapability('measure_battery'), true);
  assert.deepEqual(registered.map(entry => entry.id), ['measure_battery', 'alarm_battery']);
  const measureBatteryRegistration = registered.find(entry => entry.id === 'measure_battery');
  assert.equal(measureBatteryRegistration.options.getOpts.getOnStart, false);
  assert.equal(measureBatteryRegistration.options.getOpts.getOnOnline, false);

  await device.onEndDeviceAnnounce();
  assert.equal(device.values.measure_battery, 75);
  assert.equal(device.values.alarm_battery, false);

  device.zclNode.endpoints[2].clusters.powerConfiguration.readAttributes =
    async () => ({ batteryPercentageRemaining: 255 });
  await device.onEndDeviceAnnounce();
  assert.equal(device.values.measure_battery, 75);
  assert.equal(device.values.alarm_battery, false);
});


test('RWL022: original reporting setup and SDK battery wake refresh remain intact', async () => {
  const f = batteryFixture('RWL022');
  const { device, reads, updates } = f;
  await device.onNodeInit({ zclNode: device.zclNode });
  const configs = [];
  device.configureAttributeReporting = async values => { configs.push(values); };
  await device.onEndDeviceAnnounce();
  assert.equal(device.values.measure_battery, 80);
  assert.equal(device._batteryReportingConfigured, true);
  assert.equal(configs.length, 1);
  assert.equal(configs[0][0].minInterval, 0);
  assert.equal(configs[0][0].maxInterval, 21600);
  assert.equal(configs[0][0].minChange, 1);

  f.setReadValue(120);
  await device.onEndDeviceAnnounce();
  assert.equal(device.values.measure_battery, 60);
  assert.equal(configs.length, 1, 'do not reconfigure on every announce');
  assert.equal(reads.length, 2);
  f.cluster.emit('attr.batteryPercentageRemaining', 255);
  await tick();
  assert.equal(device.values.measure_battery, 60);
  assert.deepEqual(updates.map(x => x.value), [80, 60]);
  await device.onUninit();
});

test('RDM001: pushbutton mode exposes press, hold and release-after-hold actions', async () => {
  const { device, calls, card } = remote('RDM001');
  device.settings.mode = 'singlepushbutton';
  await device.onNodeInit({ zclNode: device.zclNode });

  for (const action of [0, 1, 3]) {
    await device._buttonCommandParser(buttonFrame(1, action));
  }

  assert.deepEqual(calls.map(call => call.state.action), ['Press', 'Hold', 'LongRelease']);
  assert.equal(await card.listener({ action: 'Hold' }, { action: 'Hold' }), true);
  assert.equal(await card.listener({ action: 'LongRelease' }, { action: 'LongRelease' }), true);
  assert.equal(await card.listener({ action: 'Release' }, { action: 'Hold' }), false);
});

for (const id of ['RWL022', 'RDM002']) {
  test(`${id}: button and valid battery report traffic restores availability, invalid data does not`, async () => {
    const { device, cluster } = batteryFixture(id);
    let availableCalls = 0;
    device.setAvailable = async () => { availableCalls += 1; };
    await device.onNodeInit({ zclNode: device.zclNode });

    await device._buttonCommandParser(buttonFrame(1, 0));
    assert.equal(availableCalls, 1);
    cluster.emit('attr.batteryPercentageRemaining', 100);
    assert.equal(availableCalls, 2);
    cluster.emit('attr.batteryPercentageRemaining', 255);
    cluster.emit('attr.batteryPercentageRemaining', -1);
    await device._buttonCommandParser(Buffer.alloc(5));
    assert.equal(availableCalls, 2);
    await device.onUninit();
  });

  test(`${id}: announce restores availability without claiming network repair`, async () => {
    const { device } = batteryFixture(id);
    let availableCalls = 0;
    device.setAvailable = async () => { availableCalls += 1; };
    await device.onNodeInit({ zclNode: device.zclNode });
    device.configureAttributeReporting = async () => {};
    await device.onEndDeviceAnnounce();
    assert.equal(availableCalls, 1);
    await device.onUninit();
  });
}

test('RWL000: real bound button commands restore availability', async () => {
  const Driver = loadDriver('RWL000');
  const device = new Driver();
  device.capabilities = new Set(['measure_battery']);
  let availableCalls = 0;
  device.setAvailable = async () => { availableCalls += 1; };

  device.registerCapability = () => {};

  const card = {
    registerRunListener() { return this; },
    async trigger() {},
  };
  device.homey = {
    flow: { getDeviceTriggerCard: () => card },
  };
  device.zclNode = {
    endpoints: {
      1: { bind() {} },
      2: {
        clusters: {
          powerConfiguration: {
            readAttributes: async () => ({ batteryPercentageRemaining: 160 }),
          },
        },
      },
    },
  };

  await device.onNodeInit({ zclNode: device.zclNode });
  await device._onCommandParser();
  await device._offCommandParser();
  await device._stepCommandParser({ stepSize: 30, mode: 'up' });
  await device._stopCommandParser();

  assert.equal(availableCalls, 4);
});
