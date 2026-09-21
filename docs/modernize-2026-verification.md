# Modernization verification

The current user-confirmed hardware checkpoint is `00c17c5` (2026-09-20).
LCT000, SML002, RWL022 and both inputs of one RDM001 were exercised on a real
Homey Pro from a clean `modernize-2026` checkout. `sdk3` remains unchanged.

The current runtime head after the deeper capability/migration audit is
`4179b4e` (2026-09-21). Runtime code has changed since the physical checkpoint:
the changes below are covered by automated tests and Homey publish validation,
but must not be described as hardware-verified until they have been exercised on
the corresponding physical devices.

## Reproducible local checks

Use Node.js 22 or newer:

```sh
npm ci --ignore-scripts
npx --yes homey@4.5.0 app validate --level publish
npm test
```

Compose is the source of truth. Issue PRs should change Compose, not the generated
`app.json`. Homey CLI regenerates `app.json` during verification before the test
suite runs, so tests exercise the generated manifest without creating noisy
manifest diffs in each PR.

Tests exercise real app classes and the pinned `homey-zigbeedriver`, with a mocked
Homey SDK boundary and synthetic Zigbee frames. They do not prove radio delivery,
pairing, physical event semantics, or actual battery reporting.

## Hardware checkpoint — 2026-09-20

The user ran `homey app run` against a real Homey Pro from a clean
`modernize-2026` checkout at `00c17c5`. Startup completed without driver
exceptions. The same checkout passed Homey publish validation, and generated
`app.json` matched the committed manifest.

Observed on physical hardware:

- **LCT000** — initialized with Hue/Saturation and Color Temperature support;
  on/off, dimming, color/temperature modes and continuous dimming worked.
- **RDM001** — root and subdevice initialized; first and second inputs triggered
  the expected input-specific Flow events.
- **RWL022** — button events for On/Off, Hue, Dim Up and Dim Down were received.
- **SML002 occupancy** — battery, temperature and occupancy reports were received;
  the user confirmed the tested sensor functions worked.

This confirms that the 2.2.18 Zigbee-driver update did not introduce a regression
in those tested paths at `00c17c5`. It does **not** physically verify the runtime
changes merged after that checkpoint, including capability migrations, battery
wake-up refreshes, SOC001, ROM002, SML settings, Dymera, Slim or every supported
Hue device.

## Test release candidate

The public Homey App Store version is already 2.1.0, so the first modernization
Test-channel build is prepared as **2.1.1**. Promotion to Live remains separate;
the Test channel is used to broaden hardware coverage before merging the branch
back to `sdk3`.

## ROM002 compatibility

The branch previously used both `LongRelease` and `LongPress` for action `0x03`.
The canonical emitted state is `LongRelease`; the Flow listener accepts both IDs
so saved Flows remain compatible. A physical event is emitted only once.

Bindings `[6, 64512]` and release-after-hold semantics are corroborated by the
ROM002 definition and Hue wall-switch converter in Zigbee-herdsman-converters,
checked on 2026-09-20:

- https://github.com/Koenkk/zigbee-herdsman-converters/blob/master/src/devices/philips.ts
- https://github.com/Koenkk/zigbee-herdsman-converters/blob/master/src/lib/philips.ts
- https://github.com/JohanBendz/com.philips.hue.zigbee/pull/705

Cluster 6 is an output cluster used for binding; it must not be added to the
manifest's input cluster list merely to make the two lists match.

## Hardware regression checklist

- [x] LCT000: core on/off, dim, color/temperature and smooth-dim paths verified
      on physical hardware at `00c17c5`.
- [x] SML002: motion/occupancy, temperature and battery reporting verified in the
      current run; broader restart/settings coverage remains useful.
- [ ] SML001 occupancy: change sensitivity, then wake/re-announce the sensor.
- [x] RDM001: both inputs of one physical module verified.
- [ ] RDM001: two physical modules simultaneously, without cross-device Flow
      triggering.
- [ ] ROM002: re-pair/bind, both inputs, mode changes, Press/Hold/Release and
      release after hold; saved Flows using either historical action ID.
- [x] RWL022: physical button events verified.
- [ ] RWL000: existing Gen 1/2 device gains/keeps `measure_battery`; replace the
      battery, wake the remote and verify percentage + low-battery state refresh.
- [ ] RWL022: replace the Gen 3 battery, wake the remote and verify the value is
      refreshed even after reporting was already configured.
- [ ] RDM002: battery updates and button/dial Flows after restart.
- [ ] Modern Iris (`929002376101/201/301/401/402`): existing paired device gains
      `light_temperature` and controls it correctly; legacy `LLC010` remains
      color-only.
- [ ] Bloom: existing LLC011/LLC012/929002375901/929002376001 and LLC013 devices
      gain working `light_temperature`; LLC014 Aura remains color-only.
- [ ] LTE005: an already-paired device historically attached to LWE004 gains
      `light_temperature` + `light_mode` without re-pairing.
- [ ] Legacy SML001/SML002: existing paired devices remain functional after their
      pairing drivers are deprecated; battery refresh works after app restart/wake.
- [ ] SML001/SML003/SML002/SML004 occupancy drivers: battery replacement/wake,
      invalid-value handling, saved settings and generation-specific sensitivity.
