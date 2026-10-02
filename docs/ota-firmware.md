# Philips Hue Zigbee OTA firmware

This branch uses Homey's native Zigbee firmware update support. Firmware binaries are bundled per driver and declared in `driver.firmware.compose.json`.

See the [2026-10-03 readiness review](ota-review-2026-10-03.md) for current coverage limits, the direct Hue-server cross-check and open release/test follow-ups. Catalogue consistency does not mean full Hue coverage.

## Source and verification policy

- Use Koenkk/zigbee-OTA as the maintained catalogue/archive.
- Prefer Signify's `originalUrl` from the Koenkk index as provenance when available.
- Never identify an image by filename or visible software version alone.
- Verify every Zigbee OTA header before adding a file: `0x0BEEF11E`, header version `0x0100`, manufacturer code `0x100B` (4107), image type, file version and total image size.
- Store a cryptographic integrity value in Homey's firmware compose metadata. Prefer the SHA-512 published by Koenkk when available; locally computed SHA-256 remains valid.
- Preserve intermediate images whenever the upstream catalogue specifies `minFileVersion` / `maxFileVersion`; do not assume devices may jump directly to the latest image.
- Enable an update only for product IDs with an independently supported image-type mapping. A broad Homey driver does not imply that every product ID in that driver uses the same firmware family.
- Treat driver compose files as source of truth. `app.json` is generated during validation and should not be hand-edited.
- `test/firmware.test.js` validates every bundled OTA file against the compose metadata, driver identity, binary header and declared integrity algorithm. It also checks SHA-512 against the reviewed upstream catalogue, preserves the complete image chain and its file/hardware-version limits, and rejects orphan files, conflicting image types and accidental enablement of withheld models.

## Catalogue verification — 2026-10-02

