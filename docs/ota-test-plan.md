# Philips Hue Zigbee OTA hardware test plan

Prepared **2026-10-02**, refreshed **2026-10-05** for `ota-2026`, tracked in [PR #758](https://github.com/JohanBendz/com.philips.hue.zigbee/pull/758) and [issue #668](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/668).

**Status: prepared for the planned 2.4.0 Homey Test release. No physical end-to-end OTA result has been recorded.** Transfer, restart and device-operation results are collected during Test. Catalogue checks, binary validation and publish validation establish the software baseline for those tests.

## Setup and evidence

The selected release is **2.4.0 on Homey Test**, together with the `develop-2.4` changes. OTA preparation stays on `ota-2026` until PR #758 is integrated for that release. Record the exact final `develop-2.4` commit used for publication (or the exact local-build commit), not just the OTA source commit. See the [release handoff](ota-test-release-2.4.0.md). The currently published 2.3.0 Test remains in place until the maintainer publishes 2.4.0.

The [model evidence register](ota-model-evidence.md) covers all 67 enabled IDs. Alongside the staged transfer checks, collect independent model/platform observations for LTO001, LTW015 and LWA029, whose existing mappings currently rely only on a curated database. Record any LLC010/LCL001 variant observations with the exact model and reported image type; the alternative families remain unapproved.

According to [Athom's OTA documentation](https://apps.developer.homey.app/wireless/zigbee/zigbee-firmware-updates), the OTA feature requires a supported Homey platform with firmware **13.2.0 or newer**, and Homey Mobile App **9.10.0 or newer** when using the mobile app. Record the Homey model, Homey firmware and client version.

Before starting, record:

- Homey driver ID **and** the device's actual Zigbee `productId` / `modelId` and `manufacturerName`.
- Current device software version; also record numeric `fileVersion`, `imageType`, manufacturer code and hardware version if the OTA query/log exposes them.
- Paired Homey device identity, advanced settings and existing Flow behaviour.
- The update offered by Homey and the device-specific wake instruction, if applicable.

The Homey driver name is not sufficient for firmware selection. For example, the `LOM002` driver has OTA entries for **LOM001, LOM006 and LOM007**; the model ID **LOM002 itself is not OTA-mapped**. Likewise, a shared `LCA001` driver does not enable firmware for every bulb alias.

If firmware is not offered, record the result and exact identities. Do not force an image, change the model ID or downgrade a device to create a test case. A device already at or above the reviewed image's numeric version is a no-update check, not a completed transfer test.

## Stage 1 — mains-powered devices

Start with one device at a time. Exact-model rows can be used independently depending on available hardware.

| Priority | Homey driver | Actual Zigbee product ID | Image type | Reviewed latest fileVersion | Images in chain |
| --- | --- | --- | --- | --- | ---: |
| First | LCA001 | LCA001 | `0x0112` | `0x01002E00` | 2 |
| First | LOM002 | LOM001 | `0x0115` | `0x01001700` | 2 |
| First | LOM002 | LOM006 or LOM007 | `0x011A` | `0x01001200` | 5 |
| Additional multi-step check | LCA001 | LCA004 or LCA005 | `0x0114` | `0x01002A00` | 5 |
| Legacy SBL container check | LCT003 | LCT003 | `0x0104` | `0x4300740C` | 2 |

Include a legacy SBL lamp as well as a modern `.zigbee` lamp. The [readiness review](ota-review-2026-10-03.md) identifies nine legacy SBL images with Hue-specific payload structure; a successful update on modern hardware does not verify that path.

For each device:

1. Confirm normal controls and one existing device-dependent Flow before OTA.
2. Start the offered update through Homey's device-update UI. Record the offered version, start time, progress and any failure/retry message.
3. Record the image/version actually transferred if visible in the logs. For old firmware, confirm that each prerequisite image is used before a later image becomes eligible; the first image offered may not be the latest image.
4. Wait for Homey to report the result and the device to rejoin. Record the resulting software version and any new update offered. Follow additional offered steps until the reviewed chain is complete or a failure is recorded.
5. Confirm the same paired Homey identity and settings remain, and that the existing Flow still works.
6. For bulbs, check on/off, dimming, color temperature and color where supported, plus state reporting. For plugs, check on/off, state reporting and the existing power-on setting.
7. Check again after an app restart. Confirm no recurring initialization errors or loss of normal controls/reporting.

Success on one model/platform is evidence for that row only. Record the installed starting version so a one-step update is not mistaken for verification of the entire chain from older firmware.

## Stage 2 — battery-powered devices

Begin after a mains-powered transfer succeeds on the same Homey setup. Test the declared wake instruction as part of the result.

| Homey driver | Actual Zigbee product ID | Image type | Reviewed latest fileVersion | Wake instruction under test |
| --- | --- | --- | --- | --- |
| RWL022 | RWL022 | `0x0119` | `0x02005501` | Brief button press every few seconds |
| RDM001 | RDM001 | `0x011C` | `0x02005505` | Briefly trigger a connected switch input; do not hold setup/reset |
| SML001-occupancy or legacy SML001 | SML001 | `0x010D` | `0x43007401` | Brief setup-button press every few seconds; do not hold it |

Record whether the instruction allows the update to start and finish, any timeout/retry, total time and rejoin. After OTA, check all existing button/switch Flow actions or sensor motion, temperature and luminance reports as applicable, advanced settings and battery reporting. For a sensor with multiple Homey devices, check the existing related devices too.

The current Develop baseline includes the SDK battery simplification for RDM001, RDM002 and RWL022. Verify battery updates from both real reports and the preserved wake-up reads after OTA. On a two-input RDM001, verify both existing Homey subdevices and their Flows. Check that last-seen advances on real incoming traffic without treating an explicit battery read response as a separate report. These checks are part of Test feedback for the combined release.

The RDM004, SML003/SML004 and other battery model mappings need their own result rows when hardware is available. Success on an older revision does not verify those newer revisions.

## Selection checks

- A current/newer device version should receive no downgrade offer.
- Unmapped aliases in a shared driver should not inherit an update.
- `LCT026`, `3261031P6` and `LST002` remain withheld because of conflicting revision evidence.
- `SOC001` remains withheld pending adequate wake/update evidence.
- Ensis zone IDs `929003053301_01` / `929003053301_02` remain withheld pending independent mapping evidence.

## Result record

Copy one record per actual model and starting version into the OTA issue/PR. Keep identifying account information out of logs/screenshots.

| Field | Observation |
| --- | --- |
| Date / tester | |
| App version / exact published or local-build commit / build channel | |
| Homey model / firmware / client version | |
| Homey driver / actual modelId / manufacturerName | |
| Image type / hardware version, if exposed | |
| Starting software version / numeric fileVersion, if exposed | |
| Offered and transferred image versions | |
| Start / finish / elapsed time | |
| Wake method / retries / Homey result | |
| Resulting software version / further update offered | |
| Rejoin / paired identity / retained settings | |
| Controls / reporting / existing Flows / app-restart result | |
| Evidence link / relevant sanitized log | |
| Verdict: completed transfer, no update available, failed, or unavailable | |

PR #758 can be reviewed and integrated for the planned Test release once the software checks pass. Physical results are Test work, not a prerequisite for starting Test. Use the recorded results and unresolved failures to decide the scope of any later Live promotion. Catalogue and mapping research can continue alongside testing; enable additional mappings only after their identity/platform evidence and complete firmware chains have been reviewed.
