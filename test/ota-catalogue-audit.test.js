'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { auditCatalogue } = require('../scripts/audit-ota-catalogue');
const REVIEWED = require('./fixtures/hue-ota-catalogue.json');
const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'audit-ota-catalogue.js');

function image(fileVersion, extra = {}) {
  return {
    manufacturerCode: 0x100b, imageType: 0x0114, fileVersion,
    fileSize: 56, sha512: 'a'.repeat(128),
    fileName: `${fileVersion}.ota`, url: `https://example.test/${fileVersion}.ota`,
    ...extra,
  };
}

const CHAIN = [
  image(100, { maxFileVersion: 99 }),
  image(200, { minFileVersion: 100, maxFileVersion: 199 }),
  image(300, { minFileVersion: 200 }),
];

test('catalogue audit accepts a complete unchanged chain without mutating either input', () => {
  const current = structuredClone(CHAIN).reverse();
  const before = JSON.stringify({ CHAIN, current });
  const report = auditCatalogue(CHAIN, current);
  assert.equal(report.reviewRequired, false);
  assert.deepEqual(report.changes, []);
  assert.equal(report.reviewedImageCount, 3);
  assert.equal(JSON.stringify({ CHAIN, current }), before);
});

test('catalogue audit reports newly added intermediate images as well as newer images', () => {
  const report = auditCatalogue(CHAIN, [...CHAIN, image(150), image(400)]);
  assert.equal(report.reviewRequired, true);
  assert.deepEqual(report.changes.map(change => [change.kind, change.fileVersion]), [
    ['new_image', 150], ['new_image', 400],
  ]);
});

test('catalogue audit detects removal of an intermediate image', () => {
  const report = auditCatalogue(CHAIN, [CHAIN[0], CHAIN[2]]);
  assert.equal(report.reviewRequired, true);
  assert.equal(report.changes.length, 1);
  assert.equal(report.changes[0].kind, 'removed_image');
  assert.equal(report.changes[0].fileVersion, 200);
  assert.deepEqual(report.changes[0].before, CHAIN[1]);
});

test('catalogue audit catches replacement bytes at the same firmware version', () => {
  const current = structuredClone(CHAIN);
  current[2].sha512 = 'b'.repeat(128);
  current[2].fileSize += 1;
  const report = auditCatalogue(CHAIN, current);
  assert.equal(report.reviewRequired, true);
  assert.deepEqual(report.changes[0].fields, {
    fileSize: { before: 56, after: 57 },
    sha512: { before: 'a'.repeat(128), after: 'b'.repeat(128) },
  });
});

test('catalogue audit detects removed and widened firmware version limits', () => {
  const current = structuredClone(CHAIN);
  delete current[1].minFileVersion;
  current[1].maxFileVersion = 299;
  const report = auditCatalogue(CHAIN, current);
  assert.deepEqual(report.changes[0].fields, {
    minFileVersion: { before: 100, after: null },
    maxFileVersion: { before: 199, after: 299 },
  });
});

test('catalogue audit translates upstream hardware limits and preserves a zero minimum', () => {
  const reviewed = [image(100, { minHardwareVersion: 0, maxHardwareVersion: 2 })];
  const current = [image(100, { hardwareVersionMin: 0, hardwareVersionMax: 2 })];
  assert.equal(auditCatalogue(reviewed, current).reviewRequired, false);
  delete current[0].hardwareVersionMin;
  current[0].hardwareVersionMax = 3;
  assert.deepEqual(auditCatalogue(reviewed, current).changes[0].fields, {
    minHardwareVersion: { before: 0, after: null },
    maxHardwareVersion: { before: 2, after: 3 },
  });
});

test('catalogue-only families are informational and do not establish new model mappings', () => {
  const report = auditCatalogue(CHAIN, [
    ...CHAIN,
    image(10, { imageType: 0x0125 }),
    image(20, { imageType: 0x0125 }),
    { manufacturerCode: 0x1234 },
  ]);
  assert.equal(report.reviewRequired, false);
  assert.equal(report.upstreamHueImageCount, 5);
  assert.deepEqual(report.activeImageTypes, [0x0114]);
  assert.deepEqual(report.unmappedFamilies, [{ imageType: 0x0125, fileVersions: [10, 20] }]);
});

