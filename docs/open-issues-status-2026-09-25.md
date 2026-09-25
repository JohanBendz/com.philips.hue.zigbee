# Remaining open issues — status after 2.2.0 / issues-2026-next audit

Date: 2026-09-25

There are 25 real open issues. This classification is based on the frozen 2.2.0 candidate, the current `issues-2026-next` branch, the completed regression/audit work, and the latest issue discussions.

The purpose is to separate **remaining code work** from **physical verification**, **platform/network behavior**, and **separate feature tracks**.

## 1. Implementation/audit complete — physical Test is now the next useful action (17)

### Implemented in 2.2.0; keep open until physical verification

- #607 — Wall Switch Long Press
- #694 — Twilight LGT002
- #428 — Gradient Signe
- #376 — color/light_mode restoration
- #522 — additional Flow actions, including relative temperature and native Candle/Fireplace
- #688 — Mood transitions / default transition
- #347 — combined light-state Flow action
- #307 — default smooth transition
- #701 — RDM005 Smart Button V3
- #622 — Datura Small
- #639 — sensor availability restored from real incoming reports
- #582 — occupancy timeout / cooldown
- #616 — RWL022 press/hold Flow semantics without breaking action IDs

### Audited on issues-2026-next; no further runtime change justified before hardware evidence

- #645 — passive on/off + current-level synchronization is regression-covered; active bindings/reporting would change Zigbee network behavior and require a separate decision.
- #699 — explicit durations remain intact under rapid synthetic load; no command queue/debounce is justified without a physical failing sequence.
- #598 — verified current GU10 Zigbee IDs are already mapped and regression-tested; the exact failing lamp modelId/interview is still needed if Test pairing fails.
- #633 — RWL022 label/protocol path plus all 16 button/action combinations are regression-covered; no binding/manufacturer-setting change is justified without physical evidence.

These 17 issues are not active code backlog at present.

## 2. Controlled sensor investigations — experiment parked (2)

- #654 — old motion sensors stop temperature/luminance updates.
- #663 — outdoor sensor eventually freezes; mixed reporting/network symptom.

The earlier wake-based measurement-reporting refresh was deliberately removed from `issues-2026-next` because it adds configure-reporting traffic during a sleepy-device wake window.

Current action: reproduce physically on 2.2.0 first. Reintroduce the reporting experiment only as a separate controlled test if the evidence supports it.

## 3. Genuine Zigbee leave/rejoin / platform track (4)

- #579 — Hue Dimmer loses connectivity.
- #580 — Tap Dial battery + network loss.
- #615 — SML001 genuinely reported as leaving Zigbee network.
- #657 — SML003 battery + network drop.

The app-side parts have been hardened:

- unsafe startup/generic-online battery reads were reduced;
- invalid battery values are rejected where applicable;
- real incoming traffic can restore stale Homey availability.

No supported app-level Trust Center/insecure-rejoin control has been identified. No speculative repair/rejoin, keep-alive polling or network workaround should be added.

These remain open primarily as platform/network compatibility cases unless physical evidence identifies an app-level trigger.

## 4. Device identity ambiguity — physical modelId required (1)

### #597 — A60 E27 800 lm

The issue contains two identifiers that currently map to different Zigbee identities upstream:

- linked product number `8719514329843` maps to Zigbee model `LWF004`;
- stated commercial model `9290018216A` maps to Zigbee model `LWA024`.

2.2.0 already adds `LWA024`. Draft PR #751 separately adds `LWF004`.

Neither should be treated as proof of the reporter's actual Zigbee `modelId`. Keep #751 isolated and do not merge it solely to close #597. A physical pairing/interview is the deciding evidence.

## 5. Separate feature/workstream (1)

- #668 — Hue OTA without Bridge.

Homey's OTA mechanism is no longer the primary blocker. Firmware provenance/licensing/distribution remains a separate workstream and should not be mixed into the issue-fix branch.

## Net result

| Status | Count |
|---|---:|
| Implementation/audit complete; physical Test next | 17 |
| Controlled sensor investigation | 2 |
| Zigbee rejoin/platform track | 4 |
| Device identity ambiguity | 1 |
| Separate OTA workstream | 1 |
| **Total** | **25** |

### What is still a real app-code backlog?

At this point, **none of the 25 has a safe, evidence-backed runtime change that should simply be implemented next on `issues-2026-next`**.

The next productive work is therefore evidence gathering / physical Test. Further runtime work should start only when one of those tests produces a concrete reproducible gap.

This does not mean the issues are solved. It means adding more code now would be more speculative than evidence-driven.
