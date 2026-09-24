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
- `test/firmware.test.js` validates every bundled OTA file against the compose metadata and the binary header and the declared integrity algorithm.

## Implemented mappings

| Homey driver | Zigbee product ID | Hue image type | Confidence |
| --- | --- | ---: | --- |
| LOM002 | LOM006 | `0x011A` | High |
| LTA011 | LTA015 | `0x0129` | High |
| LCA001 | LCA001 | `0x0112` | High |
| LWA001 | LWA001 | `0x0112` | High |
| LCG002 | LCG002 | `0x0114` | High |
| LTE002 | LTE002 | `0x0114` | High |
| LCL001 | LCL001 | `0x0117` | High |
| LCL003 | LCL003 | `0x0117` | High |

LOM006 is documented as image type `0x011A` in the public deCONZ/zigpy Hue OTA mapping. LTA015 is backed by issue #673 in this repository, which reports hardware platform `100b-129`. The remaining mappings above are documented in the public Hue OTA mapping and cross-checked against Koenkk/zigbee-OTA.

## Next mappings to assess

Public mappings also cover:

- SML001 → `0x010D`
- RWL020 / RWL021 → `0x0109`
- LCT012 / LTW012 / LTW013 / LWB010 and related legacy lights → `0x010C`
- LCF003 / LCT024 / LTP002 and related luminaires → `0x010E`

Battery devices should be handled separately because wake behaviour and update timing need explicit testing.
