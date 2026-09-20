'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadDriver } = require('./helpers');
const { CLUSTER } = require('zigbee-clusters');

function light(id, subDeviceId) {
  const Driver = loadDriver(id);
  const device = new Driver();
  device.data = subDeviceId ? { id: 'dymera', subDeviceId } : { id: 'dymera' };
  device.capabilities = new Set(['onoff', 'dim', 'light_hue', 'light_saturation', 'light_temperature', 'light_mode']);
  device.listeners = {};
  device.registerCapabilityListener = (id, fn) => { device.listeners[id] = fn; };
  device.registerMultipleCapabilities = (definitions, fn) => { device.colorListener = fn; };
  device.homey = { setTimeout, clearTimeout };
  const calls = [];
  const command = (endpoint, name) => async args => { calls.push({ endpoint, name, args }); };
  const endpoint = number => ({ clusters: {
    onOff: {
      setOn: command(number, 'setOn'), setOff: command(number, 'setOff'),
      toggle: command(number, 'toggle'), writeAttributes: command(number, 'onOff.write'),
      readAttributes: async () => ({ onOff: true }),
    },
    levelControl: {
      moveToLevelWithOnOff: command(number, 'dim'), moveWithOnOff: command(number, 'move'),
      stopWithOnOff: command(number, 'stop'), writeAttributes: command(number, 'level.write'),
      readAttributes: async () => { calls.push({ endpoint: number, name: 'level.read' }); return { currentLevel: 64 }; },
    },
    colorControl: {
      readAttributes: async () => ({ colorCapabilities: { colorTemperature: true, hueAndSaturation: true },
        colorTempPhysicalMinMireds: number === 11 ? 153 : 160, colorTempPhysicalMaxMireds: 500 }),
      moveToColorTemperature: command(number, 'temperature'),
      moveToHueAndSaturation: command(number, 'color'), writeAttributes: command(number, 'color.write'),
    },
    identify: { triggerEffectId: command(number, 'alert') },
  } });
  device.zclNode = { endpoints: { 11: endpoint(11), 12: endpoint(12) } };
  return { device, calls };
}

for (const [zone, subDeviceId, endpoint] of [['bottom', undefined, 12], ['top', 'top', 11]]) {
  test(`Dymera ${zone}: shared init and all light operations stay on endpoint ${endpoint}`, async () => {
    const { device, calls } = light('929003665001', subDeviceId);
    await device.onNodeInit({ zclNode: device.zclNode });
    assert.equal(typeof device.listeners.onoff, 'function');
    assert.equal(typeof device.listeners.dim, 'function');
    assert.equal(typeof device.colorListener, 'function');
    assert.equal(device.getStoreValue('colorTempMin'), endpoint === 11 ? 153 : 160);
    await device.listeners.onoff(false);
    await device.listeners.dim(0.5, { duration: 2500 });
    await device.colorListener({ light_temperature: 1 }, { light_temperature: { duration: 1000 } });
    await device.changeColor({ hue: 0.25, saturation: 0.5 }, { duration: 500 });
    await device.alert({ alert_mode: 'blink' });
    device.sleep = async () => {};
    await device.blink({ blink_type: 'short', blinks: 1 });
    await device.startDim({ direction: 'up', rate: 50 });
    await device.stopDim();
    await device.onSettings({ oldSettings: {}, changedKeys: ['powerOnCtrl_state'], newSettings: {
      powerOnCtrl_state: 'recover', powerOnCtrl_dimvalue: 200, powerOnCtrl_colorvalue: 300,
    } });
    await device.onUninit();
    assert.ok(calls.length >= 10);
    assert.ok(calls.every(call => call.endpoint === endpoint));
    assert.deepEqual(calls.find(call => call.name === 'dim').args, { level: 127, transitionTime: 25 });
    assert.deepEqual(calls.find(call => call.name === 'temperature').args,
      { colorTemperature: 500, transitionTime: 10 });
    assert.equal(device._dimMoveTimeout, null);
    assert.equal(device.errors.length, 0);
  });

  test(`Dymera ${zone}: missing cluster never falls back to the other light zone`, () => {
    const { device } = light('929003665001', subDeviceId);
    delete device.zclNode.endpoints[endpoint].clusters.levelControl;
    assert.equal(device.getClusterEndpoint(CLUSTER.LEVEL_CONTROL), null);
    assert.throws(() => device.levelControlCluster, /missing_level_control_cluster/);
  });
}

test('Dymera rejects an unknown subdevice instead of controlling the bottom zone', () => {
  const { device } = light('929003665001', 'unknown');
  assert.throws(() => device.getClusterEndpoint(CLUSTER.ON_OFF), /Unknown Dymera subdevice/);
});

test('Slim: inherits shared initialization with zclNode and Hue Flow methods', async () => {
  const { device } = light('929004291001');
  // Use the real base endpoint resolver with a minimal cluster-only node fixture.
  // Its ZCLNode instance assertion is covered by Homey, not this unit boundary.
  device.getClusterEndpoint = cluster => device.zclNode.endpoints[11].clusters[cluster.NAME] ? 11 : null;
  await device.onNodeInit({ zclNode: device.zclNode });
  assert.equal(device.getStoreValue('colorTempMin'), 153);
  for (const method of ['blink', 'alert', 'startDim', 'stopDim']) {
    assert.equal(typeof device[method], 'function');
  }
  assert.equal(typeof device.listeners.dim, 'function');
});

test('2.2.18: on/off readback does not overwrite an explicit dim command', async () => {
  const { device, calls } = light('929003665001');
  await device.onNodeInit({ zclNode: device.zclNode });
  device.values.dim = 0.8;
  await device.changeOnOff(true);
  await device.changeDimLevel(0.8, { duration: 3000 });
  await new Promise(resolve => setTimeout(resolve, 1150));
  assert.equal(device.values.dim, 0.8);
  assert.equal(calls.filter(call => call.name === 'level.read').length, 0);
});
