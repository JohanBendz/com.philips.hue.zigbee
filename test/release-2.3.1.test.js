'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const compose = require('../.homeycompose/app.json');
const pkg = require('../package.json');
const lock = require('../package-lock.json');
const changelog = require('../.homeychangelog.json');

test('2.3.1 Live release metadata is aligned', () => {
  assert.equal(compose.version, '2.3.1');
  assert.equal(pkg.version, '2.3.1');
  assert.equal(lock.version, '2.3.1');
  assert.equal(lock.packages[''].version, '2.3.1');

  assert.equal(typeof changelog['2.3.1']?.en, 'string');
  assert.ok(changelog['2.3.1'].en.length > 20);
  assert.doesNotMatch(changelog['2.3.1'].en, /\btest(?:\s+release|\s+candidate)?\b/i);
});

test('App Store copy is release-neutral and present', () => {
  const storeReadme = fs.readFileSync(path.join(__dirname, '..', 'README.txt'), 'utf8');
  assert.ok(storeReadme.trim().length > 100);
  assert.doesNotMatch(storeReadme, /\btest\s+(?:release|version|candidate)\b/i);
  assert.equal(compose.description.en, 'Smart light — your way.');
});
