This app supports setting up your Philips Hue lights to your Homey without having a Philips Hue bridge.

Release notes:
v1.4.4

- Added support for Hue play bar (thanks to Simon Skog for the contribution)

v1.4.3

- Added references to installed packages
- Force added dependencies to repository
- Fixed bug regarding LST001, thanks Andreas Pardeike

v1.4.0

- Changed color light to use XY ZigBee light device

Added support for:

- Hue Beyond Table
- Hue Beyond Pendant
- Hue Beyond Ceiling
- Hue Fair Ceiling Lamp
- Hue Being Ceiling Lamp
- Hue Sana Wall Light
- Hue Dimmer Switch (RWL020 US version)
- Hue Aurelle Rectangle Panel Light

v 1.3.0: - Release notes :) - Added support for:

- Hue Dimmer Switch
- Hue Motion Sensor
- Hue Phoenix Pendant
- Hue Phoenix Table
- Hue Go

Currently Supported bulbs/devices:

Tested:

- Hue Ambiance Candle (LTW012)
- Hue White Bulb (LWB010)
- Hue A19 Bulb (Color) (LCT001, LCT015)
- Hue Dimmer Switch (RWL021)
- Hue Motion Sensor
- Hue Living Colors Iris (LLC010)
- Hue Go (LLC020)
- Hue Runner (x3 Hue Spot GU10)
- Hue Spot GU10 (LCT003)
- Hue Living Colors Bloom (LLC011,LLC012)

Untested:

- Hue White Bulb (LWB014,LWB004,LWB006,LWB007)
- Hue A19 Bulb (Color) (LCT001,LCT007,LCT010,LCT014,LCT016)
- Hue A19 White Ambiance (LTW001,LTW004,LTW010,LTW015)
- Hue color candle (LCT012)
- Hue LightStrips Plus (LST002)
- Hue LightStrips (LST001)
- Hue Ambiance Spot (LTW013,LTW014)
- Hue Phoenix Pendant (HML003)
- Hue Phoenix Table (HML005)
- Hue Beyond Table (HBL001)
- Hue Beyond Pendant (HBL002)
- Hue Beyond Ceiling (HBL003)
- Hue Fair Ceiling Lamp (LTC002)
- Hue Being Ceiling Lamp (LTC001)
- Hue Sana Wall Light (LCW001)
- Hue Dimmer Switch (RWL020)
- Hue Aurelle Rectangle Panel Light (LTC015)

Please report test-results to huezigbee@hibbisoft.se.

More bulbs will be added and please make requests if yo are missing a lamp.

Thanks for contributing:
https://github.com/tidemann
https://github.com/Sparc0

How to transfer light from hue bridge to Homey by Jesper P:
Hue lights are also resettable with the round Hue remote (i.e. Living colors gen 2 Remote).
Delete the specific light in the official iOS Hue app. Then turn on the power of the specific light. Then press the on button and the one dot button on the remote simultaneously, while holding the remote near the light. The light will blink and has been reset. You can now add the light to Homey.

NOTE: If the bulbs have been used with a bridge, or bought as a package with bridge, prior to connecting them directly to Homey. You will need to reset the bulb with the Philips Hue bridge before being able to add them. You can also reset the bulb with a Philips Hue Remote (8718696743157).
