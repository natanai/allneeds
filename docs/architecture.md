# allneeds.app V2 architecture

## Boundary

`natanai/nvc-app` is a reference implementation and must remain read-only from this project. V2 code lives only in `natanai/allneeds`.

The initial audit was performed against the production `backend` branch at `fbf26ce9b7ef2b5b966c3191c4334389274e184f`. The current parity refresh uses `performance/immediate-response-v1` at `7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3` (observed 2026-08-23). Production can continue changing independently. V2 must therefore record provenance when legacy data is intentionally imported rather than assuming a permanently synchronized tree.

## Architecture decision

V2 uses React + TypeScript + Vite and remains a static-site-capable frontend. Personal data should remain device-local by default. Existing optional network features may later reconnect to the separately hosted allneeds.app backend through explicit adapters rather than making that backend a prerequisite for the basic app.

**V2 is an implementation rewrite, not a visual redesign.** The current production site is the visual and product reference. Unless a change is deliberately requested, V2 should reproduce production's appearance, information architecture, wording, proportions, palette, typography, tactile treatment, and recognizable interaction model as closely as practical. The purpose of V2 is to improve stability, accessibility, maintainability, responsiveness, and UX behavior underneath that familiar product.

### Why this direction

The legacy application has a strong visual identity, content/data pipeline, and interaction concept, but its presentation layer has accumulated generated HTML, large shared and inline styles, global browser state, page-specific DOM mutation, and tightly coupled scripts. V2 keeps the product people see while replacing the implementation that makes it fragile.

## Preserve from production

- Canonical feelings, needs, faux-feelings, and strategy content.
- Stable slugs and useful public URL families.
- Evidence and research metadata, including source-link validation.
- Body-cue source data and reverse-inference behavior.
- Observation cue/taxonomy data and the domain logic that can be isolated from the current editor.
- Journal normalization and historical migration knowledge.
- On-device privacy as the default persistence model.
- **Visual parity by default:** the plum/lavender canvas, current page/card proportions, Atkinson Hyperlegible + Manrope typography, rose/mint/gold/sky/peach accents, dark outlines, rounded forms, tactile shadows, current navigation-magnet appearance, current doorway treatment, and existing information hierarchy.
- The recognizable fridge-magnet interaction concept, including user-controlled physics/play rather than replacing magnets with generic cards.
- Existing wording and labels unless there is a concrete UX/content reason to change them.

## Magnet product contract

The magnet behavior is part of the product identity and should be rebuilt deliberately rather than discarded.

### Resting / physics-off state

- Magnets are immediately visible on first paint and begin in a valid, non-overlapping arrangement.
- Previously saved arrangements restore before the user sees a fallback layout whenever practical.
- Saved positions use normalized/percentage coordinates so arrangements survive reasonable viewport changes.
- Board height is persisted where the user can alter it and should not silently collapse or force overlap.
- There is no automatic shuffle on mount. Shuffle happens only from an explicit user action.
- Turning physics/play off leaves content magnets fixed and non-draggable.
- Navigation is the deliberate exception: its loose play-state arrangement is read top-to-bottom and left-to-right, then packed into tight non-overlapping rows in that same user-arranged sequence. The sequence is persisted independently for compact and wide viewports.
- Turning physics/play on must not resize magnets, drop them from the top, or otherwise re-layout the board as a side effect.

### Physics / “Play With” state

The intended metaphor is **magnets suspended very slowly in water**, not energetic game physics:

- magnets drift *very* slowly;
- magnets softly bump/push one another rather than overlapping;
- magnets softly rebound from container edges;
- a picked-up magnet can be moved elsewhere while magnets underneath gently yield/push away;
- on desktop, an unpressed mouse moving nearby may create an extremely subtle repelling “hand in the water” effect, but it must never interfere with clicking or dragging;
- on touch devices, normal page scrolling remains available until the user is actually holding/dragging a magnet, at which point vertical scrolling is suppressed for that drag;
- releasing a drag must not accidentally activate the magnet link;
- mobile rows must never begin overlapped, and desktop boards should expand rather than force magnets into collisions;
- motion should remain calm enough that the interface is readable and usable while physics is on.

Physics/Play is **on by default for new users** and remains user-controllable. It is not merely decorative: it should preserve the playful physical-object interaction goal while using a stable, efficient engine and lifecycle. Performance work may let a settled Play-on board sleep internally and wake immediately for interaction, but must not turn the product default into a static interface.

## Do not carry forward

