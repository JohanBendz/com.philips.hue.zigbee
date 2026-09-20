'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { loadDriver } = require('./helpers');

test('SML001 occupancy: saved sensitivity is applied on next announce', async () => {
  const Driver = loadDriver('SML001-occupancy');
  const device = new Driver();
  const writes = [];
  device.zclNode = { endpoints: { 2: { clusters: {
    occupancySensingCluster: { writeAttributes: async value => writes.push(value) },
  } } } };
  await device.onSettings({ oldSettings: {}, newSettings: { motion_sensitivity: '2' },
    changedKeys: ['motion_sensitivity'] });
  await device.onEndDeviceAnnounce();
  assert.deepEqual(writes, [{ sensitivity: 2 }]);
});

test('SOC001: attribute listeners update values and are removed on uninit', async () => {
  const Driver = loadDriver('SOC001');
  const device = new Driver();
  const onOff = new EventEmitter();
  const powerConfiguration = new EventEmitter();
  device.isFirstInit = () => false;
  device.zclNode = { endpoints: { 2: { clusters: { onOff, powerConfiguration } } } };
  await device.onNodeInit({ zclNode: device.zclNode });
  onOff.emit('attr.onOff', 1);
  powerConfiguration.emit('attr.batteryPercentageRemaining', 160);
  assert.equal(device.values.alarm_contact, true);
  assert.equal(device.values.measure_battery, 80);
  await device.onUninit();
  assert.equal(onOff.listenerCount('attr.onOff'), 0);
  assert.equal(powerConfiguration.listenerCount('attr.batteryPercentageRemaining'), 0);
});
