# allneeds V2 agent contract

This file is the root-level implementation contract for automated coding agents working in `natanai/allneeds`. Read it before making changes. It applies to the entire repository unless a more specific `AGENTS.md` exists below a directory.

## Repository boundary

- Work only in `natanai/allneeds` for V2 changes.
- `natanai/nvc-app` is a read-only visual/product reference. Do not commit to it from V2 work.
- Use a dedicated branch and PR for meaningful changes. Do not patch `main` directly.
- Preserve user work already present on the branch. Do not overwrite parallel changes merely to simplify your task.

## Product and visual contract

- V2 is an implementation rewrite, not a redesign. Preserve the existing visual language, wording, proportions, tactile magnet treatment, and information architecture unless the user explicitly requests a design change.
- **Before UI/design work, read `docs/design-language.md`.** Reuse accepted patterns recorded there before inventing a new treatment for the same job. When the user explicitly approves a new or superseding visual decision, update that document in the same PR.
- Magnets are a core product interaction, not decorative cards.
- **Before changing magnet behavior, physics, layout, persistence integration, or magnet styling, read `docs/magnet-behavior.md` and any nested magnet `AGENTS.md`.** That document is the canonical detailed magnet contract; update it in the same PR when an explicit user decision changes the behavior.
- **Do not retain superseded magnet behavior as dormant code.** When a magnet interaction is replaced, delete obsolete constants, state flags, branches, CSS selectors, comments, and tests rather than hiding or disabling the old implementation. Git history is the archive. The removed mechanisms listed in `docs/magnet-behavior.md` must not be resurrected accidentally.
- **Play/physics is ON by default for magnet surfaces.** This is intentional. Do not "optimize" by changing the default to static/resting mode or by reducing the physical interaction to a hover animation.
- Play may be made cheaper internally (sleep/wake, broadphase collision, cached measurements, fewer unnecessary frames), but it must remain instantly responsive and feel continuously available.
- Navigation magnets are allowed to have intentional navigation-specific styling. Their typography, sizing, shadows, crisp-rendering strategy, hover/focus/pick-up treatment, or compact presentation do not have to be identical to content magnets when the difference is purposeful.
- Do not interpret "shared magnet behavior" as "identical CSS." What must remain consistent are the physical interaction semantics, drag/fling correctness, persistence, accessibility, and lifecycle guarantees unless the user explicitly asks for a behavioral difference.
- Navigation-specific presentation must not make route-active, menu, ARIA, or other semantic state change the measured magnet geometry or cause the persistent nav to repack. Physics-state styling may visually move/lift a magnet as part of interaction; semantic/presentation state must stay dimension-neutral.
- The Menu magnet is the only non-removable navigation magnet. Home and Customizer are enabled by default but must remain user-toggleable through Navigation magnets settings.
- Saved compact and wide magnet layouts remain independent. Do not collapse them into one cross-viewport coordinate set.

## Startup and native-app continuity

The first branded loading surface is a real application readiness boundary, not merely a download spinner.

- Keep the route graph and local reference content aggressively warm/eager so normal internal navigation does not introduce route-loading UI or first-visit fetch delays.
- Mount React underneath the boot overlay while preparation is happening. Do not delay the initial React mount until after preload work.
- The boot overlay may disappear only after the visible shell has a valid first geometry (especially navigation magnets), or after the documented maximum fallback deadline. `app ready` should mean the mounted interface is visually usable, not just that JavaScript finished importing.
- Hidden-under-overlay layout is allowed; `display: none` preflight is not, because geometry must remain measurable.
- Do not make normal route changes reconstruct or visibly re-pack the persistent navigation surface.
- Separate **geometry-affecting state** from **presentation/semantic state**. Route-active state, `aria-*` state, menu open/closed state, callback identity, and similar presentation changes must not trigger magnet layout when dimensions did not change.
- Active navigation styling must be dimension-neutral. Do not change font metrics, padding, gap, or other measured size merely to show the active route.

## Network boundary

