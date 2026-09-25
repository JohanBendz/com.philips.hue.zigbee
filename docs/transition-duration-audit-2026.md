# Hue transition-duration audit — 2026-09

Scope: issue #699 on `issues-2026-next`.

## Current behavior

The shared Hue `drivers/Light.js` in the 2.2.0 Test candidate applies a 400 ms fallback transition when Homey does not provide `opts.duration`.

When Homey does provide a finite duration, the exact value is passed through to the pinned `homey-zigbeedriver 2.2.18` transition-time conversion.

The library converts:

- Level Control duration from milliseconds to tenths of seconds.
- Color Control duration from milliseconds to tenths of seconds.

There is no shared mutable duration state in these paths.

## Regression stress test

`issues-2026-next` now includes a stress regression covering rapid command traffic without changing runtime behavior.

The test sends:

- 20 rapid dim commands, each with an explicit 2500 ms duration;
- 20 rapid color commands alternating between explicit 1800 ms and omitted duration.

Expected and verified command payloads:

- all explicit dim commands retain `transitionTime: 25`;
- all explicit color commands retain `transitionTime: 18`;
- all omitted color durations receive the app fallback `transitionTime: 4`.

The test passes in CI.

## What this rules out

Within the app/library boundary currently exercised, there is no evidence that rapid invocation:

- mutates the duration options object;
- causes one command's duration to leak into another;
- drops an explicit finite duration;
- turns an explicit duration into zero because of app-level concurrency.

## What remains possible

A Zigbee light can receive a new command while an earlier transition is still in progress. A later Level Control or Color Control move command may supersede the previous transition.

This is materially different from the app "losing" a duration.

Frequent Flow/API/Mood activity can therefore produce visually interrupted transitions even when every individual Zigbee command contains the intended duration.

## Regression boundary

Do not add a command queue, serialization layer, debounce, transition lock or delayed command scheduler without explicit review and physical evidence.

Any such mechanism would change long-standing Homey/Hue behavior, could make current automations less responsive, and could reorder user commands.

## Safe next evidence

Physical Test verification should capture the original Still Ceiling / Lightstrip Plus V4 scenario.

If the problem remains, the useful evidence is:

1. exact command sequence and timestamps;
2. whether the problematic command was dim, color, temperature or on/off;
3. whether the command payload contained the requested transition time;
4. whether another command reached the same lamp before the previous transition completed.

## Current conclusion

No additional runtime fix is justified on `issues-2026-next`.

The 2.2.0 fallback addresses the known missing-duration path, explicit durations are preserved under rapid synthetic load, and any command-queue solution would be a behavioral change requiring a separate decision.
