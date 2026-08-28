# allneeds design language

This is the living visual/interaction design record for `allneeds` V2. Read it before changing UI presentation. It complements `AGENTS.md`: the agent contract governs implementation boundaries; this document records visual decisions the user has explicitly accepted.

## How to use this document

- Reuse an accepted pattern before inventing another treatment for the same job.
- Preserve behavior while improving presentation. A design pass must not remove, hide, disable, or silently relocate an existing function unless the user explicitly asks for that behavior change.
- When the user approves a new visual pattern, record it here in the same PR that implements it.
- When a later explicit decision supersedes an older one, update the older rule rather than accumulating contradictory variants.
- Prefer a shared component when the same control is genuinely reused and extracting it does not create unnecessary abstraction. Otherwise match the canonical source implementation closely and keep this document pointed at the canonical source.

## Overall character

allneeds should feel tactile, calm, compact, and app-like rather than like a collection of generic web forms.

- Preserve the playful magnet identity where magnets are the product interaction.
- For settings, feeds, utility controls, and secondary actions, favor compact native-app density: clear grouping, short labels, restrained borders, and less repeated explanatory copy.
- Space efficiency should come from hierarchy and grouping, not by making controls cryptic or removing capabilities.
- Use icons for familiar actions when they reduce reading load. Keep text when the icon alone would be ambiguous.
- Avoid oversized decorative buttons for routine utility actions.
- Use Customizer-owned theme tokens and derived `color-mix()` values rather than introducing independent hard-coded theme colors.

## Functional theme roles

**Accepted 2026-08-25.** The Customizer palette is defined by what each color does, not by the hue shipped in the default preset.

- The canonical editable roles are `Primary`, `Quiet`, `Text`, `Secondary`, `Action`, `Positive`, `Attention`, `Selection`, and `Outline`. Runtime code uses the corresponding `--primary`, `--quiet`, `--text`, `--secondary`, `--action`, `--positive`, `--attention`, `--selection`, and `--outline` custom properties.
- Default colors are only defaults. A role must keep the same semantic job when a preset or user customization changes its hue completely.
- Do not introduce hue-named runtime aliases for these roles. Older saved themes may still contain the former hue-keyed fields, but those names belong only in the persisted-theme migration/read boundary and must never be emitted by new saves.
- Presets, Customizer state, magnet tone props/classes, feature CSS, startup prepaint, and regression tests all use the functional role vocabulary.
- The Design Lab main and actual-size previews inherit the live Customizer palette and roundness from the page. The lab must not maintain duplicate live palette or roundness controls. Fixed preset-comparison swatches may render independent preset snapshots because their purpose is explicit side-by-side comparison.
- The semantic-vocabulary regression test is permanent and should fail if a removed hue-named CSS token or magnet tone is reintroduced into runtime source.

## Need magnet identities

**Accepted 2026-08-25; refined 2026-08-27.** Need magnets may develop distinct full-face identities while preserving the shared physical magnet shell.

