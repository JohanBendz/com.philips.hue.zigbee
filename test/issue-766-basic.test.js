'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Cluster, BasicCluster } = require('zigbee-clusters');
const HueSpecificBasicCluster = require('../lib/HueSpecificBasicCluster');
const { loadDriver, remote, zclFixture } = require('./helpers');

test('Hue Basic keeps the canonical 0x0000 cluster name and Hue extensions', () => {
  assert.equal(HueSpecificBasicCluster.NAME, BasicCluster.NAME);
  assert.equal(HueSpecificBasicCluster.NAME, 'basic');
  assert.equal(HueSpecificBasicCluster.ID, BasicCluster.ID);

  Cluster.addCluster(HueSpecificBasicCluster);
  const { zclNode } = zclFixture(1, [0, 1]);
  const clusters = zclNode.endpoints[1].clusters;

  assert.ok(clusters.basic, 'Homey standard Basic consumers expect clusters.basic');
  assert.equal(clusters.HueSpecificBasicCluster, undefined);
  assert.equal(clusters.basic.constructor, HueSpecificBasicCluster);
  assert.equal(clusters.basic.constructor.ATTRIBUTES.swBuildId.id, 0x4000);
  assert.equal(clusters.basic.constructor.ATTRIBUTES.deviceMode.id, 0x0034);
  assert.equal(clusters.basic.constructor.ATTRIBUTES.deviceMode.manufacturerId, 0x100b);
  assert.equal(clusters.basic.constructor.ATTRIBUTES.ledIndication.id, 0x0033);
  assert.equal(clusters.basic.constructor.ATTRIBUTES.ledIndication.manufacturerId, 0x100b);
  assert.equal(clusters.basic.constructor.COMMANDS.triggerDeviceMode.id, 0x0034);
});

test('Homey Zigbee getSwBuildId reads the restored standard Basic accessor', async () => {
  const Driver = loadDriver('RDM001');
  const device = new Driver();
  const { zclNode } = zclFixture(1, [0, 1]);
  const reads = [];

  device.zclNode = zclNode;
  zclNode.endpoints[1].clusters.basic.readAttributes = async attributes => {
    reads.push(attributes);
    return { swBuildId: '1.0.3' };
  };

  assert.equal(await device.getSwBuildId({ endpointId: 1, skipCache: true }), '1.0.3');
  assert.deepEqual(reads, [['swBuildId']]);
  assert.equal(device.getStoreValue('__swBuildId'), '1.0.3');
});

test('RDM001 deferred switch-mode write continues through canonical Basic', async () => {
  const { device } = remote('RDM001');
  const writes = [];

  device.zclNode.endpoints[1].clusters.basic.writeAttributes = async payload => {
    writes.push(payload);
  };
  device._deviceMode = 'dualpushbutton';
  device._wakeupaction = true;

  await device._setmode();
  await device._setmode();
  assert.deepEqual(writes, [{ deviceMode: 'dualpushbutton' }]);
  assert.equal(device._wakeupaction, false);
});

test('ROM002 switch configuration continues through canonical Basic', async () => {
  const { device } = remote('ROM002');
  const writes = [];

  device.zclNode.endpoints[1].clusters.basic.writeAttributes = async payload => {
    writes.push(payload);
  };
  await device._writeDeviceMode('singlepushbutton');

  assert.deepEqual(writes, [{ deviceMode: 'singlepushbutton' }]);
});

test('LWM007 finds the same Hue-extended Basic cluster for its switch endpoint', () => {
  const Driver = loadDriver('LWM007');
  const device = new Driver();
  const { zclNode } = zclFixture(1, [0, 3, 64512]);
  device.zclNode = zclNode;

  const basic = device._switchModeCluster();
  assert.ok(basic);
  assert.equal(basic, zclNode.endpoints[1].clusters.basic);
  assert.equal(basic.constructor.ATTRIBUTES.deviceMode.manufacturerId, 0x100b);
});
