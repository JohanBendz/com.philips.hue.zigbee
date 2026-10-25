# OTA handoff for 2.4.0 Test

Updated **2026-10-25** (Europe/Stockholm) for [PR #786](https://github.com/JohanBendz/com.philips.hue.zigbee/pull/786), [OTA tracker #668](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/668) and [dashboard #776](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776).

Version **2.4.0** is prepared for the permanent **`dev`** Test-staging branch. The frozen OTA/localization source `e7e9a07` has been reconciled with `dev` at `e5a9ee0`, including #809's 2.3.2 Flow correction. All 16 merge conflicts were resolved while preserving the 2.4.0 version, exact Hue device filters, all 13 languages and existing Zigbee runtime behaviour. Merging code does not publish a Homey build. `main` remains the 2.3.1 Live source until a separate verified promotion.

Physical OTA results are collected **during Test**. Missing results for other models do not block software preparation; they remain evidence needed for a later Live-scope decision.

## Prepared scope

| Item | Candidate |
| --- | --- |
| App / package / both lockfile version records | `2.4.0` |
| App minimum | Homey `>=12.9.0`, Node.js `>=22` |
| Native OTA minimum | Supported platform on `13.2.0+`; mobile client `9.10.0+` |
| Enabled OTA | 47/172 drivers; 67/398 exact product IDs; 21 families |
| Firmware | 63 update entries; 141 files; 40 unique images; 157 references |
| Fixed catalogue | Koenkk/zigbee-OTA `7798da234349eaa937b22f9aebad909a741d1e4b` |
| Catalogue SHA-256 | `d6d7d1afa46bfb056bc4c8730082105aec59d0734fc8ae1a531206dff1ae317d` |
| App-source commit used for the package below | `082d97467d648304aac33c7c0b1a7ea0af182ad5` |

The enabled model/family set is unchanged. The one firmware refresh replaces LTA015's `0x0129` target `0x01000D06` with `0x01001200`. Signify bytes, upstream SHA-512, the OTA header, size and model mapping were verified. Upstream archived the older image on 2026-10-18 and specifies no prerequisite or version/hardware limit for the replacement. All other families' intermediate chains remain unchanged. See [catalogue verification](ota-firmware.md#current-verification--2026-10-25) and the [model register](ota-model-evidence.md).

No Power-on runtime migration (#792), plug-reporting lab (#803), beta-types audit (#808), contributed Tento addition (#797) or passive RWL022 battery experiment (#813) is included. The proven 15-second plug polling remains.

## Prepared candidate verification

- Clean `npm ci --ignore-scripts`, Node.js 24.22.1, Homey CLI **4.5.0** publish validation and **225 tests / 0 failures** passed.
- Tests verify firmware headers and integrity, upstream SHA-512, exact approved model/family sets, complete intermediate chains and limits, withheld models, generated OTA declarations and battery wake instructions.
- All 11 app-global Flow device arguments retain #809's exact Hue scope. The imported Flow regression checks and existing language checks verify driver scope, device-scoped titles, argument tokens and all 13 supported app languages together.
- The audit against the fixed current index reports **zero active-family changes**. A refresh is always deliberate; the audit never imports firmware automatically.
- Runtime JavaScript under `app.js`, `drivers/` and `lib/` is unchanged from the frozen 2.4 source. Changes to the inherited source consist of Flow metadata, release/CI preparation, regression coverage and the single verified firmware replacement.
- Final branch/PR CI and the integration commit are linked in PR #786 and dashboard #776. Recheck the actual branch heads if either line advances.

## Package verification

The native CLI `app build` plus its archive pipeline were used. Every packaged source file, all firmware bytes and production dependencies match the source; the generated manifest matches Compose output and the CLI Homey shim matches CLI assets. The pinned libraries are `homey-zigbeedriver` **2.2.18** and `zigbee-clusters` **3.8.0**. Project `test/`, `docs/` and `scripts/` directories are excluded.

| Measurement | Value |
| --- | ---: |
| Files | 1,105 |
| File bytes | 64,821,516 |
| Compressed bytes | 59,300,021 |
| Firmware bytes including per-driver copies | 51,948,824 |
| Unique firmware bytes | 13,196,446 |

Archive SHA-256: `6a4de684e113d35995ff5556ab0e4bbfcc19459a376403ccf41bafe3bb6b4a82`. This identifies a local verification archive from app-source commit `082d974`, not a published build. A documentation-only follow-up changes excluded `docs/` files. Rebuild from the final `dev` release commit at publication and record that commit and Homey Build ID. Earlier 2026-10-07 archive measurements are historical. The earlier `f5dbfdd` archive omitted production dependencies and must not be used for publication.

## Build and publication

Use Node.js 22 or newer and retain the tracked root `app.json` bootstrap file. Run in this order:

```sh
npm ci --ignore-scripts
npx --yes homey@4.5.0 app validate --level publish
npm test
npx --yes homey@4.5.0 app build
npm run ota:audit
git diff --check
```

Validation regenerates root `app.json` for tests, but the generated diff is not committed. Keep the file present and tracked. Validation also preprocesses the build directory without copying production dependencies, so run **`app build` after validation** before inspecting the upload archive. Do not treat the compressed upload size as installed App Store size.

Integrate the reviewed #786 into `dev` with its latest fixes intact, rebuild/validate from the final release commit, and publish **2.4.0 to Homey Test** through the maintainer's normal process. Publication is not performed by this preparation. Keep `main` unchanged until a separately approved Live promotion. Forward-port accepted release fixes to the active 2.5 line while preserving its version.

## Test observations and follow-up

The [LCT015 observation](ota-test-results.md#lct015--2026-10-05) confirms transfer/rejoin, OTA `0x01001A02` → `0x01002A00` and Hue software `1.50.2_r30933` → `1.116.12`. Homey first could not verify success, then showed the target and current-version status after a delay. Full controls/Flows/settings/app-restart checks and exact installed build/platform/client details were not supplied. This is not proof for another model or an older prerequisite path.

Use the [hardware test plan](ota-test-plan.md) for mains-powered lights/plugs, an older intermediate chain, legacy LCT003 SBL images, battery devices, both RDM001 inputs and existing Flows. Add an LTA015 result for the refreshed target when available. Preserve initial verification errors, wait a few minutes and recheck before retrying; all 63 update changelogs include this guidance in English and Swedish.

Record #812's SML003 battery-percentage behaviour and the possible RWL022 battery-drain report separately, before and after OTA. Neither is established as an OTA fault. #813 remains an isolated experiment and is not included in this release. Keep report/wake behaviour unchanged while collecting evidence.

LTO001, LTW015 and LWA029 still need independent observations beyond curated-database model evidence. LCT026, LST002, 3261031P6, SOC001 and both Ensis zone IDs remain withheld; additional LLC010 `0x0103` and LCL001 `0x0117` variants remain unapproved. No broader Hue coverage or Live readiness is claimed by the software checks.
