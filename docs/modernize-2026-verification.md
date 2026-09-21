# Modernization verification

The current user-confirmed hardware checkpoint is `00c17c5` (2026-09-20).
LCT000, SML002, RWL022 and both inputs of one RDM001 were exercised on a real
Homey Pro from a clean `modernize-2026` checkout. `sdk3` remains unchanged.

The subsequent 2.1.1 release-preparation commit changes only version/release
metadata and this documentation; runtime code is unchanged from that checkpoint.

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
in those tested paths. It does **not** physically verify SOC001, ROM002,
SML001 settings, Dymera, Slim or every supported Hue device.

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
- [ ] RWL000/RWL022/RDM002: battery updates and button/dial Flows after restart.
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
  The full suite now contains 36 tests, including reporting-store and
  repeated-init cleanup checks.
- Re-save sensitivity/LED settings, then wake the sensor. Existing SOC001
  installations need a wake/re-announce or repair test; new pairing must also be
  tested to verify the updated binding list on hardware.

See [issue-triage-2026.md](issue-triage-2026.md) for all 120 open issues and the
distinction between concrete code fixes, hardware test candidates and new work.
