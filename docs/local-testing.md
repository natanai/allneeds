# Local testing guide

This workspace is the local comparison build. It can be run and validated independently of the online `natanai/allneeds` work; publishing remains an explicit step.

## 1. Install and start

Use Node 22.22 or newer (Node 24 is recommended):

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL Vite prints, normally `http://127.0.0.1:5173/`.

The optional shared feed uses `/allneeds-api` for development reads and the production backend for shared add-count/account actions. “Save to inventory” writes locally first, so it remains useful if the count update is unavailable.

## 2. Run the complete automated check

```powershell
pnpm check:all
```

That command runs:

1. strict TypeScript validation;
2. the Vitest unit and persistence suites;
3. the production Vite build;
4. creation of `dist/404.html` for direct SPA deep links;
5. generation of a content-versioned `dist/service-worker.js` for public app assets only;
6. production verification that every public artifact is precached, app-shell and asset lookups are cache-first and `Vary`-safe, both product fonts are local, no Google Fonts URL remains, the route graph is eager, and the compact shell keeps optional guidance/control duplicates out of the primary workflow;
7. the production-browser suite; and
8. a stopped-server/offline/reconnect verifier.

Use `pnpm check` when you only need the TypeScript, unit, and production-build foundation layer.

To run the parts separately:

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The browser regression suite runs against the built production output. Install
its local Chromium once with `pnpm exec playwright install chromium`, then run
`pnpm check:all` for the foundation checks plus the real-browser contracts.
`pnpm check:browser` rebuilds and runs only the browser layer. The nav regression
spec specifically verifies drag/reorder in Play, order-preserving compact grid
packing on exit, and persistence after reload. The native-stability spec also
checks every animation frame for an exposed upper-left pile, enforces the
`3.5s` entrance gate, verifies warm route changes without replacement loaders,
round-trips content-magnet coordinates between wide and compact layouts within
two CSS pixels, exercises modal keyboard containment, opens cached deep routes
offline, and guards the primary mobile layout/overflow contract. The routed
shell matrix directly opens every route family at desktop and mobile widths,
then verifies titles, landmarks, shell order, and overflow. It also covers the
non-sticky persistent nav behavior and filtered browse/scroll restoration
through Back and Forward. Workflow continuity tests exercise Observation →
Journal handoff, Journal save/clear, Body Cue reset, Inventory and per-Need
draft isolation, the current Alexithymia body/compass/emotion lane, and a real
download → delete → import backup recovery using only visible controls. Feed
prewarming is intercepted with an empty public response inside automated browser
checks so an optional external service cannot invalidate otherwise local tests.

`pnpm test:e2e` runs both the shared Playwright suite and an isolated outage
verifier. The latter starts a production preview on port 4192, activates the
cache, stops the listener, reloads one deep route, opens another in a fresh tab,
restarts the same port, and proves a cache-miss request reaches the server.
Run only the shared suite with `pnpm test:e2e:playwright`, or only the true
outage/reconnect scenario with `pnpm test:e2e:outage`.

## 3. Test the actual production output

```powershell
pnpm build
pnpm preview --host 127.0.0.1
```

Open the preview URL Vite prints, normally `http://127.0.0.1:4173/`. The feed’s development proxy is intentionally unavailable in static preview; everything else is fully local.

Append `?diagnostics=1` on a fresh entrance to show the local UX metrics panel. It reports app-ready time, entrance LCP, current-view CLS, maximum observed interaction duration, warm-route response time, and the public offline-cache state. Wait for **Offline cache: ready** before deliberately stopping a production preview. The values stay in the current page and are never transmitted.

Record milestone measurements in [`ux-validation-log.md`](ux-validation-log.md), including the viewport/build context and any failed baseline that motivated a fix. Local results demonstrate regressions and improvements but do not replace production percentile measurements.

## 4. Recommended smoke test