- Generated page markup as the primary component system.
- The legacy `build-pages.mjs` rendering architecture.
- Giant shared/page-inline CSS as a styling strategy.
- Feature state stored in page globals or `window.NVC*` APIs.
- Direct `localStorage` calls inside presentation components.
- DOM construction/mutation as the primary UI model.
- Layout instability caused by magnet initialization, font loading, resize repair, search results, or physics lifecycle changes.
- Mobile behavior implemented as page-specific viewport and scroll patches.
- Visual redesign merely because the implementation technology changed.

## Proposed source layout

```text
src/
  app/                  app shell, routing, providers, page focus behavior
  components/           reusable UI primitives once repetition is proven
  features/
    home/
    feelings/
    needs/
    faux-feelings/
    body-cues/
    strategies/
    journal/
    observations/
    alexithymia/
  domain/               typed models and pure domain algorithms
  data/
    adapters/           legacy/editorial-source -> V2 model conversion
    generated/          validated generated datasets, with provenance
  persistence/
    legacy/             read-only legacy format adapters
    migrations/         explicit V2 schema migrations
  styles/               production-parity tokens/base styles; feature styles stay scoped
scripts/                 data import/build and static-output tooling
docs/                    architecture, migration notes, compatibility maps
public/                  static assets that do not belong in modules
```

Directories are added as slices need them; this is a boundary map, not a requirement to create empty abstraction layers.

## Data strategy

The CSV/evidence files in production are editorial source material, not V2's component API. V2 should:

1. import an intentional legacy snapshot;
2. validate relationships, slugs, and required fields at build time;
3. transform it into typed V2 domain objects;
4. record the source production commit used for that generated snapshot;
5. have React features consume the typed generated model, not legacy column names.

`data/index.json`, `body-regions.json`, and the descriptive `reverse-inference.json` are useful reference/build outputs, but their current shapes are not automatically the permanent V2 model. Migration adapters should be allowed to understand old shapes without forcing those shapes through the new UI.

Alexithymia Support is a current canonical-source example. Editors change `src/data/alexithymiaSupport.json`; `scripts/compile-alexithymia-support.mjs` validates candidate roles, fixed Feeling routes, body-profile keys, source coverage, and fixed Feeling-shape coordinates before emitting `src/data/generated/alexithymiaSupport.json`. React and the shared clue scorer consume only that typed runtime asset. Body association strengths remain owned by `src/data/body-regions.json`; the lane references those records by key and does not copy or normalize them a second way. The former `src/legacy/alexithymia-support-data.js` runtime branch has been removed.

## State and persistence

- Prefer local component state for transient interaction.
- Add feature context only for state that genuinely spans a feature subtree.
- Do not add a global state library until a concrete cross-feature problem justifies one.
- All browser persistence goes through a storage/repository boundary.
- New persisted values use an explicit schema envelope (`schemaVersion`, `savedAt`, `data`).
- A future schema is reported as unsupported rather than silently reinterpreted.
- Malformed data is not silently overwritten.
- Legacy keys are read only by compatibility adapters.
- Import from production data should validate first and write to V2-owned keys only after a deliberate migration/import action.

Known production keys from the initial audit are recorded in `src/persistence/legacy/keys.ts`.

For small settings and early personal-data slices, localStorage remains reasonable. The repository boundary keeps IndexedDB available later for larger journal/history datasets without coupling components to a storage engine.

Unsaved Journal, Observation, Body Cues, Inventory add/edit, per-Need personal-strategy, and Alexithymia lane work uses separate schema-versioned draft stores. Drafts are debounced during interaction, flushed on page hide/mobile backgrounding and unmount, restored on return or reload, and cleared only by the feature's explicit Clear/Reset/Cancel boundary or a successful handoff/save. Alexithymia draft schema v2 migrates compatible v1 clue and selected-word state at the persistence boundary while discarding removed breathing, care, and inferred-Need phases. Browse-page search terms use session storage so Back/Forward restores the working set without turning a temporary filter into permanent personal data.

## Routing

Use browser-history URLs and retain important route families where practical:

- `/`
- `/feelings/`
- `/feelings/:slug/`
- `/feelings/body-cues/`
- `/needs/`
- `/needs/:slug/`
- `/faux-feelings/`
- `/faux-feelings/:slug/`
- `/observations/`
- `/inventory/`
- `/inventory/journal/`
- `/alexithymia-support/`

Do not use hash routing: it would unnecessarily break the public URL model.

## App loading and continuity

