# Philips Hue Zigbee OTA firmware

This branch uses Homey's native Zigbee firmware update support. Firmware binaries are bundled per driver and declared in `driver.firmware.compose.json`.

## Source and verification policy

- Use Koenkk/zigbee-OTA as the maintained catalogue/archive.
- Prefer Signify's `originalUrl` from the Koenkk index as provenance when available.
- Never identify an image by filename or visible software version alone.
- Verify the Zigbee OTA header before adding a file:
  - file identifier: `0x0BEEF11E`
  - header version: `0x0100`
  - manufacturer code: `0x100B` (4107)
  - image type
  - file version
  - total image size
- Store a SHA-256 integrity value in Homey's firmware compose metadata.
- Preserve intermediate firmware images when the upstream catalogue specifies `minFileVersion` / `maxFileVersion`; do not assume every device may jump directly to the latest image.
- Treat driver compose files as source of truth. `app.json` is generated during validation and should not be hand-edited.

## Implemented mappings

| Homey driver | Zigbee product ID | Hue image type | Confidence | Source |
| --- | --- | ---: | --- | --- |
| LOM002 | LOM006 | `0x011A` | High | deCONZ/zigpy Hue OTA mapping + Koenkk/zigbee-OTA |

LOM006 currently bundles the complete known `0x011A` upgrade chain from the Koenkk index through file version `16781824`.

## Next high-confidence mappings to assess

Known public mappings include SML001 → `0x010D`, RWL020/RWL021 → `0x0109`, LCA001/LWA001 → `0x0112`, LCG002/LTE002 → `0x0114`, LCL001/LCL003 → `0x0117`, and several older light families on `0x010C` / `0x010E` / `0x010F`.

Each mapping must still be checked against the exact product IDs supported by the Homey driver before firmware is enabled.
