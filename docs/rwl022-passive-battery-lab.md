# RWL022 passive battery reporting lab (investigation only)

## Problem and evidence

A Homey Live 2.3.1 user reported unexpectedly rapid battery percentage decline on a Philips Hue Dimmer Switch **RWL022**. The reported Homey graph fluctuated as well as falling; the report does not yet establish physical battery drain.

The older `sdk3` RWL022 driver had active Configure Reporting commented out. The modernized driver requests `batteryPercentageRemaining` reporting with min=0 seconds, max=21600 seconds (six hours), minChange=1 raw ZCL unit (0.5%). The driver additionally performs an explicit battery read when the device announces. This configuration was already present in 2.1.2 and is unchanged in 2.3.1 and frozen 2.4.0. The report frequency the device actually obeys has not been measured.

## Scope and safeguards

- **Base:** `develop-2.5`; experimental Draft PR only. Not part of Live 2.3.1, planned 2.3.2 hotfix PR #809, or frozen 2.4.0.
- **Default:** no change at all. Without `HUE_RWL022_BATTERY_LAB=passive`, original RWL022 reporting setup and wake reads remain intact.
- **Opt-in:** when `HUE_RWL022_BATTERY_LAB=passive`, request `maxInterval=0xFFFF` on **endpoint 1**, Power Configuration / battery percentage attribute. Per ZCL, this disables automatic reporting, including change-triggered reports. Retain the existing single explicit read per End Device Announce; retain button Flows, SDK parsing, incoming-report observation and availability/last-seen.
- **Previously paired devices:** simply removing app code does not undo a stored configuration. This lab explicitly sends the disable command on the next End Device Announce, when the sleepy device is awake. It is sent once per app runtime after a successful configuration.
- **Newly paired devices:** defer the experimental disable command until End Device Announce; do not send on first init when the remote may be sleeping.
- **Failure:** if the configuration request fails, do not mark it successful; retry at the next announce.
- **Blast radius:** this environment flag affects **all RWL022 devices** running under this local app instance. Only use on a dedicated Homey test setup. It does not select one RWL022 by ID.
- **Rollback:** remove the flag and restart the app. The original six-hour reporting configuration is applied on the next RWL022 End Device Announce (or on initial pairing). Verify the device actually accepted the command. Avoid repeatedly toggling the flag.

This experiment does not disable Homey's `measure_battery` capability or the physical remote buttons. No change is made to RWL000, RDM001, RDM002, other remotes, Zigbee pairing, or OTA.

## Windows PowerShell test

In a checkout of this experimental branch on a dedicated Homey test installation:

```powershell
$env:HUE_RWL022_BATTERY_LAB = 'passive'
homey app run
```

Wake the RWL022 and verify its End Device Announce is received. Record whether the Configure Reporting request succeeded. A button press alone is **not guaranteed** to trigger an announce, so verify the actual event before claiming configuration success. An attribute read/explicit report may still be available.

To restore active reporting, remove the flag, restart the app and wait for an End Device Announce:

```powershell
Remove-Item Env:HUE_RWL022_BATTERY_LAB
homey app run
```

## Test observations to collect

1. RWL022 hardware/firmware, Homey version, original vs current battery age, app version and dates.
2. Raw Zigbee battery reports and ZCL Configure Reporting responses if available (omit device/network identifiers in shared logs).
3. Daily number of reports, battery percentage and battery voltage if accessible, before and after the experiment.
4. End Device Announce count, failed reads/retries, button responsiveness, and device dropouts.
5. Evidence of **physical** battery depletion (failure to operate or battery measurement) vs Homey percentage interpretation.

Do not merge or publish this experiment until actual hardware testing supports it. A falling percentage curve alone cannot establish increased current draw.

Related: battery simplification #771 (already in 2.4), #786 frozen 2.4 Test candidate, #809 independent 2.3.2 serializer/Flow hotfix.