- Identity work must not change shared shell padding, border/shadow semantics, physics, pickup behavior, or Customizer roundness. Visual identity belongs inside the existing shell. Explicitly approved icon content may change a particular magnet's measured intrinsic width, as with a two-sided icon treatment, but the shared board must measure that real geometry normally rather than patching or faking dimensions.
- Full-face art should use Customizer-owned functional roles and remain legible across every real preset, including near-monochrome Refrigerator. Do not hard-code rescue colors for one design.
- Primary Need icons should remain visually distinct across the site. Before proposing a new Need identity, compare its primary glyph with the full existing Need-icon inventory and approved identities. Do not reuse another Need’s primary glyph as the main symbol. A familiar motif may appear only as a subtle secondary echo when relatedness is intentional, unless the user explicitly approves stronger reuse.
- Multiple visible icons on one Need magnet require an approved conceptual reason, such as distinct function lenses. A unified Need without lenses should default to one primary icon, with additional meaning carried by full-face artwork rather than extra glyphs.
- The live Design Lab at `/design-lab/need-magnets` is the canonical approval surface. Main/actual-size candidates inherit the real page Customizer, fixed rows show every preset, and candidates should be judged through the full 0–200% roundness range.
- Standalone mockup HTML is not the normal audit path. Put previews into the live lab unless the user explicitly asks for an offline artifact.
- Production controls are optional comparison aids. Remove them when the direction has narrowed or they waste review space. Once a candidate is approved and promoted, remove it from the active lab set; Git history is the archive.
- If a concept intentionally removes the visible icon while keeping its label offset, preserve the real icon slot and hide only the glyph rather than faking the spacing with audit-only padding.
- Artwork intended to meet a magnet edge must reach the true SVG/view-box edge, especially at 0% roundness where accidental gaps become obvious.
- **Connection · Constellation is the first approved Need identity.** It retains the existing Connection link icon, uses a networked path-and-node mask across the full face, and derives its icon/art fade from `Positive` to `Primary` over a `Selection`/`Quiet` face. Canonical production references are `src/features/needs/NeedsPage.module.css` and `public/icons/needs/art/connection-constellation.svg`.
- **Safety · Layered Cover is approved.** It replaces the generic shield with an umbrella icon and uses three overlapping full-face cover layers to communicate buffered protection rather than security-software branding. Its face mixes `Quiet` with `Selection`; the umbrella fades from `Primary` toward `Positive`; and the layered artwork blends `Primary`/`Positive` into `Action`/`Primary`. Canonical production references are `src/features/needs/NeedsPage.module.css`, `public/icons/needs/safety.svg`, and `public/icons/needs/art/safety-layered-cover.svg`.
- **Understanding · Converging Map (U4D) is approved.** It pairs a route-map icon on the left with a perspective-pair icon on the right so the magnet gestures toward the approved `Making sense` and `Understanding between people` lenses without splitting the Need. Two full-face fields converge toward the center to communicate one workable picture built from distinct orientations. The face blends `Quiet`/`Selection` into `Selection`/`Action`; the route-map uses `Primary`, the perspective-pair uses `Secondary`, and the converging art fades from `Primary` to `Action` at restrained opacity. Canonical production references are `src/features/needs/NeedsPage.module.css`, `public/icons/needs/understanding.svg`, `public/icons/needs/understanding-perspective.svg`, and `public/icons/needs/art/understanding-converging-map.svg`.
- **Clarity · Pulse (C4B) is approved.** It pairs a Focus icon on the left for `Making things explicit` with a Compass icon on the right for `Getting clear within yourself`. A continuous pulse runs across the face to show both lenses as ways of reading or locating relevant distinctions more clearly. The face blends `Quiet`/`Selection` into `Selection`/`Positive`; the Focus icon derives from `Primary`/`Text`, the Compass from `Positive`/`Text`, and the pulse art fades from `Primary` toward `Positive`/`Text`. Canonical production references are `src/features/needs/NeedsPage.module.css`, `public/icons/needs/clarity.svg`, `public/icons/needs/clarity-compass.svg`, and `public/icons/needs/art/clarity-pulse.svg`.

- **Honesty · Heart to Honesty (H1) is approved.** It uses one Honesty-specific heart-and-voice icon, with a corrected-path field behind it. A faint abandoned route ends before the label area while the stronger route resolves toward the `Honesty` label, making the Need itself read as the destination rather than something being crossed through. The face blends `Quiet`/`Selection` into `Selection`/`Quiet`; the icon derives from `Primary`/`Text`; and the corrected-path art fades from `Primary`/`Text` toward `Action`/`Text`. Canonical production references are `src/features/needs/NeedsPage.module.css`, `public/icons/needs/honesty.svg`, and `public/icons/needs/art/honesty-corrected-destination.svg`.

- **Accountability · Responsibility Mosaic (A1) is approved.** It replaces the former clipboard/checkmark compliance metaphor with one Accountability-specific four-piece mosaic icon and a larger field of contributing pieces. The composition represents recognizing the part that is ours without claiming the whole outcome, matching the audited distinction between responsibility and totalizing blame. The face blends `Quiet`/`Selection` into `Selection`/`Positive`; the icon derives from `Primary`/`Text`; and the mosaic art fades from `Primary`/`Text` toward `Action`/`Text` at restrained opacity. Canonical production references are `src/features/needs/NeedsPage.module.css`, `public/icons/needs/accountability.svg`, and `public/icons/needs/art/accountability-responsibility-mosaic.svg`.

## Magnet physics

