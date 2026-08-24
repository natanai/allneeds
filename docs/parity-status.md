# Production parity status

Reference repository: `natanai/nvc-app`  
Reference branch: `performance/immediate-response-v1`  
Reference commit: `7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3`  
Local workspace: `C:\allneedsV2` (no Git metadata or remote writes)

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
| `/observations/` | Current single-input Load flow, exact/nearby matching, quick check, recipe, guide, and direct Journal handoff |
| `/inventory/` | Current compact Needs/Strategies inventory, filtering, details, editing, and personal strategy form |
| `/inventory/journal/` | History-first journal with filters, disclosures, migrations, and full-screen entry composer |
| `/feed/` | Live public read-only pull plus local-only saving |
| `/alexithymia-support/` | Complete progressive body/compass/emotion/care/journal/communication lane |

## Canonical snapshot checks

- 48 feelings
- 67 needs
- 56 faux feelings
- 136 strategies
- all entity slugs unique
- every catalog relationship resolves to a current public record
- all 142 production icon files copied with matching SHA-256 hashes
- body regions, reverse inference, observation guide, cues, modules, detector stats, and public index content match the reference checkout (allowing for Git checkout line-ending normalization)
- nine observation logic modules retain the reference source content

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
- feed saves remain local in this comparison build

## Repeat-load resilience

- every generated public build artifact is included in the content-versioned cache
- app navigations and hashed public assets are served cache-first after activation
- `/allneeds-api` and personal browser data are excluded from the worker manifest
- a stopped-server production test passes current-route reload, fresh-tab deep linking, and reconnect recovery

## Deliberate local-test boundary

Bluesky OAuth/profile sync is represented by the same signed-out and disabled controls as production, but OAuth sign-in and backend profile writes are disabled in this local comparison build. OAuth metadata and redirect URIs belong to the production origin and cannot be exercised accurately from an arbitrary localhost port. The public feed remains testable through Vite’s read-only development proxy.

No source code in this workspace has been committed, pushed, or sent to the online `natanai/allneeds` repository.

## Local verification (2026-08-23)

- strict TypeScript validation passed
- `49/49` unit and persistence tests passed across `13/13` files
- the production build passed with `177` precached public assets and two local fonts
- `18/18` production-Chromium flows passed, including mobile/desktop route sweeps, Play-order grid packing and reload persistence, full-screen Menu → Journal behavior, backup recovery, draft continuity, modal focus, warm navigation, and offline deep routes
- the isolated stopped-server reload, fresh cached deep link, same-port reconnect, and cache-miss probe passed
- current-reference comparisons were performed at `390×844` and `1440×1000` for the key Observation, Body Cues, Emotions Wheel, Inventory, Journal, and navigation surfaces; automatic pixel-diff baselines remain future hardening rather than an unverified claim
