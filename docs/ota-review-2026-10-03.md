# OTA readiness review — 2026-10-03

Initial reviewed code: [`3c79e72`](https://github.com/JohanBendz/com.philips.hue.zigbee/commit/3c79e7225d7376c1ea4922bf8824b74a5fe622c9) on `ota-2026`. Date uses Europe/Stockholm. Updated on the same date for the integration of [`develop-2.4` at `29d9db0`](https://github.com/JohanBendz/com.philips.hue.zigbee/commit/29d9db03a2a2699c1bead2ee238f2afe27c3eac5). Work remains on `ota-2026`, with PR #758 targeting `develop-2.4`.

The new development baseline supplies version **2.4.0**, Homey compatibility **`>=12.9.0`**, and consistent package/lockfile versions. It adds four drivers and 18 product IDs; OTA manifests, firmware binaries and the reviewed catalogue are unchanged. The coverage inventory below reflects the integrated baseline; the source/API observations retain their original audit scope.

**Verdict: native OTA declarations and catalogue maintenance are implemented for a selected set of devices. Coverage is incomplete, release preparation has open items, and physical transfer/rejoin results are still pending.**

## Verified state

| Measure | Result |
| --- | ---: |
| Driver compose files with OTA / total | 47 / 172 |
| Explicitly OTA-mapped product IDs / supported IDs | 67 / 398 |
| Supported product IDs without OTA mappings | 331 |
| Enabled image families / families in the Hue catalogue | 21 / 38 |
| Unique bundled images / Hue images in the catalogue | 40 / 69 |
| Per-driver firmware files / manifest references | 141 / 157 |

Product IDs include aliases and regional variants. These counts do not measure the proportion of physical Hue products or installed devices covered. The public catalogue is not an exhaustive inventory of every product or firmware available through a Hue Bridge.

- [CI on the reviewed commit](https://github.com/JohanBendz/com.philips.hue.zigbee/actions/runs/37070472946) passed Homey publish validation and all **133 tests**. The **13 OTA-focused tests** were rerun during this review and passed.
- After integrating `develop-2.4`, Homey CLI 4.5.0 publish validation and all **161 tests** passed locally. The integrated tree preserves every existing OTA manifest, firmware binary and catalogue-reference byte. The offline catalogue audit still reports zero active-family changes against the reviewed index.
- `npm run ota:audit` resolved upstream to [`9f46fc5`](https://github.com/Koenkk/zigbee-OTA/blob/9f46fc5208eab9890dfe31696652428fa497850c/index.json), reporting **zero changes** in active families. Whole-index SHA-256: `b1a18d3fc8111106f2e77d7789f8b0277ea3cac4f2f9b7963a11a14f26575141`.
- All 40 unique images match the reviewed source checksums and metadata. All headers have field control zero, so none contains an additional hardware-version range or device-specific destination hidden in optional header fields.
- A selection simulation checked zero, every file/constraint boundary and adjacent versions through each family's latest image. All 21 chains reach their reviewed latest version without a gap; the longest require five steps. This verifies selection metadata, not transfer behaviour.
- Nine images use Hue's legacy SBL container. A generic Zigbee subelement parser rejects their payload layout, but this is a known format handled explicitly by [zigpy's `HueSBLOTAImage`](https://github.com/zigpy/zigpy/blob/dev/zigpy/ota/image.py). Their original bytes are preserved. Homey CLI header validation accepts them; physical behaviour still needs a result.

## Direct Hue-server cross-check

The public [Hue checkUpdate endpoint](https://firmware.meethue.com/v1/checkUpdate?deviceTypeId=100B-112&version=0) was queried with `version=0` for all 38 image types in the current catalogue. This is also the endpoint used by [Koenkk's Hue collector](https://github.com/Koenkk/zigbee-OTA/blob/9f46fc5208eab9890dfe31696652428fa497850c/src/autodl/hue.ts).

- All 38 requests returned HTTP 200; **19 families returned images**, while 19 returned no images.
- Seven active families returned images: `0x0112`, `0x0114`, `0x0115`, `0x011A`, `0x011D`, `0x011F`, `0x0129`.
- The 13 returned images belonging to those active families match local file sizes and the server's MD5 metadata. SHA-512 remains the repository's source-integrity check.
- No returned version was newer than the corresponding catalogue's highest version. Some responses omit prerequisite images or lag the catalogue, so this API must not be used to remove chain images or downgrade the reference.

An empty response is not evidence that a family has no firmware. These results cannot establish complete parity with all Hue Bridge updates. [Hue lamp release notes](https://www.philips-hue.com/en-us/support/release-notes/lamps) provide additional platform context, but their visible software versions are not interchangeable with OTA fileVersion values.

## Findings and follow-up work

### 1. Declared Homey minimum — resolved by development baseline integration

The initial review found `compatibility: ">=5.0.0"` despite the app and both pinned Zigbee dependencies declaring Node.js `>=22`. The integrated `develop-2.4` baseline resolves this with `compatibility: ">=12.9.0"` and generated-manifest regression checks. [Athom documents Node.js 22 across Homey platforms from v12.9.0](https://apps.developer.homey.app/the-basics/app#node.js).

Separately, [native Zigbee OTA](https://apps.developer.homey.app/wireless/zigbee/zigbee-firmware-updates) needs Homey 13.2+ on supported platforms and mobile app 9.10+. The app's runtime minimum does not promise OTA on Homey 12.9. The 2016–2019 Homey models are not listed as supported OTA platforms. This app declares the `local` platform; generic Homey Cloud OTA availability does not add Cloud support to this app.

### 2. Complete the model-mapping regression guard

`VERIFIED_IMAGE_TYPES` in `test/firmware.test.js` independently constrains the expected family for **29 of the 67 enabled product IDs**. The other 38 still receive manufacturer/product identity, binary, integrity and complete-chain checks, but lack that separate expected model-to-family assertion. Examples include LCA001, LOM006, RWL022 and SML001.

Create a complete reviewed model-to-family register with evidence links, then use it to check every enabled product and reject unreviewed additions. Do not treat a snapshot copied from current manifests as independent proof of the mapping.

### 3. Replace the blanket single-family assumption with reviewed variant support

Homey's documented selection also matches the device-reported manufacturer code and image type. A product ID occurring on multiple hardware platforms is therefore not inherently unsupported by Homey OTA. Our current global one-image-type-per-product assertion is a conservative repository policy, not a Homey restriction.

Reconcile each variant's evidence before replacing this assertion with explicit allowed families. For example, the [deCONZ mapping](https://github.com/dresden-elektronik/deconz-rest-plugin/wiki/OTA-Image-Types---Firmware-versions) distinguishes two LST002 generations (`0x010B` and `0x010F`). It also lists LCL001 under `0x0117`, while [a captured LCL001 OTA query](https://github.com/Koenkk/zigbee-OTA/issues/400) reports `0x011F`, which is the family currently enabled here. That supports the current family without establishing coverage of every LCL001 revision.

The same evidence review should revisit LCT026 and 3261031P6. The latter is listed as `0x0111` in the deCONZ table, in addition to the differing observations recorded in our earlier notes. No replacement mapping was inferred during this review.

### 4. Expand model coverage deliberately

Known gaps include LST002/LST003/LST004, gradient model IDs such as LCX024/LCX025/LCX028, SOC001, RDM003/RDM005/ROM002 and the Ensis zone IDs. Public images exist for several missing families, including gradient `0x0118`, Festavia `0x0123` and contact-sensor `0x0125`; firmware availability alone does not identify every model using them.

Useful next candidates from the deCONZ table are LWB004 (`0x0105`), LTC013 (`0x010E`) and LCL003 (`0x0117`). All are supported product IDs here but lack OTA mappings. Review their platform/revision evidence before enabling them. SOC001 additionally needs a verified wake/update procedure. Coverage work can proceed alongside controlled hardware testing.

### 5. Finish release preparation and record physical results

The maintained app version and both package-lock version records now match the inherited **2.4.0** development baseline. No OTA release version/channel or matching OTA changelog entry has been selected. Confirm release metadata together when preparing the chosen build, without replacing another active Test workstream accidentally.

Use the [hardware test plan](ota-test-plan.md) to record controlled Test/local results: modern mains-powered devices, a multi-step chain, a legacy SBL lamp, then battery devices and their wake instructions. Include transfer completion, rejoin, retained settings and existing controls/Flows. No physical success is claimed by this review.

## Recommended order

1. Complete the evidence-backed model mapping guard on `ota-2026`, keeping `develop-2.4` as its integration base.
2. Prepare the selected OTA test build and collect the hardware results in parallel with mapping research.
3. Add supported variants and additional verified products in small groups.
4. Promote only the scope supported by the collected results; retain an explicit coverage list.
