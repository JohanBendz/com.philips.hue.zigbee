# Branching, release procedure and documentation ownership

This is the ongoing procedure. Current build/version, branch freeze, release scope and actual Test/Live publication belong in [dashboard #776](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776), the appropriate release issue and GitHub Releases.

## Branches and channels

| Branch | Responsibility |
| --- | --- |
| `main` | Source of the latest explicitly published Homey Live build; repository maintenance only between releases. |
| `dev` | Staging source for the next approved Homey Test candidate. |
| `develop-X.Y` | Version-scoped work or a frozen release candidate; never itself a Homey channel. |
| `feature/*`, `fix/*`, `hotfix/*` | Isolated scoped changes, proposed through PRs for the approved target. |
| `experiment/*`, `audit/*` | Investigation-only branches, with Draft PRs until independently accepted. |

Pushing/merging Git code **does not publish a Homey app**. Publishing Test or Live is an explicit maintainer action. Record exact app version, source commit, Homey Build ID, channel and verification in the release issue. Promote only a tested, approved release source to `main`; do not merge unrelated experiments along with it.

When a Test/Live branch is frozen, new feature work must stay on the selected future version branch. Apply bug fixes selectively to their affected release line, then forward-port approved fixes. Never overwrite publication branches with a historical release/feature branch.

## Information placement

- `docs/` holds durable product architecture, implementation contracts, supported firmware mapping, and repeatable procedures.
- **Issues** hold bug reports, investigation evidence, model requests, release plans, dated hardware tests, acceptance decisions and current scope.
- **PRs** hold code and documentation changes, review findings, checks and implementation decisions.
- **Milestones**, [dashboard #776](https://github.com/JohanBendz/com.philips.hue.zigbee/issues/776) and GitHub Releases aggregate scheduling, current status and release history.
- `README.txt` is the Homey App Store description, `.homeychangelog.json` is version-keyed Homey release notes, `CHANGELOG.md` is human-readable release history.

Link to current issues/PRs instead of copying their state into permanent docs. Historical reports may be retained in the canonical issue discussion and commit-pinned Git history. Do not maintain parallel status sources across branches.

## Build and validation

1. Respect the release-branch freeze stated in the current release issue.
2. Run Homey CLI publish validation, tests, and whitespace checks on the targeted branch. Generate root `app.json` **before** any tests that inspect it.
3. Build from the exact final source commit, verify the built manifest and device/Flow regression requirements, publish explicitly, and record build/source details with observations and rollback reference.

The root `app.json` **must stay present and tracked** to bootstrap Homey Compose. Compose declarations are the authoritative source; CLI regenerates root `app.json`. Never hand-edit or delete the root manifest, add it to `.gitignore`, or commit incidental regenerated changes to keep it artificially in sync.

GitHub branch protection / mandatory reviews are repository settings and are not assumed to be enabled by this document.
