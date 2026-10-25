# Branching and Homey release channels

Updated 2026-10-25. Applies to `JohanBendz/com.philips.hue.zigbee`.

## Permanent publication branches

| Git branch | Responsibility | Current published baseline |
| --- | --- | --- |
| `main` (GitHub default) | Code of the latest **Homey Live** version, plus maintenance-only repository metadata/CI | App v2.3.1, Build 68 |
| `dev` | Staging branch for the **next Homey Test** candidate | Starts from the same v2.3.1 baseline |

**Branch names are not Homey deployment channels.** Pushing or merging does not publish an app. Maintainer must explicitly publish to Homey Test or Live and record the version/build. `main` must never contain unverified changes intended for the next Test. Test candidates are merged into `dev`; Live promotions are merged from the *verified* Test release into `main` only after approval/publication. Avoid sweeping `dev` changes into Live when other experiments have landed between Test and release.

## Other branches are temporary or version-scoped

- `fix/*`, `feature/*`, `hotfix/*`: isolated work. Target `dev` only when the changes are intended for the next Test.
- `experiment/*`, `audit/*`: isolated research; Draft PRs, never automatically merged or published.
- `develop-2.4`: previously frozen 2.4.0 Test candidate including OTA and localization. Keep it intact. Before any future 2.4 Test cut, reconcile subsequent 2.3.x fixes *selectively* and revalidate; do not overwrite `dev` just because the old candidate exists.
- `develop-2.5`: active exploratory 2.5.0 feature and migration baseline. Features currently in flight against it may remain there; when selecting the next 2.5 Test, bring only approved changes into `dev` after reconciling the 2.3.x and 2.4 histories.
- `modernize-2026`: retained as emergency historical v2.1.2 rollback; not active development.
- Former branches `issues-2026` (old 2.2.1 default), `issues-2026-next` (same v2.3.1 snapshot as new `main` at branch creation), `ota-2026`, `release/2.3.1-live-polish`: historical. Check PR and rollback references before manually deleting. Never force-overwrite `main` or `dev` with these.

## Near-term release sequence

1. **2.3.1** is Live; new `main` and `dev` start at the identical published source commit `0eb6bd2`. Repository CI/documentation-only commits after this baseline do not alter app runtime or app version.
2. **PR #809** (2.3.2, `hotfix/2.3.2-flow-device-filters`) targets `dev`; keep Draft until local verification and Homey Test observations are complete. Committing a regenerated root `app.json` is **not** a prerequisite.
3. **PR #786** (frozen 2.4.0 branch) tracks a future distinct Test candidate, not the immediate 2.3.2 hotfix.
4. **PR #813** RWL022 battery experiment and **#803** LOM002 reporting experiment are *not* in the 2.3.2 candidate.
5. When promoting a Test build to Live, record exact version, commit and Homey Build ID. Keep rollback reference; verify Flow compatibility and crash trend.

## Validation and safety

The validation workflow runs on pushes to `main`, `dev`, `develop-2.4` and `develop-2.5`, and on PRs. It does not publish releases.

**Important Homey Compose bootstrap rule:** the repository-root `app.json` **must exist and remain tracked**. We have established that the Compose workflow does not work if this file is absent. It is an output/bootstrap manifest, **not the source of truth**, and is explicitly allowed to be out of sync with `.homeycompose` files. Homey CLI overwrites/regenerates it during run/validation/build/publication. Never remove it or add it to `.gitignore`; do not include incidental generated changes in feature/fix PRs, and do not require a commit merely to synchronize it. Compose files plus release package metadata define the intended application. **Tests reading `app.json` must run after a CLI regeneration** (the GitHub CI workflow already validates before running `npm test`); directly invoking `npm test` without generating may read stale contents. For each actual Test/Live build verify the generated manifest and app version, without requiring a git-tracked manifest update.

Recommended GitHub repository rules: require PR review and successful CI for `main`, disallow force-pushes/deletion and prefer only release-approved promotions. These controls are configured in GitHub Settings; this document does not assert they are already enabled.

The [development dashboard](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776) tracks publication status and version-scoped investigations.
