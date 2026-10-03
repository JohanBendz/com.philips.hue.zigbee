# Power-on Behaviour standard-attribute audit — issue #768

Scope: future 2.4 development only. The published 2.3.0 Test / 2.2.1 Live
settings and runtime code are **unchanged** by this first contract pass.

The pinned `zigbee-clusters@3.8.0` exposes these standard ZCL attributes
(the contract test checks the actual installed dependency in CI):

| Existing Homey setting | Legacy Hue attribute | Standard ZCL attribute | Wire attribute ID |
| --- | --- | --- | --- |
| `powerOnCtrl_state` | OnOff `powerOnCtrl` | `startUpOnOff` | 0x4003 |
| `powerOnCtrl_dimvalue` | LevelControl `powerOnCtrl` | `startUpCurrentLevel` | 0x4000 |
| `powerOnCtrl_colorvalue` | ColorControl `powerOnCtrl` | `startUpColorTemperatureMireds` | 0x4010 |

**Nontrivial enum difference:** existing saved radio choices are `on`,
`off`, and `recover`. Standard `startUpOnOff` uses `previous`
instead of `recover` for the wire value 255 / 0xFF. The pure mapper
`toStandardStartupState` performs this translation without changing any
Homey setting ID or stored value. Do not simply rename the ZCL attribute
and send `recover` into the upstream enum.

Keep brightness value `255` unchanged. The standard color-temperature
startup attribute supports `0xFFFF` to restore the previous temperature,
but the shipped UI currently defaults to 366 mired and stores numeric values.
Preserve existing physical-range clamping, never infer a new UI or migrate
settings while doing the protocol cleanup.

The existing `HueSpecificColorControlCluster` also adds a separate
`colorLoop` command (0x44); that functionality must not be dropped by
removing the redundant startup attribute. Investigate its compatibility with
upstream `colorLoopSet` independently if the custom class is to be removed.

The current `Light.onSettings()` writes several settings together when any
power-on field is modified. Its read-before-write/error behavior and device
support detection need targeted regression coverage before changing runtime
code, especially on existing installed bulbs and plugs.

## Next gate

Implement the startup-attribute migration in a **separate, narrowly scoped
draft PR** with tests for Off, On and Recover, numeric startup brightness,
temperature clamping and unsupported clusters. Use a Homey Test build to
physically verify a White bulb, White Ambiance bulb, Color Ambiance bulb and
Hue Smart Plug before considering the change release-verified. No migration
of stored Homey setting IDs and no expansion of reporting or polling.