**Accepted 2026-08-25; superseded and expanded 2026-08-25.** A magnet being actively held behaves like a pressure source above the shared magnet surface. Think of lifting it as pushing air down into the board: nearby resting magnets are forced radially away, then their own motion, coupling, and collisions carry that disturbance outward through the packed container.

- This is an enhancement to the existing physics, not a replacement: preserve pickup alignment, direct drag tracking, fling/release behavior, collisions, wobble, empty-space pushing, persistence, and Play/rest semantics.
- The held magnet remains attached to the pointer and is conceptually above the surface, so resting magnets yield to its pressure rather than pushing the held magnet off the pointer.
- Pressure reach scales from the physical sizes of the interacting magnets instead of using a separate displacement target. The held interaction applies acceleration/force; normal damping, mass, edge restitution, and collision response dissipate the energy.
- Do not impose a special held-state speed cap on neighboring magnets. The board is one physics system: while one magnet is held, all resting magnets must continue their ordinary surface coupling and hard-contact response so motion can propagate beyond the first neighbor as a visible ripple through tightly packed magnets.
- The response should be clearly perceptible on both desktop and touch without becoming an unbounded explosion; tune force, damping, mass, and restitution rather than stopping propagation with an artificial per-neighbor cap or by disabling resting-resting collisions.
- Pointer pickup is direct manipulation, not a focus treatment. A pointer-held magnet must not acquire an extra focus/selection ring; keyboard focus remains visibly indicated when navigating without pointer pickup. Do not implement this by hiding a held-state focus ring in CSS—prevent pointer pickup from creating/retaining that focus state at the interaction source.

## Touch and control sizing

- Important direct touch controls should retain an approximately 44px touch target even when their visible treatment is compact.
- Compact controls can use smaller typography and tighter internal padding, but should not become difficult to tap.
- Disabled/unavailable actions should remain understandable through state and context rather than simply disappearing when the function still matters to the user.

## Body-cue match language

**Accepted 2026-08-27.** Preserve Body Cues as a first-class tactile experience and use one shared body-clue scorer wherever its authored associations appear.

- Display a whole-number `Clue match` as fit to the cues the person entered, not as probability, confidence, certainty, accuracy, diagnosis, or a share of all possible Feelings.
- Candidate matches are independent. They do not have to sum to 100, and the first-ranked candidate must not become 100 merely because it ranks first.
- Body Cues and the body channel within Alexithymia Support read the same forward association strengths and use the same formula. Do not restore the legacy per-emotion-normalized reverse weights as a scoring path.
- Compass candidates do not display percentages until that clue channel has its own approved numerator, denominator, and missing-data behavior.
- `Not this time` is a current-check-in choice outside the score. It must not create a device-wide penalty for that Feeling in unrelated situations.

## Alexithymia Support check-in

**Accepted 2026-08-28.** Alexithymia Support is a four-stage, present-moment working surface: `What happened?`, `Clues`, `Words`, and `Your words`. It is not a lesson, detached practice mode, diagnostic test, treatment, or strategy library.

- At compact widths, use a full-bleed mobile stage with a compact app bar, safe-area padding, one immediate job, and a persistent next action. Do not restore the legacy stack of outlined region cards or expand every option into the page.
- Body and Feeling shape are optional peer clue cards. Body opens one canonical region at a time in a bottom sheet and returns selections to a compact clue tray; the full Body Cues page remains available as its own tactile experience.
- Feeling and Need choices reuse the shared `MagnetBoard`. Candidate details, score explanations, and full Need browsing open in focus-managed sheets so research copy does not displace the working task.
- Use familiar icon-only controls for Back, Close, Info, Copy, Read aloud, and Journal when context supplies the label; retain accessible names and approximately 44px targets. Keep text for semantic choices such as `Fits`, `Maybe`, `Not this time`, and `No word yet`.
- `Clue match` is a compatibility estimate derived only from clues the person chose. Candidate decisions and selected Needs remain direct user choices outside the score.
- The final composer may use only the person's observation, selected words, and selected Needs. It must not infer a Need, generate a request, or offer a lane-local care recommendation. Selected Need magnets route to the canonical Need pages and their strategy decks.
- Drafts resume the same stage after route changes, reload, or iOS backgrounding. `Start over` is the explicit destructive boundary.

## Canonical utility controls

### Shuffle