- [ ] SOC001: open/close and battery reports, restart and re-announce.
- [ ] Issue #699: simultaneous on/off and duration-based dimming; 2.2.18's
      explicit-dim/readback fix is a candidate, not a confirmed hardware fix.

Do not close these issue groups solely because validation or unit tests pass.

## PR #709 clean absorption

Source: https://github.com/JohanBendz/com.philips.hue.zigbee/pull/709 by SerrII.
The contributor hardware-tested the original implementation. The adapted shared-
Light implementation still needs hardware confirmation.

- Preserve driver IDs `929003665001` / `929004291001` and Dymera's `top`
  subdevice ID. These are Homey identities, not a claim that Dymera advertises a
  catalog number: Zigbee matching uses `LCW004` / `LCW005`.
- Root/bottom uses endpoint 12, top uses 11. Override cluster resolution for all
  inherited Light operations; missing clusters never fall back to the other zone.
- Inherit light initialization, physical color-temperature range discovery,
  power-on settings, blink/alert, duration and smooth-dimming behavior.
- Omitted subdevice settings are inherited from the root as documented in
  https://apps.developer.homey.app/wireless/zigbee#sub-devices.
- Remove custom pairing pages and debug logging; use standard Zigbee learnmode.
- Keep contributor Dymera assets; pad Slim's original 500x375 image to 500x500
  without stretching and derive the missing 75x75 thumbnail. No visual redesign.

Additional hardware checks:

- [ ] Dymera: pairing creates Bottom and Top; each zone independently controls
      on/off, dim/duration, color and temperature.
- [ ] Dymera: power-on settings, blink/alert and start/stop dim affect only the
      chosen zone, including after restart.
- [ ] Slim: pairing/model match, initialization, all standard controls and Flows.

## Follow-up from issue triage

The first mock-only sensor tests did not expose a missing cluster: they supplied
the same incorrect cluster name as the driver. They have been replaced by tests
using real ZCLNode/Endpoint/Cluster instances from zigbee-clusters 3.8.0.

- SOC001 now receives manufacturer-cluster contact reports (0xfc06 / 0x0100),
  with a bound On/Off **command** compatibility path for older installations.
  The issue #642 descriptor has no On/Off input cluster. Contact and battery
  reporting setup are isolated and failed configuration is retried on announce.
- SML occupancy sensitivity/LED settings now use actual cluster names and
  manufacturer-specific attributes. Radio strings are converted correctly;
  zero sensitivity and disabled LED are preserved.
- The four initial protocol regression cases failed before these corrections.
  The suite has since been expanded with capability migration, settings migration,
  product-ID ownership and battery lifecycle regression tests.
- Re-save sensitivity/LED settings, then wake the sensor. Existing SOC001
  installations need a wake/re-announce or repair test; new pairing must also be
  tested to verify the updated binding list on hardware.

See [issue-triage-2026.md](issue-triage-2026.md) for the first-pass issue inventory
and the distinction between concrete code fixes, hardware test candidates and new
work. The inventory is a dated snapshot; GitHub is the source of truth for the
current open-issue count.


## Capability and migration audit — 2026-09-21

A second pass reviewed not just whether a model is supported, but whether existing
paired devices survive capability, driver and settings changes.

Merged after the `00c17c5` hardware checkpoint:

- **#720 / Iris** — modern Iris product IDs migrate in place to
  `light_temperature`; legacy LLC010 remains color-only. Added
  `929002376402`.
- **#721 / Bloom** — Bloom variants gain `light_temperature` in place while
  LLC014 LivingColors Aura remains color-only; LLC013 Compose was corrected.
- **#722 / LTE005** — devices historically paired under the wrong LWE004 driver
  gain `light_temperature` and `light_mode` without re-pairing.
- **#723 / occupancy settings** — repaired missing initial setting values and
  atomically initializes missing settings on already-paired occupancy sensors.
- **#724 / sensitivity** — old SML001/SML002 generations are limited to 0–2;
  newer SML003/SML004 accept 0–4. The shared settings UI exposes the union and
  runtime validates by actual Zigbee product ID.
- **#725 / legacy SML migration** — legacy SML001/SML002 pairing drivers are
  deprecated for new pairing but retained for installed devices. Their battery
  capability registration now survives app restarts, and old SML002 voltage-style
  battery thresholds migrate to percentage semantics.
- **#726 / occupancy battery** — current occupancy drivers reject invalid Zigbee
  battery value 255, tolerate sleeping-device read failures and refresh battery
  state on announce/wake.
- **#727 / product-ID ownership** — removed four accidental active-driver
  collisions: 1742930P7, LTC012, LWA011 and LWF002. Existing paired devices are
  not moved; only future matching is made unambiguous. Phoenix LLM010/011/012
  remains an explicit unresolved overlap pending stronger hardware-backed mapping.
- **#728 / RWL000** — the existing `measure_battery` capability migration now
  also refreshes Gen 1/2 dimmer battery state on announce/wake.
- **#729 / RWL022** — Gen 3 dimmer battery is refreshed on every announce and
  invalid value 255 is ignored.

Every PR above passed the Node.js test suite and Homey CLI publish validation
before merge. These are migration/protocol checks, not substitutes for the
hardware checklist above.

The physical checkpoint therefore remains `00c17c5`; the tested runtime head for
automated checks is `4179b4e`.