- Basic app startup must not depend on Cloudflare/backend, Bluesky, third-party modules, analytics, or other remote services.
- Do not speculatively fetch the shared strategy feed during boot.
- Bluesky/OAuth network work is allowed only when required by an explicit sign-in/OAuth return, an explicitly requested profile action, or a genuinely remembered active account/session that must be restored.
- Shared/public strategy network requests should start when the user opens or refreshes that feature, not to make the local shell "ready."
- Local assets/data fetched from the app origin are part of the eager local-runtime preload contract and are distinct from remote account/feed work.

## CSS and runtime behavior

- Use CSS Modules for component/feature styling and the shared token layer for global design values.
- **Intentional UI color roles are Customizer-owned.** Do not introduce a standalone themed surface, accent, text, outline, or similar feature color that the Customizer cannot change. Reuse an existing theme token, derive from Customizer-owned tokens with `color-mix()`/opacity, or add a new `ThemeValues` role and wire it through the Customizer, presets, saved-theme prepaint, and regression coverage before consuming it. Fixed black/white is reserved for accessibility contrast, masks, asset/data visualization, or safe pre-CSS fallback—not independent themed surfaces or accents.
- Do not solve layout defects with runtime-injected CSS, page-specific style tags, JavaScript style monkey-patches, or accumulating override layers.
- Imperative CSS custom-property writes are appropriate for high-frequency magnet physics positions; do not route per-frame physics through React state.
- Fix ownership at the component/layout source. If a defect comes from lifecycle or measurement timing, repair the lifecycle rather than hiding the symptom with CSS.
- Avoid global CSS growth. Global styles are for reset/base/tokens; feature behavior belongs with the owning component.

## Performance rules

- Optimize unnecessary work, not intentional product behavior.
- Avoid rerender/re-layout cascades caused by object identity when the geometry is unchanged.
- Avoid repeated DOM reads inside hot loops when a value can be measured once per frame/pass.
- Large magnet boards should not remain permanently O(n²) when a spatial broadphase can preserve identical collision behavior.
- Play mode may sleep when physically settled only if all relevant input paths wake it immediately (pointer influence, drag/fling, device orientation, drop waves, resize/layout changes, etc.). A sleeping engine is still logically Play-on.
- Prefer build-time transformation for canonical data that otherwise performs the same legacy-to-runtime mapping on every cold start.
- "Preload the whole app" means the complete usable local runtime, not redundant copies of identical assets or build debris.

## Persistence and privacy

- Personal data stays device-local by default and goes through repository/storage boundaries rather than direct storage calls in presentation components.
- Do not add telemetry containing journal, inventory, observation, search, route-content, or other personal content.
- Performance diagnostics must remain local-only unless the user explicitly chooses otherwise.

## Verification and workflow discipline

For behavior-affecting work, add or update regression coverage at the same layer as the risk.

- `pnpm check` is the minimum foundation gate when the environment can run it.
- Use `pnpm check:all` for release-level/browser-sensitive work when Playwright is available.
- Startup/navigation changes should cover boot-overlay readiness and persistent nav geometry across route/menu state changes.
- Magnet changes should preserve drag/click suppression, compact/wide persistence, Play/rest transitions, and frame-level first-paint stability, plus the interaction invariants enumerated in `docs/magnet-behavior.md`.
- If connector-only work cannot run the local suite, rely on an existing repository validation path or one intentionally scoped branch validation and report that limitation explicitly; do not claim local validation that was not run.
- Do not create a push- or pull-request-triggered workflow merely to validate every small agent commit. Prefer the repository's existing CI, a manual `workflow_dispatch` validation, or a single deliberately scoped run before merge.
- Validation workflows should be permanent only when they represent a durable repository need. Temporary agent-only workflows must not remain configured to fire on every synchronization or commit.

## Documentation priority

`AGENTS.md` is the concise implementation contract. `docs/design-language.md` is the living record of accepted visual/interaction decisions and is required reading for UI work. `docs/magnet-behavior.md` is the canonical detailed magnet interaction/physics contract and is mandatory before magnet work. **Before changing explanatory, psychological, behavioral, health, or research-facing copy, read `docs/content-evidence-review.md` and follow its approval ledger.** `docs/architecture.md` and `docs/ux-stability-roadmap.md` provide the deeper rationale and measurable targets. When older prose conflicts with an explicit later product decision recorded here or in the design-language record, update the older documentation rather than following the stale sentence.
