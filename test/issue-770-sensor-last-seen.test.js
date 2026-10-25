'use strict';

const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver, zclFixture } = require('./helpers');
const {
  markHueSensorAvailable,
  isValidHueOccupancyReport,
  isValidHueTemperatureReport,
  isValidHueLuminanceReport,
  isValidHueBatteryReport,
} = require('../lib/HueSensorAvailability');

const tick = () => new Promise(resolve => setImmediate(resolve));
const setObserver = device => {
  let count = 0;
  device.setLastSeenAt = async () => { count += 1; };
  return () => count;
};

test('strict last-seen payload predicates reject ZCL invalid markers and malformed values', () => {
  assert.equal(isValidHueOccupancyReport({ occupied: true }), true);
  assert.equal(isValidHueOccupancyReport({ occupied: false }), true);
  for (const value of [null, {}, { occupancy: true }, { occupied: 1 }]) {
    assert.equal(isValidHueOccupancyReport(value), false);
  }
  for (const value of [-27315, 0, 2150, 32767]) {
    assert.equal(isValidHueTemperatureReport(value), true);
  }
  for (const value of [NaN, Infinity, -32768, -27316, 32768, 21.5]) {
    assert.equal(isValidHueTemperatureReport(value), false);
  }
  for (const value of [0, 1, 10001, 65534]) {
    assert.equal(isValidHueLuminanceReport(value), true);
  }
  for (const value of [-1, NaN, 65535, 65536, 1.5]) {
    assert.equal(isValidHueLuminanceReport(value), false);
  }
  for (const value of [0, 100, 160, 200]) {
    assert.equal(isValidHueBatteryReport(value), true);
  }
  for (const value of [-1, 201, 255, NaN, 50.5]) {
    assert.equal(isValidHueBatteryReport(value), false);
  }
});

test('sensor helper preserves availability even for malformed callbacks; telemetry is opt-in', async () => {
  let available = 0;
  const device = { setAvailable: async () => { available += 1; } };
  const observed = setObserver(device);

  await markHueSensorAvailable(device); // historic call semantics
  await markHueSensorAvailable(device, { validReport: false });
  await tick();
  assert.equal(available, 2);
  assert.equal(observed(), 0);

  await markHueSensorAvailable(device, { validReport: true });
  await markHueSensorAvailable(device, { validReport: true });
  await tick();
  assert.equal(available, 4, 'availability remains unthrottled');
  assert.equal(observed(), 1, 'only telemetry is throttled by shared per-device helper');
});

function occupancyFixture(id) {
  const Driver = loadDriver(id);
  const device = new Driver();
  device.settings = { temperature_decimals: '1', batteryThreshold: 20 };
  device.capabilities = new Set([
    'alarm_motion', 'measure_temperature', 'measure_luminance', 'measure_battery', 'alarm_battery',
  ]);
  let available = 0;
  device.setAvailable = async () => { available += 1; };
  return { device, observed: setObserver(device), available: () => available };
}

for (const id of ['SML001-occupancy', 'SML002-occupancy']) {
  test(`${id}: malformed callbacks preserve legacy availability but cannot advance last-seen`, async () => {
    const { device, observed, available } = occupancyFixture(id);
    device.onOccupancyAttributeReport({}); // not the ZCL occupied bitmap
    device.onTemperatureMeasuredAttributeReport(-32768);
    device.onLuminanceMeasuredAttributeReport(0xffff);
    device.onBatteryPercentageRemainingAttributeReport(255);
    await tick();
    assert.equal(available(), 4, 'same four availability calls as before');
    assert.equal(observed(), 0);

    device.onOccupancyAttributeReport({ occupied: true });
    device.onTemperatureMeasuredAttributeReport(2150);
    device.onLuminanceMeasuredAttributeReport(10001);
    device.onBatteryPercentageRemainingAttributeReport(160);
    await tick();
    assert.equal(available(), 8);
    assert.equal(observed(), 1, 'shared 60s throttle spans every accepted report type');
    assert.equal(device.values.alarm_motion, true);
    assert.equal(device.values.measure_battery, 80);
  });

  for (const [label, emit] of [
    ['occupancy', device => device.onOccupancyAttributeReport({ occupied: false })],
    ['temperature', device => device.onTemperatureMeasuredAttributeReport(2050)],
    ['luminance', device => device.onLuminanceMeasuredAttributeReport(10001)],
    ['battery', device => device.onBatteryPercentageRemainingAttributeReport(150)],
  ]) {
    test(`${id}: accepted ${label} report individually updates Homey last-seen`, async () => {
      const { device, observed } = occupancyFixture(id);
      emit(device);
      await tick();
      assert.equal(observed(), 1);
    });
  }
}

