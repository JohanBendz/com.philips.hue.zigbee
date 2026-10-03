'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const DRIVERS = path.join(ROOT, 'drivers');
const CATALOGUE = require('./fixtures/hue-ota-catalogue.json');
const MODEL_REGISTRY = require('./fixtures/hue-ota-models.json');
const CATALOGUE_IMAGES = new Map(CATALOGUE.images.map(image => [catalogueKey(image), image]));

const WITHHELD_REVISION_CONFLICTS = new Set([
  '3261031P6',
  'LCT026',
  'LST002',
]);

const WITHHELD_PENDING_EVIDENCE = new Set([
  'SOC001',
  '929003053301_01',
  '929003053301_02',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function catalogueKey(image) {
  return `${image.manufacturerCode}:${image.imageType}:${image.fileVersion}`;
}

function assertModelRegistry(registry) {
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.manufacturerCode, 0x100b);
  assert.ok(Object.keys(registry.models).length > 0, 'empty model registry');
  const sourceKinds = new Set([
    'maintained-mapping', 'hue-v2-fixture', 'hue-v2-capture',
    'ota-request', 'device-report', 'curated-device-database',
  ]);

  for (const [sourceId, source] of Object.entries(registry.sources)) {
    assert.equal(new URL(source.url).protocol, 'https:', `${sourceId}: source URL`);
    assert.ok(sourceKinds.has(source.kind), `${sourceId}: evidence kind`);
    assert.ok(Object.keys(source.observations).length > 0, `${sourceId}: no observations`);
  }

  for (const [productId, model] of Object.entries(registry.models)) {
    assert.ok(Array.isArray(model.imageTypes) && model.imageTypes.length > 0, `${productId}: no reviewed families`);
    assert.equal(new Set(model.imageTypes).size, model.imageTypes.length, `${productId}: duplicate family`);
    assert.ok(model.imageTypes.every(type => Number.isInteger(type) && type >= 0 && type <= 0xffff), `${productId}: invalid family`);
    assert.ok(Array.isArray(model.sources) && model.sources.length > 0, `${productId}: no evidence`);
    assert.equal(new Set(model.sources).size, model.sources.length, `${productId}: duplicate source`);
    const evidencedTypes = new Set();

    for (const sourceId of model.sources) {
      assert.ok(Object.hasOwn(registry.sources, sourceId), `${productId}: unknown source ${sourceId}`);
      const observations = registry.sources[sourceId].observations[productId];
      assert.ok(Array.isArray(observations) && observations.length > 0, `${productId}: source ${sourceId} has no model evidence`);
      let supportsApprovedFamily = false;
      for (const platform of observations) {
        const match = /^([0-9a-f]{4})-([0-9a-f]{3,4})$/i.exec(platform);
        assert.ok(match, `${productId}: invalid observed platform ${platform}`);
        assert.equal(parseInt(match[1], 16), registry.manufacturerCode, `${productId}: observed manufacturer`);
        const imageType = parseInt(match[2], 16);
        evidencedTypes.add(imageType);
        supportsApprovedFamily ||= model.imageTypes.includes(imageType);
      }
      assert.ok(supportsApprovedFamily, `${productId}: source ${sourceId} does not support an approved family`);
    }
    for (const imageType of model.imageTypes) {
      assert.ok(evidencedTypes.has(imageType), `${productId}: family 0x${imageType.toString(16)} has no evidence`);
    }
    if (model.sources.every(sourceId => registry.sources[sourceId].kind === 'curated-device-database')) {
      assert.ok(model.reviewNote?.trim(), `${productId}: curated-only evidence needs a review note`);
    }
  }
}

function assertReviewedModel(update, label, registry = MODEL_REGISTRY) {
  for (const productId of asArray(update.device.productId)) {
    assert.ok(Object.hasOwn(registry.models, productId), `${label}/${productId}: unreviewed model`);
    for (const file of update.files) {
      assert.equal(file.manufacturerCode, registry.manufacturerCode, `${label}/${productId}: unreviewed manufacturer`);
      assert.ok(
        registry.models[productId].imageTypes.includes(file.imageType),
        `${label}/${productId}: unreviewed imageType 0x${file.imageType.toString(16)}`,
      );
    }
  }
}

function assertReviewedCoverage(mappedImageTypes, registry = MODEL_REGISTRY) {
  assert.deepEqual([...mappedImageTypes.keys()].sort(), Object.keys(registry.models).sort(), 'OTA model coverage differs from the reviewed registry');
  for (const [productId, imageTypes] of mappedImageTypes) {
    assert.deepEqual(
      [...imageTypes].sort((a, b) => a - b),
      [...registry.models[productId].imageTypes].sort((a, b) => a - b),
      `${productId}: declared families differ from the reviewed registry`,
    );
  }
}

function assertCatalogueChain(files, label) {
  assert.ok(Array.isArray(files) && files.length > 0, `${label}: empty firmware chain`);
  const first = files[0];
  const expected = CATALOGUE.images.filter(image =>
    image.manufacturerCode === first.manufacturerCode && image.imageType === first.imageType,
  );
  assert.ok(expected.length > 0, `${label}: firmware family absent from reviewed catalogue`);
  assert.deepEqual(
    files.map(catalogueKey),
    expected.map(catalogueKey),
    `${label}: incomplete or changed reviewed catalogue chain`,
  );

  for (const file of files) {
    const image = CATALOGUE_IMAGES.get(catalogueKey(file));
    assert.equal(file.size, image.fileSize, `${label}/${file.name}: catalogue size`);
    for (const field of ['minFileVersion', 'maxFileVersion', 'minHardwareVersion', 'maxHardwareVersion']) {
      assert.equal(file[field], image[field], `${label}/${file.name}: catalogue ${field}`);
    }
  }
}

test('OTA model registry records source-backed families and labels curated-only evidence', () => {
  assertModelRegistry(MODEL_REGISTRY);
});

test('bundled Zigbee firmware matches compose metadata, driver identity, headers and integrity', () => {
  const driverNames = fs.readdirSync(DRIVERS);
  let firmwareDrivers = 0;
  let firmwareFiles = 0;
  let bundledFirmwareFilesCount = 0;
  const supportedProductIds = new Set();
  const mappedImageTypes = new Map();

  for (const driverName of driverNames) {
    const driverDir = path.join(DRIVERS, driverName);
    if (!fs.statSync(driverDir).isDirectory()) continue;
    const driverComposePath = path.join(driverDir, 'driver.compose.json');
    if (!fs.existsSync(driverComposePath)) continue;
    const driver = JSON.parse(fs.readFileSync(driverComposePath, 'utf8'));
    const supportedProducts = asArray(driver.zigbee?.productId).filter(Boolean);
    for (const productId of supportedProducts) supportedProductIds.add(productId);

    const firmwareComposePath = path.join(driverDir, 'driver.firmware.compose.json');
    if (!fs.existsSync(firmwareComposePath)) continue;

    firmwareDrivers += 1;
    const firmware = JSON.parse(fs.readFileSync(firmwareComposePath, 'utf8'));
    const supportedManufacturers = asArray(driver.zigbee.manufacturerName);
    const referencedFirmwareFiles = new Set();

    assert.ok(Array.isArray(firmware.updates) && firmware.updates.length > 0, driverName);

    for (const update of firmware.updates) {
      assert.ok(Array.isArray(update.files) && update.files.length > 0, driverName);
      assertReviewedModel(update, driverName);
      const updateProducts = asArray(update.device.productId);
      for (const productId of updateProducts) {
        if (!mappedImageTypes.has(productId)) mappedImageTypes.set(productId, new Set());
        for (const file of update.files || []) mappedImageTypes.get(productId).add(file.imageType);
        assert.ok(
          supportedProducts.includes(productId),
          `${driverName}: unsupported productId ${productId}`,
        );
      }

      for (const manufacturer of asArray(update.device.manufacturerName)) {
        assert.ok(
          supportedManufacturers.includes(manufacturer),
          `${driverName}: unsupported manufacturer ${manufacturer}`,
        );
      }

      assertCatalogueChain(update.files, driverName);
      const versions = update.files.map(file => file.fileVersion);
      assert.deepEqual(
        versions,
        [...versions].sort((a, b) => a - b),
        `${driverName}: firmware files are not ordered`,
      );

      for (const file of update.files) {
        firmwareFiles += 1;
        referencedFirmwareFiles.add(file.name);
        const filename = path.join(driverDir, 'assets', 'firmware', file.name);
        const data = fs.readFileSync(filename);

        assert.equal(data.length, file.size, filename);
        assert.equal(data.readUInt32LE(0), 0x0beef11e, filename);
        assert.equal(data.readUInt16LE(4), 0x0100, filename);
        assert.equal(data.readUInt16LE(10), file.manufacturerCode, filename);
        assert.equal(data.readUInt16LE(12), file.imageType, filename);
        assert.equal(data.readUInt32LE(14), file.fileVersion, filename);
        assert.equal(data.readUInt32LE(52), file.size, filename);

        const [algorithm, expectedDigest] = file.integrity.split(':');
        assert.ok(algorithm && expectedDigest, `${filename}: invalid integrity format`);
        const digest = crypto.createHash(algorithm).update(data).digest('hex');
        assert.equal(digest, expectedDigest, filename);
        assert.equal(
          crypto.createHash('sha512').update(data).digest('hex'),
          CATALOGUE_IMAGES.get(catalogueKey(file)).sha512,
          `${filename}: bytes differ from reviewed upstream catalogue`,
        );
      }
    }

    const firmwareDir = path.join(driverDir, 'assets', 'firmware');
    const bundledFirmwareFiles = fs.readdirSync(firmwareDir).filter(entry =>
      fs.statSync(path.join(firmwareDir, entry)).isFile(),
    );
    bundledFirmwareFilesCount += bundledFirmwareFiles.length;
    assert.equal(
      bundledFirmwareFiles.length,
      referencedFirmwareFiles.size,
      `${driverName}: bundled firmware file count does not match manifest references`,
    );
    for (const bundledFirmwareFile of bundledFirmwareFiles) {
      assert.ok(
        referencedFirmwareFiles.has(bundledFirmwareFile),
        `${driverName}: orphan firmware file ${bundledFirmwareFile}`,
      );
    }
  }

  assertReviewedCoverage(mappedImageTypes);
  for (const productId of mappedImageTypes.keys()) {
    assert.ok(
      !WITHHELD_REVISION_CONFLICTS.has(productId),
      `${productId}: revision-conflicted product must remain withheld from OTA`,
    );
    assert.ok(
      !WITHHELD_PENDING_EVIDENCE.has(productId),
      `${productId}: product awaiting mapping or wake evidence must remain withheld from OTA`,
    );
  }

  const mappedProductIds = new Set(mappedImageTypes.keys());
  const unmappedProductIds = [...supportedProductIds].filter(productId => !mappedProductIds.has(productId));
  console.log(
    `[OTA audit] supported product IDs=${supportedProductIds.size}; mapped=${mappedProductIds.size}; gaps=${unmappedProductIds.length}; firmware drivers=${firmwareDrivers}; bundled files=${bundledFirmwareFilesCount}; manifest file refs=${firmwareFiles}`,
  );

  assert.ok(firmwareDrivers > 0);
  assert.ok(firmwareFiles > 0);
});

test('OTA catalogue check rejects removal of a required intermediate image', () => {
  const firmware = require('../drivers/LCA001/driver.firmware.compose.json');
  const files = structuredClone(firmware.updates.find(update => update.device.productId === 'LCA005').files);
  files.splice(1, 1);
  assert.throws(() => assertCatalogueChain(files, 'LCA005'), /incomplete or changed reviewed catalogue chain/);
});

test('OTA catalogue check rejects removed or widened source version limits', () => {
  const firmware = require('../drivers/LCA001/driver.firmware.compose.json');
  const original = firmware.updates.find(update => update.device.productId === 'LCA005').files;
  const widened = structuredClone(original);
  widened[0].maxFileVersion += 1;
  assert.throws(() => assertCatalogueChain(widened, 'LCA005'), /catalogue maxFileVersion/);

  const removed = structuredClone(original);
  delete removed[1].minFileVersion;
  assert.throws(() => assertCatalogueChain(removed, 'LCA005'), /catalogue minFileVersion/);
});

test('OTA model guard rejects an unreviewed alias even when it shares a supported driver', () => {
  const firmware = require('../drivers/LWA001/driver.firmware.compose.json');
  const update = structuredClone(firmware.updates.find(entry => entry.device.productId === 'LWA011'));
  update.device.productId = ['LWA011', 'LWA033'];
  assert.throws(() => assertReviewedModel(update, 'LWA001'), /LWA033: unreviewed model/);
});

test('OTA model guard rejects another valid family and a changed manufacturer', () => {
  const firmware = require('../drivers/LCA001/driver.firmware.compose.json');
  const update = structuredClone(firmware.updates.find(entry => entry.device.productId === 'LCA001'));
  update.files = firmware.updates.find(entry => entry.device.productId === 'LCA005').files;
  assert.throws(() => assertReviewedModel(update, 'LCA001'), /LCA001: unreviewed imageType/);

  const wrongManufacturer = structuredClone(firmware.updates.find(entry => entry.device.productId === 'LCA001'));
  wrongManufacturer.files[0].manufacturerCode = 0x100c;
  assert.throws(() => assertReviewedModel(wrongManufacturer, 'LCA001'), /unreviewed manufacturer/);
});

test('OTA model registry rejects missing evidence, unrelated citations and unsupported allowed families', () => {
  const missing = structuredClone(MODEL_REGISTRY);
  missing.models.LCA001.sources = [];
  assert.throws(() => assertModelRegistry(missing), /LCA001: no evidence/);

  const unrelated = structuredClone(MODEL_REGISTRY);
  unrelated.models.LCA001.sources = ['hueex'];
  assert.throws(() => assertModelRegistry(unrelated), /LCA001: source hueex has no model evidence/);

  const widened = structuredClone(MODEL_REGISTRY);
  widened.models.LCA001.imageTypes.push(0x0114);
  assert.throws(() => assertModelRegistry(widened), /LCA001: family 0x114 has no evidence/);
});

test('OTA coverage guard rejects a removed model or an additional unapproved family', () => {
  const families = new Map();
  for (const driverName of fs.readdirSync(DRIVERS)) {
    const filename = path.join(DRIVERS, driverName, 'driver.firmware.compose.json');
    if (!fs.existsSync(filename)) continue;
    for (const update of JSON.parse(fs.readFileSync(filename, 'utf8')).updates) {
      for (const productId of asArray(update.device.productId)) {
        if (!families.has(productId)) families.set(productId, new Set());
        for (const file of update.files) families.get(productId).add(file.imageType);
      }
    }
  }

  const missing = structuredClone(families);
  missing.delete('RWL022');
  assert.throws(() => assertReviewedCoverage(missing), /OTA model coverage differs/);

  families.get('LLC010').add(0x0103);
  assert.throws(() => assertReviewedCoverage(families), /LLC010: declared families differ/);
});

test('OTA variant policy requires an explicitly reviewed family instead of a blanket single-family rule', () => {
  const registry = structuredClone(MODEL_REGISTRY);
  // Synthetic approval in this test only; no production manifest or registry is widened.
  registry.models.LLC010.imageTypes.push(0x0103);
  registry.models.LLC010.sources.push('hueex');
  assertModelRegistry(registry);

  const update = structuredClone(require('../drivers/LLC011/driver.firmware.compose.json').updates[0]);
  update.device.productId = 'LLC010';
  assert.throws(() => assertReviewedModel(update, 'LLC010'), /unreviewed imageType/);
  assert.doesNotThrow(() => assertReviewedModel(update, 'LLC010', registry));
});
