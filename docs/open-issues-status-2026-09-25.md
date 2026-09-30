# Remaining open issues — status after 2.2.0 / issues-2026-next cleanup

Date: 2026-09-25

After the 2.2.0 implementation review, post-2.2.0 audits and issue consolidation, the repository now has **10 real open issues**.

Historical requests that are implemented have been closed as completed. Overlapping network/reporting reports have been consolidated into canonical issues so the open backlog describes work that actually remains.

## Open issues

### Physical Test / model evidence required (6)

- #428 — Gradient Signe native three-color gradient: implementation exists; physical color-order/behavior confirmation remains.
- #694 — Twilight LGT002: front/back, physical buttons and back gradient implemented; physical confirmation remains.
- #645 — light state reporting: passive on/off/current-level synchronization is implemented and regression-covered. Active bindings/reporting are deliberately not added without physical evidence.
- #699 — intermittent transition duration under frequent traffic: explicit and fallback durations survive stress tests; physical command-sequence evidence is still required.
- #598 — GU10 reconnect: verified current GU10 Zigbee IDs are mapped. Exact modelId/interview is required if the affected lamp still fails on 2.2.0.
- #633 — RWL022: label/protocol path and all 16 button/action combinations are regression-covered. Pairing/binding changes are deliberately deferred pending physical evidence.

### Canonical unresolved technical tracks (2)

- #615 — **Hue sleepy devices intermittently leave Zigbee network / rejoin instability**.
  - Canonical for historical #579, #580 and #657 network-loss symptoms.
  - App-side polling/battery/availability handling is hardened.
  - Genuine coordinator/Trust Center/rejoin behavior remains unresolved at platform/network level.

- #654 — **Hue motion sensors stop updating temperature / luminance**.
  - Canonical for the reporting side of historical #663.
  - Listener lifecycle is fixed.
  - Wake-based configure-reporting recovery remains deliberately parked until physical evidence justifies it.

### Identity ambiguity (1)

- #597 — A60 E27 800 lm.
  - `8719514329843` maps upstream to `LWF004`.
  - `9290018216A` maps upstream to `LWA024`.
  - 2.2.0 already contains `LWA024`; draft PR #751 keeps the separate `LWF004` hypothesis isolated.
  - A physical Homey Zigbee interview is the deciding evidence.

### Separate feature workstream (1)

- #668 — Hue OTA without Bridge.
  - Homey's OTA mechanism is available.
  - Firmware provenance/licensing/distribution remains a separate maintainability decision.

## Closed during the 2026-09-25 cleanup

### Completed implementations

- #307 — default smooth transition
- #347 — combined light-state Flow action
- #376 — color/light_mode restoration
- #522 — additional Flow actions
- #582 — motion cooldown / occupancy timeout
- #607 — Wall Switch long press
- #616 — RWL022 press/hold semantics
- #622 — Datura Small support
- #639 — stale sensor availability recovery
- #701 — RDM005 Smart Button V3
- #688 — known Mood-transition path

### Consolidated into canonical issues

- #579 → #615
- #580 → #615
- #657 → #615
- #663 → #654 for reporting; #615 for genuine network loss

## Net result

| Status | Count |
|---|---:|
| Physical Test / model evidence | 6 |
| Canonical unresolved technical tracks | 2 |
| Identity ambiguity | 1 |
| Separate OTA workstream | 1 |
| **Open real issues** | **10** |

## Engineering boundary

There is still no safe evidence-backed runtime change that should simply be added next to `issues-2026-next`.

The productive next step is physical verification of the six Test/evidence issues. Runtime changes to bindings, reporting, command ordering or rejoin behavior require concrete failing evidence first.

This is intentionally stricter than the old backlog: an implemented request does not stay open indefinitely merely because every hardware variant has not yet been re-tested. A reproducible regression should become a focused new bug rather than keeping the original feature request open forever.