**Accepted 2026-08-24.** The canonical Shuffle treatment is the icon-only crossed-arrows control used on the Feelings and Needs magnet browsers.

Canonical references:
- `src/features/feelings/FeelingsPage.tsx`
- `src/features/feelings/FeelingsPage.module.css` (`.shuffle`)
- `src/features/needs/NeedsPage.tsx`
- `src/features/needs/NeedsPage.module.css` (`.shuffle`)

Visual/interaction contract:
- crossed-arrows shuffle SVG, not a circular refresh arrow;
- icon-only when surrounding context makes Shuffle clear;
- accessible `aria-label` remains required;
- roughly square 44px touch target;
- white/light surface, strong theme outline, `var(--radius-lg)` corners;
- small tactile downward shadow and a slight lifted hover/focus state;
- do not create a separate pink text-pill Shuffle variant for another page.

### View mode / card arrangement

**Accepted 2026-08-24.** A view-mode icon should preview the arrangement the action will produce.

- **View all:** show multiple cards arranged vertically, matching the expanded strategy list.
- **View one at a time:** show overlapping/stacked cards, matching the deck presentation.
- Do not use a generic table/grid glyph when the resulting layout is specifically a vertical card list.
- Keep the text label where it meaningfully disambiguates the mode.

## Compact settings language

**Accepted 2026-08-24.** The Customizer is the canonical reference for dense settings UI.

References:
- `src/features/customizer/CustomizerPanel.tsx`
- `src/features/customizer/CustomizerPanel.module.css`

Rules:
- Prefer compact settings rows over large stacked form cards.
- Lead with a small recognizable icon, a short title/status, and a trailing control.
- Avoid repeating the same explanation in both a heading and helper paragraph.
- Group related settings into visually coherent sections that contribute their full intrinsic height to the scroll layout; never allow compacting to collapse a functional section out of view.
- Device capability controls should remain visible as an explicit Device section even when a capability is unavailable.
- Native browser controls should be used directly when platform behavior depends on a trusted user gesture (for example the color picker on iOS Safari).

## Color editing

**Accepted 2026-08-24.** Customizer color swatches support two gestures:

- drag the swatch to adjust color quickly;
- tap the native color-input swatch to open the platform picker.

The visible swatch itself is the native `input[type=color]`; do not replace it with a button that programmatically clicks a hidden color input on iOS Safari.

## Account sign-in recovery

**Accepted 2026-08-25.** Bluesky username mistakes should be recoverable inside the Account & data panel.

- Check that a syntactically valid Bluesky username resolves before navigating away to Bluesky authorization.
- Keep a missing/invalid username in the panel and show a concise inline message directly beneath the Sign in control so the person can correct it immediately.
- Distinguish an unresolvable username from a temporary Bluesky/network failure; do not tell someone their username is wrong when availability is the actual problem.
- Error notices use the existing functional theme roles and an accessible alert announcement rather than a browser/Worker JSON error surface.

## Profile sync and shared-strategy refresh

**Accepted 2026-08-26.** Account and update actions should expose their real stages instead of collapsing several network operations into one indefinite busy state.

- `Save this browser` first saves the browser snapshot, then reconciles Public/Followers strategies. Once the snapshot succeeds, report its exact local save time while strategy sync continues; completion reports its own exact time and the number of browser strategies reconciled.
- Do not describe the whole operation as merely “Saving…” after the profile snapshot is already durable. A later strategy-sync failure must preserve and report the successful snapshot-save fact.
- Profile save uses one streamed Worker request. The browser sends a complete authoritative strategy snapshot, while the Worker compares it with one owner read and writes only changed/new strategies, changed Need relationships, and strategies that must be unpublished. Do not rely on a browser-only change log for profile correctness across restores or multiple devices.
- The branded first load owns resolution of the Public/Most recent shared-strategy snapshot: it reuses a recently checked persistent snapshot when available and otherwise owns one eager request. Need pages and the Shared Strategies screen reuse that cache and its in-flight promise instead of opening additional requests.
- Shared Strategies includes a visible **Refresh shared strategies** action for installed iOS use. It performs one explicit refresh of the current scope and reports the exact local completion time without reloading the app shell.
- Sort the already-fetched snapshot in the browser. Changing sort must not make another Worker request; selecting the signed-in Following scope may request its distinct snapshot.
- Persist the successfully checked Public/Most recent snapshot for one hour. A full reload may satisfy the branded preload from that complete browser snapshot with no Worker request, while the page reports when it was last refreshed. This is a bounded freshness claim, not proof that the server has not changed; manual Refresh always bypasses it.
- A recently verified account may be reused from session-scoped browser storage for the same one-hour window so repeated reloads do not call `/api/me`. Private/profile operations remain server-enforced, and a new browser-app session validates normally.

