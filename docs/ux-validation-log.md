# UX validation log

This log records reproducible local evidence for the stability roadmap. It is not a substitute for production field data at the 75th percentile.

## 2026-08-28 — Alexithymia Support implementation gate

- The deterministic Alexithymia Support compiler validated candidate roles, fixed-catalog routes, body-profile references, source coverage, and Feeling-shape coordinates; the generated runtime asset was fresh.
- Strict TypeScript validation passed. Vitest passed `198/198` tests across `48/48` files.
- The production build transformed `191` modules, generated the installed-app service worker with `170` runtime assets, and passed the production artifact verifier.
- Playwright discovered all `63` production flows, including new Alexithymia checks for combined, body-only, shape-only, Faux Feeling, Working term, multiple-word, `No word yet`, direct Need routing, Journal handoff, Feeling-page boundaries, and mobile overflow contracts.
- The browser flows could not execute in this workspace because its configured Playwright Chromium binary is unavailable. This entry therefore records no screenshot, live-browser, iOS standalone, large-text, reduced-motion, keyboard, or screen-reader sign-off. Those checks remain required on the normal browser runner and target devices before release approval.

## 2026-08-23 — current-reference parity refresh

Reference: `natanai/nvc-app`, branch `performance/immediate-response-v1`, commit `7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3`.

- Compared the current reference and local React surfaces at `390×844` and `1440×1000` for Observations, Body Cues, Emotions Wheel, Inventory, Journal, and the navigation shell; corrected the meaningful spacing, disclosure, hierarchy, and responsive differences found during that pass.
- Verified every public route at mobile and desktop widths with no horizontal overflow, lingering preparation text, route-level replacement loader, or runtime console problem.
- Verified navigation magnets remain draggable in Play, preserve the user's visual reading order when Play ends, pack that same sequence into tight rows, and restore it after reload. Navigation has no green selected glow, is not sticky, and keeps the Play control in the shared board-relative position.
- Verified Menu → Journal opens the full-screen composer directly and Menu → History opens the history view.
- Strict TypeScript validation passed; Vitest passed `49/49` tests in `13/13` files.
- The clean production build transformed `163` modules, precached `177` public assets, retained both local product fonts, and passed the production artifact verifier.
- All `18/18` production-Chromium flows passed. The separate stopped-server reload, fresh cached deep link, same-port restart, and cache-miss reconnect verifier also passed.
- The optional public Feed request is fulfilled with an empty public response only inside automated browser/outage checks. This keeps the local production gate independent from external service availability without changing application behavior.

## 2026-08-18 — production-preview shell, routes, and Observation matcher

Environment: a fresh Vite production preview origin in the Codex in-app Chromium browser. Diagnostics were enabled with `?diagnostics=1`; metrics stayed local to the page.

### First entrance

| Signal | Result |
| --- | ---: |
| App ready | `300.2ms` |
| Entrance LCP | `68ms` |
| Console warnings/errors | `0` |
| Preload state | `ready` |
| Main landmarks | `1` |

The navigation-wide `3.5s` gate now begins before module loading. A separate warm development entrance completed in `393.7ms`; its earlier implementation had reported `6861.2ms` because import time occurred before a second `3.5s` wait.

### Warm route transitions

| Route | Response | Loading replacement | Current-view CLS |
| --- | ---: | --- | ---: |
| Feelings | `34.1ms` | none | `0.0356` |
| Needs | `78.1ms` | none | `0` |
| Inventory | `58.5ms` | none | `0` |
| Observations, before hidden-DOM fix | `588.4ms` | none | `0` |
| Observations, after hidden-DOM fix | `28.5ms` | none | `0.0356` |

Observation data and research content remain preloaded. The closed guide now mounts no guide-card DOM; opening it immediately produced the heading “Constructing Low-Inference, Time-Bound Observations” without a loading message.

### Runtime and semantic checks

- All shipped Observation cue and module regexes compiled without a warning or silent detector skip.
- Route navigation produced one named `main` landmark, a route-specific document title, focus on `#main-content`, and top-of-page scroll for non-history navigation.
- Observation help trapped focus, locked background scroll, closed with Escape, and restored focus to its trigger.
- The Journal composer focused Reflection, locked background scroll, closed with Escape, changed the URL/title to Journal history, and restored focus to the main region.
- Customizer focused its close control, remained intentionally non-modal, closed with Escape, and restored focus to the Customizer magnet.
- Mobile Body Cues and Alexithymia Support each had one named `main` landmark and zero horizontal overflow at `390×844`.

### Automated evidence

- Strict TypeScript validation passed.
- Vitest passed `47/47` tests across `13/13` files.
- The production verifier passed `171` precached public assets, two local fonts, the eager route graph, clean Observation matcher compilation, route semantics, modal focus behavior, offline strategy, and compact-workflow guards.
- The checked-in Chromium regression dragged a navigation magnet to a new reading position in Play, confirmed that exiting Play packed the magnets into one compact row in that exact visual order, reloaded the production build, and confirmed that the same order returned with no console warnings or errors.
- Seventeen production-Chromium flows now pass. Frame-by-frame entrance sampling caught the previously unverified upper-left pile; the board now stays inline-hidden until React has committed measured coordinates. The suite also caught responsive relayout carrying outgoing motion into restored layouts; outgoing viewport coordinates now save before relayout and restored layouts begin without stale velocity or pointer repulsion.
- Content-magnet x/y coordinates round-trip through wide → compact → wide → compact → reload within `2 CSS px`, while the two viewport classes retain independent arrangements.
- Warm Feelings, Body Cues, Needs, Observations, and Inventory navigation renders no replacement loader and remains below the `250ms` automated regression ceiling. Observation help and Journal keyboard contracts, offline Need/Observation deep links, and the `390×844` Observation editor/control/overflow contract also pass.
- Fifteen direct route shapes—including browse/detail tools, Journal history, Feed, Alexithymia Support, and Not Found—pass at both `1280×900` and `390×844` with exactly one named `main`, the expected document title, navigation before page content, and no horizontal overflow. The navigation remains the same shell instance across client routing but scrolls away normally. A filtered Feelings working set and exact scroll position survive Back; Forward returns the detail route to its saved top position.
- Visible-control workflow tests now prove Observation → Journal handoff, Journal close/reload/save/clear boundaries, Body Cue reload/reset, Inventory and per-Need draft isolation, and Alexithymia lane/compass/emotion/reflection restoration through Start over. A real downloaded local backup restores a strategy after it is removed; the test does not inspect or inject browser storage directly.
- The isolated outage verifier activates the generated production cache, stops the preview listener, reloads `/needs/love-caring`, opens `/observations` in a fresh tab, restarts the same port, and proves a cache-miss request reaches the restarted server before reloading cleanly.

## Still requiring broader evidence

- Field LCP/INP/CLS at the 75th percentile on the supported production-device matrix.
- Automated canonical screenshot comparison against the current allneeds.app reference at the approved viewports.
- Automated accessibility scanning plus full manual keyboard and screen-reader review across every route and state.
- Automated visual comparison against canonical allneeds.app reference screenshots.
- Full keyboard and screen-reader review across every route and interactive state.
