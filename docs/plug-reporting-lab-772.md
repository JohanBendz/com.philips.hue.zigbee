# Hue Smart Plug reporting experiment — issue #772

**EXPERIMENT ONLY — DO NOT MERGE INTO DEVELOP/TEST/LIVE WITHOUT A SEPARATE DECISION.**
Branch: `experiment/772-plug-reporting-lab`, based on `develop-2.4`.
`drivers/Plug.js` is unchanged: the proven `pollInterval: 15000` and
`getOnOnline: true` remain enabled in every test mode. No global changes to
lighting or the existing paired plug fleet.

## Hypothesis, not an established diagnosis

The pinned `homey-zigbeedriver@2.2.18` maps `onoff` to
`get: 'onOff'`, `report: 'onOff'` and installs an `attr.onOff` listener,
but the original Compose manifest lists input cluster 6 on endpoint 11
**without** an outgoing reporting `bindings` entry. No
`reportOpts.configureAttributeReporting` is specified in `Plug.js`.
Homey's Zigbee guidance normally requires a binding made at pairing and
explicit Configure Reporting for unsolicited attribute updates. This
could explain missing reports, but the maintainer has spent many hours
investigating that issue previously; do not assume prior experiments
were incorrect or that Hue hardware actually supports reliable reports.

Historical baseline: Plug polling existed in 2020 SDK3 code (3600 ms);
15,000 ms polling plus get-on-online is present by 2022.

## Deliberately isolated changes

Only this experiment's `LOM002` Compose manifest adds `bindings: [6]`
under endpoint 11 for **newly paired lab plugs**. Changing a Compose
manifest does not by itself recreate missing bindings on existing devices.
The shared `Plug.js`, other driver manifests and production branch are
unchanged. `drivers/LOM002/device.js` accepts an explicit environment
mode for one debug Homey app execution:

- Unset: normal 15-second polling, no lab code runs.
- `HUE_PLUG_REPORT_LAB=passive`: add a removable listener for actual
  `attr.onOff` events only, without a Configure Reporting request.
- `HUE_PLUG_REPORT_LAB=configure`: the same listener plus a one-time
  `configureAttributeReporting` call on endpoint 11 for `onOff` with
  minimum 0 seconds, maximum 300 seconds and minChange 1. Log whether
  the call succeeds or fails; success is *not* proof reports arrive.

Example PowerShell (run only from the isolated experimental checkout):

```powershell
$env:HUE_PLUG_REPORT_LAB = 'passive'
homey app run
# Stop, and only if testing a fresh lab-paired plug:
$env:HUE_PLUG_REPORT_LAB = 'configure'
homey app run
Remove-Item Env:HUE_PLUG_REPORT_LAB
```

## Controlled sequence

1. Baseline: before any new pairing, document the model ID/firmware,
   Homey firmware, and physical-button behavior with normal polling.
   Note the Homey state sync latency on repeated ON/OFF actions.
2. Run the lab branch in `passive` mode on the existing paired plug.
   Tap the physical button 10–20 times with >20 seconds between actions.
   Each true inbound report logs
   `[LOM002 report lab] attr.onOff=<value> ... reportCount=<n>`.
   Poll read responses do **not** emit this event.
3. If zero reports are observed and a spare physical plug is available,
   newly pair that dedicated plug using **the lab manifest's endpoint-11
   binding**. Repeat passive mode to isolate binding alone.
4. On that same isolated lab plug, run `configure` mode. Observe whether
   the Configure Reporting request succeeds and whether subsequent real
   reports actually arrive. Test at least 20 manual on/off cycles.
5. Leave polling enabled throughout. Repeat after restart, power
   interruption and a longer (>12-hour) observation window. Repeat for
   other LOM firmware/model variants only if needed.
6. Log: number of manual toggles, number of report events, apparent
   per-event latency and correctness, poll-only catches, rejoin recovery,
   reporting configuration success/failure. Compare against the original
   polling baseline; collect sanitized Zigbee logs where practical.

Do **not** share Zigbee network keys, IEEE identifiers, sensitive node
data or entire unredacted interviews. Do not infer zero Zigbee reports
from the lack of a Homey UI refresh alone; use the separate attribute
report log.

## Success / abort criteria

A successful Configure Reporting command merely shows command acceptance.
Only sustained real physical changes reaching Homey through unsolicited
reports across the representative LOM variants can justify *considering*
a reporting-first design. If report events are missing, delayed,
inconsistent, or fail after reconnect, retain 15-second polling as the
known-good solution. No production driver or polling change is authorized
by this experiment.
