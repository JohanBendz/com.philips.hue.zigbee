# OTA model evidence register

Reviewed **2026-10-03** for `ota-2026`, based on `develop-2.4`.

All **67 enabled product IDs** now have an explicit expected-family check in [the fixed model register](../test/fixtures/hue-ota-models.json). The register is reviewed against external model/platform records; it is not generated or refreshed by the catalogue-audit command. Firmware files, OTA declarations and model coverage are unchanged by this work.

**64 models** have an explicit entry in a maintained model table, an API fixture/capture, an OTA request or an owner hardware report. **LTO001, LTW015 and LWA029** currently rely only on Bifrost's curated device database. Its author describes it as a best-effort collection and does not link each original device capture. Their existing mappings are retained and guarded, with independent device evidence still open. A test fixture is evidence of the published model/platform record, not proof of a successful physical update.

## What the checks enforce

- Every OTA product ID must be in the reviewed register; an alias cannot inherit firmware from a shared driver.
- Every declared manufacturer and image family must be approved for that exact product ID.
- Every approved family needs a cited source with a matching model/platform observation. A source URL alone does not satisfy the check.
- The declared product/family sets must exactly match the register, detecting accidental removal as well as unreviewed additions.
- Multiple families are possible only through explicit reviewed entries. Each firmware update entry still has to preserve its own complete catalogue chain.
- Existing binary, checksum, manufacturer/product identity, chain-limit, orphan-file and withheld-model checks remain in place.

Mutation checks cover an unreviewed alias, a valid image from the wrong family, a changed manufacturer, missing/unrelated evidence, an unsupported allowlist addition, a removed model and an unapproved extra family. A synthetic registry change tests the explicit-variant policy without enabling that variant in the app.

The source observations retain only model/platform facts. Device names, addresses, IDs and other household data from the public samples are not copied.

## Approved families and evidence

All families below use manufacturer **0x100B**. Links point to the reviewed sources; repository files are commit-pinned.

