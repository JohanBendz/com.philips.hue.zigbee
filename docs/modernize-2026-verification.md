# Modernization verification

The last user-confirmed hardware checkpoint before this stabilization pass is
`747ce0d` (LCT000, SML002 and both inputs of one RDM001). `sdk3` remains unchanged.

## Reproducible local checks

Use Node.js 22 or newer:

```sh
npm ci --ignore-scripts
npm test
npx --yes homey@4.5.0 app validate --level publish
git diff --exit-code -- app.json
```

Compose is the source of truth. Regenerate and commit `app.json` after changing
drivers or Flow cards. The workflow checks for stale generated output.

Tests exercise real app classes and the pinned `homey-zigbeedriver`, with a mocked
Homey SDK boundary and synthetic Zigbee frames. They do not prove radio delivery,
pairing, physical event semantics, or actual battery reporting.

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

## Hardware regression checklist (not yet verified for these changes)

- [ ] LCT000: on/off, dim with duration, color, temperature, power-on settings,
      blink/alert and smooth-dim Flows.
- [ ] SML002: motion, lux, temperature and battery, including after app restart.
- [ ] SML001 occupancy: change sensitivity, then wake/re-announce the sensor.
- [ ] RDM001: both inputs; then two physical modules simultaneously, without
      cross-device Flow triggering.
- [ ] ROM002: re-pair/bind, both inputs, mode changes, Press/Hold/Release and
      release after hold; saved Flows using either historical action ID.
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
