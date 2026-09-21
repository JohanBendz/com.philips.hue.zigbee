'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver, zclFixture } = require('./helpers');

for (const id of ['SML001-occupancy', 'SML002-occupancy']) {
  test(`${id}: settings use real cluster names and preserve low/disabled values`, async () => {
    const Driver = loadDriver(id);
    const device = new Driver();
    const { zclNode } = zclFixture(2, [0, 1, 1030]);
    device.zclNode = zclNode;
    const clusters = zclNode.endpoints[2].clusters;
    const writes = [];
    clusters.occupancySensing.writeAttributes = async value => writes.push(['occupancy', value]);
    clusters.HueSpecificBasicCluster.writeAttributes = async value => writes.push(['basic', value]);
    clusters.powerConfiguration.readAttributes = async () => ({ batteryPercentageRemaining: 160 });
    await device.onSettings({ oldSettings: {}, newSettings: { motion_sensitivity: '0', ledIndicator: 'true' },
      changedKeys: ['motion_sensitivity', 'ledIndicator'] });
    await device.onEndDeviceAnnounce();
    assert.deepEqual(writes, [['basic', { ledIndication: true }], ['occupancy', { sensitivity: 0 }]]);
    writes.length = 0;
    await device.onSettings({ oldSettings: {}, newSettings: { ledIndicator: 'false' }, changedKeys: ['ledIndicator'] });
    await device.onEndDeviceAnnounce();
    assert.deepEqual(writes, [['basic', { ledIndication: false }], ['occupancy', { sensitivity: 0 }]]);
    assert.equal(clusters.occupancySensing.constructor.ATTRIBUTES.sensitivity.manufacturerId, 0x100b);
  });
}

function contactSensor() {
  const Driver = loadDriver('SOC001');
  const device = new Driver();
  // Descriptor from issue #642: On/Off is an OUTPUT, not an input attribute cluster.
  const fixture = zclFixture(2, [0, 1, 3, 64518], [25, 0, 3, 6]);
  device.zclNode = fixture.zclNode;
  device.isFirstInit = () => false;
  return { device, ...fixture };
}

test('SOC001: real ZCL manufacturer contact reports and legacy On/Off commands', async () => {
  const { device, node, zclNode } = contactSensor();
  await device.onNodeInit({ zclNode });
  // Synthetic report: manufacturer 0x100b, attribute 0x0100, enum8, open=1.
  await node.handleFrame(2, 0xfc06, Buffer.from([0x1c, 0x0b, 0x10, 1, 0x0a, 0, 1, 0x30, 1]), {});
  assert.equal(device.values.alarm_contact, true);
  await node.handleFrame(2, 0xfc06, Buffer.from([0x1c, 0x0b, 0x10, 2, 0x0a, 0, 1, 0x30, 0]), {});
  assert.equal(device.values.alarm_contact, false);
  await node.handleFrame(2, 6, Buffer.from([0x11, 3, 1]), {});
  assert.equal(device.values.alarm_contact, true);
  await node.handleFrame(2, 6, Buffer.from([0x11, 4, 0]), {});
  assert.equal(device.values.alarm_contact, false);
  await node.handleFrame(2, 1, Buffer.from([0x18, 5, 0x0a, 0x21, 0, 0x20, 160]), {});
  assert.equal(device.values.measure_battery, 80);
  await node.handleFrame(2, 1, Buffer.from([0x18, 6, 0x0a, 0x21, 0, 0x20, 255]), {});
  assert.equal(device.values.measure_battery, 80);
  await device.onUninit();
  assert.equal(zclNode.endpoints[2].clusters.hueContact.listenerCount('attr.contact'), 0);
  assert.equal(zclNode.endpoints[2].clusters.powerConfiguration.listenerCount('attr.batteryPercentageRemaining'), 0);
  assert.equal(zclNode.endpoints[2].bindings.onOff, undefined);
});

