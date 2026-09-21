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


test('occupancy drivers expose the full sensitivity union but enforce generation-aware ranges', async () => {
  for (const [id, productId, acceptedMax] of [
    ['SML001-occupancy', 'SML001', 2],
    ['SML001-occupancy', 'SML003', 4],
    ['SML001-occupancy', '9290030657', 4],
    ['SML002-occupancy', 'SML002', 2],
    ['SML002-occupancy', '9290019758', 2],
    ['SML002-occupancy', 'SML004', 4],
  ]) {
    const settings = require(`../drivers/${id}/driver.settings.compose.json`);
    const sensitivitySetting = settings.find(setting => setting.id === 'motion_sensitivity');
    assert.deepEqual(sensitivitySetting.values.map(value => value.id), ['0', '1', '2', '3', '4']);

    const Driver = loadDriver(id);
    const device = new Driver();
    device.settings.zb_product_id = productId;

    await device.onSettings({
      oldSettings: {},
      newSettings: { motion_sensitivity: String(acceptedMax) },
      changedKeys: ['motion_sensitivity'],
    });
    assert.equal(device.getStoreValue('sensitivity'), acceptedMax);

    if (acceptedMax === 2) {
      await assert.rejects(
        device.onSettings({
          oldSettings: {},
          newSettings: { motion_sensitivity: '3' },
          changedKeys: ['motion_sensitivity'],
        }),
        /supported range is 0-2/,
      );
    }
  }
});


test('legacy motion sensor drivers stay available for existing devices but are hidden from pairing', () => {
  for (const id of ['SML001', 'SML002']) {
    const compose = require(`../drivers/${id}/driver.compose.json`);
    assert.equal(compose.deprecated, true, id);
  }
});

for (const [id, threshold] of [['SML001', 20], ['SML002', 20]]) {
  test(`${id}: battery capabilities are registered after app restart and refreshed on announce`, async () => {
    const Driver = loadDriver(id);
    const device = new Driver();
    device.capabilities = new Set(['measure_battery', 'alarm_battery']);
    device.settings.batteryThreshold = threshold;
    device.isFirstInit = () => false;
    device.registerCapability = (...args) => {
      device.registeredCapabilities = device.registeredCapabilities || [];
      device.registeredCapabilities.push(args[0]);
    };
    const listeners = { on() {}, removeListener() {} };
    device.zclNode = {
      endpoints: {
        1: { bind() {}, clusters: {} },
        2: {
          clusters: {
            temperatureMeasurement: listeners,
            illuminanceMeasurement: listeners,
            powerConfiguration: {
              readAttributes: async () => ({ batteryPercentageRemaining: 84 }),
            },
          },
        },
      },
    };

    await device.onNodeInit({ zclNode: device.zclNode });
    assert.deepEqual(device.registeredCapabilities, ['measure_battery', 'alarm_battery']);

    await device.onEndDeviceAnnounce();
    assert.equal(device.values.measure_battery, 42);
    assert.equal(device.values.alarm_battery, false);
  });
}

test('legacy SML002 voltage threshold is migrated to percentage semantics', async () => {
  const Driver = loadDriver('SML002');
  const device = new Driver();
  device.settings.batteryThreshold = 2.9;
  const calls = [];
  device.setSettings = async values => {
    calls.push(values);
    Object.assign(device.settings, values);
  };

  await device._migrateLegacyBatteryThreshold();
  assert.deepEqual(calls, [{ batteryThreshold: 20 }]);
  assert.equal(device.getSetting('batteryThreshold'), 20);

  await device._migrateLegacyBatteryThreshold();
  assert.equal(calls.length, 1);

  const setting = require('../drivers/SML002/driver.settings.compose.json')
    .find(item => item.id === 'batteryThreshold');
  assert.equal(setting.value, 20);
  assert.equal(setting.label.en, 'Low Battery Alarm Threshold (%)');
});
