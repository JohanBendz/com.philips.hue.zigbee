'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OnOffCluster, LevelControlCluster, ColorControlCluster } = require('zigbee-clusters');
const HueSpecificOnOffCluster = require('../lib/HueSpecificOnOffCluster');
const HueSpecificLevelControlCluster = require('../lib/HueSpecificLevelControlCluster');
const HueSpecificColorControlCluster = require('../lib/HueSpecificColorControlCluster');
const { toStandardStartupState } = require('../lib/HuePowerOnStartup');

test('pinned standard startup attributes match the legacy Hue attribute IDs', () => {
  assert.equal(OnOffCluster.ATTRIBUTES.startUpOnOff.id, 0x4003);
  assert.equal(LevelControlCluster.ATTRIBUTES.startUpCurrentLevel.id, 0x4000);
  assert.equal(ColorControlCluster.ATTRIBUTES.startUpColorTemperatureMireds.id, 0x4010);

  assert.equal(HueSpecificOnOffCluster.ATTRIBUTES.powerOnCtrl.id,
    OnOffCluster.ATTRIBUTES.startUpOnOff.id);
  assert.equal(HueSpecificLevelControlCluster.ATTRIBUTES.powerOnCtrl.id,
    LevelControlCluster.ATTRIBUTES.startUpCurrentLevel.id);
  assert.equal(HueSpecificColorControlCluster.ATTRIBUTES.powerOnCtrl.id,
    ColorControlCluster.ATTRIBUTES.startUpColorTemperatureMireds.id);

  // This command is unrelated to startup attributes and must not disappear
  // when the redundant Hue color-control attribute is eventually retired.
  assert.equal(HueSpecificColorControlCluster.COMMANDS.colorLoop.id, 0x44);
});

test('previously stored Homey state IDs map explicitly to standard ZCL enum labels', () => {
  assert.equal(toStandardStartupState('off'), 'off');
  assert.equal(toStandardStartupState('on'), 'on');
  assert.equal(toStandardStartupState('recover'), 'previous');

  assert.throws(() => toStandardStartupState('previous'), /Unsupported Hue power-on state/);
  assert.throws(() => toStandardStartupState('toggle'), /Unsupported Hue power-on state/);
  assert.throws(() => toStandardStartupState(undefined), /Unsupported Hue power-on state/);
});

test('all shipped Power-on settings retain their stored identifiers and values', () => {
  for (const name of ['light_powerOnCtrl', 'light_temp_powerOnCtrl', 'plug_powerOnCtrl']) {
    const group = require(`../.homeycompose/drivers/settings/${name}.json`);
    const state = group.children.find(setting => setting.id === 'powerOnCtrl_state');
    assert.ok(state, `${name} has a state setting`);
    assert.equal(state.value, 'on');
    assert.deepEqual(state.values.map(item => item.id), ['on', 'off', 'recover']);

    const brightness = group.children.find(item => item.id === 'powerOnCtrl_dimvalue');
    const temperature = group.children.find(item => item.id === 'powerOnCtrl_colorvalue');
    if (name === 'plug_powerOnCtrl') {
      assert.equal(brightness, undefined);
      assert.equal(temperature, undefined);
    } else {
      assert.ok(brightness);
      assert.equal(brightness.value, 255);
      assert.equal(brightness.min, 0);
      assert.equal(brightness.max, 255);
    }
    if (name === 'light_temp_powerOnCtrl') {
      assert.ok(temperature);
      assert.equal(temperature.value, 366);
      assert.equal(temperature.min, 153);
      assert.equal(temperature.max, 500);
    } else {
      assert.equal(temperature, undefined);
    }
  }
});
