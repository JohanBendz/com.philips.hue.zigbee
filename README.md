# Philips Hue ZigBee on Homey

Philips Hue support without Bridge for Homey

## Release notes:

### v.2.0.32 (SDK3)
Minor improvements and added some additional device ID's

### v.2.0.31 (SDK3)
Added support for:
- Dimmer Switch (Gen 3)
- Adore Bathroom Recessed Downlights

Added flowcard for alerts (lights)

### v.2.0.30 (SDK3)
Added a secondary version of Outdoor Sensor - Outdoor Occupancy Sensor, for test/evaluation

### v.2.0.29 (SDK3)
Added support for:
- Aurelle Panel Round
- Centris Panel
- Centris Spot

Added a secondary version of Motion Sensor - Occupancy Sensor, for test/evaluation

Added some device Id's to already supported devices
Optimized images to shrink the size of the app.

### v.2.0.27 (SDK3)
Fix:
- Smart Button, replaced faulty flow cards with correct (and more) cards.

### v.2.0.26 (SDK3)
Added support for:
- Milliskin GU10 Recessed Spotlight White Ambiance
- Filament ST72 E27

Added some device Id's to already supported devices

### v.2.0.24 (SDK3)
Added flowcard for Blink (lights)

### v.2.0.23 (SDK3)
Added support for:
- Buckram Spotlights

Added some device Id's to already supported devices

### v.2.0.22 (SDK3)
Added support for:
- Bulb E14 Candle White and Color BT
- Bulb E14 P45 White
- Phoenix Downlight

Added functionality:
- Motion Sensor now has a setting for time between triggered and reset alarm

### v.2.0.21 (SDK3)
Only in Test version on Github, new feature:
- Hue Motion Sensors with an up to date firmware is added as an Occupancy Sensor instead of an Motion Sensor 

### v2.0.20 (SDK3)
Reverted last update, issues with some bulbs needs to be fixed.

### v2.0.19 (SDK3)
Added Power On/Off/Recover behaviour after power loss to lights

### v2.0.14 (SDK3)
Added a few product ID's to already supported devices
Added manufacturerName Signify Netherlands B.V. to all drivers

### v2.0.13 (SDK3)
Added support for:
- Calla Outdoor Tall Path Light
- Appear Outdoor Wall Light (Upper and Lower)

### v2.0.12 (SDK3)
Added support for:
- E14 Candle White Ambience (BT)
- Filament G125
- Additional product ID's for Lucca Pedestal and Lucca Post

### v2.0.11 (SDK3)
Added support for:
- Smart Button

### v2.0.10 (SDK3)
Added support for:
- Additional product ID for the Play Lightbar

### v2.0.9 (SDK3)
Added support for:
- Added product ID's to some already added devices but in different colors

### v2.0.8 (SDK3)
Fix:
- Zigbee driver and cluster update forced

### v2.0.7 (SDK3)
Added support for:
- Lily Outdoor XL Spotlight
- Additional Product ID's for Ensis Pendant (upper and lower light)
- Runner Single Spotlight
- Additional Product ID for Adore Bathroom Mirror

### v2.0.6 (SDK3)
Added support for:
- Econic Hanging Wall light (thx Caseda)

### v2.0.5 (SDK3)
Added support for:
- Fugato Triple Spotlight (thx Caseda)

Fix:
- Removed jpg/replaced with png

### v2.0.4 (SDK3)
Added support for:
- New version of Being Ceiling Lamp
- Resonate Outdoor Wall Light

Fix:
- On/Off was not correcty set on dim to/from 0

### v2.0.3 (SDK3)
Added support for:
- Hue Garnea Downlight
- Bulb 1600 Lumen White

Verbose Zigbee logging enabled for better troubleshooting crash logs. 

### v2.0.2 (SDK3)
Fix:
- Luminance for Motion and Outdoor Sensors was not correctly calculated

### v2.0.1 (SDK3)
Changes:
- SDK3 rewrite
- Implemented new Homey Zigbee Driver
- Implemented the use of Compose
- Hue Switch Button now show battery information
- Some changes in settings for MotionSensors

