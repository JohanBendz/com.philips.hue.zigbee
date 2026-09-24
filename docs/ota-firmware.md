# Philips Hue Zigbee OTA firmware

This branch uses Homey's native Zigbee firmware update support. Firmware binaries are bundled per driver and declared in `driver.firmware.compose.json`.

## Source and verification policy

- Use Koenkk/zigbee-OTA as the maintained catalogue/archive.
- Prefer Signify's `originalUrl` from the Koenkk index as provenance when available.
- Never identify an image by filename or visible software version alone.
- Verify every Zigbee OTA header before adding a file: `0x0BEEF11E`, header version `0x0100`, manufacturer code `0x100B` (4107), image type, file version and total image size.
- Store a cryptographic integrity value in Homey's firmware compose metadata. Prefer the SHA-512 published by Koenkk when available; locally computed SHA-256 remains valid.
- Preserve intermediate images whenever the upstream catalogue specifies `minFileVersion` / `maxFileVersion`; do not assume devices may jump directly to the latest image.
- Enable an update only for product IDs with an independently supported image-type mapping. A broad Homey driver does not imply that every product ID in that driver uses the same firmware family.
- Treat driver compose files as source of truth. `app.json` is generated during validation and should not be hand-edited.
- `test/firmware.test.js` validates every bundled OTA file against the compose metadata, driver identity, binary header and declared integrity algorithm.

## Current coverage

The branch currently contains **42 firmware-enabled Homey drivers** and **111 bundled firmware files**.

| Homey driver | Zigbee product ID(s) | Hue image type(s) | Battery wake instruction |
| --- | --- | --- | --- |
| 1743130P7 | 1743430P7 | `0x011F` | — |
| 1746447P7 | 1746430P7 | `0x011F` | — |
| LCA001 | LCA001 | `0x0112` | — |
| LCE002 | LCE002 | `0x0114` | — |
| LCF003 | LCF003 | `0x010E` | — |
| LCF003 | 4080248P9 | `0x011D` | — |
| LCG002 | LCG002 | `0x0114` | — |
| LCL001 | LCL001 | `0x011F` | — |
| LCS001 | 1741530P7 | `0x011F` | — |
| LCT000 | LCT010, LCT014, LCT015, LCT016 | `0x010C` | — |
| LCT000 | LCT007 | `0x0104` | — |
| LCT012 | LCT012 | `0x010C` | — |
| LCT024 | LCT024 | `0x010E` | — |
| LCT026 | LCT026 | `0x0111` | — |
| LLC010 | LLC010 | `0x0108` | — |
| LLC011 | LLC011 | `0x0103` | — |
| LLC020 | LLC020 | `0x0108` | — |
| LOM002 | LOM006 | `0x011A` | — |
| LTA001 | LTA001 | `0x0112` | — |
| LTA011 | LTA015 | `0x0129` | — |
| LTC001 | LTC001 | `0x010E` | — |
| LTC011 | LTC011 | `0x010E` | — |
| LTE002 | LTE002 | `0x0114` | — |
| LTG002 | LTG002 | `0x0114` | — |
| LTO001 | LTO001 | `0x0114` | — |
| LTO002 | LTO002 | `0x0114` | — |
| LTP002 | LTP002 | `0x010E` | — |
| LTW000 | LTW010, LTW015 | `0x010C` | — |
| LTW000 | LTA009 | `0x0114` | — |
| LTW012 | LTW012 | `0x010C` | — |
| LTW013 | LTW013 | `0x010C` | — |
| LWA001 | LWA001 | `0x0112` | — |
| LWA004 | LWA004 | `0x0112` | — |
| LWA017 | LWA029 | `0x0114` | — |
| LWE002 | LWE002 | `0x0112` | — |
| LWO001 | LWO001 | `0x0112` | — |
| LWB000 | LWB010, LWB014 | `0x010C` | — |
| LWB000 | LWB006 | `0x0105` | — |
| RDM001 | RDM001 | `0x011C` | Yes |
| RDM002 | RDM002 | `0x0121` | Yes |
| RWL000 | RWL020, RWL021 | `0x0109` | Yes |
| RWL022 | RWL022 | `0x0119` | Yes |
| SML001-occupancy | SML001 | `0x010D` | Yes |
| SML001-occupancy | SML003 | `0x011B` | Yes |
| SML001 | SML001 | `0x010D` | Yes |
| SML002-occupancy | SML002 | `0x010D` | Yes |
| SML002-occupancy | SML004 | `0x011B` | Yes |
| SML002 | SML002 | `0x010D` | Yes |

LOM006 is documented as image type `0x011A` in the public deCONZ/zigpy Hue OTA mapping. LTA015 is backed by issue #673 in this repository, which reports hardware platform `100b-129`. The remaining mappings were added only after cross-checking public Hue OTA mappings, captured Hue V2 `product_data`, observed Zigbee OTA requests, Koenkk/zigbee-OTA metadata and matching Zigbee OTA image headers.

## Battery devices

Battery-powered devices use a separate `wakeInstruction` in their firmware compose manifest. The instruction is device-specific:

- Hue Dimmer Switch: briefly press a button every few seconds.
- Hue motion sensors: briefly press the setup button every few seconds; do not hold it.
- Hue Tap Dial Switch and Wall Switch Module: follow the instruction declared by their driver manifest.

Battery-device OTA should be verified on real hardware because update timing depends on keeping the device awake.

## Expansion rule

Do not infer OTA support from a shared Homey driver alone. Add another product only when its Hue image type can be independently established and the required image chain is available and header-verified. New mappings should be added in small groups, followed by the firmware regression test and Homey publish validation before further expansion.
