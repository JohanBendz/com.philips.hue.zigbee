# Homey runtime / driver metadata audit — issue #767

## Runtime facts

Homey's official SDK documentation states that **Homey firmware v12.9.0** is the first release using **Node.js 22 across the listed Homey platforms**. Earlier versions use Node.js 12, 16 or 18 depending on platform. The app's pinned `homey-zigbeedriver` / `zigbee-clusters` generation and `package.json` specify Node >=22.

Source: https://apps.developer.homey.app/the-basics/app#nodejs

**Proposed minimum compatibility:** `>=12.9.0`, replacing the historical SDK-v3 floor `>=5.0.0`. This is a runtime contract, not a functionality change.

**Release decision pending:** Do not raise the Homey App Store compatibility value until the maintainer has reviewed the distribution of active installs by **Homey firmware** (and, where possible, hardware generation) and decided how older installations should be handled. An app-version install histogram is not a substitute for a firmware-version distribution. No reliable fleet statistics were available during this audit.

## Driver metadata

All Hue Zigbee drivers are local, bridge-free implementations. Define `platforms: ["local"]` and `connectivity: ["zigbee"]` on the five reusable light templates and explicitly on standalone Compose driver manifests. Explicitly configured drivers must retain these values. The generated manifest (created by the Homey CLI) is asserted by `test/issue-767-metadata.test.js`.

Relevant SDK documentation:
- https://apps.developer.homey.app/advanced/homey-compose
- https://apps.developer.homey.app/the-basics/devices
- https://apps.developer.homey.app/guides/homey-cloud

## Regression boundaries

Only Compose metadata and tests may change in this first pass. Do not edit generated root `app.json`, any device runtime code, capability IDs, Flow definitions or the published 2.3.0 Test branch.