The active firmware families were compared with [Koenkk/zigbee-OTA at `9f46fc5208eab9890dfe31696652428fa497850c`](https://github.com/Koenkk/zigbee-OTA/blob/9f46fc5208eab9890dfe31696652428fa497850c/index.json).

- All **40 unique firmware images** match the upstream SHA-512 and file size.
- All **21 enabled image types** include every image listed for that family at the reviewed source revision.
- All **157 manifest file references** preserve the catalogue's `minFileVersion` / `maxFileVersion` limits. There were no source mismatches or missing chain images.
- `test/fixtures/hue-ota-catalogue.json` records the source commit, whole-index SHA-256, original source URLs where present, image checksums and version constraints. Tests use this fixed reference without network access.
- Mutation tests prove that deleting an intermediate image, removing a minimum version or widening a maximum version is rejected.

This establishes consistency with the reviewed catalogue, not physical OTA success. New firmware requires a fresh source review and a deliberate catalogue-reference update. The reference is not automatically refreshed from `master`.

Official [Hue lamp release notes](https://www.philips-hue.com/en-us/support/release-notes/lamps) and [accessory release notes](https://www.philips-hue.com/en-us/support/release-notes/accessories) provide platform/version context. Their human-readable software versions do not replace the numeric version and image type in the OTA header or prove a model-to-platform mapping.

## Manual catalogue maintenance

Run `npm run ota:audit` to compare the reviewed reference with Koenkk's current catalogue. The command resolves `master` to a commit SHA before fetching `index.json`, then reports that SHA and the index's SHA-256 for reproducibility. It downloads catalogue metadata only and never writes driver manifests, firmware binaries or the reviewed reference.

The report identifies added and removed images in active families, including intermediate versions, and changes to checksums, sizes, version limits, source URLs and upstream eligibility filters. Koenkk's `hardwareVersionMin` / `hardwareVersionMax` are compared with Homey's `minHardwareVersion` / `maxHardwareVersion`; a zero boundary is preserved. Duplicate image identities and malformed Hue metadata fail the audit.

```sh
# Inspect a specific source revision instead of the current master.
npm run ota:audit -- --ref 9f46fc5208eab9890dfe31696652428fa497850c

# Compare a previously downloaded upstream index without network access.
npm run ota:audit -- --index /path/to/index.json

# Emit JSON, including changed fields and the list of unmapped product IDs.
npm run --silent ota:audit -- --json
```

| Exit code | Meaning |
| --- | --- |
| `0` | No catalogue changes in active firmware families |
| `1` | Active-family changes require manual review |
| `2` | Invalid arguments, network failure or invalid catalogue data |

Catalogue-only image families are reported separately as information. Their presence does not establish which Homey product IDs use them and does not enable OTA. This command does not inspect newly published binary headers or test device updates. Any import still requires source and mapping evidence, binary verification, a deliberate reference update, regression tests and Homey publish validation. There is no scheduled updater or automatic pull request creation.

The audit on 2026-10-02 resolved to the reviewed `9f46fc5` revision: **0 active-family changes**, **69 upstream Hue images** and **17 catalogue-only image families**. The existing 67 mapped product IDs and 313 unmapped IDs were unchanged.

## Packaging verification — 2026-10-02

Homey CLI **4.5.0** built the app and its archive locally. This did not upload or install it.

| Measurement | Result |
| --- | ---: |
| Firmware files in the source/build | 141 |
| Firmware bytes, including per-driver copies | 51,894,298 |
| Unique firmware image bytes | 13,141,920 |
| Build file count | 1,073 |
| Build file bytes, including firmware and dependencies | 61,982,157 |
| Compressed CLI upload archive bytes | 58,916,974 |

The project-level `test/`, `docs/` and `scripts/` directories are excluded by `.homeyignore`. Firmware files must remain in their driver asset directories for validation and upload; per-driver copies are part of Homey's declared layout.

The upload archive size is **not** the installed App Store app size. [Athom's Zigbee firmware documentation](https://apps.developer.homey.app/wireless/zigbee/zigbee-firmware-updates) states that firmware is stored separately after upload and downloaded when a device update starts. Backend extraction and actual installed size have not been measured here. Removing required intermediate images is therefore not an appropriate way to reduce the installed app.

See [the OTA hardware test plan](ota-test-plan.md) for the next verification stage.

## Current coverage

The branch currently contains **47 firmware-enabled Homey drivers** and **141 bundled firmware files**.

| Homey driver | Zigbee product ID(s) | Hue image type(s) | Battery wake instruction |
| --- | --- | --- | --- |
| 1743130P7 | 1743430P7 | `0x011F` | — |
| 1746330P7 | 1746330P7 | `0x011F` | — |
| 1746447P7 | 1746430P7 | `0x011F` | — |
| LCA001 | LCA001 | `0x0112` | — |
| LCA001 | LCA004, LCA005 | `0x0114` | — |
| LCE002 | LCE002 | `0x0114` | — |
| LCF003 | LCF003 | `0x010E` | — |
| LCF003 | 4080248P9 | `0x011D` | — |
| LCG002 | LCG002 | `0x0114` | — |
| LCL001 | LCL001 | `0x011F` | — |
| LCS001 | 1741530P7 | `0x011F` | — |
| LST001 | LST001 | `0x0103` | — |
| LCT000 | LCT010, LCT014, LCT015, LCT016 | `0x010C` | — |
| LCT003 | LCT003 | `0x0104` | — |
| LCT000 | LCT007 | `0x0104` | — |
| LCT012 | LCT012 | `0x010C` | — |
| LCT024 | LCT024 | `0x010E` | — |
| LCT024 | 440400982842 | `0x011F` | — |
| LLC010 | LLC010 | `0x0108` | — |
| LLC011 | LLC011, LLC012 | `0x0103` | — |
| LLC020 | LLC020 | `0x0108` | — |
| LOM002 | LOM001 | `0x0115` | — |
| LOM002 | LOM006, LOM007 | `0x011A` | — |
| LTA001 | LTA001 | `0x0112` | — |
| LTA011 | LTA015 | `0x0129` | — |
| LTC001 | LTC001 | `0x010E` | — |
| LTC011 | LTC011 | `0x010E` | — |
| LTC014 | 3216231P6 | `0x011D` | — |
| LTE002 | LTE002 | `0x0114` | — |
| LTG002 | LTG002 | `0x0114` | — |
| LTO001 | LTO001 | `0x0114` | — |
| LTO002 | LTO002 | `0x0114` | — |
| LTP002 | LTP002 | `0x010E` | — |
| LTW000 | LTW010, LTW015 | `0x010C` | — |
| LTW000 | LTW001 | `0x0104` | — |
| LTW000 | LTA009 | `0x0114` | — |
| LTW012 | LTW012 | `0x010C` | — |
| LTW013 | LTW013 | `0x010C` | — |
| LWA001 | LWA001 | `0x0112` | — |
| LWA001 | LWA011 | `0x0114` | — |
| LWA004 | LWA004 | `0x0112` | — |
| LWA017 | LWA017, LWA029 | `0x0114` | — |
| LWE002 | LWE002 | `0x0112` | — |
| LWO001 | LWO001 | `0x0112` | — |
| LWU001 | LWU001 | `0x0114` | — |
| LWB000 | LWB010, LWB014 | `0x010C` | — |
| LWB000 | LWB006 | `0x0105` | — |
| ROM001 | ROM001 | `0x0116` | Yes |
| RDM001 | RDM001 | `0x011C` | Yes |
| RDM001 | RDM004 | `0x0122` | Yes |
| RDM002 | RDM002 | `0x0121` | Yes |
| RWL000 | RWL020, RWL021 | `0x0109` | Yes |
| RWL022 | RWL022 | `0x0119` | Yes |
| SML001-occupancy | SML001 | `0x010D` | Yes |
| SML001-occupancy | SML003 | `0x011B` | Yes |
| SML001 | SML001 | `0x010D` | Yes |
| SML002-occupancy | SML002 | `0x010D` | Yes |
| SML002-occupancy | SML004 | `0x011B` | Yes |
| SML002 | SML002 | `0x010D` | Yes |

LOM006 is documented as image type `0x011A` in the public deCONZ/zigpy Hue OTA mapping. LTA015 is backed by issue #673 in this repository, which reports hardware platform `100b-129`. The remaining mappings were added only after cross-checking public Hue OTA mappings, captured Hue V2 `product_data`, observed Zigbee OTA requests, Koenkk/zigbee-OTA metadata and matching Zigbee OTA image headers.

## Gap audit

The source-of-truth inventory is derived from every active `drivers/*/driver.compose.json`, not from generated `app.json`.

As of this branch state:

- **380** unique Zigbee product IDs are supported by active driver compose files.
- **67** product IDs have an explicit, evidence-backed OTA mapping.
- **313** product IDs remain intentionally unmapped for OTA.
- **47** Homey drivers contain firmware manifests.
- **141** firmware binaries are physically bundled; those binaries are referenced **157** times across product-specific update entries.

The 313 unmapped IDs do **not** represent 313 distinct physical products. Many are retail IDs, aliases, regional variants or multiple IDs owned by the same Homey driver. An unmapped alias must not inherit firmware from another product in the driver unless its image type is independently established.

This audit added two mains-powered mappings after external verification:

- `1746330P7` (Hue Appear Outdoor Wall) → `0x011F`: observed in Hue V2 product data as hardware platform `100b-11f`; the exact model is also OTA-enabled in Zigbee2MQTT.
- `3216231P6` (Hue Aurelle square panel) → `0x011D`: observed in Hue V2 product data as hardware platform `100b-11d`; the exact model is also OTA-enabled in Zigbee2MQTT.

High-confidence candidates that remain withheld:

- `SOC001` → `0x0125`: multiple independent Hue V2 resources agree on `100b-125`, and Koenkk/zigbee-OTA contains the Signify Hue Secure Contact Sensor image chain. It remains withheld until battery wake/update behaviour is explicit enough for a safe Homey instruction.
- `929003053301_01` and `929003053301_02` (Ensis zones) → `0x011F`: currently supported by one public Hue device database, but no independent raw platform observation or OTA request has been found yet.

Newer compose aliases such as `LCA011`, `LWG005`, `LCL007`, `5047131P9`, `LWO005`, `929003597801`, `LCU001`, `LCL008` and `915005821901` were checked against external sources during this audit. No explicit model-to-hardware-platform evidence was found, so none inherited firmware from related models.

## Known revision conflicts

The following product IDs are deliberately withheld while their platform/revision evidence is reconciled:

- `LCT026`: observed as both `0x0111` and `0x011E` on different Hue hardware revisions.
- `3261031P6`: observed as both `0x0117` and `0x011D` on different Hue hardware revisions.
- `LST002`: observed requesting `0x010B`, while a public Hue device database maps the same model ID to `0x010F`.

Do not restore a single image-type mapping for these product IDs from model name alone.

Homey also matches the image type reported by the device, so multiple reviewed platform variants can in principle be supported for one product ID. The current one-family-per-product test is a repository policy, not a Homey limitation; see the [variant review](ota-review-2026-10-03.md#3-replace-the-blanket-single-family-assumption-with-reviewed-variant-support), including the additional observations for 3261031P6 and LCL001.

## Battery devices

Battery-powered devices use a separate `wakeInstruction` in their firmware compose manifest. The instruction is device-specific:

- Hue Smart Button: briefly press the button immediately before starting the update; press it again if Homey asks you to wake it.
- Hue Dimmer Switch: briefly press a button every few seconds.
- Hue motion sensors: briefly press the setup button every few seconds; do not hold it.
- Hue Tap Dial Switch and Wall Switch Module: follow the instruction declared by their driver manifest.

Battery-device OTA should be verified on real hardware because update timing depends on keeping the device awake.

## Expansion rule

Do not infer OTA support from a shared Homey driver alone. Add another product only when its Hue image type can be independently established and the required image chain is available and header-verified. New mappings should be added in small groups, followed by the firmware regression test and Homey publish validation before further expansion.
