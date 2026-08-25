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

## Touch and control sizing

- Important direct touch controls should retain an approximately 44px touch target even when their visible treatment is compact.
- Compact controls can use smaller typography and tighter internal padding, but should not become difficult to tap.
- Disabled/unavailable actions should remain understandable through state and context rather than simply disappearing when the function still matters to the user.

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
- Strategy cards remain tactile/prominent, but mobile card padding, border weight, and shadow should be more restrained than desktop chrome.
- Do not shrink or reintroduce instability into the stable-viewport one-at-a-time strategy deck merely to save space; density improvements should come from surrounding chrome and card padding first.
- Add-a-strategy forms keep every existing field and save capability. Related short fields such as optional name/location may share a row on normal phone widths, with a one-column fallback on very narrow screens.

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
- Previous/next deck navigation uses compact circular arrow controls with the position count between them.
- In one-at-a-time mode, horizontal swipes on the card deck move to the previous/next strategy while vertical gestures remain normal page scrolling; interactive controls inside a card do not initiate deck swipes.
- The focused deck also supports Left/Right Arrow navigation as a non-pointer alternative.
- Mobile deck height should use stable viewport sizing rather than dynamic viewport height, so Safari browser chrome does not visibly squash or stretch the card while scrolling. Give the deck generous vertical space before its card body becomes internally scrollable.
- In one-at-a-time mode, keep the deck metaphor visibly legible: when enough cards exist, two rear cards should visibly peek beneath the active card. Rear layers must stay horizontally contained inside the deck; use inward scaling and vertical offsets rather than viewport-expanding side offsets.
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

- Treat the feed as a compact app list rather than a stack of oversized web-form cards.
- Filters stay easy to scan but should use restrained labels, borders, and vertical space.
- Strategy title/body/author metadata establish the hierarchy; chips and Save actions are secondary.
- Visibility and supported-needs metadata may use compact chips/popovers.
- `Save to inventory` should remain clearly actionable without becoming the visual focus of every card.
- Feed scope, sort, Bluesky state, Needs-supported details, and save behavior must not be lost during visual cleanup.

## Decision log

### 2026-08-24

- Customizer redesigned toward compact iOS-settings-like density while preserving every control.
- Local-storage deletion demoted to low-prominence destructive footer text.
- Customizer sections must remain intrinsically sized in the scroll grid so Appearance and Device cannot collapse away.
- Native color swatch is the actual color input: drag adjusts; tap opens the platform picker.
- Shared strategy feed and Need-detail strategy controls moved toward denser app-like presentation without behavior changes.
- Shuffle standardized on the existing crossed-arrows icon-only browser control.
- Strategy view-mode icons standardized to depict the destination card arrangement.
- Need-detail one-at-a-time strategy decks restored horizontal swipe navigation with vertical-scroll gesture discrimination and Left/Right Arrow support.
- Need-detail mobile strategy cards use stable viewport sizing and more available screen height so iOS browser chrome does not resize them during page scrolling.
- Need-detail mobile title/evidence/sources/form chrome was compacted so supporting information consumes less screen before Strategies without hiding any content or controls.
- Needs index mobile search/title spacing was tightened while retaining the canonical Shuffle control and full magnet behavior.
- Personal strategy composers are now local/private first: Bluesky sharing appears only for active sessions, signed-out public-export status moves to advanced overflow, disabled profile-save ghosts disappear, and the composer ellipsis lives at the bottom right.
- Need-detail one-at-a-time strategy decks keep two visible rear-card layers when available, using vertically offset inward layers that preserve the no-horizontal-overflow invariant.