test('SOC001: contact configuration failure does not block battery; retry only unfinished work', async () => {
  const { device, zclNode } = contactSensor();
  await device.onNodeInit({ zclNode });
  const requests = [];
  let failContact = true;
  device.configureAttributeReporting = async ([request]) => {
    requests.push(request.attributeName);
    if (request.attributeName === 'contact' && failContact) throw new Error('sleepy device');
  };
  zclNode.endpoints[2].clusters.hueContact.readAttributes = async () => ({ contact: 'open' });
  zclNode.endpoints[2].clusters.powerConfiguration.readAttributes = async () => ({ batteryPercentageRemaining: 150 });
  await device.onEndDeviceAnnounce();
  assert.equal(device.values.measure_battery, 75);
  assert.equal(device._reportingConfigured, false);
  failContact = false;
  await device.onEndDeviceAnnounce();
  assert.equal(device.values.alarm_contact, true);
  assert.equal(device._reportingConfigured, true);
  assert.deepEqual(requests, ['contact', 'batteryPercentageRemaining', 'contact']);
  await device.onEndDeviceAnnounce();
  assert.equal(requests.length, 3);
  await device.onUninit();
});

test('SOC001: real SDK reporting configuration accepts custom cluster and stores both paths', async () => {
  const { device, zclNode } = contactSensor();
  await device.onNodeInit({ zclNode });
  const clusters = zclNode.endpoints[2].clusters;
  const requests = [];
  clusters.hueContact.configureReporting = async value => requests.push(['contact', value]);
  clusters.powerConfiguration.configureReporting = async value => requests.push(['battery', value]);
  clusters.hueContact.readAttributes = async () => ({ contact: 'closed' });
  clusters.powerConfiguration.readAttributes = async () => ({ batteryPercentageRemaining: 100 });
  await device.onEndDeviceAnnounce();
  assert.deepEqual(requests.map(([name]) => name), ['contact', 'battery']);
  assert.equal(device.getStoreValue('configuredAttributeReporting').length, 2);
  assert.equal(device.values.alarm_contact, false);
  assert.equal(device.values.measure_battery, 50);
  assert.equal(clusters.hueContact.constructor.ATTRIBUTES.contact.manufacturerId, 0x100b);
  await device.onUninit();
});

test('SOC001: repeated initialization does not accumulate listeners or lose an earlier binding', async () => {
  const { device, zclNode } = contactSensor();
  const endpoint = zclNode.endpoints[2];
  const previousBinding = {};
  endpoint.bindings.onOff = previousBinding;
  await device.onNodeInit({ zclNode });
  await device.onNodeInit({ zclNode });
  assert.equal(endpoint.clusters.hueContact.listenerCount('attr.contact'), 1);
  assert.equal(endpoint.clusters.powerConfiguration.listenerCount('attr.batteryPercentageRemaining'), 1);
  await device.onUninit();
  assert.equal(endpoint.bindings.onOff, previousBinding);
  assert.equal(endpoint.clusters.hueContact.listenerCount('attr.contact'), 0);
});


for (const id of ['SML001-occupancy', 'SML002-occupancy']) {
  test(`${id}: missing device settings are initialized atomically`, async () => {
    const Driver = loadDriver(id);
    const device = new Driver();
    device.settings = { minReportLux: 120 };
    const calls = [];
    device.setSettings = async values => {
      calls.push(values);
      Object.assign(device.settings, values);
    };

    const migrated = await device._migrateMissingSettings();
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], migrated);
    assert.equal(migrated.ledIndicator, 'false');
    assert.equal(migrated.motion_sensitivity, '2');
    assert.equal(migrated.minReportLux, undefined);
    assert.equal(migrated.maxReportLux, 300);

    await device._migrateMissingSettings();
    assert.equal(calls.length, 1);
  });

  test(`${id}: migration preserves an older stored LED preference`, async () => {
    const Driver = loadDriver(id);
    const device = new Driver();
    device.settings = {};
    device.store.ledIndicator = true;
    device.setSettings = async values => Object.assign(device.settings, values);

    const migrated = await device._migrateMissingSettings();
    assert.equal(migrated.ledIndicator, 'true');
  });
}

test('occupancy sensor settings declare initial values for every editable setting', () => {
  for (const id of ['SML001-occupancy', 'SML002-occupancy']) {
    const settings = require(`../drivers/${id}/driver.settings.compose.json`);
    for (const setting of settings) {
      assert.ok(Object.prototype.hasOwnProperty.call(setting, 'value'), `${id}:${setting.id}`);
    }
  }
});
