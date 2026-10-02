# Homey runtime / driver metadata audit — issue #767

## Runtime facts

Homey's official SDK documentation states that **Homey firmware v12.9.0** is the first release using **Node.js 22 across the listed Homey platforms**. Earlier versions use Node.js 12, 16 or 18 depending on platform. The app's pinned `homey-zigbeedriver` / `zigbee-clusters` generation and `package.json` specify Node >=22.

Source: https://apps.developer.homey.app/the-basics/app#nodejs

**2.4.0 compatibility decision (2026-10-02):** Change the development manifest to `>=12.9.0`, replacing the historical SDK-v3 floor `>=5.0.0`. This aligns the advertised Homey firmware floor with the existing Node >=22 dependency contract. It does not change runtime Zigbee behavior.

**Athom installed-base input:** Athom told the maintainer: “we could say it safe to assume 94% of your users are on 13.5.0 or higher.” This is an estimate, not an exact per-firmware histogram. Those approximately 94% already meet the proposed 12.9.0 requirement. The remaining approximately 6% are below *13.5.0*, not necessarily below *12.9.0*: the portion potentially excluded by this new minimum is therefore at most approximately 6% on the stated estimate, with the actual share unknown. We deliberately do **not** raise the minimum to 13.5.0.

This change is limited to the `develop-2.4` line; the published 2.3.0 Test, 2.2.1 Live and preserved 2.1.2 rollback branches are unchanged. Monitor compatibility/publishing feedback before promoting 2.4.0.

## Driver metadata

All Hue Zigbee drivers are local, bridge-free implementations. Define `platforms: ["local"]` and `connectivity: ["zigbee"]` on the five reusable light templates and explicitly on standalone Compose driver manifests. Explicitly configured drivers must retain these values. The generated manifest (created by the Homey CLI) is asserted by `test/issue-767-metadata.test.js`.

Relevant SDK documentation:
- https://apps.developer.homey.app/advanced/homey-compose
- https://apps.developer.homey.app/the-basics/devices
- https://apps.developer.homey.app/guides/homey-cloud

## Regression boundaries

The compatibility PR changes only `.homeycompose/app.json`, the regression test and this audit note. Do not edit generated root `app.json`, device runtime code, capability IDs, Flow definitions, or the published 2.3.0 Test branch. The earlier driver metadata PR #789 remains unchanged.
