'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const languages = ['en', 'nl', 'de', 'fr', 'it', 'sv', 'no', 'es', 'da', 'ru', 'pl', 'ko', 'ar'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...collectJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) result.push(full);
  }
  return result;
}

function flowTokens(value) {
  if (typeof value !== 'string') return [];
  return [...value.matchAll(/\[\[[^\]]+\]\]/g)].map(match => match[0]).sort();
}

function assertLocalizedObject(value, location) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || !Object.hasOwn(value, 'en')) return;

  for (const language of languages) {
    assert.ok(Object.hasOwn(value, language), `${location} is missing ${language}`);
    assert.equal(typeof value[language], typeof value.en, `${location} has a type mismatch for ${language}`);
  }

  if (typeof value.en === 'string') {
    const expectedTokens = flowTokens(value.en);
    for (const language of languages) {
      assert.deepEqual(flowTokens(value[language]), expectedTokens,
        `${location} does not preserve Flow tokens for ${language}`);
    }
  } else if (Array.isArray(value.en)) {
    for (const language of languages) {
      assert.ok(Array.isArray(value[language]), `${location} must be an array for ${language}`);
      assert.equal(value[language].length, value.en.length,
        `${location} has a different item count for ${language}`);
    }
  }
}

function walk(value, location) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  assertLocalizedObject(value, location);
  for (const [key, child] of Object.entries(value)) {
    walk(child, location ? `${location}.${key}` : key);
  }
}

test('Homey metadata covers every supported app language', () => {
  const app = readJson(path.join(root, '.homeycompose', 'app.json'));
  for (const field of ['name', 'description', 'tags']) {
    assertLocalizedObject(app[field], `.homeycompose/app.json:${field}`);
  }
});

test('all Flow cards and device settings cover every supported app language', () => {
  const files = [
    ...collectJsonFiles(path.join(root, '.homeycompose', 'flow')),
    ...collectJsonFiles(path.join(root, '.homeycompose', 'drivers', 'settings')),
  ];

  for (const id of fs.readdirSync(path.join(root, 'drivers'))) {
    for (const filename of ['driver.flow.compose.json', 'driver.settings.compose.json']) {
      const file = path.join(root, 'drivers', id, filename);
      if (fs.existsSync(file)) files.push(file);
    }
  }

  for (const file of files) {
    walk(readJson(file), path.relative(root, file));
  }
});

test('all driver pairing instructions cover every supported app language', () => {
  let pairingInstructions = 0;

  for (const id of fs.readdirSync(path.join(root, 'drivers'))) {
    const file = path.join(root, 'drivers', id, 'driver.compose.json');
    if (!fs.existsSync(file)) continue;

    const compose = readJson(file);
    const instruction = compose.zigbee?.learnmode?.instruction;
    if (!instruction?.en) continue;

    pairingInstructions += 1;
    assertLocalizedObject(instruction, `drivers/${id}/driver.compose.json:zigbee.learnmode.instruction`);
  }

  assert.equal(pairingInstructions, 172, 'Expected every current driver to expose a localized pairing instruction');
});

test('App Store README exists for every supported app language', () => {
  assert.ok(fs.existsSync(path.join(root, 'README.txt')));
  for (const language of languages.slice(1)) {
    const file = path.join(root, `README.${language}.txt`);
    assert.ok(fs.existsSync(file), `Missing README.${language}.txt`);
    assert.ok(fs.readFileSync(file, 'utf8').trim().length > 0, `README.${language}.txt is empty`);
  }
});