## App identity and social sharing imagery

**Accepted 2026-08-25.** The legacy three-door mark remains the canonical app/favorite/share identity.

- Preserve the complete legacy favicon, Apple touch icon, Android/maskable icon, Safari pinned-tab, Windows tile, web-manifest, and social-card asset set.
- The document head must advertise format fallbacks and platform-specific icons explicitly; do not rely on a browser inventing a letter tile from the page title.
- Open Graph and Twitter sharing metadata use the legacy three-door social cards and accessible image text.

## Destructive / advanced actions

**Accepted 2026-08-24.** Rare destructive maintenance actions should not compete visually with normal tasks.

- `Delete local storage` is deliberately tiny, low-prominence footer text in the Customizer rather than a large colored button.
- It should remain findable to someone intentionally looking for it and retain confirmation before deletion.
- Reset is secondary utility UI, not a dominant CTA.

## Need pages

**Accepted 2026-08-24.** Mobile Need pages should use the available screen like a compact native reading interface while preserving every disclosure, source, strategy, save, navigation, and form function.

### Need detail mobile hierarchy

- The need icon/title is an identity header, not a hero banner: keep it clear but compact, with restrained gaps and mobile title sizing.
- Evidence is supporting reading content rather than a giant standalone card. On mobile use tighter padding, lighter borders/shadows, and compact section spacing while keeping the claim fully readable.
- `Details` and `Citations` are secondary disclosure controls. Their visible treatment should be small and quiet while retaining an approximately 44px touch target and the existing expand/collapse behavior.
- Supporting-source labels and numbered source links may share one row on ordinary phone widths; narrow screens fall back to a single-column flow rather than clipping content.
- Expanded citation rows use compact numbering and typography but must retain the full description and external link.
- Strategy cards remain tactile/prominent, but mobile card padding and border weight should be restrained. In stacked mode, do not fake depth with repeated heavy drop shadows; the visible rear cards themselves provide the depth cue. View-all cards may retain only a subtle lift.
- Do not shrink or reintroduce instability into the stable-viewport one-at-a-time strategy deck merely to save space; density improvements should come from surrounding chrome and card padding first.
- Add-a-strategy forms keep every existing field and save capability. Related short fields such as optional name/location may share a row on normal phone widths, with a one-column fallback on very narrow screens.

### Function lenses within a Need

**Accepted 2026-08-26.** When a Need has approved function lenses under `docs/need-function-lenses.md`, the page should teach the distinction without turning one Need into competing mini-pages.

- Keep the canonical Need title and umbrella claim above the lenses.
- Introduce the group with the compact heading **This need can involve** or an approved equivalent.
- Keep all lenses readily visible at the same time. Do not use tabs or another default interaction that hides one function behind another.
- Each lens uses a restrained reading card with a plain-language title, optional first-person recognition cue, short explanation, quiet `Details` disclosure, and its own source/citation disclosures.
- Citation numbering restarts within each lens because the evidence sets are locally owned by that lens.
- Stack lenses on narrow screens. Wider screens may place them side by side when the text remains comfortably readable.
- Lens surfaces and borders derive only from functional Customizer roles. Do not assign fixed semantic colors to individual lenses or create Need-specific lens chrome.
- The component is generic and data-driven. A Need with no lenses retains the existing Need-page presentation unchanged.
- Canonical production references are `src/features/needs/NeedFunctionLenses.tsx` and `src/features/needs/NeedFunctionLenses.module.css`.

### Needs index mobile hierarchy

- Keep Search + the canonical Shuffle control in one compact toolbar.
- Search should use a normal mobile touch height (about 44px), restrained border/shadow, and should not visually outweigh the magnet board.
- Reduce ornamental gaps around the title, toolbar, and board rather than removing magnet interaction or browse functions.

## Strategy UI

**Accepted 2026-08-24.** Strategy browsing should be information-first with compact controls.

