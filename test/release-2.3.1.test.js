'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const compose = require('../.homeycompose/app.json');
const pkg = require('../package.json');
const lock = require('../package-lock.json');
const changelog = require('../.homeychangelog.json');

test('current release metadata is aligned', () => {
  const version = pkg.version;

  assert.equal(compose.version, version);
  assert.equal(lock.version, version);
  assert.equal(lock.packages[''].version, version);

  assert.equal(typeof changelog[version]?.en, 'string');
  assert.ok(changelog[version].en.length > 20);
  assert.doesNotMatch(changelog[version].en, /\btest(?:\s+release|\s+candidate)?\b/i);
});

test('App Store copy is release-neutral and present', () => {
  const storeReadme = fs.readFileSync(path.join(__dirname, '..', 'README.txt'), 'utf8');
  assert.ok(storeReadme.trim().length > 100);
  assert.doesNotMatch(storeReadme, /\btest\s+(?:release|version|candidate)\b/i);
  assert.equal(compose.description.en, 'Smart light — your way.');
});
