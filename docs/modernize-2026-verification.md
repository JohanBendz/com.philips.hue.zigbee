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
