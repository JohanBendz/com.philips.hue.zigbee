This app supports setting up your Philips Hue lights to your Homey without having a Philips Hue bridge.

Release notes:

v1.4.7

Added support for:
- HUE 9W A60 E27 EUR White (thx Gemini123)
- Hue White Ambiance GU10 BT (thx Schnaaf)
- Hue smart plug (thx KrakenTyio)
- Hue Filament ST64 (thx bramoosterhuis)
- Hue Go BT (thx Schnaaf)
- Hue E27 W&C Ambiance BT (thx Schnaaf)
- Hue E27 White Ambiance BT (thx Schnaaf)
- Hue E14 White Candle BT
- Hue Outdoor Fuzo Wall Lantern

Changes:
- Added battery types for Energy (thx JohanBendz)
- Based on findings by mapulu we now run motion detection on SML001 with minimum 5 seconds reports to see if we can mitigate issues with motion sensors stop reporting data
- Added energy consumption to the devices that had any data defined on meethue.com

v1.4.6

Added support for:
- Hue White GU10 PF
- Hue Fair Pendant
- Hue White (LWF002)
- Hue Color Spot GU10
- Hue Filament G93 (thanks for contributing Gemeni123)
- Hue Filament A60 (thanks for contributing Gemeni123)
- Hue Living Colors Aura
- Hue Lucca Outdoor Post
- Hue Lucca Outdoor Garden Light
- Hue White Ambience Adore Bathroom Ceiling (thanks for contributing Gemeni123)
- Hue Spot GU10 with Bluetooth 
- Hue Impress Outdoor Pedestal Light
- Hue Impress Outdoor Wall Light
- Hue Adore Bathroom mirror light
- Hue Aurelle Square (thanks for contributing Gemeni123)
- Hue Ensis Pendant (thanks for contributing Gemeni123)

v1.4.5

Added support for:
- Hue Outdoor Sensor
- Hue Outdoor Welcome Floodlight 
- Hue Cher Ceiling
- Hue Still Ceiling
- Images of LTC001 and LTC002 had been switched.
- Fixed icons for HML004 and LTC012

New feature:
- Temperature Offset for Motion Sensor and Outdoor Sensor

v1.4.4

Added support for:
- Hue Phoenix Wall
- Hue Amaze Pendant
- Hue play bar (thanks to Simon Skog for the contribution)
- Hue Struana Ceiling
- Hue Lily Outdoor Spot
- Hue Outdoor Lightstrip
Fixes:
- Changed back all RGB bulbs to use ZigbeeLightDevice since alot of RGB bulbs get a sligthly greenish color when selecting warmest ambiance. Please inform me about RGB bulbs/strips not working so that we can try changing specific bulbs to ZigBeeXYLightDevice

Also big thanks to Johan Bendz for contributing to the app.

Motion Sensor seems to be fixed in v2.0.5-rc.2.

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
- Hue Connected Lamp GU10 (LCT003)
- Hue Living Colors Bloom (LLC011,LLC012)
- Hue Fair Ceiling Lamp (LTC002)
- Hue Still Ceiling (LTC003)

Untested:

- Hue White Bulb (LWB014,LWB004,LWB006,LWB007)
- Hue A19 Bulb (Color) (LCT001,LCT007,LCT010,LCT014,LCT016)
- Hue A19 White Ambiance (LTW001,LTW004,LTW010,LTW015)
- Hue color candle (LCT012)
- Hue LightStrips Plus (LST002)
- Hue LightStrips (LST001)
- Hue Ambiance Spot (LTW013,LTW014)
- Hue Phoenix Pendant (HML003)
- Hue Phoenix Wall (HML004)
- Hue Phoenix Table (HML005)
- Hue Beyond Table (HBL001)
- Hue Beyond Pendant (HBL002)
- Hue Beyond Ceiling (HBL003)
- Hue Being Ceiling Lamp (LTC001)
- Hue Sana Wall Light (LCW001)
- Hue Dimmer Switch (RWL020)
- Hue Aurelle Rectangle Panel Light (LTC015)
- Hue Outdoor Lightstrip (LST003 and LST004)
- Hue Lily Outdoor Spot (LCS001)
- Hue Struana Ceiling (LTC012)
- Hue Amaze Pendant (LTP002)
- Hue Fair Pendant (LTP003)
- Hue White GU10 PF (LWG001)
- Hue Outsoor Sensor (SML002)
- Hue Outdoor Welcome Floodlight (1743630P7)
- Hue Cher Ceiling (LTC011)
- Hue Color Spot GU10 (LCG002)
- Hue Filament G93 (LWO001)
- Hue Living Colors Aura (LLC014)
- Hue Lucca Outdoor Post (LWW002)
- Hue Lucca Outdoor Garden Light (LWW001)
- Hue Filament A60 (LWA004)
- Hue White Ambience Adore Bathroom Ceiling (LTC021)
- Hue Spot GU10 with Bluetooth (LWG004)
- Hue Impress Outdoor Pedestal Light (1743130P7)
- Hue Impress Outdoor Wall Light (1743030P7,1742930P7)
- Hue Adore Bathroom mirror light (LTW017)
- Hue Aurelle Square (LTC014)
- Hue Econic light (1743830P7)
- Hue Ensis Pendant (4090331P9)
- HUE 9W A60 E27 EUR White (LWA001)
- Hue White Ambiance GU10 BT (LTG002)
- Hue smart plug (LOM002)
- Hue Filament ST64 (LWV001)
- Hue Go Bluetooth (LCT026)
- Hue E27 W&C Ambiance BT (LCA001)
- Hue E27 White Ambiance BT (LTA001)
- Hue E14 White Candle BT (LWE002)
- Hue Outdoor Fuzo Wall Lantern (1744430P7)

Please report test-results to huezigbee@hibbisoft.se.

More bulbs will be added and please make requests if yo are missing a lamp.

Thanks for contributing:
https://github.com/tidemann
https://github.com/Sparc0
https://github.com/JohanBendz

How to transfer light from hue bridge to Homey by Jesper P:
Hue lights are also resettable with the round Hue remote (i.e. Living colors gen 2 Remote).
Delete the specific light in the official iOS Hue app. Then turn on the power of the specific light. Then press the on button and the one dot button on the remote simultaneously, while holding the remote near the light. The light will blink and has been reset. You can now add the light to Homey.

NOTE: If the bulbs have been used with a bridge, or bought as a package with bridge, prior to connecting them directly to Homey. You will need to reset the bulb with the Philips Hue bridge before being able to add them. You can also reset the bulb with a Philips Hue Remote (8718696743157).