Added support for:
- Hue Lightstrip Plus V4 (thx zepign)
- Hue Lightstrip Outdoor 2 meter
- Hue Lightstrip Outdoor 5 meter
- Hue Being Pendant
- Nyro Outdoor Pedestal
- Nyro Outdoor Wall Light
- Hue Econic Wall Light
- Hue Aurelle Rectangular

### v1.6.3 (SDK2)
Change:
Implemented Composer

Added support for:
- Econic Wall light
- Nyro Outdoor Pedestal
- Nyro Outdoor Wall Light
- Lily Outdoor XL Spotlight
- Resonate Outdoor Wall Light
- Aurelle Panel Rectangular
- Fugato Triple Spotlight
- Lightstrip Plus V4
- Lightstrip Outdoor 2 meter
- Lightstrip Outdoor 5 meter
- Garnea Downlight
- Being Pendant
- Bulb 1600 Lumen White
- Filament G125 E27

### v1.6.2 (SDK2)
Added:
- New product ID's for a number of devices that was already supported by the app
- New manufacturerName, Signify Netherlands B.V.

### v1.6.1 (SDK2)
Fix:
- LCT000 issue
- SML001 and SML002 typo in settings update

Prepping for SDK3. Upgrading Test version to Stable version.

### v1.5.10 (SDK2)

Added support for:
- Silver frame version of Daylo Outdoor Wall Light

### v1.5.9 (SDK2)

Fix:
- kill some bugs

### v1.5.8 (SDK2)
Fix:
- It looks like there is multiple versions of the Fuzo Wall Light, added additional Device ID and Profile ID

### v1.5.7 (SDK2)

Added support for:
- Australian version of the Hue Smart Plug - LOM005

Fixes:
- Fuzo lights was set as Color by misstake, now White

### v1.5.6 (SDK2)

Fixes:
- Ensis upper and lower was switched

### v1.5.5 (SDK2)

Fixes:
- Corrected the device driver info for Hue Econic

### v1.5.4 (SDK2)

Added support for:
- Hue Ensis Pendant, Upper and Lower light version

### v1.5.3 (SDK2)

Added support for:
- Hue Fuzo Outdoor Wall Light (open front version)

### v1.5.2 (SDK2)

Added support for:
- Hue Daylo Outdoor Wall Light
- Hue Flourish Ceiling Light
- Hue Centura GU10 Recessed Spotlight
- Hue Impress Path Light
- Hue Fugato Double Spotlight
- Hue Calla Outdoor Path Light
- Hue Fuzo Outdoor Wall Light (splitt front version)
- Hue Impress Outdoor Wall Light

Fixes:
- Added error handling where code was missing it (to be compliant with updated Homey sdk)

### v1.5.1 (SDK2)

Added support for:
- Hue Signe Floor Light

New features:
- Duration functionality added to units that support hue, saturation and temperature

Changes:
- Hue Motion Sensor, fine tuning of reporting will hopefully make the device work better
- Hue Outdoor Sensor, fine tuning of reporting will hopefully make the device work better

Fixes:
- N/A

### v1.5.0 (SDK2)
The Philips Hue Zigbee app and project has been transferred from Sebastian Johansson to Johan Bendz

Added support for:
- Hue Outdoor Discover Floodlight
- Hue Flourish Pendant

New features:
- Dim duration functionality added to units with Dim capability

Changes:
- Added Product ID LOM001 to Hue Smart Plug

Fixes:
- N/A

### v1.4.9

Added support for:
- Hue Bulb 9W A60 E27 EUR White (thx Gemini123)
- Hue White Ambiance GU10 BT (thx Schnaaf)
- Hue smart plug (thx KrakenTyio)
- Hue Filament ST64 (thx bramoosterhuis)
- Hue Go BT (thx Schnaaf)
- Hue Bulb E27 W&C Ambiance BT (thx Schnaaf)
- Hue Bulb E27 White Ambiance BT (thx Schnaaf)
- Hue Bulb E14 White Candle BT
- Hue Outdoor Fuzo Wall Lantern
- Hue Fluorish Ceiling Light

New features:
- Added battery types for Energy (thx JohanBendz)
- Added energy consumption to the devices that had any data defined on meethue.com

Changes:
- Based on findings by mapulu we now run motion detection on SML001 with minimum 5 seconds reports to see if we can mitigate issues with motion sensors stop reporting data

### v1.4.6

