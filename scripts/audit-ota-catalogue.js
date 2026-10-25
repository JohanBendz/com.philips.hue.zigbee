'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const REPOSITORY = 'Koenkk/zigbee-OTA';
const HUE = 0x100b;
const METADATA_FIELDS = [
  'fileSize', 'sha512', 'minFileVersion', 'maxFileVersion',
  'minHardwareVersion', 'maxHardwareVersion', 'force', 'modelId',
  'manufacturerName', 'fileName', 'url', 'originalUrl',
];

function imageKey(image) {
  return `${image.manufacturerCode}:${image.imageType}:${image.fileVersion}`;
}

function unsigned(value, maximum, label) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${label}: expected an unsigned integer up to ${maximum}`);
  }
  return value;
}

function normalizeImages(images, upstream) {
  if (!Array.isArray(images)) throw new Error('Catalogue must be an array of images');
  const result = new Map();
  for (const image of images) {
    if (!image || typeof image !== 'object') throw new Error('Invalid catalogue entry');
    if (image.manufacturerCode !== HUE) continue;
    const normalized = {
      manufacturerCode: HUE,
      imageType: unsigned(image.imageType, 0xffff, 'imageType'),
      fileVersion: unsigned(image.fileVersion, 0xffffffff, 'fileVersion'),
      fileSize: unsigned(image.fileSize, 0xffffffff, 'fileSize'),
    };
    if (normalized.fileSize === 0) throw new Error('fileSize must be positive');
    if (typeof image.sha512 !== 'string' || !/^[a-f0-9]{128}$/i.test(image.sha512)) {
      throw new Error(`${imageKey(normalized)}: invalid SHA-512`);
    }
    normalized.sha512 = image.sha512.toLowerCase();
    for (const [minimum, maximum, limit] of [
      ['minFileVersion', 'maxFileVersion', 0xffffffff],
      ['minHardwareVersion', 'maxHardwareVersion', 0xffff],
    ]) {
      for (const field of [minimum, maximum]) {
        const sourceField = upstream && field === 'minHardwareVersion' ? 'hardwareVersionMin'
          : upstream && field === 'maxHardwareVersion' ? 'hardwareVersionMax' : field;
        if (image[sourceField] !== undefined) {
          normalized[field] = unsigned(image[sourceField], limit, sourceField);
        }
      }
      if (normalized[minimum] > normalized[maximum]) {
        throw new Error(`${imageKey(normalized)}: inverted ${minimum}/${maximum}`);
      }
    }
    for (const field of ['fileName', 'url', 'originalUrl', 'modelId']) {
      if (image[field] === undefined) continue;
      if (typeof image[field] !== 'string' || !image[field]) throw new Error(`Invalid ${field}`);
      normalized[field] = image[field];
    }
    if (image.force !== undefined) {
      if (typeof image.force !== 'boolean') throw new Error('Invalid force flag');
      normalized.force = image.force;
    }
    if (image.manufacturerName !== undefined) {
      if (!Array.isArray(image.manufacturerName)
        || image.manufacturerName.length === 0
        || image.manufacturerName.some(name => typeof name !== 'string' || !name)) {
        throw new Error('Invalid manufacturerName filter');
      }
      normalized.manufacturerName = [...image.manufacturerName].sort();
    }
    const key = imageKey(normalized);
    if (result.has(key)) throw new Error(`Duplicate Hue image identity: ${key}`);
    result.set(key, normalized);
  }
  if (result.size === 0) throw new Error('Catalogue contains no Hue images');
  return result;
}

function auditCatalogue(reviewedImages, upstreamIndex, activeImageTypes) {
  const reviewed = normalizeImages(reviewedImages, false);
  const current = normalizeImages(upstreamIndex, true);
  const active = new Set(activeImageTypes ?? [...reviewed.values()].map(image => image.imageType));
  for (const imageType of active) {
    if (![...reviewed.values()].some(image => image.imageType === imageType)) {
      throw new Error(`Active image type ${imageType} is missing from the reviewed catalogue`);
    }
  }
  const identities = [...new Set([...reviewed.keys(), ...current.keys()])]
    .filter(key => active.has((reviewed.get(key) ?? current.get(key)).imageType))
    .sort((a, b) => {
      const left = reviewed.get(a) ?? current.get(a);
      const right = reviewed.get(b) ?? current.get(b);
      return left.imageType - right.imageType || left.fileVersion - right.fileVersion;
    });
  const changes = [];
  for (const key of identities) {
    const before = reviewed.get(key);
    const after = current.get(key);
    const { manufacturerCode, imageType, fileVersion } = before ?? after;
    const identity = { manufacturerCode, imageType, fileVersion };
    if (!before || !after) {
      changes.push({ kind: before ? 'removed_image' : 'new_image', ...identity, before, after });
      continue;
    }
    const fields = {};
    for (const field of METADATA_FIELDS) {
      if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
        fields[field] = { before: before[field] ?? null, after: after[field] ?? null };
      }
    }
    if (Object.keys(fields).length) changes.push({ kind: 'changed_metadata', ...identity, fields });
  }
  const unmapped = new Map();
  for (const image of current.values()) {
    if (active.has(image.imageType)) continue;
    const family = unmapped.get(image.imageType) ?? { imageType: image.imageType, fileVersions: [] };
    family.fileVersions.push(image.fileVersion);
    unmapped.set(image.imageType, family);
  }
  return {
    reviewRequired: changes.length > 0,
    reviewedImageCount: [...reviewed.values()].filter(image => active.has(image.imageType)).length,
    upstreamHueImageCount: current.size,
    activeImageTypes: [...active].sort((a, b) => a - b),
    changes,
    unmappedFamilies: [...unmapped.values()].sort((a, b) => a.imageType - b.imageType)
      .map(family => ({ ...family, fileVersions: family.fileVersions.sort((a, b) => a - b) })),
  };
}

function readInventory() {
  const supported = new Set();
  const mapped = new Set();
  const imageTypes = new Set();
  let firmwareDrivers = 0;
  let bundledFiles = 0;
  let fileReferences = 0;
  const asArray = value => Array.isArray(value) ? value : [value];
  for (const entry of fs.readdirSync(path.join(ROOT, 'drivers'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(ROOT, 'drivers', entry.name);
    const driverPath = path.join(directory, 'driver.compose.json');
    if (!fs.existsSync(driverPath)) continue;
    const driver = JSON.parse(fs.readFileSync(driverPath, 'utf8'));
    const driverProducts = asArray(driver.zigbee?.productId).filter(Boolean);
    for (const id of driverProducts) supported.add(id);
    const firmwarePath = path.join(directory, 'driver.firmware.compose.json');
    if (!fs.existsSync(firmwarePath)) continue;
    firmwareDrivers += 1;
    const firmware = JSON.parse(fs.readFileSync(firmwarePath, 'utf8'));
    for (const update of firmware.updates) {
      for (const id of asArray(update.device.productId)) {
        if (!driverProducts.includes(id)) throw new Error(`${entry.name}: unsupported OTA product ${id}`);
        mapped.add(id);
      }
      for (const file of update.files) {
        if (file.manufacturerCode !== HUE) throw new Error(`${entry.name}: non-Hue OTA image`);
        imageTypes.add(unsigned(file.imageType, 0xffff, 'imageType'));
        fileReferences += 1;
      }
    }
    bundledFiles += fs.readdirSync(path.join(directory, 'assets', 'firmware'), { withFileTypes: true })
      .filter(file => file.isFile()).length;
  }
  return {
    firmwareDrivers, bundledFiles, fileReferences,
    supportedProductIds: supported.size,
    mappedProductIds: mapped.size,
    unmappedProductIds: [...supported].filter(id => !mapped.has(id)).sort(),
    imageTypes: [...imageTypes].sort((a, b) => a - b),
  };
}

function parseOptions(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    if (argument === '--json' || argument === '--help') {
      options[argument.slice(2)] = true;
    } else if (argument === '--ref' || argument === '--index') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${argument} needs a value`);
      options[argument.slice(2)] = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (options.ref && !/^[a-f0-9]{40}$/i.test(options.ref)) throw new Error('--ref needs a full commit SHA');
  if (options.index && options.ref) throw new Error('Use either --index or --ref');
  return options;
}

