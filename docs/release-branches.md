# Release branches

## Current publication routing — 2026-10-25

The repository has adopted permanent **`main` = latest published Homey Live** and **`dev` = next Homey Test candidate** branches. Both were initialized from the published v2.3.1 source (commit `0eb6bd2`), and synchronized following repository-only CI/documentation maintenance. GitHub's default branch is now `main`.

- Bug fixes intended for the next Test use PRs against `dev` (currently Draft #809, proposed 2.3.2).
- `develop-2.4` remains the **frozen** 2.4.0 release-candidate branch (Draft #786 targets `dev`). Do not overwrite `dev` with the 2.4 code until that later Test cut has been reconciled and approved.
- `develop-2.5` is a version-scoped workspace for experiments and new features; it is not the Test or Live channel. #792, #803, #808 and #813 remain separate Drafts here.
- `modernize-2026` preserves the earlier 2.1.2 rollback. Former `issues-2026` / `issues-2026-next` / `ota-2026` are historical, no longer release destinations.
- Homey publish actions remain explicit maintainer steps. Never infer that a PR merge publishes to Homey.

The canonical current policy and release procedure is [docs/branching-and-releases.md](https://github.com/JohanBendz/com.philips.hue.zigbee/blob/main/docs/branching-and-releases.md). The 2026-10-07 material below is retained as a historical record of the 2.4/2.5 scope freeze.

---

## Historical release-branch decision — 2026-10-07

Decision recorded **2026-10-07**, refreshed **2026-10-25** (Europe/Stockholm). Current publication status is maintained in [dashboard #776](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776).

## Publication freeze while 2.5 work proceeds

The maintainer explicitly froze `dev` and `main` on 2026-10-25 while publishing and verifying 2.4.0. Baselines: `dev` at `b57a42d550a8649a01352f93874d803683fa8445`, `main` at `9f9ae18cac2646035abe0990be5a93748399648e`. New work targets `develop-2.5` only. Do not forward-port back to either publication branch, merge into them, or publish a release until the maintainer confirms the freeze is lifted.

## Frozen 2.4 scope

`develop-2.4` remains version **2.4.0**, frozen at [`e7e9a07`](https://github.com/JohanBendz/com.philips.hue.zigbee/commit/e7e9a07a5c2fb35c9405f667b4657f88e42f9a12) after OTA PR #758 and language PR #806. This is a scope freeze while physical Test observations are collected, not a claim that 2.4.0 has already been published.

Only direct fixes to faults in 2.4 or earlier code, regression tests for those fixes, and necessary release preparation may enter this line. New device support, feature work, capability migrations, dependency migrations and reporting experiments belong on 2.5. A confirmed device-targeting fault can require withholding an affected OTA mapping in a corrective build; do not expand OTA families as part of such a fix.

The 2026-10-25 correction reconciles the 2.3.2 Flow hotfix and the verified LTA015 firmware refresh on 2.4, integrated through #786 into `dev`. Both corrections are forward-ported to 2.5 with its 2.5.0 version retained. The freeze continues to exclude new features and experimental runtime migrations.

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

Use the maintained Compose manifest and package/lockfile versions. **Keep root `app.json` tracked and present**: Homey Compose needs that file to bootstrap, but it may be stale in the repository. Homey CLI regenerates it on validation/run/build; do not commit incidental generated diffs in PRs, and do not demand in-repository version synchronization. Ensure manifest-reading tests run after CLI regeneration (as CI already does). Pull requests and pushes to `develop-2.5` run Homey publish validation, regression tests and whitespace checks.

The 2.5 release-note entry records the actual forward-ported Flow-scope and firmware corrections. Keep existing release entries intact and update 2.5 notes with any further implemented changes before preparing publication. App Store README and release notes describe functionality rather than branch/Test/Live status.

The freeze is a documented development policy. This setup does not add GitHub branch-protection rules, change the repository default branch or publish a Homey release.
