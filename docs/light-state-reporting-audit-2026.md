# Hue light-state reporting audit — 2026-09

Scope: issue #645 on `issues-2026-next`.

This audit keeps the frozen 2.2.0 behavior intact and separates passive state synchronization from active Zigbee reporting configuration.

## Current 2.2.0 behavior

The shared `drivers/Light.js` registers listeners for two incoming Zigbee attributes when those reports are already received:

- `onOff.attr.onOff` → Homey `onoff`
- `levelControl.attr.currentLevel` → Homey `dim`

The listeners are removed during uninitialization to avoid accumulation.

This path is passive. It does not create bindings and it does not configure attribute reporting.

A regression test on `issues-2026-next` now guards that behavior and verifies that:

- valid incoming on/off reports update Homey's state;
- valid incoming level reports update Homey's dim value;
- invalid level values are ignored;
- listeners are cleaned up;
- the passive synchronization path does not invoke `configureAttributeReporting()`.

## Why passive synchronization is the safe first step

Athom's current Zigbee documentation states that attribute reports are sent to bound nodes and that a binding is normally required for a cluster to report attributes. The driver manifest `bindings` property is used to create those bindings during pairing.

Relevant documentation:
https://apps.developer.homey.app/wireless/zigbee

The current Hue light manifests do not establish On/Off (cluster 6) or Level Control (cluster 8) reporting bindings for the light fleet. Representative light manifests explicitly have empty `bindings` arrays.

Therefore the 2.2.0 listener can synchronize Homey only for devices/firmware/network situations where the lamp already sends those reports to Homey.

That is intentional for the Test candidate: it adds no Zigbee traffic and makes no fleet-wide pairing/binding migration.

## Important distinction

Issue #645 asks for Homey state to reflect a Hue light that was changed outside the Homey command path.

There are several materially different cases:

1. **The lamp sends an attribute report to Homey.**
   - 2.2.0 now consumes it.
   - This is the passive path and is safe.

2. **The lamp is controlled by another Zigbee controller/device but sends no report to Homey.**
   - The passive path cannot discover the new state.
   - Active binding/reporting may be required.

3. **The lamp is physically switched off at mains.**
   - A powerless lamp cannot transmit an "off" report.
   - No app implementation can obtain a live Zigbee state from a device without power.

## Regression boundary

Do not add any of the following without explicit review and physical testing:

- On/Off or Level Control bindings across the Hue light fleet;
- configure-reporting calls for all existing paired light devices;
- periodic polling of light state;
- migration code that changes Zigbee bindings on already-paired devices;
- startup reads across the light fleet intended only to improve external-state synchronization.

These changes would alter Zigbee traffic and/or network configuration for a very large installed base and therefore have materially higher regression risk than passive listeners.

## Safe next evidence

Before considering active reporting:

1. Test #645 against the 2.2.0 Test build on the affected model.
2. Confirm whether Homey receives `onOff` and/or `currentLevel` reports when the light is changed externally.
3. If reports arrive, verify that the Homey capability follows them.
4. If no reports arrive, capture the Zigbee interview/reporting configuration for that model before changing bindings.
5. Only then evaluate a model-scoped active-reporting experiment before any fleet-wide change.

## Current conclusion

No further runtime change is justified on `issues-2026-next` yet.

The passive 2.2.0 implementation is low-risk and now regression-covered. Moving from passive listening to active binding/reporting would change network behavior and must be treated as a separate decision after physical evidence from #645.
