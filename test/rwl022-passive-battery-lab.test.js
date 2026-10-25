'use strict';

// Controlled RWL022 experiment. This does not alter the default release behaviour.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { batteryFixture } = require('./remote-battery-fixture');
const { buttonFrame } = require('./helpers');

const ENV_KEY = 'HUE_RWL022_BATTERY_LAB';

test('RWL022: default mode retains original six-hour reporting and first-init read', async () => {
  const original = process.env[ENV_KEY];
  delete process.env[ENV_KEY];
  try {
    const f = batteryFixture('RWL022');
    const { device, reads } = f;
    device.isFirstInit = () => true;
    const configurations = [];
    device.configureAttributeReporting = async values => { configurations.push(values); };

    await device.onNodeInit({ zclNode: device.zclNode });
    assert.equal(configurations.length, 1);
    assert.deepEqual(configurations[0][0], {
      endpointId: 1,
      cluster: require('zigbee-clusters').CLUSTER.POWER_CONFIGURATION,
      attributeName: 'batteryPercentageRemaining',
      minInterval: 0,
      maxInterval: 21600,
      minChange: 1,
    });
    assert.deepEqual(reads, [['batteryPercentageRemaining']]);
    assert.equal(device.values.measure_battery, 80);
    await device.onUninit();
  } finally {
    if (original === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = original;
  }
});

test('RWL022: opt-in passive lab disables persisted reports only on wake, retaining battery reads and buttons', async () => {
  const original = process.env[ENV_KEY];
  process.env[ENV_KEY] = 'passive';
  try {
    const f = batteryFixture('RWL022');
    const { device, reads, calls } = f;
    device.isFirstInit = () => true;
    const configurations = [];
    device.configureAttributeReporting = async values => { configurations.push(values); };

    await device.onNodeInit({ zclNode: device.zclNode });
    assert.equal(configurations.length, 0, 'a sleeping remote is not configured on initial pairing');

    await device.onEndDeviceAnnounce();
    assert.equal(configurations.length, 1);
    assert.equal(configurations[0][0].endpointId, 1);
    assert.equal(configurations[0][0].cluster, require('zigbee-clusters').CLUSTER.POWER_CONFIGURATION);
    assert.equal(configurations[0][0].attributeName, 'batteryPercentageRemaining');
    assert.equal(configurations[0][0].minInterval, 0);
    assert.equal(configurations[0][0].maxInterval, 0xFFFF);
    assert.equal(configurations[0][0].minChange, 1);
    assert.equal(device.values.measure_battery, 80);
    assert.equal(device._batteryReportingConfigured, true);
    assert.deepEqual(reads, [['batteryPercentageRemaining']]);

    f.setReadValue(140);
    await device.onEndDeviceAnnounce();
    assert.equal(configurations.length, 1, 'one disable command per app runtime');
    assert.deepEqual(reads, [['batteryPercentageRemaining'], ['batteryPercentageRemaining']]);
    assert.equal(device.values.measure_battery, 70);

    await device._buttonCommandParser(buttonFrame(1, 0));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].state.action, 'OnOff-ShortPress');
    await device.onUninit();
  } finally {
    if (original === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = original;
  }
});

test('RWL022: passive setup failure retries on next announce without marking configuration complete', async () => {
  const original = process.env[ENV_KEY];
  process.env[ENV_KEY] = 'passive';
  try {
    const f = batteryFixture('RWL022');
    const { device, reads } = f;
    device.isFirstInit = () => false;
    let attempts = 0;
    device.configureAttributeReporting = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('remote asleep');
    };
    await device.onNodeInit({ zclNode: device.zclNode });
    await device.onEndDeviceAnnounce();
    assert.equal(device._batteryReportingConfigured, false);
    assert.equal(attempts, 1);
    assert.equal(reads.length, 0);
    await device.onEndDeviceAnnounce();
    assert.equal(attempts, 2);
    assert.equal(device._batteryReportingConfigured, true);
    assert.equal(reads.length, 1);
    await device.onUninit();
  } finally {
    if (original === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = original;
  }
});
