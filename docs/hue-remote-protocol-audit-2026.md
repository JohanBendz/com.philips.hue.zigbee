# Hue remote 0xFC00 protocol migration audit — issue #769

Status: **contract/tests only**. Neither current device drivers nor their public
Flow card identifiers are changed by this first PR. Scope: `develop-2.4` only.

## What the repository demonstrates today

The following offsets are taken from *current raw parsers*, not independent
captures of physical Zigbee traffic. Existing `test/helpers.js:buttonFrame()`
creates a zero-filled synthetic ten-byte buffer, setting only indexes 5
(button/input) and 9 (action). Treat it as a regression fixture, **not** as
evidence of actual ZCL frame-control bits, manufacturer headers or payload shape.

| Device family | Raw path currently intercepted | Parser behaviour to preserve |
| --- | --- | --- |
| RDM001 Wall Switch | 0xFC00, input frame[5], action frame[9] (length >= 10); also Power Configuration 0x0001 | Two independently routed inputs; rocker release and pushbutton Press/Hold/Release/LongRelease; mode writes on waking. |
| ROM002 Wall Switch | 0xFC00, input frame[5], action frame[9] (length >= 10) | Two independently routed inputs, hold de-duplication, release semantics and legacy Flow alias LongPress/LongRelease. |
| RWL022 Dimmer | 0xFC00, frame[5] / frame[9] (length >= 10); also 0x0001 | Four buttons × four public actions; availability on valid traffic. |
| RDM002 Tap Dial | 0xFC00; buttons 1–4 use frame[5] / frame[9]; Ring uses frame[5] == 20 and length >= 18 | Ring direction frame[12] (0xFF left / 0 right), frame[17] legacy time/speed class; preserve all existing action strings and the numeric payload for future #762. Battery/availability path remains independent. |
| LGT002 Twilight | 0xFC00 on endpoint **1**, button frame[5], action frame[9] (length >= 10) | Dot/Hue × Press/Hold/Release/LongRelease; do not affect front/back light endpoints 12/11. |

`ROM001` and `RWL000` already use standard endpoint-bound
OnOff/LevelControl commands and do **not** belong to the raw 0xFC00 conversion.

## Blocking uncertainties before any driver migration

1. `lib/HueSpecificCluster.js` currently declares command 0 with
   `button:uint16`, `type:enum8`, `action:enum8`, `duration:uint16`.
   That shape has not been proven against the current raw parser's action at
   byte 9 or the longer Tap Dial Ring messages. Do not assume the existing
   declaration can decode those packets correctly.
2. The actual ZCL frame-control flags and manufacturer header (if present)
   must be determined from sanitized **hardware captures**. Merely padding
   the legacy test buffers with zeroes does not establish that contract.
3. The upstream ZCL endpoint routes incoming commands via
   `endpoint.bind('hue', new HueSpecificBoundCluster(...))`; global registration
   of a `BoundCluster` itself is incorrect. Before migration verify its
   command definition, direction/manufacturer matching, and full payload,
   using the pinned `zigbee-clusters` version, not an assumed header.
4. Do not refactor button events, raw Power Configuration parsing, battery
   refresh, input/subdevice selection, availability or cleanup all at once.
   Migrate one model family per isolated PR, preserving all Flow IDs.

## Safe first implementation

`HueSpecificBoundCluster.button()` now returns the callback result/promise
and propagates a rejection. This makes future ZCL-dispatch errors observable
without changing any current device drivers (none of the listed raw-device
handlers bind this class yet). Tests create an actual ZCL endpoint and bind
the handler, ensuring payload properties are forwarded unchanged. Additional
legacy Tap Dial ring tests lock the current public event names, including
ignored invalid direction/short buffers. **No device runtime routing changes
have been made in this PR.**

## Next gate

Collect redacted manufacturer-specific 0xFC00 raw frame samples from RDM001,
RDM002 button + Ring, RWL022, ROM002 and Twilight. Capture exact endpoint,
cluster, frame bytes, firmware/model and observed physical action; redact
device/network identifiers. Build a protocol fixture for each supported
variant before selecting the first family for an experimental
BoundCluster-migration PR. Test on physical hardware through a controlled
future 2.4 Test release, never by altering published 2.3.0 Test.