function legacySensorFixture(id) {
  const Driver = loadDriver(id);
  const device = new Driver();
  device.settings = { batteryThreshold: 20, temperature_offset: 0 };
  device.capabilities = new Set(['alarm_motion', 'measure_temperature', 'measure_luminance']);
  device.registerCapability = () => {};
  device.isFirstInit = () => false;
  device.homey = { clearTimeout() {}, setTimeout() { return 1; } };
  const temperatureMeasurement = new EventEmitter();
  const illuminanceMeasurement = new EventEmitter();
  const zclNode = { endpoints: {
    1: { bind() {} },
    2: { clusters: { temperatureMeasurement, illuminanceMeasurement } },
  } };
  device.zclNode = zclNode;
  return { device, zclNode, observed: setObserver(device), temperatureMeasurement, illuminanceMeasurement };
}

for (const id of ['SML001', 'SML002']) {
  test(`${id}: only valid incoming legacy measured-value reports advance last-seen`, async () => {
    const { device, zclNode, observed, temperatureMeasurement, illuminanceMeasurement } =
      legacySensorFixture(id);
    await device.onNodeInit({ zclNode });
    temperatureMeasurement.emit('attr.measuredValue', -32768);
    illuminanceMeasurement.emit('attr.measuredValue', 65535);
    await tick();
    assert.equal(observed(), 0);
    temperatureMeasurement.emit('attr.measuredValue', 2100);
    illuminanceMeasurement.emit('attr.measuredValue', 10001);
    await tick();
    assert.equal(observed(), 1);
    assert.equal(device.values.measure_temperature, 21);
    await device.onUninit();
  });

  test(`${id}: accepted bound motion command counts; malformed command does not`, async () => {
    const { device, observed } = legacySensorFixture(id);
    device._onWithTimedOffCommandHandler({ onOffControl: 0, onTime: NaN, offWaitTime: 0 });
    await tick();
    assert.equal(observed(), 0);
    device._onWithTimedOffCommandHandler({ onOffControl: 0, onTime: 30, offWaitTime: 0 });
    await tick();
    assert.equal(observed(), 1);
    assert.equal(device.values.alarm_motion, true);
  });
}

function contactFixture() {
  const Driver = loadDriver('SOC001');
  const device = new Driver();
  const { node, zclNode } = zclFixture(2, [0, 1, 3, 64518], [25, 0, 3, 6]);
  device.zclNode = zclNode;
  device.isFirstInit = () => false;
  return { device, node, zclNode, observed: setObserver(device) };
}

test('SOC001: explicit initial contact/battery reads do not count as incoming reports', async () => {
  const { device, zclNode, observed } = contactFixture();
  await device.onNodeInit({ zclNode });
  const requests = [];
  device.configureAttributeReporting = async ([config]) => { requests.push(config.attributeName); };
  zclNode.endpoints[2].clusters.hueContact.readAttributes = async () => ({ contact: 'open' });
  zclNode.endpoints[2].clusters.powerConfiguration.readAttributes =
    async () => ({ batteryPercentageRemaining: 160 });
  await device._setupReporting();
  await tick();
  assert.deepEqual(requests, ['contact', 'batteryPercentageRemaining']);
  assert.equal(device.values.alarm_contact, true);
  assert.equal(device.values.measure_battery, 80);
  assert.equal(observed(), 0, 'neither explicit read can advance last-seen');
  device.onContactAlarmAttributeReport('closed'); // direct old-style invocation
  device.onBatteryPercentageAttributeReport(180);
  await tick();
  assert.equal(observed(), 0);
  await device.onUninit();
});

test('SOC001: genuine contact ZCL report updates telemetry without changing capability mapping', async () => {
  const { device, node, zclNode, observed } = contactFixture();
  await device.onNodeInit({ zclNode });
  await node.handleFrame(2, 0xfc06, Buffer.from([0x1c, 0x0b, 0x10, 1, 0x0a, 0, 1, 0x30, 1]), {});
  await tick();
  assert.equal(device.values.alarm_contact, true);
  assert.equal(observed(), 1);
  await device.onUninit();
});

test('SOC001: valid incoming battery report counts, unknown battery does not', async () => {
  const { device, node, zclNode, observed } = contactFixture();
  await device.onNodeInit({ zclNode });
  await node.handleFrame(2, 1, Buffer.from([0x18, 1, 0x0a, 0x21, 0, 0x20, 255]), {});
  await tick();
  assert.equal(observed(), 0);
  await node.handleFrame(2, 1, Buffer.from([0x18, 2, 0x0a, 0x21, 0, 0x20, 150]), {});
  await tick();
  assert.equal(observed(), 1);
  assert.equal(device.values.measure_battery, 75);
  await device.onUninit();
});

test('SOC001: legacy physical On/Off command is incoming traffic; no new availability writes', async () => {
  const { device, node, zclNode, observed } = contactFixture();
  let availability = 0;
  device.setAvailable = async () => { availability += 1; };
  await device.onNodeInit({ zclNode });
  await node.handleFrame(2, 6, Buffer.from([0x11, 3, 1]), {});
  await tick();
  assert.equal(observed(), 1);
  assert.equal(device.values.alarm_contact, true);
  assert.equal(availability, 0, 'SOC001 original availability behavior is preserved');
  await device.onUninit();
});