async function fetchBytes(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'hue-ota-catalogue-audit' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run ota:audit -- [--ref <commit SHA> | --index <index.json>] [--json]\n'
      + 'Read-only: compares the reviewed Hue catalogue with upstream; never imports firmware.\n'
      + 'Exit codes: 0 = no changes in active families, 1 = review required, 2 = error.');
    return;
  }
  let ref = options.ref?.toLowerCase();
  let bytes;
  let source;
  if (options.index) {
    bytes = fs.readFileSync(options.index);
    source = { localIndex: path.resolve(options.index) };
  } else {
    if (!ref) {
      const commit = JSON.parse((await fetchBytes(`https://api.github.com/repos/${REPOSITORY}/commits/master`)).toString('utf8'));
      ref = commit.sha;
      if (typeof ref !== 'string' || !/^[a-f0-9]{40}$/.test(ref)) throw new Error('Invalid upstream commit SHA');
    }
    bytes = await fetchBytes(`https://raw.githubusercontent.com/${REPOSITORY}/${ref}/index.json`);
    source = { repository: REPOSITORY, ref, path: 'index.json' };
  }
  source.sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const reviewed = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'fixtures', 'hue-ota-catalogue.json'), 'utf8'));
  const inventory = readInventory();
  const report = {
    source,
    reviewedSource: reviewed.source,
    inventory,
    ...auditCatalogue(reviewed.images, JSON.parse(bytes.toString('utf8')), inventory.imageTypes),
  };
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const hex = (number, width) => `0x${number.toString(16).padStart(width, '0')}`;
    console.log(`Source: ${source.ref ?? source.localIndex}\nIndex SHA-256: ${source.sha256}`);
    console.log(`${inventory.firmwareDrivers} OTA drivers; ${inventory.mappedProductIds}/${inventory.supportedProductIds} product IDs mapped; ${inventory.unmappedProductIds.length} unmapped.`);
    console.log(`${inventory.bundledFiles} bundled files; ${inventory.fileReferences} manifest references; ${report.reviewedImageCount} reviewed images in ${report.activeImageTypes.length} active families.`);
    console.log(`Active-family changes: ${report.changes.length}${report.reviewRequired ? ' — manual review required.' : '.'}`);
    for (const change of report.changes) {
      console.log(`  ${change.kind}: ${hex(change.imageType, 4)} / ${hex(change.fileVersion, 8)}${change.fields ? ` (${Object.keys(change.fields).join(', ')})` : ''}`);
    }
    console.log(`Catalogue-only families (${report.unmappedFamilies.length}): ${report.unmappedFamilies.map(family => hex(family.imageType, 4)).join(', ')}`);
    console.log('Catalogue availability does not prove a product mapping. This audit does not verify binary headers or physical OTA success.');
  }
  process.exitCode = report.reviewRequired ? 1 : 0;
}

if (require.main === module) {
  main().catch(error => {
    console.error(`OTA catalogue audit failed: ${error.message}`);
    process.exitCode = 2;
  });
}

module.exports = { auditCatalogue };
