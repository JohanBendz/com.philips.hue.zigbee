# Zigbee leave/rejoin audit — 2026-09

Scope: #579, #580, #615 and #657 on `issues-2026-next`.

This audit is intentionally conservative. It separates application-level availability/reporting recovery from coordinator-level Zigbee leave/rejoin behavior and establishes regression boundaries before any further runtime changes.

## Regression boundary

The following must remain true unless explicitly reviewed and approved:

- `modernize-2026` / 2.1.2 behavior must not be regressed.
- The frozen `issues-2026` / 2.2.0 Test candidate must not be changed by this investigation.
- No speculative Trust Center, insecure-rejoin, coordinator, pairing or leave handling is added at app level.
- No new fleet-wide bindings or reporting configuration are introduced as a side effect of this rejoin investigation.
- Sleepy-device request volume must not be increased without hardware evidence that the change is necessary and safe.

## What 2.2.0 already changed safely

The 2.2.0 branch reduced application-initiated traffic to sleepy devices in several relevant paths:

- RWL000 no longer performs battery reads at app start or generic online transitions; battery refresh is tied to end-device announce/wake.
- Legacy SML001/SML002 battery capability getters no longer read battery on app start.
- Occupancy-driver battery refresh was moved away from ordinary initialization and is performed on announce/wake.
- Invalid battery value `255` is rejected in the hardened battery paths.
- Actual incoming sensor reports can restore Homey availability.

These changes should be preserved.

## What issues-2026-next adds

### Passive availability recovery

`HueRemoteAvailability` only calls `setAvailable()` after real incoming traffic.

- RWL000: bound button commands.
- RWL022: announce, valid battery report, valid parsed button event.
- RDM002: announce, valid battery report, valid parsed button/dial event.

This does not send Zigbee traffic and does not attempt a network repair. It only corrects Homey's availability state when the device has demonstrated that it is still communicating.

### Measurement-reporting recovery — parked

An earlier draft refreshed temperature/luminance reporting for SML001/SML002 families on the first announce after an app restart, retrying on a later announce after failure.

That experiment has now been removed from `issues-2026-next`. It sends Zigbee configuration traffic during the sleepy-device wake window, so it is being kept separate from the rejoin/availability work until it can be tested physically. It must not be presented as a rejoin fix.

## homey-zigbeedriver 2.2.18 behavior relevant to this audit

The app pins `homey-zigbeedriver` 2.2.18.

The library documents `onEndDeviceAnnounce()` as the window in which a sleepy device is temporarily online and able to handle requests.

Relevant library behavior:

- `getOnOnline` performs an attribute read on end-device announce.
- On first initialization, a registered capability with a getter may fetch its initial value even when ordinary startup polling is disabled.
- Failed first-init capability reads can be rescheduled for the next end-device announce.
- First-init attribute-reporting configuration can also be retried on the next announce.
- `configureAttributeReporting()` retries a failed configure-reporting request internally and groups configuration by endpoint/cluster.

This reinforces the rule that application traffic during sleepy-device wake windows should be deliberate and bounded.

Source:
https://github.com/athombv/node-homey-zigbeedriver/tree/v2.2.18

## Evidence that "left network" is not one single app symptom

There are at least two distinguishable cases.

### 1. Homey says "left network" while the device still sends data

Homey community reports show Hue and non-Hue battery devices reported as having left the network while they continue to trigger flows or report values. That is compatible with stale/incorrect platform availability or network state rather than an actual loss of radio communication.

In this case the passive availability recovery in #757 is appropriate because it trusts real inbound traffic.

Example:
https://community.homey.app/t/device-reported-as-having-left-the-zigbee-network-but-is-still-working/104995

### 2. The coordinator genuinely rejects a rejoin

Independent Zigbee coordinator logs for Hue SML001 show a different failure mode: a `STANDARD_SECURITY_UNSECURED_REJOIN` can be denied by the Trust Center, followed by `DEVICE_LEFT`.

That is coordinator/security-policy behavior, not something exposed through this Homey app's current Zigbee device API.

Example:
https://github.com/home-assistant/core/issues/89311

This external evidence does not prove that every Homey report has the same cause. It demonstrates why application availability, application polling and coordinator rejoin policy must not be conflated.

## Issue classification

### #579 — Hue Dimmer Switch

Mixed report.

- Earlier battery polling timing was a plausible application aggravator and has been reduced in 2.2.0.
- Users have also reported full Zigbee-stack recovery after Homey reset/reinstall.
- #757 can correct stale Homey availability when real button traffic is still arriving.
- No evidence currently justifies app-level rejoin logic.

### #580 — Hue Dial Switch

Mixed battery/network report.

- Battery handling is hardened in 2.2.0.
- #757 restores availability from actual Tap Dial traffic.
- Genuine network loss remains outside the demonstrated app-level fix.

### #615 — SML001 leave/rejoin

Best canonical issue for genuine leave/rejoin investigation.

- The issue explicitly reports the device leaving the Zigbee network.
- External coordinator evidence for older Hue motion sensors shows insecure-rejoin/Trust-Center behavior can produce this symptom.
- Current Homey app APIs do not expose a supported Trust Center policy control here.
- Do not add speculative application-level repair logic.

### #657 — SML003 network drop + battery

Mixed report.

- Battery/reporting aspects have concrete app-level hardening.
- The actual network-drop symptom remains unproven.
- Similar instability has also been reported externally for newer Hue motion sensor generations, so this should not be assumed to be only an SML001 legacy-firmware issue.

## Decision gates

Do **not** implement any of the following without explicit review:

1. coordinator Trust Center or insecure-rejoin changes;
2. automatic pairing/repair/rejoin attempts;
3. new or changed Zigbee bindings intended to solve leave/rejoin;
4. periodic polling intended to keep sleepy devices "alive";
5. additional per-wake reads/writes/configuration solely to work around a network leave;
6. changes to 2.1.2 or the frozen 2.2.0 candidate based on these unresolved reports.

## Safe next work

Without changing released or 2.2.0 behavior, the safe investigation path is:

1. keep passive availability recovery from real inbound traffic;
2. physically distinguish "Homey says unavailable/left but events still arrive" from "device genuinely stops all Zigbee traffic";
3. collect Homey firmware, device model/firmware and whether Repair restores the device without re-pairing;
4. keep measurement-reporting recovery parked as its own #654/#663 experiment until physical testing justifies reintroducing it;
5. only introduce further runtime changes after a reproducible app-level mechanism is identified.

## Current conclusion

No app-side code path reviewed in 2.1.2, 2.2.0 or the passive availability part of #757 provides a supported mechanism that would intentionally remove a device from the Zigbee network or alter Trust Center rejoin policy.

The current evidence supports preserving 2.2.0 behavior and avoiding speculative rejoin code. The unresolved work is primarily to distinguish stale Homey network/availability state from a genuine coordinator-level rejoin failure on physical hardware.