### Need detail strategy cards

- Keep strategy cards themselves tactile and prominent.
- Strategy browsing controls should be lighter than the cards.
- Device/Profile save actions use compact icon + text controls; do not let routine save controls dominate the card.
- Strategy-specific supporting evidence is a reference link, not a second paragraph of card content. Present it as a small, subdued, recognizably underlined external-link treatment for people who want the source; keep the full source description available through accessible labeling/title metadata.
- Previous/next deck navigation uses compact circular arrow controls with the position count between them.
- **Superseded 2026-08-24:** do not arbitrate active-card touches between horizontal deck swiping and vertical page scrolling. In one-at-a-time mode, a single-finger touch that begins on the non-interactive face of the active strategy card belongs to the card for the duration of that gesture; normal vertical page scrolling starts outside the card or in View All.
- Direct manipulation is the canonical one-at-a-time gesture: the active card must track the pointer horizontally while held, with a small restrained rotation/vertical follow so it feels physically attached to the thumb. Releasing beyond the distance/velocity threshold carries that card off-screen and advances in the drag direction; an incomplete drag springs the same card back into place.
- Left drag reveals and advances to the **next** strategy. Right drag reveals and returns to the **previous** strategy. The rear-card stacking order must switch with drag direction so the card being revealed is the card the gesture will actually select.
- Interactive controls inside a strategy card (links, buttons, inputs) remain normal controls and do not initiate card dragging.
- The focused deck also supports Left/Right Arrow navigation as a non-pointer alternative.
- Mobile deck height should use stable viewport sizing rather than dynamic viewport height, so Safari browser chrome does not visibly squash or stretch the card while scrolling. Give the deck generous vertical space before its card body becomes internally scrollable.
- In one-at-a-time mode, keep the deck metaphor visibly legible and legacy-inspired: when enough cards exist, the two rear cards should peek beneath **and slightly to opposite sides** of the active card with small opposing rotations. Create the side peeks inside an inset deck gutter and horizontally clip the stack so the transforms can never widen the page or create horizontal scrolling.
- Stacked cards should not each cast a large downward shadow. Use borders, offsets, and the physical rear-card layers for depth; repeated shadow bands make the stack look artificially thick.
- Before Shuffle, default strategy order favors human contributions over system-generated strategies. Named user contributors come first, then other user-made strategies, then system strategies, while preserving the source order within each tier. Once the user presses Shuffle, keep the shuffled order until the deck is reinitialized; do not silently re-prioritize it.
- Shuffle uses the canonical Shuffle control above.
- View-all/view-one icons follow the destination-arrangement rule above.
- All existing save, profile, shuffle, view-mode, previous/next, swipe, and keyboard functionality must remain present during visual cleanup.

### Personal strategy composer and sharing

**Accepted 2026-08-24; superseded and refined 2026-08-24.** The composer is **local/private first**. Bluesky is an optional enhancement for people who are already signed in, not part of the default mental model for adding a strategy.

Canonical references:
- `src/features/inventory/InventoryPage.tsx`
- `src/features/inventory/StrategySharingFields.tsx`
- `src/features/inventory/StrategySharingFields.module.css`
- `src/features/inventory/personalStrategiesExport.ts`
- `src/features/needs/NeedDetailPage.tsx`