| Product ID | Approved image type | Evidence | Follow-up |
| --- | --- | --- | --- |
| `1741530P7` | `0x011F` | [aiohue] | — |
| `1743430P7` | `0x011F` | [aiohue] | — |
| `1746330P7` | `0x011F` | [indigo] | — |
| `1746430P7` | `0x011F` | [aiohue] | — |
| `3216231P6` | `0x011D` | [mqtt2hue] | — |
| `4080248P9` | `0x011D` | [aiohue] | — |
| `440400982842` | `0x011F` | [hueex], [mqtt2hue] | — |
| `LCA001` | `0x0112` | [deconz-wiki] | — |
| `LCA004` | `0x0114` | [vault] | — |
| `LCA005` | `0x0114` | [morpheus] | — |
| `LCE002` | `0x0114` | [hue4j] | — |
| `LCF003` | `0x010E` | [deconz-wiki] | — |
| `LCG002` | `0x0114` | [deconz-wiki] | — |
| `LCL001` | `0x011F` | [aiohue], [zigbee-ota-400] | Variant evidence below |
| `LCT003` | `0x0104` | [hueex] | — |
| `LCT007` | `0x0104` | [deconz-wiki], [hueex], [openhab] | — |
| `LCT010` | `0x010C` | [deconz-wiki], [gohue] | — |
| `LCT012` | `0x010C` | [deconz-wiki] | — |
| `LCT014` | `0x010C` | [morpheus] | — |
| `LCT015` | `0x010C` | [deconz-wiki], [hue4j], [hueex], [hues] | — |
| `LCT016` | `0x010C` | [morpheus] | — |
| `LCT024` | `0x010E` | [deconz-wiki] | — |
| `LLC010` | `0x0108` | [deconz-wiki] | Variant evidence below |
| `LLC011` | `0x0103` | [aiohue] | — |
| `LLC012` | `0x0103` | [hueex] | — |
| `LLC020` | `0x0108` | [deconz-wiki] | — |
| `LOM001` | `0x0115` | [zigbee-ota-2] | — |
| `LOM006` | `0x011A` | [deconz-wiki] | — |
| `LOM007` | `0x011A` | [hueex] | — |
| `LST001` | `0x0103` | [hueex] | — |
| `LTA001` | `0x0112` | [openhab] | — |
| `LTA009` | `0x0114` | [aiohue] | — |
| `LTA015` | `0x0129` | [johan-673] | — |
| `LTC001` | `0x010E` | [deconz-wiki] | — |
| `LTC011` | `0x010E` | [deconz-wiki] | — |
| `LTE002` | `0x0114` | [deconz-wiki] | — |
| `LTG002` | `0x0114` | [aiohue] | — |
| `LTO001` | `0x0114` | [bifrost] | Independent device capture needed |
| `LTO002` | `0x0114` | [aiohue], [hues] | — |
| `LTP002` | `0x010E` | [deconz-wiki] | — |
| `LTW001` | `0x0104` | [deconz-wiki], [openhab] | — |
| `LTW010` | `0x010C` | [deconz-wiki], [mqtt2hue] | — |
| `LTW012` | `0x010C` | [deconz-wiki], [gohue] | — |
| `LTW013` | `0x010C` | [deconz-wiki], [openhab] | — |
| `LTW015` | `0x010C` | [bifrost] | Independent device capture needed |
| `LWA001` | `0x0112` | [deconz-wiki], [gohue] | — |
| `LWA004` | `0x0112` | [mqtt2hue] | — |
| `LWA011` | `0x0114` | [gohue] | — |
| `LWA017` | `0x0114` | [vault] | — |
| `LWA029` | `0x0114` | [bifrost] | Independent device capture needed |
| `LWB006` | `0x0105` | [deconz-wiki], [gohue] | — |
| `LWB010` | `0x010C` | [deconz-wiki], [openhab] | — |
| `LWB014` | `0x010C` | [morpheus] | — |
| `LWE002` | `0x0112` | [jeedom-110703] | — |
| `LWO001` | `0x0112` | [jeedom-110703] | — |
| `LWU001` | `0x0114` | [hues] | — |
| `RDM001` | `0x011C` | [aiohue], [enconnect], [openhab] | — |
| `RDM002` | `0x0121` | [aiohue], [enconnect] | — |
| `RDM004` | `0x0122` | [hues] | — |
| `ROM001` | `0x0116` | [openhab], [vault] | — |
| `RWL020` | `0x0109` | [deconz-wiki], [morpheus] | — |
| `RWL021` | `0x0109` | [deconz-wiki], [hues], [mqtt2hue], [openhab] | — |
| `RWL022` | `0x0119` | [aiohue], [mqtt2hue] | — |
| `SML001` | `0x010D` | [aiohue], [deconz-wiki], [gohue], [mqtt2hue] | — |
| `SML002` | `0x010D` | [enconnect] | — |
| `SML003` | `0x011B` | [aiohue] | — |
| `SML004` | `0x011B` | [z2m-14923] | — |

## Variant observations still under review

- **LLC010:** the deCONZ table supports the enabled `0x0108` family. The Hue-ex fixture also labels one LLC010 as `100b-103`. That could reflect a variant or a fixture error; it is not sufficient to approve `0x0103` for LLC010. Both observations are recorded, but only `0x0108` is approved.
- **LCL001:** the enabled `0x011F` family has an explicit Zigbee OTA request and an API fixture. The deCONZ table also lists `0x0117`; the extra family remains under review.
- **LCT026, LST002 and 3261031P6:** remain withheld pending the previously documented variant reconciliation. The new policy does not activate them.
- **SOC001 and the two Ensis zone IDs:** retain their existing evidence/wake-procedure follow-ups and remain withheld.

## Maintenance

For an intentional mapping change, review the exact product ID and hardware/image family, add or amend its source observation, then update the approved model entry and driver firmware declaration together. Re-run `node --test test/firmware.test.js`, generate the Homey manifest, run publish validation and the full suite. Do not obtain expected families by copying the updated driver declaration.

Collect direct device observations for the three database-only models alongside controlled Test/local runs. Prefer an OTA query containing manufacturerCode/imageType or a Hue V2 product_data record containing model_id/hardware_platform_type. Physical transfer/rejoin results belong in [the hardware test plan](ota-test-plan.md).

## Sources

