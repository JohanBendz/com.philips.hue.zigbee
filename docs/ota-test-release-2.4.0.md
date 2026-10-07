# OTA handoff for 2.4.0 Test

Prepared **2026-10-04**, refreshed **2026-10-07** (Europe/Stockholm) for [PR #758](https://github.com/JohanBendz/com.philips.hue.zigbee/pull/758), [OTA tracking #668](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/668) and [dashboard #776](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776).

The selected destination is **2.4.0 on Homey Test**, together with the `develop-2.4` release. Preparation and validation are performed on `ota-2026`. PR #758 is the integration path into `develop-2.4`; publication belongs to the maintainer's scheduled Test release. This work does not publish a build or modify the active 2.3.0 Test release.

Physical OTA results are collected **during Test**. Their absence is not a software-preparation blocker for this Test candidate. They remain necessary evidence when deciding the scope of a later Live release.

## Frozen OTA scope

| Item | Prepared scope |
| --- | --- |
| Development baseline | `develop-2.4` at `349e3423396b57e6f0cd1e6933624115161d40b2` |
| App / package / lockfile version | `2.4.0` |
| App runtime minimum | Homey `>=12.9.0`, Node.js `>=22` |
| Native OTA requirements | Supported Homey platform on `13.2.0+`; Homey Mobile App `9.10.0+` |
| OTA coverage | 47 of 172 drivers; 67 of 398 supported product IDs |
| Firmware | 21 families; 40 unique images; 141 per-driver files; 157 manifest references |
| Catalogue | Koenkk/zigbee-OTA `9f46fc5208eab9890dfe31696652428fa497850c` |
| Model guards | All 67 enabled IDs have explicit source-linked family checks |
| Release files | `.homeychangelog.json` 2.4.0 entry, `CHANGELOG.md`, `README.md` and `README.txt` |

The Develop refresh includes the completed #770 last-seen work and #771 SDK battery simplification, alongside the Power-on and remote-protocol contract tests. The separate Power-on runtime migration in PR #792 and Smart Plug reporting experiment in PR #803 are outside this candidate. The existing 15-second plug polling is retained. Firmware binaries, image-selection metadata and approved model families are unchanged by this release preparation. The later help-text update adds English/Swedish post-restart guidance to the firmware changelogs.

See [exact driver/model coverage](ota-firmware.md#current-coverage) and the [model evidence register](ota-model-evidence.md). A driver's retail name is not a firmware-family identifier. Of the enabled mappings, 64 have an explicit maintained model-table entry, API fixture/capture, OTA request or owner report. LTO001, LTW015 and LWA029 currently have curated-database evidence only and need independent device observations during Test.

## Prepared candidate verification

**Merge review: 2026-10-07.** Reviewed OTA source: `41c3927a391970df2ab8d0167a0a5b19ddd05bab`; current `develop-2.4` is still `349e3423396b57e6f0cd1e6933624115161d40b2` and is already included. PR #758 is open, ready for review and conflict-free. No blocking implementation finding remains for integration into the planned 2.4.0 Test release. The follow-up commit records this review only in `docs/`, which is excluded from the packaged app.

A clean `npm ci --ignore-scripts`, Node.js **24.19.0** and Homey CLI **4.5.0** passed publish validation and **215 tests / 0 failures**. [PR CI for the reviewed source](https://github.com/JohanBendz/com.philips.hue.zigbee/actions/runs/37240962101) also passed on Node.js 22. CI for the documentation follow-up is recorded in PR #758 and the dashboard. All 67 evidence-register rows and 29 local documentation links/anchors were checked. Selection checks across 63 update entries and 691 file-version boundary scenarios reach the reviewed target or correctly have no newer image. The three runtime file differences against Develop are whitespace only.

The fresh catalogue audit resolved upstream to `10797024f00acd9530f10e8517a68823c59f3b3b` (index SHA-256 `e5cbc330ae03b307154bd4940752d4525487875e1552cfc691c8cde9019a7676`), with **zero active-family changes** against the fixed reviewed reference `9f46fc5`. App/package/lockfile versions and the release-note key agree on **2.4.0**.

The native CLI `app build` and archive pipeline were used to rebuild the verification package. All **47 OTA drivers**, **63 update entries** and **141 firmware files** are present; generated declarations, English/Swedish help, wake instructions and every firmware byte match the source. Runtime files match, and development directories are excluded. The pinned `homey-zigbeedriver` **2.2.18**, `zigbee-clusters` **3.8.0**, their production dependencies and Homey's CLI-provided runtime shim are included. Thirteen dependency package manifests and 168 JavaScript files match the clean dependency tree or the CLI shim.

| Local CLI archive measurement | Result |
| --- | ---: |
| Files | 1,093 |
| File bytes before compression | 62,294,893 |
| Compressed bytes | 59,112,930 |
| Firmware bytes, including per-driver copies | 51,894,298 |

Archive SHA-256: `85113935bee5faf20a95ad5f737c4c95fe6d654e9a54b9a79116fbef5f60a165`. This identifies the local verification archive built from `41c3927`, not a published build. Rebuild and record the final Develop release commit at the Test cut.

The earlier `f5dbfdd` verification archive omitted the production dependencies and also predates the post-restart help text. Its 870-file measurements and SHA-256 are superseded; it must not be used for publication. Source-level firmware validation remains valid, and no firmware or runtime change was needed to correct the package verification. Always include the CLI production-dependency build step when inspecting an upload archive.

## Software checks before integration and publication

Use Node.js 22 or newer. Start from a clean checkout, retain the tracked generated `app.json` baseline, and run in this order:

```sh
npm ci --ignore-scripts
npx --yes homey@4.5.0 app validate --level publish
npm test
npx --yes homey@4.5.0 app build
npm run ota:audit
git diff --check
```

- Publish validation must succeed with all 47 firmware-enabled drivers present in the generated manifest.
- Regression tests check exact model coverage, source evidence, binary integrity, complete firmware chains and selection limits, as well as preservation of every declaration and wake instruction in the generated manifest.
- Catalogue audit exit code `0` means no active-family changes; `1` requires a source review; `2` means the audit failed. Review new upstream metadata before changing this candidate. Do not silently refresh the fixed references.
- Inspect the actual CLI-built app: pinned Zigbee libraries and production dependencies, along with all 141 firmware files, must be present with matching checksums, and development `test/`, `docs/` and `scripts/` directories must be excluded. The CLI upload archive includes firmware; it is not the installed app size.
- Verify `.homeycompose/app.json`, `package.json`, both lockfile version records and the release-note key agree on `2.4.0`. Discard incidental generated root `app.json` changes after validation.

## Integration at the Test cut

1. Check PR #758 against the actual `develop-2.4` head used for the release. If Develop advances, sync those changes into `ota-2026` and rerun the checks. The PR's green temporary-merge CI is additional evidence; it does not itself update either branch.
2. Integrate the reviewed OTA PR into `develop-2.4` as part of the planned 2.4.0 Test cut. Keep the existing Develop changes and combine any later 2.4.0 release-note additions. Do not transfer OTA into the frozen 2.3.0 Test or Live branches.
3. Run the checks again on the final release commit, record that exact commit and archive, and publish **2.4.0 to Test** through the maintainer's normal process. Merge/publication have not been performed by this preparation.
4. Record publication in the dashboard and direct testers to the hardware plan and #668. Keep the OTA issue open while Test feedback is collected.

## Test observations and remaining coverage work

The first [LCT015 result](ota-test-results.md#lct015--2026-10-05) confirms transfer/rejoin, OTA `0x01001A02` → `0x01002A00` and software `1.50.2_r30933` → `1.116.12`. Homey initially could not verify success, then showed the installed target and up-to-date status after a delay. The exact installed app build/Homey/client versions and post-update controls/Flows/app-restart results have not yet been supplied. This is not a complete functional result or proof for other models.

Follow the [hardware test plan](ota-test-plan.md), including its per-device result template:

- Modern mains-powered devices: LCA001 and exact LOM001/LOM006/LOM007 plug models; include an old starting version that exercises an intermediate chain.
- Legacy path: LCT003 with its SBL images.
- Battery path: RWL022, RDM001 and SML001, including wake instructions, normal button/sensor behaviour and battery reporting.
- With the #771 baseline, verify battery reports and wake-up reads on RDM001/RDM002/RWL022, including both RDM001 inputs and existing subdevices/Flows. Check last-seen from real traffic after OTA.
- For every transferred image, record the starting/resulting version, progress/result, rejoin, retained paired identity/settings, existing Flows and behaviour after app restart. An already-current device verifies the no-update path only.
- Collect independent model/platform observations for LTO001, LTW015 and LWA029. Record exact LLC010/LCL001 variants without enabling additional families from a model name alone.

LCT026, LST002, 3261031P6, SOC001 and the two Ensis zone IDs remain withheld. LLC010 `0x0103` and LCL001 `0x0117` remain unapproved alternatives. The 331 unmapped product IDs and other catalogue-only families are future coverage work, not promised 2.4.0 OTA support.

For an initial verification error after rejoin, preserve the message, wait a few minutes and check the firmware/update status again before retrying. Record both outcomes. For a persistent failed transfer, stop that test case and retain the Homey result/log before another attempt; do not force a different image or factory-reset the device to conceal the failure. Verify normal operation and record whether the problem follows one model, firmware family or Homey platform. A confirmed targeting error requires withholding the affected mapping in a subsequent Test build. App rollback does not roll back firmware already installed on a Hue device.

Athom's [native OTA documentation](https://apps.developer.homey.app/wireless/zigbee/zigbee-firmware-updates) requires correct targeting and physical end-to-end verification before broad release. Keep Test results explicit; software checks alone do not establish device-level success.