test('catalogue audit detects provenance and upstream eligibility changes', () => {
  const current = structuredClone(CHAIN);
  current[0].originalUrl = 'https://example.test/replacement.ota';
  current[0].force = true;
  current[0].modelId = 'LCA005';
  current[0].manufacturerName = ['Signify Netherlands B.V.'];
  const report = auditCatalogue(CHAIN, current);
  assert.equal(report.reviewRequired, true);
  assert.deepEqual(Object.keys(report.changes[0].fields), [
    'force', 'modelId', 'manufacturerName', 'originalUrl',
  ]);
});

test('catalogue audit rejects ambiguous identities, malformed images and missing baselines', () => {
  assert.throws(() => auditCatalogue(CHAIN, [...CHAIN, CHAIN[0]]), /Duplicate Hue image identity/);
  assert.throws(() => auditCatalogue(CHAIN, [image(100, { sha512: 'broken' })]), /invalid SHA-512/);
  assert.throws(() => auditCatalogue(CHAIN, [image(-1)]), /fileVersion/);
  assert.throws(() => auditCatalogue(CHAIN, [image(100, { fileSize: 0 })]), /fileSize/);
  assert.throws(() => auditCatalogue(CHAIN, [image(100, { hardwareVersionMin: 3, hardwareVersionMax: 2 })]), /inverted/);
  assert.throws(() => auditCatalogue(CHAIN, []), /no Hue images/);
  assert.throws(() => auditCatalogue(CHAIN, CHAIN, [0x0125]), /missing from the reviewed catalogue/);
});

function protectedFilesDigest() {
  const hash = crypto.createHash('sha256');
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile()) {
        hash.update(path.relative(ROOT, filename));
        hash.update(fs.readFileSync(filename));
      }
    }
  }
  visit(path.join(ROOT, 'drivers'));
  hash.update(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'hue-ota-catalogue.json')));
  return hash.digest('hex');
}

test('offline CLI reports inventory and exit codes without changing drivers, binaries or reviewed catalogue', t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'hue-ota-audit-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const indexPath = path.join(temporary, 'index.json');
  const originalDigest = protectedFilesDigest();
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', timeout: 10000 });
  const upstreamImages = REVIEWED.images.map(({ minHardwareVersion, maxHardwareVersion, ...metadata }) => ({
    ...metadata,
    ...(minHardwareVersion === undefined ? {} : { hardwareVersionMin: minHardwareVersion }),
    ...(maxHardwareVersion === undefined ? {} : { hardwareVersionMax: maxHardwareVersion }),
  }));

  fs.writeFileSync(indexPath, JSON.stringify(upstreamImages));
  const unchanged = run(['--index', indexPath, '--json']);
  assert.equal(unchanged.status, 0, unchanged.stderr);
  const report = JSON.parse(unchanged.stdout);
  assert.equal(report.reviewRequired, false);
  assert.equal(report.source.localIndex, indexPath);
  assert.equal(report.source.ref, undefined);
  assert.match(report.source.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual({
    drivers: report.inventory.firmwareDrivers,
    mapped: report.inventory.mappedProductIds,
    supported: report.inventory.supportedProductIds,
    unmapped: report.inventory.unmappedProductIds.length,
    files: report.inventory.bundledFiles,
    references: report.inventory.fileReferences,
    images: report.reviewedImageCount,
    families: report.activeImageTypes.length,
  }, { drivers: 47, mapped: 67, supported: 380, unmapped: 313, files: 141, references: 157, images: 40, families: 21 });

  fs.writeFileSync(indexPath, JSON.stringify(upstreamImages.slice(1)));
  const changed = run(['--index', indexPath, '--json']);
  assert.equal(changed.status, 1, changed.stderr);
  assert.equal(JSON.parse(changed.stdout).changes[0].kind, 'removed_image');

  fs.writeFileSync(indexPath, '{broken');
  const malformed = run(['--index', indexPath]);
  assert.equal(malformed.status, 2);
  assert.match(malformed.stderr, /OTA catalogue audit failed/);
  assert.equal(run(['--ref', 'master']).status, 2);
  assert.equal(run(['--index', indexPath, '--ref', 'a'.repeat(40)]).status, 2);
  assert.equal(run(['--unknown']).status, 2);
  assert.equal(protectedFilesDigest(), originalDigest);
});