- Fresh entrance: use a clean local port, confirm the branded preparation bar is the only loading state, and confirm no magnet board visibly spreads out from the upper-left corner. With `?diagnostics=1`, confirm import time counts toward the single 3.5-second entrance budget rather than starting a second wait after the module graph loads.
- App shell: confirm the navigation magnets are the consistent first surface on every route, scroll a long page and confirm they move away with the document, and move among primary routes without a “Loading page…” replacement. Confirm the browser title changes with each route, there is exactly one `main` landmark, and non-history navigation focuses that named landmark without moving the page away from the top.
- Navigation magnets: enable play, drag magnets into a visibly different reading order, disable play, and confirm they form a tight grid while preserving that top-to-bottom/left-to-right order. Reload and confirm the ordered grid returns. Repeat once at compact width and once at wide width.
- Home: open each of the three doorways and Alexithymia Support.
- Feelings: search, shuffle, toggle physics, pick up and relocate a magnet, confirm only contacted or nearby magnets react and the board settles without a global reshuffle, navigate away and back, reload, and confirm the settled location returns before opening a feeling, Body Cues, and the emotions wheel.
- Body Cues: move a region slider, confirm possible feelings appear, navigate away/back and reload, then confirm the exact cue returns. “Reset all cues” must remove it permanently.
- Needs: search, open a need, page/shuffle its strategies, save one to the device, and add a personal strategy. Leave an unsaved personal strategy, navigate to another need and back, and confirm each need keeps its own draft until Save or “Clear draft.”
- Faux feelings: search, open one, and follow its related feeling and need magnets.
- Observations: insert the example, load matches, toggle met/unmet language, open the full guide, and convert the observation to a journal draft.
- Inventory: confirm the saved item and need coverage, then edit/remove a strategy. Leave text in the add and edit forms, navigate away/back and reload, and confirm the exact fields and coverage filter return; “Clear draft,” Cancel, and successful Save must clear the appropriate editor state. Download/restore the full-device backup from Menu → Account & data (or Journal → Backup & restore).
- Journal: confirm the Journal nav magnet opens the full-screen entry composer directly, close it to reach History, save/edit/filter an entry, export a backup, and verify an observation draft opens automatically.
- Dialog keyboard behavior: open Menu, Observation help, and Journal. Confirm working focus moves inside, Escape closes, focus returns to the opener, and Tab/Shift+Tab cannot leave each modal surface. Customizer is intentionally non-modal and must not trap Tab.
- Warm-route resources: after the entrance gate, open Body Cues and Observations and confirm neither page renders “Loading body-cue matches…” nor “Loading guide…”.
- Clean boot: open the browser console before a fresh entrance and confirm the preloaded Observation matcher emits no invalid-regex warnings or errors.
- Draft continuity: type unsaved text in Observations and Journal, navigate away/back, close the Journal composer, reload, and confirm the exact text returns. Save or Clear should remove the corresponding draft.
- Browse continuity: filter Feelings, Needs, and Faux Feelings, open a result, use Back, and confirm the same query and filtered magnets return for the current tab session.
- Alexithymia Support: complete a body selection, use the compass, select/reject a suggested feeling, navigate away/back and reload, and confirm the lane, body value, compass values, and selected emotion return. Continue to the shared Journal when useful, try the care and communication steps, then use “Start over” and confirm the cleared lane stays cleared after reload.
- Shared feed in `pnpm dev`: pull public strategies and save one locally; confirm the Inventory count changes even if the best-effort live add-count update is unavailable. With a restored production session, confirm the following feed unlocks.
- Account & data: confirm Bluesky handle validation is active, Profile actions remain unavailable while signed out, and backup/restore stays fully local. Complete OAuth redirect/profile-cookie acceptance on `https://allneeds.app`; the registered client intentionally returns localhost/GitHub preview sign-ins to the official origin.
- Customizer: change colors/roundness, reload, and confirm the choices persist.
- Responsive checks: repeat every primary route around 390 × 844 and 1280 × 900; move a magnet in each size and confirm switching sizes does not overwrite the other arrangement. On mobile, confirm Customizer appears only in navigation, the Observation editor appears before its collapsed recipe, and Feed filters/Pull appear before optional sign-in guidance. On desktop, confirm all enabled resting navigation magnets form tight rows while preserving the user's reading order.
- Browser history: scroll a long browse page, open a visible result without first scrolling, use Back, and confirm the exact working position returns; deliberate forward navigation should still begin at the top.
- Production outage/reconnect: `pnpm test:e2e:outage` automates the stopped-listener reload, fresh cached deep link, same-port restart, and cache-miss reconnect. For a milestone manual check, repeat it in the target browser with `?diagnostics=1`. `/allneeds-api` responses must never enter the app-shell cache.
- Product fonts: in browser network/application tooling, confirm Atkinson Hyperlegible and Manrope load from the local production origin with no request to `fonts.googleapis.com` or `fonts.gstatic.com`.
- Local metrics: open `/?diagnostics=1`, record the entrance values, follow a primary nav magnet, and confirm the Last route value updates while entrance LCP remains unchanged.

## 5. Compare with the other implementation

Run this workspace and the other checkout on different ports:

```powershell
# This workspace
pnpm dev --port 5173

# From the other checkout in a second terminal
pnpm dev --port 5175
```

Open both URLs side by side. Because browser storage is scoped by origin/port, test data on port 5173 will not mix with data on port 5175.

## 6. Reset local test data

The safest reset is browser DevTools → Application → Local Storage → the local Vite origin → Clear. This removes only data stored for that local port.

The main V2 keys are:

- `allneeds.v2.inventory`
- `allneeds.v2.journal`
- `allneeds.v2.journal.draft`
- `allneeds.v2.observation.draft`
- `allneeds.v2.body-cues.draft`
- `allneeds.v2.inventory.draft`
- `allneeds.v2.alexithymia.draft`
- `allneeds.v2.need-strategy.draft:<need-slug>`
- `nvcApp.theme`
- `nvc_rejected_emotions`
- `magnetPositions:*`

Export a backup from Menu → Account & data or Journal → Backup & restore before clearing anything you want to keep.
