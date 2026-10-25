# Homey Developer Tools feedback review, 2026-10-25

All **30 comments** in the supplied export were reviewed in their original order. The export provides relative ages, not submission dates, installed versions or original message links. Those ages have not been converted into dates. Implemented support does not mean an old reporter has retested successfully.

## Scope and findings

Exact model matching was compared across these source refs:

| Line | Version | Reviewed commit |
| --- | --- | --- |
| `main` | 2.3.1 | `9f9ae18cac2646035abe0990be5a93748399648e` |
| `dev` | 2.4.0 | `b57a42d550a8649a01352f93874d803683fa8445` |
| `develop-2.5` | 2.5.0 | `3992935bfeb3080f42d07ee6643a8a36d71bc9ac` |

`dev` and `main` remain frozen for the maintainer's publication and verification. This review changes documentation on the 2.5 line only. No device support, OTA mapping or release is added, no issues are closed, and no messages are sent to reporters. A driver declaration in Live source is evidence of implemented matching, not proof of physical verification or the reporter's installed version.

Recommended next work:

1. Review **Impress `1745930P7`, Attract `1746130P7`, G95 color `LCO001`, and E12 White Ambiance filament `LTE004`** as a separate 2.5 device batch. All four IDs are absent from the three refs and have definitions in the pinned upstream source below. Impress has an explicit ID/manufacturer in the export; the other associations need confirmation against each reporter's interview. Review endpoints, profile, energy and artwork before selecting a driver. These are candidates, not implemented support.
2. Obtain **Scenova** identity and endpoint evidence. Its retail product page is not a Zigbee fingerprint. Do not add its EAN/12NC as an alias or assume a standard temperature range.
3. Reuse current Test cases for **remote battery and motion-sensor recovery**. A missing value, stale availability, stalled reports and actual network departure must be diagnosed separately. Keep the RWL022 reporting experiment [#813](https://github.com/JohanBendz/com.philips.hue.zigbee/pull/813) separate.
4. Keep **LWM007** explicitly partial: normal on/off/dim exists; physical input mode, minimum brightness and hold behavior remain hardware investigation in [#779](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/779).
5. Improve guidance for exact IDs, generic pairing, supported Datura/Festavia variants, held-button Flows and power-on settings. Friends of Hue/Green Power, MotionAware and Secure video require separate integration research.

New pairing support must not automatically inherit OTA eligibility. These findings do not block the pending 2.4 OTA Test release.

## All 30 comments

| # | Topic | Current assessment | Follow-up |
| --- | --- | --- | --- |
| 1 | Built-in dimmer, EAN `8721103111876` | Existing #779 interview identifies `LWM007`; driver exists in Live source, Dev and 2.5. Support is partial. | Retest pairing/on/off/dim. Physical input configuration and minimum brightness remain in #779; do not claim `deviceMode` fixes the switch. |
| 2 | Scenova | No named Scenova driver or identity from this export. Official product exists, but no definition was found in the pinned Philips upstream file. | Obtain exact model/manufacturer and all endpoints. Review the regional variant and wide temperature range. |
| 3 | Impress Wall `1745930P7`, manufacturer Philips | Exact ID missing in all three refs. Existing Impress wall drivers match `1742930P7` and `1743030P7`; upstream separately identifies this low-voltage model. | Strong 2.5 candidate. Obtain the offered full interview before choosing an alias/new driver and checking controls, energy and unique matching. |
| 4 | Essential GU10 | `LCG008` was added only to 2.5 by [#814](https://github.com/JohanBendz/com.philips.hue.zigbee/pull/814), with its own temperature/energy profile. The comment has no ID. | Confirm LCG008, then collect future 2.5 Test feedback. Do not extend the claim to all Essential GU10 revisions. |
| 5 | A60 color `LCA011` | Matched by `LCA001` in all three refs; closed [#697](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/697). | Verify installed version/current pairing. The Matter logo alone does not change Zigbee matching. No duplicate driver needed. |
| 6 | White Ambiance A60 1100 lm / A67 1600 lm | Existing `LTA011`/`LTA015` support; interviewed new A67 `LTA016` added only to 2.5 in #814 / [#805](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/805). Lumens do not identify revisions. | Obtain both actual IDs; distinguish an existing model from LTA016 or another unmatched A60. |
| 7 | Hue-button “gen3” dimmer, battery `?` | Likely RWL022, but generation wording is ambiguous. RWL022 already has battery capability, reporting setup, wake/rejoin reads and validated parsing. The old symptom is not proved fixed. | Obtain model/app/build and fresh report/read evidence. Separate no report, invalid value and availability; relate to [#633](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/633) and #813 as appropriate. |
| 8 | Essential lights become sockets | Consistent with generic fallback, but no ID given. LCG008 is on 2.5; `LCA016` remains unmatched in [#760](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/760). | Obtain identity; do not change generic-device classes globally or claim the entire family is covered. |
| 9 | Friends of Hue and hold-to-dim | No general Friends of Hue driver. Some products use Zigbee Green Power, requiring different commissioning/event handling from ordinary battery remotes. | Identify the switch and investigate Homey's Green Power interface. Existing Hue remote hold cards do not prove Friends of Hue support. |
| 10 | Motion sensing through bulbs | Signify describes MotionAware as Bridge Pro exclusive. No implementation here. | Explain the scope; direct support needs separate protocol/platform research, not a generic occupancy capability on every bulb. |
| 11 | Attract, EAN `8718696174357` | Official Signify evidence identifies Attract / 12NC `915005842401`; upstream associates Attract with `1746130P7`. That Zigbee ID is absent from all refs. | Good 2.5 candidate after interview confirmation and profile/energy/assets review. Do not substitute EAN for model ID. |
| 12 | A60 E27 White and Color Ambiance | Existing LCA001 driver matches several generations, including LCA011. Retail name does not identify this unit. | Give existing-driver guidance; obtain model/manufacturer if pairing still falls back. |
| 13 | Datura ceiling | Small round revisions exist: `929003736201_01/_02` and `929003736601_01/_02`. Sources pair as separate Zigbee devices. | Confirm size/revision; do not claim all Datura shapes. Historical [#622](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/622). |
| 14 | Hue Doorbell | Secure video/audio is outside implemented direct Zigbee functions. Official setup requires Wi-Fi and Hue app. | Do not promise compatibility for a purchase. Any useful local Zigbee function needs independent evidence; a light alias cannot provide video/calls/audio. |
| 15 | G95 White and Color Ambiance | Upstream identifies a G95 color bulb as `LCO001`, absent from all refs. White filament and other Lightguide globes are different products. Export lacks identity. | Good 2.5 candidate after interview confirmation. Review actual color/temperature/energy; do not reuse a white-only globe. |
| 16 | Filament `LWV005`, platform `100b-114` | Exact ST64 White driver exists in all refs. | Verify current version/pairing. Neither a Hue firmware update causing the original problem nor OTA eligibility follows from this report. |
| 17 | Cannot install app | Homey model/version and error missing. No actionable code diagnosis. | Obtain exact error and platform/firmware. Source targets local platforms, Homey >=12.9.0. Distinguish installation from device pairing. |
| 18 | Twilight general request | LGT001/002/003 implemented in all refs with front/back Homey devices. | Retest both sources, buttons and Flows on current code. Two-source support does not imply native gradients. |
| 19 | Dimming without bridge | Light drivers expose dim and start/stop dimming actions. Symptom unspecified. | Establish slider, transition, held remote or physical wired switch; capture reproduction before changing code. |
| 20 | Motion sensors leave network daily | Existing lifecycle issues overlap; old report does not establish actual leave or a current regression. | Collect model/build, leave/rejoin events and subsequent traffic; distinguish report/availability failures. See [#615](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/615) / [#654](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/654). |
| 21 | White Ambiance Luster E14 | `LTU001` E14 P45 White Ambiance exists in all refs. Upstream associates EAN `8719514491106`; [#778](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/778) supplies a Homey interview. | Existing support answers this revision. Obtain ID if different; do not direct it to white-only Luster or a candle. |
| 22 | Twilight rear works, front fails; says `TGL002` | Runtime routes front to endpoint 12, back to 11. Supported IDs are **LGT**001/002/003; **TGL**002 is unmatched. | Confirm interview before assuming a new ID. Retest both sources; do not add a likely transposed spelling from prose. Related [#694](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/694). |
| 23 | Motion sensor fails after battery change | Cannot distinguish rejoin, reporting, availability or mesh/device problem. Battery replacement does not prove re-pairing is needed. | Diagnose existing device where possible; collect wake/rejoin and battery/motion reports. Relate to [#812](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/812) only if its missing-battery symptom matches. |
| 24 | New White Ambiance GU10, 4.2 W/400 lm | LTG005 exists in all refs; upstream confirms White Ambiance GU10. Retail specification/energy label does not prove this unit's ID. | Confirm model and current pairing; review any different ID separately. |
| 25 | “g27” filament becomes generic | Ambiguous retail description; many E27 filament IDs already supported. | Obtain model/manufacturer/interview. Do not invent a “g27” alias. |
| 26 | Repeated on-button clicks cycle 3000 K / 5000 K | Existing press/hold/release events can drive a stateful Homey temperature cycle. No native click-count trigger is declared. | A Flow example with a state variable can address cycling. True double-click detection is a separate feature. Preserve action IDs and use one event per cycle. |
| 27 | Datura small/large round, rectangle, square | Only the small-round revisions above are matched. Their two-source implementation does not establish other shapes. | Obtain each missing revision's interviews for all light sources. |
| 28 | Advanced Flow for startup color/temperature | Power-on device settings exist; no dedicated power-on Flow action. Different from current light state or a Homey restart trigger. | Clarify persistence/trigger and consider an additive 2.5 action with supported-model filtering. Keep [#792](https://github.com/JohanBendz/com.philips.hue.zigbee/pull/792) attribute migration separate; not all lamps support all startup values. |
| 29 | E12 White Ambiance filament paired as white E14 | Upstream E12 filament is **LTE004**, absent. Current White Ambiance E14 is LTE005, white-only E14 is LWE004. Export gives no actual Zigbee ID. | High-value 2.5 investigation. Obtain actual identity/driver result. Do not convert LWE004 devices globally or blindly inherit LTE005's profile/energy; evidence differs below. |
| 30 | Festavia string lights | LCX028 driver matches LCX024/025/028 for standard whole-string controls. Other generations and native segments/effects are not established by that. | Obtain exact ID. First-generation LCX012/015/016/017 are not covered by this match list. Historical [#572](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/572). |

## Evidence and limits

**Protocol definitions:** [zigbee-herdsman-converters Philips definitions at `7462b541b367c301057aee995e6e6756e5f7e985`](https://github.com/Koenkk/zigbee-herdsman-converters/blob/7462b541b367c301057aee995e6e6756e5f7e985/src/devices/philips.ts), blob `c0b396e52de3b666cb3e23601125c9131de3b2b5`. These establish candidate associations, not physical Homey verification or OTA eligibility.

**Attract:** [official Signify conformity declaration](https://www.assets.signify.com/is/content/Signify/Assets/signify/global/20220617-philips-hue-outdoor-fixed-luminaires-202205-eu-doc.pdf) identifies EAN `8718696174357` / 12NC `915005842401`. Upstream supplies the Zigbee association; reporter interview confirmation remains.

**E12 filament:** [exact linked Signify US product](https://www.philips-hue.com/en-us/p/hue-white-ambiance-filament-candle-e12-smart-bulb-2-pack/46677577087) lists UPC `046677577087`, 12NC `929003145102`, E12, **2200–4500 K**, **4.4 W on / 0.2 W standby**. Upstream LTE004 belongs to product family `9290031451`, but declares **153–454 mired**, approximately 2200–6500 K; upstream LTE005 E14 uses **222–454 mired**. Inspect the actual temperature attributes before selecting a profile. The product page's body also mentions E14 despite its E12 fitting field. Do not base matching on that prose or assume this export proves LTE004.

**Scenova:** [official US product](https://www.philips-hue.com/en-us/p/outdoor-luminaires-philips-hue-scenova-wall-light-rectangular/046677612177) lists UPC `046677612177`, 12NC `929004444301` and 1000–20000 K. This one regional product does not establish the reporter's Zigbee identity/endpoints.

**LWM007:** [latest physical input report in #779](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/779#issuecomment-6056915850) says endpoint 11 rejects `deviceMode`; endpoint 1 responds but does not change behavior. A successful attribute write is not proof of working input configuration.

**Friends of Hue:** [PTM 215Z documentation](https://www.zigbee2mqtt.io/devices/PTM_215Z.html) describes Green Power translation and press/release events for several Friends of Hue switches. It does not establish Homey compatibility or imply that every Friends of Hue product uses that module.

**Bridge services:** [Signify's Bridge Pro page](https://www.philips-hue.com/pt-br/p/hue-bridge-pro/8720169155053) describes MotionAware as Bridge Pro exclusive. [Secure doorbell setup documentation](https://www.philips-hue.com/en-ae/support/article/hue-secure-wired-doorbell-smart-chime-guide/000013) requires Wi-Fi/Hue-app setup. Useful local Zigbee functions, if any, need independent protocol evidence.

## Evidence to obtain from reporters

For pairing: installed app version, Homey model/firmware, `modelId`, `manufacturerName`, every endpoint's input/output clusters, current driver/pairing result and controls that work/fail. Include every source of a multi-source fixture. Remove keys and other secrets; device addresses are unnecessary for model matching.

For battery/network symptoms: timestamps, whether other traffic still reaches Homey, raw battery values/read errors, actual announce/leave events and reproduction. A question mark is not proof of depleted batteries or network departure.

For installation/dimming: the exact error or concrete reproduction before selecting a fix. Do not recommend deletion/re-pairing of working devices/Flows as the first diagnostic step or promise automatic reclassification of an existing generic device.

The [2.5 issue review](2.5-issue-review-2026-10-25.md) remains the implemented-work inventory. This document adds follow-up candidates and evidence requirements, not completed features.
