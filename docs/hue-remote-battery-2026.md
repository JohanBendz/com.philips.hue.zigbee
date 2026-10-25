# Hue remote battery simplification — issue #771

Scope: `develop-2.4`, not published 2.3 Test / 2.2.1 Live.

RDM001, RDM002 and RWL022 previously called both
`registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION)`
and a private raw-frame `_powerParser()`, causing duplicate Homey
capability writes from one 0x0021 attribute report. The pinned
`homey-zigbeedriver@2.2.18` system mapping already listens for
`attr.batteryPercentageRemaining`, converts the ZCL half-percent
representation (0..200) to Homey percent, and owns a capability write.
The app now supplies one strict `reportParser` override for finite
integer values 0..200, retaining the prior rejection of 255/unknown
and negative/fractional/out-of-range values.

The app's only additional report listener is observational: it uses the
pinned `zigbee-clusters` `attr.batteryPercentageRemaining` event to
refresh last-seen for RDM001, or the original availability+last-seen
recovery for RDM002 and RWL022. Unlike the old raw parser it does not
treat ZCL read responses as independent unsolicited reports, and never
calls `setCapabilityValue`. Unregister this listener on device uninit.

Wake-up reads remain intentionally present, once per announce or during
the existing RWL022 first-reporting setup, but use the SDK's
`getClusterCapabilityValue('measure_battery', CLUSTER.POWER_CONFIGURATION)`
so those responses pass through the **same** parser and capability
update rather than private duplicated arithmetic. On RDM001 an actual
incoming announce itself still counts towards last-seen, regardless of
the subsequent explicit read. RDM002/RWL022 announce recovery remains
unchanged.

No changes to RWL000 (endpoint 2 and alarm threshold=20), ROM001,
remote button 0xFC00 decoding/Flow IDs, first-init/announce reporting
configuration or reporting intervals. The tests exercise all boundary
values (0, 100, 200, 255, invalid), SDK mapping, exactly one
capability update per genuine report, source separation between report
and wake read, existing availability and RWL022 reporting setup.

Physical checks on RDM001, RDM002 and RWL022 should accompany the
future 2.4 Homey Test. No extra reads/polling or report requests added.
