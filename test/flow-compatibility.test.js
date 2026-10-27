'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const published = require('./fixtures/flow-2.3.1.json');
const flowRoot = path.join(root, '.homeycompose', 'flow');

function readCard(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(flowRoot, relativePath), 'utf8'));
}

test('all 11 published 2.3.1 Flow cards keep their entire schema, except deprecated flag', () => {
  const observedIds = new Set();

  for (const [relativePath, original] of Object.entries(published.cards)) {
    const old = readCard(relativePath);
    assert.equal(old.deprecated, true, relativePath);
    assert.equal(old.id, original.id, relativePath);
    assert.equal(observedIds.has(old.id), false, old.id);
    observedIds.add(old.id);

    const unchanged = { ...old };
    delete unchanged.deprecated;
    assert.deepEqual(unchanged, original, relativePath);
  }

  assert.equal(observedIds.size, 11);
});

test('all 11 new device-scoped cards use distinct IDs and preserve argument names and types', () => {
  const newIds = new Set();

  for (const [relativePath, original] of Object.entries(published.cards)) {
    const v2Path = relativePath.replace(/\.json$/, '_v2.json');
    const card = readCard(v2Path);
    assert.equal(card.id, original.id + '_v2', v2Path);
    assert.notEqual(card.deprecated, true, v2Path);
    assert.equal(newIds.has(card.id), false, card.id);
    newIds.add(card.id);

    const oldArgSignatures = (original.args || []).map(arg => [arg.name, arg.type]);
    const newArgSignatures = (card.args || []).map(arg => [arg.name, arg.type]);
    assert.deepEqual(newArgSignatures, oldArgSignatures, v2Path);

    const device = (card.args || []).find(arg => arg.type === 'device');
    assert.ok(device, v2Path);
    assert.match(device.filter, /^driver_id=[^&]+$/, v2Path);
    for (const title of Object.values(card.titleFormatted || {})) {
      assert.doesNotMatch(String(title), /\[\[device\]\]/, v2Path);
    }
  }

  assert.equal(newIds.size, 11);
});

test('legacy and v2 Flow cards share one run listener per action or condition', () => {
  const actions = new Map();
  const conditions = new Map();
  const makeCard = (registry, id) => ({
    registerRunListener(listener) {
      assert.equal(typeof listener, 'function', id);
      assert.equal(registry.has(id), false, 'Duplicate listener: ' + id);
      registry.set(id, listener);
    },
  });

  const context = {
    module: { exports: {} },
    require(id) {
      assert.equal(id, 'homey');
      return { App: class { log() {} } };
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context, {
    filename: 'app.js',
  });

  const AppClass = context.module.exports;
  const app = new AppClass();
  app.homey = {
    flow: {
      getActionCard(id) { return makeCard(actions, id); },
      getConditionCard(id) { return makeCard(conditions, id); },
    },
  };
  app.onInit();

  for (const [relativePath, old] of Object.entries(published.cards)) {
    const registry = relativePath.startsWith('actions/') ? actions : conditions;
    assert.ok(registry.has(old.id), 'Missing legacy listener: ' + old.id);
    assert.ok(registry.has(old.id + '_v2'), 'Missing new listener: ' + old.id);
    assert.strictEqual(
      registry.get(old.id),
      registry.get(old.id + '_v2'),
      'Mismatched listener for ' + old.id,
    );
  }

  assert.equal(actions.size, 18);
  assert.equal(conditions.size, 4);
});
