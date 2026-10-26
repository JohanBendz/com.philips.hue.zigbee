# Homey SDK beta types audit — 2026-10-13

## Scope

This audit compares the currently used public Homey SDK v3 type package line with Athom's npm beta without changing the Hue app's runtime dependencies.

- Base: `develop-2.5`
- Audit branch: `audit/homey-types-beta`
- Stable comparison: `@types/homey@npm:homey-apps-sdk-v3-types@0.3.12`
- Beta command supplied by Athom: `@types/homey@npm:homey-apps-sdk-v3-types@beta`
- Resolved beta at audit time: **1.7.0**
- TypeScript used for the comparison: **7.0.2**

The beta is installed ephemerally in CI. It is not added to `package.json` or `package-lock.json`.

## Result

After adding an audit-only declaration shim that models `homey-zigbeedriver` classes as Homey Device/Driver subclasses, the complete app runtime source was checked:

- `app.js`
- `drivers/**/*.js`
- `lib/**/*.js`

Stable 0.3.12 and beta 1.7.0 both produce **42 diagnostics**.

**No beta-specific TypeScript diagnostic remains.**

The first beta-only constructor diagnostics were caused by the audit shim inheriting the newly typed `Homey.Device` constructor. Modelling the Zigbee wrapper's pass-through constructor removed all five without changing application code.

Homey publish validation, the existing **219 tests**, the stable-vs-beta comparison and whitespace validation all pass in the final audit CI run.

## What changed in the beta types

The 1.7.0 declarations are substantially richer than 0.3.12. Relevant examples include:

- new `lib/SDK.d.ts` declarations, including `fromJSON(...)`;
- new `lib/HomeyClient.d.ts`;
- explicit `Driver.getDeviceById(deviceId: string): Device`;
- `Driver.ready(): Promise<void>` and typed driver/device initialization structures;
- `Device.setLastSeenAt(): Promise<void>`;
- typed app/driver manifests and device initialization data;
- more precise nullability and object types, e.g. device name/class/availability;
- Node 22 type dependency.

The beta package metadata resolves to:

- `homey-apps-sdk-v3-types@1.7.0`
- `@types/node@^22.0.0`
- `homey-lib@^2.46.0`

## Relation to the serializer crash

The beta package is **declaration-only**. Installing it cannot change the runtime path involved in the current Homey 13.5.1 crashes.

It is nevertheless useful evidence because the new declarations explicitly expose the same SDK concepts present in the crash stack, including `SDK.fromJSON(...)`, driver readiness and `Driver.getDeviceById(...)`.

This does not provide an app-side mitigation for:

- `Invalid Driver ID: motionsensor`
- `Invalid Driver ID: motion.ac02`
- `Driver Not Initialized: SML001-occupancy`
- `Driver Not Initialized: SML002-occupancy`

Those remain runtime/serializer observations tracked upstream.

## Existing type debt exposed by both stable and beta

The remaining **42 diagnostics pre-exist the beta comparison**:

| Category | Count | Assessment |
|---|---:|---|
| `FlowCard.trigger` inferred too generically | 16 | Type/model mismatch to review; runtime is already covered by tests |
| SML001/SML002 destructured command JSDoc | 10 | Documentation/type annotation cleanup |
| Partial BoundCluster callback objects | 7 | Primarily Zigbee cluster typing/inference; verify before runtime changes |
| Legacy comma-operator returns | 6 | Safe cleanup candidate |
| `App.onInit()` returns void instead of `Promise<void>` | 1 | Safe cleanup candidate: make it `async` |
| `Light.js` capability option `duration` inferred from `object` | 1 | Type annotation cleanup |
| `HueSpecificCluster.dynamicScenes` `map8` definition | 1 | Suspicious legacy/dead code; inspect separately before changing |

The `dynamicScenes` item deserves a separate review: current `zigbee-clusters` uses `map8` for named bit flags, while this legacy definition supplies scene values much larger than eight bits. The only other `dynamicScenes` reference in the app is currently commented out.

## Dependency audit

A clean isolated lockfile containing TypeScript 7.0.2 and Homey beta types 1.7.0 reports **one high severity transitive advisory**:

- package: `image-size`
- advisory: `GHSA-w3rx-r6r6-pgpr`
- affected range reported by npm: `>=0.6.3 <=2.0.2`
- issue: ICNS parser denial of service via infinite loop
- fix available: yes

The beta type package depends on `homey-lib@^2.46.0`; Homey's `homey-lib` package depends on `image-size@^0.6.2`, which is the dependency path that introduces the audit warning.

This is a development/tooling dependency and is not a runtime change to the Homey app, but permanently adding it would add the warning to the development dependency tree.

## Recommendation

Keep the beta isolated for now rather than merging a floating `@beta` dependency into `develop-2.5`.

If we decide to adopt the richer types later:

1. prefer an exact tested version rather than a floating beta tag;
2. re-run this comparison against the then-current beta;
3. preferably wait until Athom's dependency tree no longer introduces the `image-size` advisory;
4. clean the useful pre-existing diagnostics in small, separately reviewed 2.5 changes rather than mixing them into the type-package adoption.

No change from this audit should be backported to 2.3.1 Live or frozen 2.4.0 solely for typing reasons.