V2 uses one explicit application boot boundary. Its navigation-wide deadline starts in inline HTML before the eager module graph executes, so import and parse time cannot be followed by a second full wait. React mounts **under** the branded preparation overlay while the complete route graph, self-hosted fonts, core magnet artwork, feature modules, compiled Observation matcher, Body Cues data, and local reference files warm up. The overlay remains until both local preparation and the visible shell's first valid geometry are ready, especially the navigation magnet layout, unless the documented maximum deadline is reached first. The shell is then revealed rather than first mounted, preventing users from seeing a blank-to-populated or upper-left magnet initialization frame. If warming exceeds the deadline it may finish in the background or record a degraded retryable state. After that boundary, client-side route changes use the shared in-memory resource graph and must not replace page content with a route-level loading message.

Basic startup is local-only. Shared strategy feeds, Cloudflare/backend account data, Bluesky/OAuth discovery, third-party modules, and similar remote services are not part of the readiness gate and must not be fetched speculatively for a fresh user. Explicit account actions, OAuth returns, and genuinely remembered active sessions may initialize their required network adapters independently.

Preloading means data and code are immediately available, not that every hidden interface subtree must already exist in the DOM. Large optional disclosures such as the Observation research guide keep their data in memory and instantiate their markup only when opened, avoiding invisible render work without introducing a fetch or route loading state.

The navigation magnet surface belongs to the persistent app shell, not to an individual route. It remains the consistent first surface while normal routed pages render below it, but it scrolls normally with the document so it does not consume the mobile working viewport. Route-active, menu, ARIA, and other presentation state must not reconstruct or repack that persistent geometry when its measured dimensions have not changed. The production-parity emotions-wheel route deliberately keeps its standalone wheel shell and hides the navigation surface. Production builds generate a content-versioned service worker that precaches only public build assets, replaces old app-shell caches atomically, bypasses `/allneeds-api`, and never includes personal local data. Once installed, navigations use the version-matched cached shell first, and hashed asset matches ignore transport-only `Vary` headers so offline module loading cannot miss identical cached URLs.

Detailed targets and follow-up work are tracked in `docs/ux-stability-roadmap.md`.

For local measurement, `?diagnostics=1` enables a non-transmitting panel backed by `PerformanceObserver` plus the service-worker lifecycle. It exposes only numeric entrance, layout-shift, interaction-duration, warm-route response measurements, and the public offline-cache readiness state. It never reads journal, observation, inventory, search, or route content.

The initial GitHub Pages build includes a `404.html` SPA fallback so deep links function during development. That fallback still returns an HTTP 404 on a first request. Before V2 replaces public reference pages, important index/detail routes should be prerendered or emitted as static HTML entry points so they receive real 200 responses and remain friendly to search/indexing and sharing.

## Styling

Use:

- production as the visual reference, not a new design system invented from the same colors;
- a global token layer that mirrors production values and can later support the existing customizer;
- a minimal global reset/base stylesheet;
- CSS Modules for app/feature/component implementation without changing the rendered visual language;
- 44px minimum touch targets where production already supports them or where accessibility requires them without materially changing appearance;
- visible focus states;
- `prefers-reduced-motion` while preserving a non-motion path through all magnet functionality.

Where production CSS expresses a deliberate visible design decision, V2 should reproduce that result. Refactoring selectors/components is encouraged; casually changing the visual result is not.

## Accessibility

Accessibility is a component contract, not a late audit:

- native landmarks and controls first;
- route changes move focus to the main content region;
- the persistent shell owns the only `main` landmark, gives it the current route’s accessible name, and updates the document title from the same catalog-aware route presentation;
- full-screen dialogs share focus containment, Escape handling, background scroll locking, and opener restoration, while the non-modal Customizer deliberately does not trap focus;
- keyboard behavior is tested with each interactive slice;
- controls receive accessible names from visible labels wherever possible;
- status/live regions are added only for state changes that need announcement;
- motion and drag interactions always have a non-motion, non-drag path.

## Testing

Layer tests by risk:

1. **Domain/data unit tests** — inference math, observation matching, slug/relationship validation, migrations.
2. **Persistence tests** — schema envelopes, malformed data, legacy adapters, import/export round trips.
3. **Component interaction tests** — semantic controls, focus, keyboard behavior, progressive disclosure.
4. **Accessibility checks** — automated axe-style checks plus manual keyboard/screen-reader review at milestone boundaries.
5. **Visual-parity checks** — compare key V2 screens against production reference screenshots/viewports so architecture work does not silently redesign the product.
6. **End-to-end smoke tests** — mobile viewport, direct deep links, browser back/forward, import/export, magnet play/resting transitions, and critical guided flows.