Rules:
- The signed-out Add Strategy experience should read as a simple local form: strategy name, description, Needs, optional contributor information, and one obvious device-save path.
- Do **not** show Bluesky-oriented audience controls or a disabled `Save to profile` ghost while signed out. Those controls become visible when there is an active Bluesky session.
- When signed in, show one compact **Bluesky sharing** audience row with `Private`, `Followers`, and `Public`, plus the working profile-save/sync action.
- `Private` remains the default. `Public` remains the canonical saved state that makes a personal strategy eligible for the bulk **Share your strategies with Nat…** export.
- Signed-out users must not lose that export capability: advanced Public/Private export visibility remains available inside the composer overflow menu rather than occupying the main form.
- The composer form should use clean, restrained native-app field chrome. Avoid a large colored legacy-style panel, oversized textareas, or disabled secondary actions that consume equal visual weight with the primary save task.
- Keep the roughly 44px **ellipsis action menu** as the final bottom-right utility control in the composer. Do not place it in the title/header row.
- The composer ellipsis includes **Share this strategy with Nat…**. It must use the composer's normal device-save path first so required fields, duplicate handling, persistence, and the selected sharing state remain canonical; only a strategy that was actually saved may then be exported.
- Composer one-off sharing downloads a file containing only the newly saved strategy and exposes the pre-addressed email follow-up. It must not change the selected or saved sharing state.
- Keep the existing strategy name, description, Needs picker, optional contributor fields, device save, profile sync (when available), direct Nat share, and bulk-export eligibility functions.
- Personal strategy cards show a quiet `Private`, `Followers`, or `Public` status; sharing state should be legible without becoming the visual focus of the card.
- Secondary and maintenance actions belong behind a roughly 44px ellipsis control on personal strategy cards.
- The card ellipsis includes **Share this strategy with Nat…** as an immediate one-off action. It downloads a file containing only that strategy and offers the pre-addressed email follow-up.
- A one-off Nat share is an explicit action, not a privacy mutation: sharing a Private strategy once must not silently make it Public or include it in later bulk exports.
- Edit and Remove remain secondary actions in the card ellipsis. Do not add a second always-visible Nat-export eligibility toggle there.
- Bulk Nat export includes only personal strategies whose saved sharing state is `Public`.

### Shared strategy feed

**Accepted 2026-08-26.** Shared Strategy cards belong to the same visual family as strategy cards on Need pages; the feed adds browsing controls, not a competing social-network card language.

- Use the Need-page strategy-card hierarchy as the canonical visual reference: `Positive` strategy surface, strong `Outline`, rounded tactile card geometry, title/body first, compact utility actions, and restrained lift rather than generic white social-post cards.
- Feed cards are content-sized rather than fixed-height decks, but their title, body, save-action, and utility-control treatment should remain recognizably related to Need-page strategy cards.
- Place contributor attribution at the **bottom-right** of the card as quiet metadata rather than leading the card with an avatar/profile header.
- Public feed attribution is contributor-controlled. Show only the explicit contributor **name** and **location** supplied with the strategy. Do not expose or synthesize a visible identity from Bluesky display name, handle, DID, or other account metadata when those contributor fields were not provided.
- A timestamp may follow the contributor line as quiet feed metadata; it should not outweigh the strategy content.
- Filters stay easy to scan but should use restrained labels, borders, and vertical space. Explicit Refresh is a compact utility control with its accessible name preserved.
- Signed-in card utilities should compress according to meaning rather than expanding every state into a text pill: visibility is an icon-only status (`Public` globe, `Followers` people, `Private` lock, moderation-hidden eye-slash) with an accessible label/title; owner Edit is icon-only; an already-saved strategy is a check-only status; the Needs disclosure keeps the short visible label `Needs`; an unsaved `Save` keeps text because it is an important action rather than passive state.
- On ordinary phone widths, the signed-in utility row should remain on one line when those compact controls fit. Do not widen the document or introduce horizontal scrolling to force the row; very narrow screens may wrap as a fallback.
- Feed scope, sort, Bluesky sign-in gating for Following, refresh/cache behavior, Needs-supported details, owner Edit, moderation controls, and inventory-save behavior must not be lost during visual cleanup.

## Decision log

### 2026-08-27

- Clarity's **Pulse (C4B)** became the approved production Need-magnet identity: Focus for `Making things explicit`, Compass for `Getting clear within yourself`, and one continuous pulse spanning both sides. The treatment remains Customizer-owned, uses the existing shared two-sided magnet pattern, and does not alter shared shell or physics behavior.

### 2026-08-26

- Understanding's **Converging Map (U4D)** became the approved production Need-magnet identity: route-map for `Making sense`, perspective-pair for `Understanding between people`, and two full-face fields converging toward one center. The treatment remains Customizer-owned and preserves the shared physical magnet shell and physics while allowing the explicitly approved second icon to participate in normal measured width.
- Need function lenses became an accepted optional Need-page pattern: approved lenses remain visible together under `This need can involve`, own their local Details/citations, stack on narrow screens, and use generic Customizer-owned chrome rather than tabs or Need-specific rendering. Understanding is the first approved use.
- Signed-in Shared Strategy card chrome was compacted by meaning: visibility, owner Edit, and already-Saved states use familiar icon-only treatments with accessible names, while Needs and unsaved Save retain short text where the action would otherwise be ambiguous.
- Shared Strategies now reuse the Need-page strategy-card language instead of a separate social-post card treatment; contributor name/location sit quietly at bottom-right and visible feed attribution never falls back to Bluesky handles/display names/DIDs.
- Profile snapshot save and shared-strategy reconciliation now share one streamed request, report separate stages and exact local times, and write only server-side strategy deltas. Shared Strategies provides the explicit installed-iOS refresh action while sort and page navigation reuse the eager startup snapshot.
- Repeated reloads now reuse a one-hour public-feed snapshot and session-scoped account verification instead of repeatedly invoking the Worker; public-feed misses also skip the irrelevant signed-in session query.

