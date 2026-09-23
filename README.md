# Philips Hue, without the bridge

Control Philips Hue lights and accessories **directly from Homey over Zigbee**, without a Philips Hue Bridge.

This community-maintained Homey app supports a broad range of Hue lights, lamps, lightstrips, plugs, motion/contact sensors, dimmer switches, Smart Buttons, Wall Switch modules and other Zigbee accessories.

## What this app does

- Pairs supported Philips Hue / Signify Zigbee devices directly with Homey.
- Provides native Homey capabilities for lighting, sensors, switches and remotes.
- Supports Homey Flows for device-specific actions and events.
- Supports common Hue features such as dimming, color, color temperature, power-on behaviour and selected native Hue effects where the device protocol is known.
- Uses Homey's local Zigbee network; a Hue Bridge is not required.

## Important limitations

This is a **direct Zigbee integration**, not a replacement implementation of the Hue Bridge.

Some Hue products expose functionality outside standard Zigbee. Features such as Hue Secure video/audio, cloud services and other Bridge-specific services are therefore outside this app's scope unless the device also exposes useful local Zigbee functionality.

Support is based on the device's actual Zigbee identity and clusters, not only its retail product name. Different generations of visually identical Hue products can use different Zigbee model IDs.

## Device support

The app contains a large number of device drivers and product IDs covering, among other things:

- White, White Ambiance and White & Color Ambiance bulbs and fixtures
- GU10, E14, E27 and filament lamps
- Lightstrips and selected gradient products
- Indoor and outdoor motion / occupancy sensors
- Hue Contact Sensor
- Hue Dimmer Switch, Smart Button, Tap Dial and Wall Switch Module
- Hue Smart Plug
- Multi-zone fixtures such as Ensis and Twilight

The driver manifests under `drivers/` are the authoritative source for exact Zigbee product IDs.

If your Hue device pairs as **Generic Zigbee Device**, please open an issue and include the Homey Zigbee interview from Homey Developer Tools. At minimum, include:

- `modelId`
- `manufacturerName`
- endpoint IDs
- input/output clusters

Do not rely only on the retail model number printed on the box.

## Reporting bugs

Please use GitHub Issues and include:

1. Homey model and firmware version.
2. App version.
3. Exact Hue product / Zigbee `modelId`.
4. What you expected to happen.
5. What actually happened.
6. Relevant Homey logs or Zigbee interview where applicable.
7. Whether the device previously worked, and if so, when the behaviour changed.

Network dropouts and rejoin problems should be reported separately from battery, Flow-card or capability-value problems; they can have different causes.

## Development

The app uses Homey SDK 3, Homey Compose and the current Homey Zigbee driver stack used by this repository.

Requirements:

- Node.js 22 or newer
- Homey CLI for local run/validation

Common commands:

```bash
npm ci
npm test
npm run validate
npm run run
```

Pull requests are automatically checked with Homey publish validation, the regression test suite and `git diff --check`.

### Generated manifest

**Do not edit or commit root `app.json`.**

The source manifest lives in `.homeycompose/` and the driver compose files. Homey generates `app.json` during preprocessing/validation.

## Release history

See [CHANGELOG.md](CHANGELOG.md).

## License and credits

Released under the [MIT License](LICENSE).

Sebastian Johansson is the original author of the app. The project was transferred to Johan Bendz in 2020 and is currently maintained by Johan Bendz.

Philips Hue and Signify are trademarks of their respective owners. This community project is not an official Signify application.