Added support for:
- Hue White GU10 PF
- Hue Fair Pendant
- Hue White (LWF002)
- Hue Color Spot GU10
- Hue Filament G93 (thanks for contributing Gemeni123)
- Hue Filament A60 (thanks for contributing Gemeni123)
- Hue Living Colors Aura
- Hue Lucca Outdoor Post
- Hue Lucca Outdoor Pedestal
- Hue White Ambience Adore Bathroom Ceiling (thanks for contributing Gemeni123)
- Hue Spot GU10 with Bluetooth 
- Hue Impress Outdoor Pedestal Light
- Hue Impress Outdoor Wall Light
- Hue Adore Bathroom mirror light
- Hue Aurelle Square (thanks for contributing Gemeni123)
- Hue Ensis Pendant (thanks for contributing Gemeni123)

### v1.4.5

Added support for:
- Hue Outdoor Sensor
- Hue Outdoor Welcome Floodlight 
- Hue Cher Ceiling
- Hue Still Ceiling
- Images of LTC001 and LTC002 had been switched.
- Fixed icons for HML004 and LTC012

New features:
- Temperature Offset for Motion Sensor and Outdoor Sensor

### v1.4.4

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

### v1.4.3

Changes:
- Added references to installed packages
- Force added dependencies to repository

Fixes:
- Fixed bug regarding LST001, thanks Andreas Pardeike

### v1.4.0

Changes:
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

### v1.3.0: - Release notes :)

Added support for:
- Hue Dimmer Switch
- Hue Motion Sensor
- Hue Phoenix Pendant
- Hue Phoenix Table
- Hue Go


# Currently Supported bulbs/devices:

- Hue Bulb Candle Ambiance (LTW012)
- Hue Bulb White (LWB010)
- HUE Bulb 9W A60 E27 EUR White (LWA001)
- Hue Bulb A19 White (LWB014,LWB004,LWB006,LWB007)
- Hue Bulb A19 White Ambiance (LTW001,LTW004,LTW010,LTW015)
- Hue Bulb A19 Color (LCT001,LCT007,LCT010,LCT014,LCT015,LCT016)
- Hue Bulb E12 Candle Color (LCT012)
- Hue Bulb E14 Candle White BT (LWE002)
- Hue Bulb E14 Candle White and Color BT (LCE002)
- Hue Dimmer Switch (RWL021)
- Hue Motion Sensor (SML001)
- Hue Living Colors Iris (LLC010)
- Hue Go (LLC020)
- Hue Runner (x3 Hue Spot GU10)
- Hue Connected Lamp GU10 (LCT003)
- Hue Living Colors Bloom (LLC011,LLC012)
- Hue Fair Ceiling Lamp (LTC002)
- Hue Still Ceiling (LTC003)
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
- Hue Filament A60 (LWA004)
- Hue Filament G93 (LWO001)
- Hue Living Colors Aura (LLC014)
- Hue Lucca Outdoor Post (LWW002, LWF002)
- Hue Lucca Outdoor Pedestal (LWW001, LWF001)
- Hue White Ambience Adore Bathroom Ceiling (LTC021)
- Hue Spot GU10 with Bluetooth (LWG004)
- Hue Impress Outdoor Pedestal Light (1743130P7)
- Hue Impress Outdoor Wall Light (1743030P7,1742930P7)
- Hue Adore Bathroom mirror light (LTW017)
- Hue Aurelle Square (LTC014)
- Hue Econic light (1743830P7)
- Hue Ensis Pendant (4090331P9)
- Hue White Ambiance GU10 BT (LTG002)
- Hue smart plug (LOM002)
- Hue Filament ST64 (LWV001)
- Hue Go Bluetooth (LCT026)
- Hue E27 W&C Ambiance BT (LCA001)
- Hue E27 White Ambiance BT (LTA001)
- Hue Outdoor Fuzo Wall Lantern (1744430P7)
- Hue Fluorish Ceiling Light (4090531P9)
- Milliskin GU10 Recessed Spotlight White Ambiance
- Filament ST72 E27

(List may not be complete, more than 100 devices already supported and counting..)

---

Sebastian Johansson is the orginal author of this app, in april 2020 the app was transferred to Johan Bendz who is now the developer of the app. 

Credit to Richard Slater for his icons that where used when creating this app (https://thenounproject.com/richard.slater)
