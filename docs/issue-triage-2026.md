# Open issue triage — 2026-09-20

This is a first-pass inventory of **120 open issues**, not a claim that 120 reports
were reproduced. Retrieved newest and oldest search batches with overlapping
results to cover the full open set. Classification uses titles, available
descriptions and closely reviewed comments on 26 priority issues. Remaining
full-thread review is explicitly still needed.
No issue was closed or relabeled by this pass.

Runtime baseline for this pass: `modernize-2026` at `77ac0c8`, plus the sensor
protocol corrections documented below. `sdk3` is unchanged. A version string such
as 2.1.0 is insufficient to identify a tested build: use its commit SHA.

## Priorities

1. **Physical regression of existing fixes**: RDM001 two-module routing,
   ROM002 events, SOC001 open/close + battery, SML sensitivity/LED, dimmer battery.
2. **Confirm added device support**: LTV001/LWV005/LTG005 and clean #709 Dymera/Slim.
3. **Small evidence-backed device batch**: compare the supplied interviews for
   LCA011 (#697), LWG005 (#647), LCL007 (#653), LCL008 (#626), and the other explicit
   missing models below. Similar names alone are not sufficient for an alias.
4. **Separate multi-endpoint work**: Twilight #669/#694, then Datura if enough
   interview data is available. Gradient/scene effects are separate capabilities.
5. **Broader network reports**: collect comparable fresh logs before deciding
   whether a report is an app lifecycle failure, configuration error or radio loss.

## Newly reproduced protocol defects

### SOC001 (#642, #655, #660, #698)

The interview in #642 lists input clusters **0, 1, 3, 64518** and output clusters
**25, 0, 3, 6** on endpoint 2. On/Off is therefore a command-producing output, not
an input attribute server. The old `clusters.onOff.on('attr.onOff')` path throws
on a real ZCLNode constructed from that descriptor. The initial unit mock hid
that error by inventing an input cluster.

The correction registers Philips cluster **0xfc06**, manufacturer **0x100b**,
contact attribute **0x0100** (enum8: 0 closed / 1 open). It also keeps a bound
On/Off command compatibility path for already paired devices. Battery setup is
independent of contact setup; a failed contact request cannot suppress battery.
Real ZCLNode tests cover actual encoded report/command frames, retry and cleanup.
These frames are synthetic protocol fixtures, not captures from the user's hub.

New pairing uses the correct bindings. Existing devices should be woken/repaired
and tested; preserving legacy command handling avoids assuming all installations
already report the manufacturer attribute. Physical validation is still pending.

### SML001/SML002 occupancy (#618, #670)

The old settings path addressed nonexistent `occupancySensingCluster` and
`basic` names. Actual registered clusters are `occupancySensing` and
`HueSpecificBasicCluster`. Sensitivity attributes also lacked the manufacturer
header, and radio setting strings `"true"`/`"false"` were tested as booleans.
LED indication belongs to Basic attribute 0x0033, not occupancy attribute 0x0032.
These are now corrected and tested against real ZCL-created cluster objects.
Re-save LED/sensitivity settings and wake the sensor for hardware verification.

#635 reports `invalid_setting_type`; it is **not** declared fixed by these changes.
The original setting-store key fix alone was not sufficient for the above paths.

Protocol reference (checked 2026-09-20):
https://github.com/Koenkk/zigbee-herdsman-converters/blob/master/src/lib/philips.ts

## Queue sizes

| Queue | Issues |
|---|---:|
| Implemented support | 7 |
| Fix candidate | 11 |
| Battery/remotes | 6 |
| Network/lifecycle | 8 |
| Light behavior | 7 |
| Pairing/identity | 16 |
| App failure | 4 |
| Device support | 42 |
| Feature/settings | 15 |
| Other scope | 4 |
| **Total** | **120** |

## Closure standard

- Driver/model present is not proof that pairing works on the reporter's firmware.
- Passing automated tests is not physical confirmation of a radio protocol.
- Match duplicates by model **and symptom**, not just the device's retail name.
- Keep mixed reports open until their separate symptoms are accounted for.
- No automatic stale-issue closure. No mass comments or duplicate pings.

## Complete first-pass inventory

| Issue | Title | Queue | Evidence / next action |
|---|---|---|---|
| [#307](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/307) | Philips hue gu10 White ambiance bt dim duration | Light behavior | Requests a default transition for slider/voice, not merely Flow duration. Keep separate from #699. |
| [#311](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/311) | Add Reachability as property for each HUE device | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#343](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/343) | Homey Hue without Bridge app doesn‘t connect to LivingColors Iris | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#347](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/347) | Turn light on and change color and brightness in one card | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#376](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/376) | unable to set color with current hue parameters | Light behavior | Reproduce command/Flow sequence and endpoint behavior. |
| [#387](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/387) | I have two Philips Living Colors Gen 3 devices, how can I add these | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#417](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/417) | Hue Amarant Wallwasher RGBW not able to chose? | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#428](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/428) | Philips hue gradient signe not supported | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#431](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/431) | Hue Tube not supported | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#439](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/439) | New Hue Xamento spotlight | Device support | Missing interviewed model 929003074701. |
| [#456](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/456) | Philips Hue Bloom (LLC011) missing temperature | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#479](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/479) | sort devices by their specifications | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#484](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/484) | Add Support for Feller Smart Light Control for Philips Hue (FoH) | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#512](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/512) | Support for the new Hue 5.3 MR16 | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#516](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/516) | G93 E27 Thin filament LWO005 | Device support | LWO005 request; overlaps #650. Requires matching interview/capability evidence. |
| [#522](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/522) | request for additional flow charts | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#526](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/526) | Can't add second Philips Iris Living Colors to the app | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#540](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/540) | dim level working not correct. | Light behavior | Reproduce command/Flow sequence and endpoint behavior. |
| [#568](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/568) | 2nd input of Hue wall switch not working correctly in 2.0.51 | Fix candidate | Two-module input routing covered by automated regression; physical multi-module test remains. |
| [#571](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/571) | Can't see hue dimmer 3 in homey app | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#572](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/572) | Festavia lights | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#573](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/573) | Fugato 4-lights | Implemented support | 5063430P7 is already matched by its own driver; confirm with reporter on current build. |
| [#578](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/578) | Request for Bulb E14 P45 (White AND Colour Ambiance) | Device support | Missing interviewed model LCU001. |
| [#579](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/579) | Problems with Hue Dimmer Switch | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#580](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/580) | Hue Dial Switch | Battery/remotes | Test fresh reports, restart and wake-up; separate battery from link loss. |
| [#581](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/581) | Hue Tap Dail switch question | Feature/settings | Usage question for Tap Dial + another app's dimmer; separate from implementing Hue light smooth-dim. |
| [#582](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/582) | Motion Sensor Cooldown time | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#583](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/583) | Battery update on dimmer switch 3 gen, not working | Battery/remotes | Test fresh reports, restart and wake-up; separate battery from link loss. |
| [#585](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/585) | possibility of more pressures with the Dimmer Switch | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#586](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/586) | Please add this device: candle white | Implemented support | LWE007 is already in the manifest; same model as #605. |
| [#588](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/588) | Hue Enrave S Ceiling light | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#590](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/590) | Request support change sensitivity of motion sensor settings | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#592](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/592) | Request a device to be added - hue go table lamp | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#593](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/593) | After restart some devices not available | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#595](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/595) | Motion sensor showing empty battery status after replacing battery | Battery/remotes | Test fresh reports, restart and wake-up; separate battery from link loss. |
| [#596](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/596) | Hue Being ceiling lamp adds only as generic zigbee device | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#597](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/597) | A60 - connected bulb E27 - 800 | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#598](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/598) | Re-connecting Philips Hue GU10 fails | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#599](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/599) | Philips Hue lightbulb 9290003099201 | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#600](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/600) | ST64 Bulb not recognized | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#601](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/601) | Multiple wall switches: all 2nd buttons mapped to single device | Fix candidate | Same cross-module routing family as #568/#617/#649. |
| [#602](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/602) | The led strip flashes with Philips Hue, without the bridge app in Homey pro 2023 | Light behavior | Reproduce command/Flow sequence and endpoint behavior. |
| [#605](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/605) | Request a device to be added - Philips Bulb E14 Candle White (BT) | Implemented support | LWE007 is already in the manifest; same model as #586. |
| [#607](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/607) | Wall Switch Long Press | Battery/remotes | Test fresh reports, restart and wake-up; separate battery from link loss. |
| [#608](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/608) | Dimmer switch not reporting battery | Battery/remotes | Test fresh reports, restart and wake-up; separate battery from link loss. |
| [#610](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/610) | problem with Philips Motion Sensors | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#615](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/615) | Phillip Hue motion detector disconnect from zigbee network | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#616](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/616) | Long press trigger triggers both short and long actions. | Feature/settings | Press occurs before Hold by protocol. Assess Press vs Release Flow usage before changing event semantics. |
| [#617](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/617) | Wall switch module - 2nd module not working anymore | Fix candidate | Mixed thread: input routing plus state/Flow behavior. Do not close all symptoms from one fix. |
| [#618](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/618) | Settings not retained for the Philips Occupancy Sensor | Fix candidate | Store-key, cluster-name and manufacturer-header fixes are relevant; persistence symptom still needs physical verification. |
| [#620](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/620) | Filament Bulb ST64 E27 not recognized - LTV001 | Implemented support | LTV001 now included and generated; overlaps #674 and part of #624. |
| [#622](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/622) | Request for Support for Datura | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#623](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/623) | GU10 LED - Unable to Connect | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#624](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/624) | ST64 White & ST64 White Ambiance | Implemented support | Both interviewed LWV005 and LTV001 now exist. |
| [#625](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/625) | Request to add Philips Hue Runner 2-Spot Mounted Spot Light White Ambiance White | Device support | Both interviewed 929003045601_01 and _02 are absent. |
| [#626](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/626) | Request to add Philips Hue Solo Lightstrip | Device support | Missing interviewed model LCL008. |
| [#627](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/627) | Gu10 white ambiance unkown zigbee device | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#628](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/628) | Aurelle lamp square small (2024) not recognize by app | Device support | Reported model 929003597801; validate full interview, not product name alone. |
| [#629](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/629) | G125 Globe Large recognised as generic Zigbee device | Device support | Same G125 product URL as #684; confirm identity, do not infer from similar appearance. |
| [#630](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/630) | Philips Hue Spot - warm-tot koelwit licht | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#631](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/631) | Philips Filament bulb E14 white ambience not supported | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#632](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/632) | Phillips Signe Floor Light - Cannot use gradient settings in HA scenes | Other scope | Explicitly Home Assistant/Zigbee2MQTT scene behavior, not this Homey app. |
| [#633](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/633) | Dimmer Switch gen2 (RWL022) not recognized properly | Pairing/identity | RWL022 is an existing match; generation-name confusion does not prove wrong device mapping. |
| [#634](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/634) | How to push my code for Xamento Ceiling Light | Device support | Contributor offers hardware-tested Xamento work. Evaluate that code rather than recreate blindly. |
| [#635](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/635) | Outdoor Occupancy Sensor cant change properties | Feature/settings | invalid_setting_type is distinct from failed Zigbee writes. Need failing key/value and reproduction; not declared fixed. |
| [#636](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/636) | Request to add Philips Hue color spot LCD010 | Device support | Missing interviewed model LCD010. |
| [#637](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/637) | Donate to developer without Paypal | Other scope | Donation administration, no driver change. |
| [#638](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/638) | Cannot add Philips lamps | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#639](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/639) | Hue outdoor occupancy  "device unavailable". | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#640](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/640) | Hue devices all unavailable | App failure | Obtain error text/stack trace and current build reproduction. |
| [#641](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/641) | Request for new device | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#642](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/642) | hue contact sensor not reporting | Fix candidate | Interview proves On/Off is an output cluster. New fc06 contact listener and legacy command binding replace invalid attr.onOff path. |
| [#643](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/643) | Hue outdoor sensor daylight sensitivity | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#644](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/644) | Request to add Adore Hue White Ambiance | Device support | Missing interviewed model 3418131P6. |
| [#645](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/645) | Report on State for light | Light behavior | Reproduce command/Flow sequence and endpoint behavior. |
| [#647](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/647) | GU10 White new ID (LWG005), now visible as generic zigbee device | Device support | Missing interviewed model LWG005. |
| [#648](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/648) | Request to add Hue Iris limited edition (gen 4) | Device support | Missing interviewed model 929002376402. |
| [#649](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/649) | Hue Wall Switch | Fix candidate | One RDM001 hardware-tested earlier; multi-device RDM001/RDM004 confirmation outstanding. |
| [#650](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/650) | Phillis hue Filament bulb G93 LWO005 | Device support | LWO005 request; overlaps #516. |
| [#651](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/651) | Philips GU10 White Ambiance not regognized in the app in Homey | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#653](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/653) | Lightstrip PLus LCL007 | Device support | Missing interviewed model LCL007. |
| [#654](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/654) | No updated temperature or brightness anymore | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#655](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/655) | Contact sensor not working | Fix candidate | Likely same SOC001 cluster issue; confirm model/firmware and new build. |
| [#656](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/656) | Nieuw Hue Dymera ( Up&Down) | Fix candidate | Dual-zone Dymera implemented from #709; adapted version not hardware-confirmed. |
| [#657](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/657) | Philips SML003 motion sensor zigbee network drop and battery update issue | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#658](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/658) | More data points in 6 hour graph then in 1 hour ( SML004 ) | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#659](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/659) | Ondersteuning voor Philips Hue LTG005 (GU10 White Ambiance) toevoegen | Implemented support | LTG005 now has its own White Ambiance driver. |
| [#660](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/660) | Problem Philips hue door sensor | Fix candidate | Likely same SOC001 cluster issue; confirm model/firmware and new build. |
| [#661](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/661) | Hue without a bridge | App failure | Obtain error text/stack trace and current build reproduction. |
| [#663](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/663) | Probleem met hue buitensensor | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#664](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/664) | How to check if Philips Hue Smart Plug is offline | Feature/settings | Distinguish usage, SDK behavior and a genuinely missing feature. |
| [#666](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/666) | Hue Buckram | Device support | Missing interviewed model 5047131P9. |
| [#667](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/667) | Hue Go V2 added as unknown zigbee device | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#668](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/668) | Update models without bridge | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#669](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/669) | Possible to add the Twilight bedside lamp? | Device support | LGT002 multi-endpoint interview exists; related #694. Old fork implementation must not be copied. |
| [#670](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/670) | Question Advanced settings | Fix candidate | SML004 uses SML002 occupancy driver; sensitivity now addresses the real manufacturer-specific cluster. |
| [#671](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/671) | Adding new device Philips Hue White Ambiance  Milliskin929003045101 | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#672](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/672) | disconnecting device | Network/lifecycle | Collect current logs and network evidence; cleanup does not prove radio disconnect fixed. |
| [#673](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/673) | Adding new device Philips Hue White Ambiance E27 - Model LTA015 | Device support | LTA015 supplied in request; compare full interview before selecting driver/template. |
| [#674](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/674) | Support for Hue WA E27 ST64 filament LTV001 | Implemented support | LTV001 interview matches the new driver. |
| [#675](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/675) | Hue Liane wall lamp | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#677](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/677) | HUE video doorbell | Other scope | Duplicate-topic candidate with #685; establish protocol/integration scope before promising support. |
| [#678](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/678) | App error | App failure | Screenshot-based startup error; needs error text and current reproduction. |
| [#684](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/684) | Adding new device "Hue White and color ambiance G125 – E27" to the app | Device support | Interview gives LCO005, not the newly added LCO003/LCO006. Do not mark fulfilled. |
| [#685](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/685) | HUE Video doorbell | Other scope | Duplicate-topic candidate with #677; establish protocol/integration scope before promising support. |
| [#686](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/686) | Hue Wall Washer support | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#688](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/688) | Mood Transitons [BROKEN] | Light behavior | Mood transition/order issue; do not assume dim-readback fix covers scene coordination. |
| [#689](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/689) | Philips Hue Xamento not on the list for philips hue without the bridge (homey) | Device support | Missing interviewed model 915005997801; coordinate with #634. |
| [#690](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/690) | Hue outdoor sensor battery | Battery/remotes | Original outdoor-sensor report plus a dimmer-battery comment: split test cases, not one device family. |
| [#691](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/691) | Hue essentials bulbs | Device support | Review full discussion/interview and capabilities before choosing an alias or new driver. |
| [#692](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/692) | philips hue light bulb  white ambience  , A60 E27 , zigbee unknown device. | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#693](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/693) | Smart button v3 | Device support | Likely related to #701; confirm actual RDM005 identity before treating as duplicate. |
| [#694](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/694) | [New device request] Philips Hue Twilight sleep and wake-up light (LGT002) | Device support | LGT002 front/back plus button endpoint. Reuse tested isolation approach only after zone/button semantics review. |
| [#695](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/695) | Device already added | Pairing/identity | Check exact interview, manufacturer/model and existing device identity. |
| [#697](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/697) | [New device request] Philips Hue A60 White and Color Bulb LCA011 | Device support | Missing interviewed model LCA011; reporter offers testing. |
| [#698](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/698) | Hue secure contact sensor fails to communicate with Homey | Fix candidate | SOC001 contact and battery now configured independently; physical retest required. |
| [#699](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/699) | DIm duration attribute sometimes misses out even everithing is set up correctly | Light behavior | 2.2.18 explicit-dim/readback regression covered by tests, but instant-transition symptom not proven identical. |
| [#700](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/700) | App crashed | App failure | Only a diagnostic ID is provided. Need actual stack trace, dimmer model and branch reproduction. |
| [#701](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/701) | Philips Hue Smart Button V3 | Device support | RDM005 smart-button request; comment has an image interview, not yet transcribed/verified. |
| [#704](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/704) | Phillips welcome home floodlight | Pairing/identity | Exact manufacturer Philips + model 1743630P7 already matches the existing Welcome driver; investigate pairing/interview. |
