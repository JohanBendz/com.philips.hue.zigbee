'use strict';

const { EventEmitter } = require('node:events');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CLUSTER } = require('zigbee-clusters');
const { loadDriver } = require('./helpers');
const { startHuePlugReportLab } = require('../lib/HuePlugReportLab');
const compose = require('../drivers/LOM002/driver.compose.json');
const generated = require('../app.json');

function fixture() {
  const logs = [];
  const errors = [];
  const configured = [];
  const cluster = new EventEmitter();
  const device = {
    log: message => logs.push(message),
    error: (...args) => errors.push(args),
    configureAttributeReporting: async configs => { configured.push(configs); },
  };
  return { device, cluster, logs, errors, configured };
}

test('lab manifest binds only On/Off cluster on LOM endpoint 11', () => {
  assert.deepEqual(compose.zigbee.endpoints['11'].clusters, [0, 3, 4, 5, 6]);
  assert.deepEqual(compose.zigbee.endpoints['11'].bindings, [6]);
  const result = generated.drivers.find(driver => driver.id === 'LOM002');
  assert.deepEqual(result.zigbee.endpoints['11'].bindings, [6]);
});

test('passive probe counts only real report event path and never reconfigures Zigbee', async () => {
  const { device, cluster, logs, configured } = fixture();
  const lab = startHuePlugReportLab(device, cluster, { mode: 'passive', endpointId: 11 });
  await lab.ready;
  cluster.readAttributes = async () => ({ onOff: false }); // a poll/read response
  await cluster.readAttributes(['onOff']);
  assert.equal(lab.snapshot().totalReports, 0, 'normal polls are not report events');
  cluster.emit('attr.onOff', true);
  cluster.emit('attr.onOff', false);
  cluster.emit('attr.onOff', undefined);
  assert.deepEqual(lab.snapshot().totalReports, 3);
  assert.deepEqual(lab.snapshot().validReports, 2);
  assert.equal(configured.length, 0);
  assert.ok(logs.every(x => !x.includes('IEEE') && !x.includes('networkKey')));
  lab.stop();
  cluster.emit('attr.onOff', true);
  assert.equal(lab.snapshot().totalReports, 3);
});

test('explicit configure mode sends just one correct On/Off reporting request, not a poll change', async () => {
  const { device, cluster, configured, logs } = fixture();
  const lab = startHuePlugReportLab(device, cluster, { mode: 'configure', endpointId: 11 });
  await lab.ready;
  assert.deepEqual(configured, [[{
    endpointId: 11, cluster: CLUSTER.ON_OFF, attributeName: 'onOff',
    minInterval: 0, maxInterval: 300, minChange: 1,
  }]]);
  assert.ok(logs.some(x => x.includes('configureAttributeReporting accepted')));
  lab.stop();
});

test('reporting configuration failure is diagnostic, never disables original polling', async () => {
  const { device, cluster, errors } = fixture();
  device.configureAttributeReporting = async () => { throw new Error('not supported'); };
  const lab = startHuePlugReportLab(device, cluster, { mode: 'configure', endpointId: 11 });
  await lab.ready;
  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /failed/);
  lab.stop();
});

test('normal LOM002 driver initializes with untouched 15-second polling and zero lab activity', async () => {
  const previous = process.env.HUE_PLUG_REPORT_LAB;
  delete process.env.HUE_PLUG_REPORT_LAB;
  try {
    const Driver = loadDriver('LOM002');
    const device = new Driver();
    device.capabilities = new Set(['onoff']);
    device.getClusterEndpoint = () => 11;
    const registered = [];
    device.registerCapability = (...args) => registered.push(args);
    await device.onNodeInit({ zclNode: { endpoints: { 11: { clusters: { onOff: new EventEmitter() } } } } });
    assert.equal(registered.length, 1);
    assert.equal(registered[0][0], 'onoff');
    assert.equal(registered[0][1], CLUSTER.ON_OFF);
    assert.deepEqual(registered[0][2], {
      getOpts: { pollInterval: 15000, getOnOnline: true },
    });
    assert.equal(device._plugReportLab, undefined);
  } finally {
    if (previous === undefined) delete process.env.HUE_PLUG_REPORT_LAB;
    else process.env.HUE_PLUG_REPORT_LAB = previous;
  }
});
