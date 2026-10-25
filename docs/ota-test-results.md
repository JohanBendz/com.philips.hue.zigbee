# Philips Hue Zigbee OTA hardware observations

These records distinguish observed transfer/version results from the complete functional checks in the [hardware test plan](ota-test-plan.md). Missing build/platform details remain explicit. Results apply to the tested device and starting version only.

## LCT015 — 2026-10-05

Maintainer: Johan Bendz. Date uses Europe/Stockholm; the supplied log timestamps are UTC on 2026-10-04. Evidence is the maintainer's screenshots and log shared in the OTA project conversation. Device addresses and Homey device UUIDs are omitted.

| Field | Observation |
| --- | --- |
| App build / channel / Homey firmware / client | Not supplied; do not infer the installed build from the current repository head |
| Homey driver / actual product ID / manufacturer | `LCT000` / `LCT015` / `Philips` |
| Firmware family | Packaged mapping `0x010C`; no raw OTA query or hardware-version capture supplied |
| Starting Hue software | `1.50.2_r30933` |
| Starting OTA version | Homey showed `0.1b0 / 1.10b2`, corresponding to `0x01001A02` |
| Offered / resulting OTA version | `0x01002A00`, shown by Homey as `0.1b0 / 2.10b0` |
| Transfer / restart | Progress screenshots, followed by the maintainer reporting that the lamp blinked |
| Rejoin / response | At `22:31:26Z`, `onEndDeviceAnnounce` read color-control attributes successfully on endpoint 11; temperature/mode reads also returned values |
| Initial Homey result | `Unable to verify if update was successful`, with a Retry button; device information still showed the old software string |
| Later Homey result | Current version `0.1b0 / 2.10b0` and `Your device is up to date` |
| Resulting Hue software | Later device-information screenshot showed `1.116.12` |
| Elapsed time / delay | Not measured; screenshots show that final status and software information refreshed after the device returned |
| Controls / reporting / Flows / settings / app restart | Full post-update functional checks not yet reported |
| Verdict | Transfer, rejoin and resulting versions observed; complete functional verification pending |

This exercises the update from the already-installed prerequisite `0x01001A02` to `0x01002A00`. It does not verify the earlier prerequisite transfer from older firmware, other `0x010C` models, legacy SBL images or battery devices. The observed delay does not establish a cache or timeout defect inside Homey. No retry or further transfer was reported between the initial verification error and the later current-version screenshots.

User guidance now explains that firmware information and update status may take a few minutes to refresh after restart. Preserve an initial verification error, wait and check status again before retrying; a persistent error still needs investigation.
