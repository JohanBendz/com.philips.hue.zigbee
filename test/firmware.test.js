'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const DRIVERS = path.join(ROOT, 'drivers');
const CATALOGUE = require('./fixtures/hue-ota-catalogue.json');
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

const VERIFIED_IMAGE_TYPES = Object.freeze({
  '1741530P7': [0x011f],
  '1743430P7': [0x011f],
  '1746330P7': [0x011f],
  '1746430P7': [0x011f],
  '3216231P6': [0x011d],
  '4080248P9': [0x011d],
  '440400982842': [0x011f],
  LCA004: [0x0114],
  LCA005: [0x0114],
  LCL001: [0x011f],
  LCT003: [0x0104],
  LLC011: [0x0103],
  LLC012: [0x0103],
  LOM001: [0x0115],
  LOM007: [0x011a],
  LST001: [0x0103],
  LTA001: [0x0112],
  LTA009: [0x0114],
  LTG002: [0x0114],
  LTW001: [0x0104],
  LTO002: [0x0114],
  LWA004: [0x0112],
  LWA011: [0x0114],
  LWA017: [0x0114],
  LWE002: [0x0112],
  LWO001: [0x0112],
  RDM004: [0x0122],
  ROM001: [0x0116],
  LWU001: [0x0114],
});

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function catalogueKey(image) {
  return `${image.manufacturerCode}:${image.imageType}:${image.fileVersion}`;
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
      const updateProducts = asArray(update.device.productId);
      for (const productId of updateProducts) {
        if (!mappedImageTypes.has(productId)) mappedImageTypes.set(productId, new Set());
        for (const file of update.files || []) mappedImageTypes.get(productId).add(file.imageType);
        assert.ok(
          supportedProducts.includes(productId),
          `${driverName}: unsupported productId ${productId}`,
        );
      }

      for (const productId of updateProducts) {
        const expectedImageTypes = VERIFIED_IMAGE_TYPES[productId];
        if (!expectedImageTypes) continue;
        for (const file of update.files) {
          assert.ok(
            expectedImageTypes.includes(file.imageType),
            `${driverName}/${productId}: unverified imageType 0x${file.imageType.toString(16)}`,
          );
        }
      }

      for (const manufacturer of asArray(update.device.manufacturerName)) {
        assert.ok(
          supportedManufacturers.includes(manufacturer),
          `${driverName}: unsupported manufacturer ${manufacturer}`,
        );
      }

      assert.ok(Array.isArray(update.files) && update.files.length > 0, driverName);
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

  for (const [productId, imageTypes] of mappedImageTypes) {
    assert.equal(
      imageTypes.size,
      1,
      `${productId}: multiple OTA image types declared: ${[...imageTypes].map(type => `0x${type.toString(16)}`).join(', ')}`,
    );
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
