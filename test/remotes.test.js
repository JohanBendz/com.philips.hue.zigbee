'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver, remote, buttonFrame } = require('./helpers');

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
  test(`${id}: battery read response, report, errors and short buffers`, () => {
    const { device } = remote(id);
    // Synthetic standard ZCL read response and attribute report (not hardware captures).
    device._powerParser(Buffer.from([0x18, 1, 1, 0x21, 0, 0, 0x20, 150]));
    assert.equal(device.values.measure_battery, 75);
    device._powerParser(Buffer.from([0x18, 2, 0x0a, 0x21, 0, 0x20, 100]));
    assert.equal(device.values.measure_battery, 50);
    device._powerParser(Buffer.from([0x18, 3, 0x0a, 0x21, 0, 0x20, 255]));
    assert.equal(device.values.measure_battery, 50);
    for (const frame of [null, Buffer.alloc(3), Buffer.from([0x18, 1, 1, 0x21, 0, 0x86, 0x20, 0])]) {
      device._powerParser(frame);
    }
    assert.equal(device.values.measure_battery, 50);
  });
}


for (const id of ['RDM001', 'RDM002']) {
  test(`${id}: wake refreshes battery and preserves last valid value`, async () => {
    const { device } = remote(id);
    await device.onNodeInit({ zclNode: device.zclNode });

    device.zclNode.endpoints[1].clusters.powerConfiguration = {
      readAttributes: async () => ({ batteryPercentageRemaining: 160 }),
    };
    await device.onEndDeviceAnnounce();
    assert.equal(device.values.measure_battery, 80);

    device.zclNode.endpoints[1].clusters.powerConfiguration.readAttributes =
      async () => ({ batteryPercentageRemaining: 255 });
    await device.onEndDeviceAnnounce();
    assert.equal(device.values.measure_battery, 80);
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


test('RWL022: announce refreshes battery after reporting is configured', async () => {
  const { device } = remote('RWL022');
  await device.onNodeInit({ zclNode: device.zclNode });

  device.configureAttributeReporting = async () => {};
  device.zclNode.endpoints[1].clusters.powerConfiguration = {
    readAttributes: async () => ({ batteryPercentageRemaining: 160 }),
  };

  await device.onEndDeviceAnnounce();
  assert.equal(device.values.measure_battery, 80);
  assert.equal(device._batteryReportingConfigured, true);

  device.zclNode.endpoints[1].clusters.powerConfiguration.readAttributes =
    async () => ({ batteryPercentageRemaining: 120 });
  await device.onEndDeviceAnnounce();
  assert.equal(device.values.measure_battery, 60);

  device._powerParser(Buffer.from([0x18, 3, 0x0a, 0x21, 0, 0x20, 255]));
  assert.equal(device.values.measure_battery, 60);
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
