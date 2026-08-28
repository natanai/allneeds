# Production parity status

Reference repository: `natanai/nvc-app`  
Reference branch: `performance/immediate-response-v1`  
Reference commit: `7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3`  
Local workspace: `C:\allneedsV2` (independent comparison and publishing worktree)

## Public route coverage

| Production route family | Local React implementation |
| --- | --- |
| `/` | Home doorway page |
| `/feelings/` | Searchable 48-feeling magnet board |
| `/feelings/:slug/` | All 48 canonical detail pages |
| `/feelings/body-cues/` | Body Cue explorer with canonical reverse inference |
| `/feelings/emotions-wheel/` | Full clickable SVG wheel |
| `/needs/` | Searchable 67-need magnet board |
| `/needs/:slug/` | All 67 detail, evidence, source, and strategy views |
| `/faux-feelings/` | Searchable 56-item magnet board |
| `/faux-feelings/:slug/` | All 56 relationship pages |
| `/observations/` | Local deterministic 2.0 analysis, single-surface exact-range highlights, immediate entity links, guaranteed exploratory Feelings/Needs, quick check, recipe, bundled guide, and direct Journal handoff |
| `/inventory/` | Current compact Needs/Strategies inventory, filtering, details, editing, and personal strategy form |
| `/inventory/journal/` | History-first journal with filters, disclosures, migrations, and full-screen entry composer |
| `/feed/` | Live public/following feeds, local saving, and shared add-count updates |
| `/alexithymia-support/` | Complete progressive body/compass/emotion/care/journal/communication lane |

## Canonical snapshot checks

- 48 feelings
- 67 needs
- 56 faux feelings
- 136 strategies
- all entity slugs unique
- every catalog relationship resolves to a current public record
- all 142 production icon files copied with matching SHA-256 hashes
- body regions and reverse inference match the reference checkout (allowing for Git checkout line-ending normalization)
- the Observation 2.0 canonical source records the imported reference commit and preserves all 219 cue relationships in 28 normalized authored expressions
- four formula slots, 18 guidance groups, 48 Feelings, 67 Needs, and 56 Faux Feelings compile into one checked runtime index
- Observation-specific legacy modules, public cue/module/guide assets, loaders, and precache entries are retired

## Navigation and Journal acceptance behavior

- navigation magnets are draggable only while Play is on
- leaving Play reads their visual order top-to-bottom and left-to-right, persists that order, and tightly grid-packs the same sequence without reordering it
- the compact sequence survives reload independently at mobile and desktop widths
- navigation magnets do not use the green active/click glow
- navigation scrolls with the page rather than remaining sticky
- the Play control occupies the same board-relative corner on navigation and content boards
- Menu → Journal opens the full-screen entry composer directly; `History` opens the history page

## Persistence and privacy

- V2 inventory key: `allneeds.v2.inventory`
- V2 journal key: `allneeds.v2.journal`
- one-way import from the production inventory and journal keys
- versioned schema envelopes and malformed/future-version guards
- schema-versioned drafts for Journal, Observations, Body Cues, Inventory add/edit, per-Need personal strategies, and Alexithymia lane progress
- background-safe draft flushes plus feature-specific Save, Clear, Cancel, and Start-over boundaries
- backup and restore cover the local origin’s full localStorage
- profile restore synchronizes theme/navigation session mirrors before reload
- Bluesky profile save/load uses the production backend snapshot contract
- Followers/Public strategy visibility and Profile save targets unlock only for an authenticated session
- feed saves remain local-first and best-effort update the shared add count

## Repeat-load resilience

- every generated public build artifact is included in the content-versioned cache
- app navigations and hashed public assets are served cache-first after activation
- `/allneeds-api` and personal browser data are excluded from the worker manifest
- a stopped-server production test passes current-route reload, fresh-tab deep linking, and reconnect recovery

## OAuth origin boundary

The real Bluesky and backend profile code is present, including session restore, profile snapshot save/load, follower feed access, visibility choices, and Profile save targets. Bluesky’s registered client metadata intentionally redirects to `https://allneeds.app/inventory/`, so an OAuth round trip begun from localhost or the GitHub Pages preview completes on the official production origin. Signed-out UI, validation, local backup/restore, public feeds, and injected-session account contracts remain locally testable; the complete redirect/cookie flow must be accepted on `allneeds.app`.

## Local verification (2026-08-24)

- strict TypeScript validation passed
- `66/66` unit and persistence tests passed across `18/18` files
- the production build passed with `178` precached public assets and two local fonts
- `26/26` production-Chromium flows passed, including mobile/desktop route sweeps, pre-React saved-theme restoration, long Journal disclosures, account/profile session contracts, Play-order grid packing and reload persistence, full-screen Menu → Journal behavior, backup recovery, draft continuity, modal focus, warm navigation, and offline deep routes
- the isolated stopped-server reload, fresh cached deep link, same-port reconnect, and cache-miss probe passed
- current-reference comparisons were performed at `390×844` and `1440×1000` for the key Observation, Body Cues, Emotions Wheel, Inventory, Journal, and navigation surfaces; automatic pixel-diff baselines remain future hardening rather than an unverified claim

## Observation Inference 2.0 verification (2026-08-28)

- strict TypeScript validation, compiler freshness, domain/compiler tests, and the verified production build passed
- every nonblank test input returns four official Feelings and four official Needs; blank input returns neither
- representative migrated cue execution, catalog-wide direct matching, faux relationships, negation, quotes, Unicode offsets, formula ranges, and deterministic output are regression-covered
- a 1,908-character warm benchmark measured 8.3 ms p50 and 10.4 ms p95 across 250 runs in the Node test runtime
- production verification rejects retired Observation source/public paths and deployment assets
- Chromium, Firefox, and mobile WebKit interaction coverage is checked in at `tests/e2e/observation-inference.spec.ts` and `playwright.observation.config.ts`; this implementation environment did not contain Playwright browser binaries, so that matrix remains a release-run requirement rather than a claimed local pass
