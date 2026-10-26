# Homey compatibility and Zigbee driver metadata

Use `.homeycompose/app.json` for the minimum supported Homey version of the **current branch**. Branches using the Node.js 22 stack specify Homey `>=12.9.0` and `package.json` specifies Node `>=22`; historical release branches can have different requirements. See [Homey Node.js versions](https://apps.developer.homey.app/the-basics/app#nodejs).

## Local driver manifest contract

Hue drivers are bridge-free Zigbee drivers and should declare `platforms: ["local"]` and `connectivity: ["zigbee"]` on reusable light templates and standalone driver Compose manifests. Preserve these fields when adding or moving a driver. `test/issue-767-metadata.test.js` checks the generated manifest.

Generate `app.json` with Homey CLI before tests; keep the root file tracked as a bootstrap, but do not manually synchronize it. Preserve driver identities, capabilities, settings and existing Flows.

See [Homey Compose](https://apps.developer.homey.app/advanced/homey-compose), [device SDK](https://apps.developer.homey.app/the-basics/devices) and original [issue #767](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/767). For OTA-specific requirements see [firmware documentation](ota-firmware.md).
