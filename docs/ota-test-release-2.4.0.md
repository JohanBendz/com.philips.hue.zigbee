# OTA handoff for 2.4.0 Test

Prepared **2026-10-04** (Europe/Stockholm) for [PR #758](https://github.com/JohanBendz/com.philips.hue.zigbee/pull/758), [OTA tracking #668](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/668) and [dashboard #776](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776).

The selected destination is **2.4.0 on Homey Test**, together with the `develop-2.4` release. Preparation and validation are performed on `ota-2026`. PR #758 is the integration path into `develop-2.4`; publication belongs to the maintainer's scheduled Test release. This work does not publish a build or modify the active 2.3.0 Test release.

Physical OTA results are collected **during Test**. Their absence is not a software-preparation blocker for this Test candidate. They remain necessary evidence when deciding the scope of a later Live release.

## Frozen OTA scope

| Item | Prepared scope |
| --- | --- |
| Development baseline | `develop-2.4` at `5c4dd47964900fd3208b79d875bb12da0039938f` |
| App / package / lockfile version | `2.4.0` |
| App runtime minimum | Homey `>=12.9.0`, Node.js `>=22` |
| Native OTA requirements | Supported Homey platform on `13.2.0+`; Homey Mobile App `9.10.0+` |
| OTA coverage | 47 of 172 drivers; 67 of 398 supported product IDs |
| Firmware | 21 families; 40 unique images; 141 per-driver files; 157 manifest references |
| Catalogue | Koenkk/zigbee-OTA `9f46fc5208eab9890dfe31696652428fa497850c` |
| Model guards | All 67 enabled IDs have explicit source-linked family checks |
| Release files | `.homeychangelog.json` 2.4.0 entry, `CHANGELOG.md`, `README.md` and `README.txt` |

The Develop refresh brings the Power-on and remote-protocol contract tests plus validated Tap Dial/RWL022 last-seen handling. It does not include the separate Power-on runtime migration in PR #792. Firmware binaries, update declarations and approved model families are unchanged by this release preparation.

See [exact driver/model coverage](ota-firmware.md#current-coverage) and the [model evidence register](ota-model-evidence.md). A driver's retail name is not a firmware-family identifier. Of the enabled mappings, 64 have an explicit maintained model-table entry, API fixture/capture, OTA request or owner report. LTO001, LTW015 and LWA029 currently have curated-database evidence only and need independent device observations during Test.

## Prepared candidate verification

Local verification used a clean dependency install, Node.js **24.19.0** and Homey CLI **4.5.0**. Publish validation passed and **180 tests passed / 0 failed**. The repository's PR CI separately runs on Node.js 22; its exact commit and result are recorded in PR #758 and the dashboard.

The fresh catalogue audit resolved to the reviewed `9f46fc5` source with **zero active-family changes**. All app/package/lockfile versions and the release-note key agree on **2.4.0**. The final generated manifest and local CLI archive contain all **47 OTA declarations** and **141 firmware files**, with every firmware checksum matching the source tree. Development directories are excluded.

| Local CLI archive measurement | Result |
| --- | ---: |
| Files | 869 |
| File bytes before compression | 60,984,233 |
| Compressed bytes | 58,841,311 |
| Firmware bytes, including per-driver copies | 51,894,298 |

Archive SHA-256: `f3b514dca4afa4aff0c2c69b4b663efa59181f547dde44d83b3811ed6931b8d1`. This identifies the local verification archive, not a published build. Rebuild and record the final release commit at the Test cut.

## Software checks before integration and publication

Use Node.js 22 or newer. Start from a clean checkout, retain the tracked generated `app.json` baseline, and run in this order:

```sh
npm ci --ignore-scripts
npx --yes homey@4.5.0 app validate --level publish
npm test
npm run ota:audit
git diff --check
```

- Publish validation must succeed with all 47 firmware-enabled drivers present in the generated manifest.
- Regression tests check exact model coverage, source evidence, binary integrity, complete firmware chains and selection limits, as well as preservation of every declaration and wake instruction in the generated manifest.
- Catalogue audit exit code `0` means no active-family changes; `1` requires a source review; `2` means the audit failed. Review new upstream metadata before changing this candidate. Do not silently refresh the fixed references.
- Inspect the built app: all 141 firmware files must be present with matching checksums, and development `test/`, `docs/` and `scripts/` directories must be excluded. The CLI upload archive includes firmware; it is not the installed app size.
- Verify `.homeycompose/app.json`, `package.json`, both lockfile version records and the release-note key agree on `2.4.0`. Discard incidental generated root `app.json` changes after validation.

## Integration at the Test cut

1. Check PR #758 against the actual `develop-2.4` head used for the release. If Develop advances, sync those changes into `ota-2026` and rerun the checks. The PR's green temporary-merge CI is additional evidence; it does not itself update either branch.
2. Integrate the reviewed OTA PR into `develop-2.4` as part of the planned 2.4.0 Test cut. Keep the existing Develop changes and combine any later 2.4.0 release-note additions. Do not transfer OTA into the frozen 2.3.0 Test or Live branches.
3. Run the checks again on the final release commit, record that exact commit and archive, and publish **2.4.0 to Test** through the maintainer's normal process. Merge/publication have not been performed by this preparation.
4. Record publication in the dashboard and direct testers to the hardware plan and #668. Keep the OTA issue open while Test feedback is collected.

## Test observations and remaining coverage work

Follow the [hardware test plan](ota-test-plan.md), including its per-device result template:

- Modern mains-powered devices: LCA001 and exact LOM001/LOM006/LOM007 plug models; include an old starting version that exercises an intermediate chain.
- Legacy path: LCT003 with its SBL images.
- Battery path: RWL022, RDM001 and SML001, including wake instructions, normal button/sensor behaviour and battery reporting.
- For every transferred image, record the starting/resulting version, progress/result, rejoin, retained paired identity/settings, existing Flows and behaviour after app restart. An already-current device verifies the no-update path only.
- Collect independent model/platform observations for LTO001, LTW015 and LWA029. Record exact LLC010/LCL001 variants without enabling additional families from a model name alone.

LCT026, LST002, 3261031P6, SOC001 and the two Ensis zone IDs remain withheld. LLC010 `0x0103` and LCL001 `0x0117` remain unapproved alternatives. The 331 unmapped product IDs and other catalogue-only families are future coverage work, not promised 2.4.0 OTA support.

For a failed transfer, stop that test case and retain the Homey result/log before another attempt; do not force a different image or factory-reset the device to conceal the failure. Verify normal operation and record whether the problem follows one model, firmware family or Homey platform. A confirmed targeting error requires withholding the affected mapping in a subsequent Test build. App rollback does not roll back firmware already installed on a Hue device.

Athom's [native OTA documentation](https://apps.developer.homey.app/wireless/zigbee/zigbee-firmware-updates) requires correct targeting and physical end-to-end verification before broad release. Keep Test results explicit; software checks alone do not establish device-level success.
