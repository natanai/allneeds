# UX stability and native-app roadmap

V2 should feel like one continuously available application, not a collection of pages that happen to share styles. The production visual language remains the reference; the targets below measure improvements in stability and continuity underneath it.

## Current app-shell contract

- A full browser entrance may show one branded preparation bar while fonts, route code, feature modules, core magnet icons, and local reference data warm up.
- The `3.5s` preparation deadline begins in inline HTML before the eager module graph loads, so import/parse time counts toward the same navigation-wide budget. If warming fails or exceeds that budget, the usable shell mounts with background/degraded state instead of remaining trapped behind the entrance bar.
- After the app appears, primary route changes must not show a loading fallback or fetch another route UI bundle.
- The navigation magnet surface stays in the persistent app shell and appears first on normal app routes, but scrolls normally with the document so it never consumes the mobile working viewport. The production-parity emotions-wheel route deliberately presents its standalone wheel shell without the navigation surface.
- A magnet board remains inline-hidden under React-owned readiness until fonts, a usable container width, non-zero magnet measurements, and applied coordinates are all available. Users must never see magnets fan out from `(0, 0)`, including before class-based styles become authoritative.
- Settled magnet locations save on drop, after collision settling, on page exit, and when the document becomes hidden.
- Compact and wide magnet arrangements are stored independently. Returning to one layout must not inherit the other layout's coordinates.
- Before a responsive relayout, the outgoing viewport's current coordinates are saved against its own dimensions. Restored layouts clear stale velocity, wobble, and pointer repulsion so transient Play motion cannot displace persisted coordinates.
- Navigation magnets preserve the user's play-state reading order, then repack only that sequence into compact rows when play is disabled. Content boards never receive this automatic grid treatment.
- Resting navigation uses a tighter reserved-toggle packing profile so all enabled magnets remain compact without losing their user-arranged order.
- At compact widths the shell exposes Customizer only through its navigation magnet, avoiding a duplicate floating control over page actions.
- Primary mobile work begins before optional teaching content: the Observation editor precedes its collapsed recipe, and the shared feed exposes filters and Pull before expanded sign-in guidance.
- The persistent shell owns the application’s only `main` landmark. Every route supplies a catalog-aware document title and accessible main label before focus moves to the new page.
- Full-screen dialogs move focus to their working control, contain keyboard focus, close with Escape, prevent background scrolling, and restore focus to the opener. The non-modal Customizer receives and restores focus without trapping the rest of the page.
- Production output includes a content-versioned public-asset cache. It bypasses `/allneeds-api`, claims clients only after a complete install, removes older app-shell caches during activation, and serves the version-matched app shell before attempting the network so a dead connection cannot stall an offline entrance.
- Back/Forward restoration retries only while returning content is still expanding and cancels immediately when the user starts interacting.
- Atkinson Hyperlegible and Manrope are self-hosted, content-hashed, and included in the public-asset cache; a warm app has no external font dependency.
- Body Cues and descriptive Feeling-cue data are bundled local module assets, while the compiled Observation runtime is a shared boot resource, so internal navigation reads them synchronously instead of starting route-local fetches.
- Legacy Observation regex alternatives are reassembled and validated during the build. Startup must not skip malformed detector fragments or flood the console; every shipped cue keeps one compiled matcher and every module keeps usable matching coverage.
- Observation guide data remains preloaded, but its large research-section DOM is instantiated only when the collapsed guide opens. Route transitions therefore do not pay for invisible markup, while opening the guide still requires no network work.
- Journal, Observation, Body Cues, Inventory add/edit, Need-page personal-strategy, and Alexithymia lane drafts survive route changes, close, reload, and mobile backgrounding until explicitly saved, handed off, reset, or cleared.
- Feelings, Needs, and Faux Feelings retain independent search working sets for the current browser-tab session.
- `?diagnostics=1` exposes a local-only panel for app-ready time, entrance LCP, current-view CLS, maximum observed interaction duration, warm-route response, and public offline-cache readiness. It never transmits or records user content.

## Measurable release targets

| Area | Target |
| --- | --- |
| Magnet first paint | No visible frame with two or more magnets at the upper-left origin; all visible magnets have a completed layout. |
| Magnet persistence | Same-size reload restores the settled location within 2 CSS pixels; compact/wide round trips preserve their respective arrangements. |
| Layout stability | Cumulative Layout Shift below `0.05` on Home, Feelings, Needs, Inventory, Journal History, and Observations at the reference mobile and desktop sizes. |
| Internal navigation | Primary destination content is available without a route-loading fallback; target input-to-content response below `100ms` on a warm session. |
| Interaction responsiveness | INP below `200ms` at the 75th percentile on supported mobile hardware. |
| First entrance | LCP below `2.5s` at the 75th percentile; the preparation gate has a `3.5s` maximum wait before showing the usable app with safe fallbacks. |
| Repeat entrance | After one successful production load, the app shell and core reference tools reopen from the public-asset cache without a network dependency. |
| Persistent shell | Navigation remains the stable first surface on every route, keeps its arrangement through navigation, and scrolls away normally without covering page content. |
| Route semantics | Every supported route has one named `main` landmark and a route-specific document title; non-history navigation focuses that landmark without changing scroll position. |
| Dialog continuity | Modal focus cannot escape into the page, Escape closes the surface, background scroll remains locked, and the invoking control receives focus again. |

These targets can be sampled locally with `?diagnostics=1`. Checked-in production-browser tests now cover frame-level magnet initialization, content/nav persistence, warm route loading, modal focus, activated-cache deep links, and a primary mobile layout. A manual outage/reconnect check still covers stopping and restarting the preview itself. Any future aggregate production telemetry must remain opt-in and contain no personal journal, inventory, observation, search, route-content, or browsing data.

Dated local measurements and the limits of that evidence are recorded in [`ux-validation-log.md`](ux-validation-log.md).

## Next UX passes

1. **Automated visual coverage:** the checked-in direct-route matrix now covers every route family at `390×844` and `1280×900` for titles, landmarks, shell order, and overflow. Add reviewed canonical screenshots and visual-diff thresholds at those same viewports.
2. **Interaction consistency:** extend the shared modal/focus foundation to standardize pressed, selected, pending, success, empty, and error states without replacing the magnet/card visual language.
3. **Regression gates:** Back/Forward, all major draft boundaries, real backup recovery, and a true stopped-listener/restart scenario now join the checked-in entrance, persistence, modal, mobile, route-matrix, and offline flows. Add automated accessibility checks and canonical visual references for critical forms and detail routes.

## Non-negotiable boundaries

- No personal content is transmitted for performance measurement.
- Loading improvements must not introduce stale application versions or service-worker update traps.
- A performance optimization is not accepted if it causes a visible redesign or removes a core production feature.
- A polished animation is not accepted if it increases layout shift, blocks input, or obscures the stable non-motion path.
