# Genuine Hue Zigbee traffic and Homey last-seen — issue #770

Official Homey SDK v3 Device reference:
https://apps-sdk-v3.developer.homey.app/Device.html#setLastSeenAt

`setLastSeenAt()` is available from Homey **v12.6.1**. This is below
the maintained 2.4.0 compatibility floor of `>=12.9.0`.

## First, observational-only implementation

`lib/HueLastSeen.js` provides a single in-memory per-device timestamp
throttle (60 seconds). It calls **only** Homey's `setLastSeenAt()`, not
Zigbee reads, polls, configuration or network recovery. Errors are logged
independently and allow a later genuine incoming event to retry.

Only `markHueRemoteAvailable()` is integrated in part 1. Its current
RDM002 and RWL022 callers are limited to recognized button actions,
validated battery values and incoming end-device announce events.
Existing `setAvailable()` behaviour is unchanged and is not awaited
by the telemetry update.

**Do not simply add telemetry to `markHueSensorAvailable()` yet**:
the current SML001/SML002 occupancy handler calls that helper *before*
verifying `occupancyStatus.occupied`, and some temperature/luminance
handlers do not validate inputs at this boundary. Adding telemetry at
that location would classify malformed callback data as genuine traffic.

**SOC001 requires a separate discriminator**: the same contact/battery
handlers are invoked by fresh reports and initial explicit reads. A
last-seen timestamp should not be advanced simply because a queued
initial read was requested or a synthetic handler/test was invoked.

## Next stages

1. Add tests and valid-report gating for occupancy, temperature, luminance
   and battery before integrating last-seen into the sensor path.
2. Give SOC001 report-originated callbacks a dedicated last-seen path;
   do not alter its existing attribute-value handling or compatibility
   On/Off command path.
3. Inspect the remaining remotes separately, including #769 raw event
   normalization. Do not use last-seen as a proxy for network rejoin
   or for scheduled read responses.

Scope here is `develop-2.4`. Published 2.3.0 Test, 2.2.1 Live,
rollback and OTA are untouched.