### 2026-08-25

- Bluesky sign-in now verifies the entered username before leaving allneeds, reports typos inline beside the control, and distinguishes username mistakes from temporary lookup failures.
- The legacy three-door app identity is explicitly restored across Safari/iOS favorites, Apple touch icons, favicon fallbacks, pinned tabs, Android/maskable icons, Windows tiles, and Open Graph/Twitter sharing cards.
- Safety's Layered Cover treatment became an approved production Need-magnet identity: the generic shield is replaced with an umbrella icon, the face uses overlapping protective layers, and the palette remains entirely derived from functional Customizer roles without changing the shared magnet shell or physics.
- Connection's Constellation treatment became the first approved Need-magnet identity: full-face node/path artwork with the existing link icon, all derived from functional Customizer roles without changing the shared magnet shell or physics.
- Need-magnet concept work now belongs in the deployed Design Lab rather than standalone preview HTML by default; controls are removed when no longer useful, and approved designs leave the active review set after promotion.
- Theme internals now use functional Customizer roles site-wide instead of hue-named runtime tokens. Legacy hue-keyed saved themes are migrated only at the read/prepaint boundary, and the Design Lab inherits the live Customizer palette and roundness rather than maintaining duplicate controls.
- Held magnets now act as pressure sources above a single shared physics surface: local force pushes nearby magnets outward, resting-resting coupling and collisions remain active so the disturbance can ripple through a packed board, and the former lifted-neighbor speed cap/suppression code is removed. Pointer pickup continues to suppress pointer-created focus at the interaction source rather than hiding a held focus ring.

### 2026-08-24

- Customizer redesigned toward compact iOS-settings-like density while preserving every control.
- Local-storage deletion demoted to low-prominence destructive footer text.
- Customizer sections must remain intrinsically sized in the scroll grid so Appearance and Device cannot collapse away.
- Native color swatch is the actual color input: drag adjusts; tap opens the platform picker.
- Shared strategy feed and Need-detail strategy controls moved toward denser app-like presentation without behavior changes.
- Shuffle standardized on the existing crossed-arrows icon-only browser control.
- Strategy view-mode icons standardized to depict the destination card arrangement.
- Need-detail one-at-a-time strategy decks now use direct manipulation: the active card owns its touch gesture, follows the thumb, springs back when incomplete, and exits to select the next/previous card when completed. Vertical page scrolling is intentionally suppressed for touches that start on the active card face.
- Need-detail mobile strategy cards use stable viewport sizing and more available screen height so iOS browser chrome does not resize them during page scrolling.
- Need-detail mobile title/evidence/sources/form chrome was compacted so supporting information consumes less screen before Strategies without hiding any content or controls.
- Needs index mobile search/title spacing was tightened while retaining the canonical Shuffle control and full magnet behavior.
- Personal strategy composers are now local/private first: Bluesky sharing appears only for active sessions, signed-out public-export status moves to advanced overflow, disabled profile-save ghosts disappear, and the composer ellipsis lives at the bottom right.
- Need-detail one-at-a-time strategy decks use legacy-inspired opposing side peeks/rotation inside a clipped inset gutter so the deck feels playful without reintroducing horizontal page overflow.
- Strategy-card evidence links were demoted to compact underlined `Supporting source ↗` references so evidence does not compete with the strategy itself.
- Stacked strategy decks use the rear cards themselves for depth rather than repeated heavy drop shadows; View All retains only a subtle card lift.
- Fresh strategy decks prioritize named human submissions, then other user-made strategies, then system strategies; explicit Shuffle temporarily overrides that ordering.
