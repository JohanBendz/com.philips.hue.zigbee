# Release branches

Decision recorded **2026-10-07** (Europe/Stockholm). Current publication status is maintained in [dashboard #776](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776).

## Frozen 2.4 scope

`develop-2.4` remains version **2.4.0**, frozen at [`e7e9a07`](https://github.com/JohanBendz/com.philips.hue.zigbee/commit/e7e9a07a5c2fb35c9405f667b4657f88e42f9a12) after OTA PR #758 and language PR #806. This is a scope freeze while physical Test observations are collected, not a claim that 2.4.0 has already been published.

Only direct fixes to faults in 2.4 or earlier code, regression tests for those fixes, and necessary release preparation may enter this line. New device support, feature work, capability migrations, dependency migrations and reporting experiments belong on 2.5. A confirmed device-targeting fault can require withholding an affected OTA mapping in a corrective build; do not expand OTA families as part of such a fix.

## New development

`develop-2.5` starts from the exact frozen 2.4 commit and uses version **2.5.0**. Its initial changes only establish version metadata, this routing policy and direct-push CI. Runtime code, dependencies, capabilities, firmware files and OTA selection declarations are inherited unchanged.

| Work | Branch / PR target |
| --- | --- |
| Direct bug fix for 2.4 or earlier code | A small fix branch targeting the affected release line; forward-port to `develop-2.5` |
| Feature, additional device support, migration or planned behaviour change | A small branch from and targeting `develop-2.5` |
| Power-on runtime migration #792 | `develop-2.5`; remains Draft, separate from narrow error handling fixes |
| Plug reporting laboratory #803 | `develop-2.5`; remains research only / do not merge; preserve 15-second polling |
| OTA physical results and failure investigation | Continue #668 and the hardware result register for the frozen 2.4 scope |

Forward-port accepted earlier-release fixes promptly, with the same relevant regression checks. Preserve each line's version and release notes when reconciling release-only history. Never merge the whole 2.5 development line into frozen 2.4 or replace a published Test build without an explicit release decision.

For #804, the Power-on exception-handling fault and overly broad sensor Flow cards are direct bug-fix candidates for 2.4 once reviewed. The rejoin/on-off issue remains an evidence-backed investigation under #774. Wider capability cleanup, added translations and reporting changes follow the new-development routing unless a narrow, confirmed fault justifies a release fix.

## Validation and release metadata

Use the maintained Compose manifest and package/lockfile versions. Root `app.json` remains a generated baseline; discard incidental regeneration from normal commits. Pull requests and pushes to `develop-2.5` run Homey publish validation, the regression tests and whitespace checks.

The initial 2.5 branch has no new user-facing release changes. Keep the existing `.homeychangelog.json` entries intact; add the exact 2.5 release entry with the implemented changes before preparing publication. App Store README and release notes describe functionality rather than branch/Test/Live status.

The freeze is a documented development policy. This setup does not add GitHub branch-protection rules, change the repository default branch or publish a Homey release.