The local `check:all` gate runs typecheck, unit tests, the verified production
build, and checked-in Playwright production-browser flows. The browser layer
covers frame-level magnet initialization, nav/content persistence, warm routes,
modal focus, offline deep links, every direct route at mobile/desktop widths,
non-sticky shell persistence, Back/Forward working-position continuity, workflow
draft boundaries, real backup recovery, and stopped-listener/same-port reconnect. Automated
accessibility and canonical visual-diff tooling remain milestone work rather
than being implied by the current smoke coverage.

The production build also runs `scripts/verify-production-build.mjs`. It fails when the service-worker manifest differs from `dist`, an API/external URL enters the precache, navigations or hashed assets lose their cache-first/`Vary`-safe contract, either local product font disappears, Google Fonts returns as a runtime dependency, lazy/Suspense route-loading UI is introduced, the Observation matcher skips cue/module detectors or its public copy drifts, routed features create nested `main` landmarks, route title/naming behavior disappears, shared modal focus behavior becomes incomplete, or the compact shell regresses its single Customizer entry and primary-work-before-guidance contracts.

## GitHub Pages

The app builds to static `dist/` output. The Pages workflow:

- runs on `main`;
- uses Node 24 and Node-24-native GitHub Actions;
- installs the pinned package versions (a lockfile will be committed once dependency installation is available in the development environment);
- runs typecheck, tests, and build;
- builds with `/allneeds/` as the repository Pages base path;
- uploads `dist/` to GitHub Pages.

If V2 later moves to a custom domain root, set the build base to `/` instead of `/allneeds/`. The application reads Vite's base path for router basename so routing and asset paths stay aligned.

## Migration sequence: small vertical slices

1. **Foundation (current)** — app shell, route map, persistence boundary, CI/Pages, and production-visual-parity rules.
2. **Shared production-parity shell + magnet engine** — reproduce the current outer page/nav appearance; rebuild resting placement, persisted placement, explicit shuffle, physics toggle, drag/collision behavior, and water-like motion with stable lifecycle.
3. **Feelings browse + detail** — import/validate canonical feeling data and reproduce the current Feelings browsing/search presentation using the new magnet engine.
4. **Needs browse + detail** — evidence/source panel, categories, current presentation, cross-links with feelings.
5. **Faux feelings + relationship navigation** — complete the core reference graph without promoting Faux Feelings to a primary homepage doorway.
6. **Body Cues** — port inference math into pure TypeScript, retain current visual identity, stabilize dynamic results so slider changes do not bounce the page.
7. **Strategy inventory** — typed personal strategy model, V2 store, legacy `nvcApp.inventory` import/export adapter.
8. **Journal** — V2 journal repository plus adapters for `journal:v2`, `nvcApp.journal`, and `alexithymiaSupportJournal`.
9. **Observations** — port the useful cue/taxonomy/matching modules first, then rebuild the existing experience around them with stable responsive behavior.
10. **Alexithymia support** — compose body cues, energy/valence, possible feelings, needs, and journaling through stable progressive disclosure.
11. **Customizer/personalization parity** — reconnect current theme/navigation options through V2 persistence boundaries.
12. **Parity and migration hardening** — remaining content, redirects/prerender coverage, visual-regression references, full legacy import checks, performance/a11y regression suite.

Each slice should end in a usable deployed state and should include its data adapter, UI, accessibility behavior, tests, and visual-parity review together.

## First usable milestone

The first milestone should now be **production-parity shell + stable magnets + Feelings**, because the visual shell and magnet behavior are foundational product behavior rather than optional late-stage decoration.

It should contain:

- the current production visual shell reproduced in React;
- the current navigation magnets and recognizable controls;
- stable non-overlapping first paint;
- normalized persisted magnet positions and board height where applicable;
- explicit shuffle only;
- physics off = fixed/non-draggable;
- physics on = very slow water-like drift, soft collision/edge response, drag displacement, desktop subtle pointer repulsion, touch-safe dragging, and post-drag click suppression;
- canonical feelings data with recorded legacy provenance;
- current Feelings browsing/search presentation and stable `/feelings/:slug/` detail routes;
- mobile and desktop parity checks against production;
- a deployable GitHub Pages build.

This milestone proves that V2 can preserve the product's existing identity while replacing the unstable implementation underneath it.
