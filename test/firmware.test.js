'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const DRIVERS = path.join(ROOT, 'drivers');

const VERIFIED_IMAGE_TYPES = Object.freeze({
  '1741530P7': [0x011f],
  '1743430P7': [0x011f],
  '1746430P7': [0x011f],
  '4080248P9': [0x011d],
  LCA005: [0x0114],
  LCL001: [0x011f],
  LLC011: [0x0103],
  LST001: [0x0103],
  LTA001: [0x0112],
  LTA009: [0x0114],
  LTG002: [0x0114],
  LTO002: [0x0114],
  LWA004: [0x0112],
  LWA011: [0x0114],
  LWE002: [0x0112],
  LWO001: [0x0112],
  LWU001: [0x0114],
});

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

test('bundled Zigbee firmware matches compose metadata, driver identity, headers and integrity', () => {
  const driverNames = fs.readdirSync(DRIVERS);
  let firmwareDrivers = 0;
  let firmwareFiles = 0;

  for (const driverName of driverNames) {
    const driverDir = path.join(DRIVERS, driverName);
    const firmwareComposePath = path.join(driverDir, 'driver.firmware.compose.json');
    if (!fs.existsSync(firmwareComposePath)) continue;

    firmwareDrivers += 1;
    const firmware = JSON.parse(fs.readFileSync(firmwareComposePath, 'utf8'));
    const driver = JSON.parse(fs.readFileSync(path.join(driverDir, 'driver.compose.json'), 'utf8'));
    const supportedProducts = asArray(driver.zigbee.productId);
    const supportedManufacturers = asArray(driver.zigbee.manufacturerName);

    assert.ok(Array.isArray(firmware.updates) && firmware.updates.length > 0, driverName);

    for (const update of firmware.updates) {
      const updateProducts = asArray(update.device.productId);
      for (const productId of updateProducts) {
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
      const versions = update.files.map(file => file.fileVersion);
      assert.deepEqual(
        versions,
        [...versions].sort((a, b) => a - b),
        `${driverName}: firmware files are not ordered`,
      );

      for (const file of update.files) {
        firmwareFiles += 1;
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
      }
    }
  }

  assert.ok(firmwareDrivers > 0);
  assert.ok(firmwareFiles > 0);
});
