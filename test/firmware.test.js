'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const firmware = require('../drivers/LOM002/driver.firmware.compose.json');

test('LOM006 firmware chain matches bundled Zigbee OTA headers and integrity', () => {
  assert.equal(firmware.updates.length, 1);
  const update = firmware.updates[0];

  assert.equal(update.device.productId, 'LOM006');
  assert.deepEqual(update.device.manufacturerName, ['Philips', 'Signify Netherlands B.V.']);
  assert.equal(update.files.length, 5);

  const versions = update.files.map(file => file.fileVersion);
  assert.deepEqual(versions, [...versions].sort((a, b) => a - b));

  for (const file of update.files) {
    const filename = path.join(__dirname, '..', 'drivers', 'LOM002', 'assets', 'firmware', file.name);
    const data = fs.readFileSync(filename);

    assert.equal(data.length, file.size, file.name);
    assert.equal(data.readUInt32LE(0), 0x0beef11e, file.name);
    assert.equal(data.readUInt16LE(4), 0x0100, file.name);
    assert.equal(data.readUInt16LE(10), file.manufacturerCode, file.name);
    assert.equal(data.readUInt16LE(12), file.imageType, file.name);
    assert.equal(data.readUInt32LE(14), file.fileVersion, file.name);
    assert.equal(data.readUInt32LE(52), file.size, file.name);

    const digest = crypto.createHash('sha256').update(data).digest('hex');
    assert.equal(file.integrity, `sha256:${digest}`, file.name);
  }

  for (let i = 1; i < update.files.length; i += 1) {
    assert.equal(update.files[i].minFileVersion, update.files[i - 1].fileVersion);
  }
});