- **deconz-wiki** — `maintained-mapping`. Explicit model/image-type rows in the Philips Hue section; manufacturer code 0x100B. Reviewed file SHA-256: `a5713376c96f76a1d9dd7dfafd4cce82ff34c253341d3e8f0190ef2810b37c90`.
- **hue4j** — `hue-v2-fixture`
- **morpheus** — `hue-v2-fixture`
- **indigo** — `hue-v2-capture`
- **aiohue** — `hue-v2-fixture`
- **mqtt2hue** — `hue-v2-capture`
- **hues** — `hue-v2-fixture`
- **vault** — `hue-v2-fixture`
- **hueex** — `hue-v2-fixture`
- **openhab** — `hue-v2-fixture`
- **gohue** — `hue-v2-fixture`
- **enconnect** — `hue-v2-fixture`
- **johan-673** — `device-report`. Owner reports exact model LTA015 and hardware platform 100b-129.
- **zigbee-ota-2** — `device-report`. Owner identifies LOM001 requesting image type 277 (0x0115); confirmed as a separate image type by the maintainer.
- **z2m-14923** — `ota-request`. SML004 queryNextImageRequest explicitly reports manufacturerCode 4107 and imageType 283.
- **zigbee-ota-400** — `ota-request`. LCL001 queryNextImageRequest explicitly reports manufacturerCode 4107 and imageType 287.
- **jeedom-110703** — `hue-v2-capture`. First post contains Hue V2 product_data for LWE002 and LWO001, both on platform 100b-112.
- **bifrost** — `curated-device-database`. Author describes a best-effort database collected from community samples and public examples. Per-model original captures are not linked. Used only for the three existing mappings whose primary evidence remains open.

[deconz-wiki]: https://github.com/dresden-elektronik/deconz-rest-plugin/wiki/OTA-Image-Types---Firmware-versions
[hue4j]: https://github.com/JimmyyyW/hue4j/blob/c2daccd8db1087de7b144e646692fd38b17e28ff/lib/src/test/resources/device.json
[morpheus]: https://github.com/bjlamarca/morpheus/blob/9ec3a279e8bb156a1d470b25bf08c5012bcee0a2/morpheus/hue/json/all_devices.json
[indigo]: https://github.com/kw123/Hue-Lights-Indigo-plugin/blob/1385264f1d328c242af63dd4b7e0b1827daec325/Hue%20Lights.indigoPlugin/Contents/Server%20Plugin/v2_data_structures.txt
[aiohue]: https://github.com/home-assistant-libs/aiohue/blob/ea0b3f69c4d9af3f4d3376ac25658a75435c2b47/tests/fixtures/v2_resources.json
[mqtt2hue]: https://github.com/jyp/mqtt2hue/blob/b225b44d81eb641e07b8e303dbe88c3808b06de4/doc/api/v2.org
[hues]: https://github.com/rektdeckard/hues/blob/818243b0504b7a92f9488f9965b28f107ab91a96/test/fixtures/resource/sample2.json
[vault]: https://github.com/vault1701/hue-controller/blob/420f5bf2c479d7d58a194d864cc09a40637cc481/requestparser_test.go
[hueex]: https://github.com/ShawnMcCool/hue-ex/blob/c27e0ed0ea8f4ec507564ce72f720ef9ed1d889a/test/support/fixtures/full_state.json
[openhab]: https://github.com/openhab/openhab-addons/blob/8d09a0997f6cf1ca817b94d5cdfa647b5b51e1e1/bundles/org.openhab.binding.hue/src/test/resources/device.json
[gohue]: https://github.com/tdrn-org/go-hue/blob/37293104bbe97b4a76ad74a6905a7394a26d0017/mock/mock.json
[enconnect]: https://github.com/enasisnetwork/enconnect/blob/3a4d3fd713c5e563fdeda5c210d650ec9d16937f/enconnect/philips/test/samples/source/resource.json
[johan-673]: https://github.com/JohanBendz/com.philips.hue.zigbee/issues/673
[zigbee-ota-2]: https://github.com/Koenkk/zigbee-OTA/issues/2
[z2m-14923]: https://github.com/Koenkk/zigbee2mqtt/issues/14923
[zigbee-ota-400]: https://github.com/Koenkk/zigbee-OTA/issues/400
[jeedom-110703]: https://community.jeedom.com/t/ajout-configurations/110703
[bifrost]: https://github.com/chrivers/bifrost/blob/12d9e37e6ea032fb0708ddcd2faaa6db0133d7c8/crates/hue/src/devicedb.rs
