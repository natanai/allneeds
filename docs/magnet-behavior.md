# Magnet behavior contract

This is the canonical interaction/physics specification for allneeds magnets. It is intentionally more detailed than the general design-language notes so future work has one place to check before changing `MagnetBoard`, magnet CSS, persistence, or related tests.

**Before changing magnet behavior, read this file and `AGENTS.md`.** If a later user decision supersedes anything here, update this document in the same PR that changes the implementation. Do not keep the old behavior dormant behind unused constants, selectors, flags, branches, or fallback paths.

## Core mental model

Magnets are physical objects on one shared surface, not cards with drag animations.

- Play/physics is on by default.
- A held magnet is conceptually lifted above the surface and stays attached to the pointer.
- While held, that magnet acts like a pressure source above the board: imagine air being pushed downward from it. Nearby resting magnets are accelerated radially away, and their normal coupling/collisions carry that disturbance outward through tightly packed magnets.
- Resting magnets remain part of the same physics system while another magnet is held. Their collisions and surface coupling must not be disabled merely to make drag handling easier.
- Motion should be clearly perceptible but self-damping, not explosive. Tune force, mass, damping, restitution, and coupling rather than clipping the visible effect with an artificial one-hop displacement or special lifted-neighbor speed cap.

Canonical implementation: `src/components/magnets/MagnetBoard.tsx`.

## Current physics tuning

These values are tuning anchors, not an invitation to duplicate physics in another layer. If they change, update this section in the same PR.

| Behavior | Current value / rule |
| --- | --- |
| Linear drag | `3.2` |
| Edge restitution | `0.16` |
| Magnet collision restitution | `0.07` |
| General surface influence radius | `170px` |
| General surface coupling | `0.14` |
| Held pressure reach | `1.9 ×` the interacting magnets' half-size reach on each axis |
| Held pressure acceleration | `1450`, divided by resting magnet mass |
| Held approach gain | up to `0.7` additional multiplier based on held-magnet approach speed |
| Surface coupling while a magnet is held | `0.34` |
| Rest contact correction | `0.2` |
| Release/drop wave speed | `235` |
| Release/drop wave impulse | `9` |
| Wobble spring / damping | `34` / `6.8` |

There is deliberately **no special held-neighbor velocity cap**. Normal engine damping and contact behavior dissipate the disturbance.

## Pickup and direct drag

- Pointer pickup is direct manipulation, not focus. Pointer pickup clears keyboard focus and must not create an extra circular/selection/focus ring. Keyboard `:focus-visible` remains for genuine keyboard navigation.
- A press marks the magnet as picked up immediately. Actual drag begins after the `6px` drag threshold.
- Drag geometry uses `clientX/clientY` in one viewport coordinate space, with the board scale snapshotted at pickup. Do not return to `pageX/pageY`; iOS Safari can make page coordinates inconsistent after pointer capture on deeply scrolled pages.
- The held magnet tracks its pickup origin plus pointer delta. Scroll depth must never become part of magnet displacement.
- Pickup position and pickup scale belong in one CSS transform chain. Current content-magnet pickup is a `-12px` lift and `1.065` scale with increased z-index/shadow. Do **not** reintroduce a separate CSS individual `scale:` property on an already translated magnet; that previously scaled the translation itself and caused deep-page magnets to jump vertically.
- Current transform order is position translation → wobble translation → rotation → scale. Preserve the fact that scaling does not alter board coordinates.
- Direct drag samples release velocity, then fling/release uses a `0.85` release scale, `780px/s` maximum release speed, and `7px/s` dead zone.
- A moved magnet suppresses its activation click for `320ms` so a drag does not accidentally navigate/activate the underlying link/button.

## Pressure propagation while held

The held-pressure effect is continuous, not a one-time shove.

1. For each resting magnet near the held magnet, calculate an elliptical influence area from the physical dimensions of both magnets.
2. Apply outward acceleration from the held magnet toward the resting magnet. Faster approach increases the force modestly.
3. Keep the held magnet pointer-attached; resting magnets yield to it rather than pushing it off the pointer.
4. Continue normal resting-resting surface coupling and hard AABB collision response during the hold.
5. Let those contacts propagate the disturbance through the board, so a packed group can ripple beyond the immediate neighbor.
6. Let normal damping, mass, edge restitution, and collision restitution settle the board naturally.

The board should therefore feel like one small physics engine. A tightly packed arrangement is not a reason for the effect to disappear; packed magnets should transmit the disturbance.

## Empty-space pusher

Empty board space is also an interaction surface.

- Desktop mouse/pen: primary-button drag on empty board space immediately turns the pointer into a `44 × 44px` physical pusher/collider.
- Touch: ordinary vertical page scrolling must remain available. A stationary empty-space hold becomes a pusher after `240ms`; moving at least `8px` before the hold activates cancels the pusher and leaves the gesture to native scrolling.
- Once active, the pusher uses hard AABB contact, positional correction (`0.76`), velocity transfer (`0.82`), and a `520px/s` impulse ceiling.
- Do not solve touch arbitration by globally disabling scrolling on the board.

## Hover, tilt, collisions, wobble, and release waves

- An unpressed pointer can create a mild local surface influence; this is secondary to direct manipulation.
- Device tilt may bias resting magnet velocity when supported.
- Resting magnets collide physically with each other and board edges.
- Collision/release energy can produce wobble and visible surface ripple feedback.
- Releasing a moved magnet emits a physical drop wave whose strength is related to release speed. This is distinct from the continuous held-pressure field and should remain so.
- Reduced-motion preference may remove decorative animation, but it must not silently break the core direct-manipulation semantics.

## Visual pickup treatment

Content and navigation magnets share interaction semantics but may have intentionally different rendering strategies.

- Content magnets: pickup uses the shared transform chain, higher z-index, lift/scale, shadow, and subtle saturation/brightness change.
- Desktop navigation magnets intentionally use a crisp resting `left/top` layout path to avoid Chromium text rasterization softness, switching to transforms only once actual dragging begins.
- Navigation route-active styling may change face/shadow presentation but must not change measured geometry or trigger repacking.
- A pointer-held magnet must never gain an extra focus/selection ring. Do not hide such a ring with a held-state CSS override; prevent pointer pickup from creating/retaining focus at the interaction source.

Canonical visual implementation: `src/components/magnets/MagnetBoard.module.css`.

## Layout, first paint, and persistence

- Magnets remain hidden until the board has valid measured geometry (`data-ready=true`). Users should not see magnets animate outward from the top-left during initial load.
- Layout measurement and packing happen at the component/lifecycle source; do not patch first paint with runtime-injected CSS.
- Saved magnet layouts are viewport-class specific. Compact/mobile and wide/desktop coordinates remain independent.
- Saved positions restore inside the current board bounds. Navigation also persists/restores its visual order where applicable.
- Semantic/presentation changes such as active route, ARIA state, menu state, or callback identity must not repack navigation when geometry did not change.
- Long need labels must remain inside the board and may wrap; do not restore global `white-space: nowrap` behavior that lets a long need overflow its container.

## Accessibility and gesture ownership

- Magnets remain real links/buttons with normal accessible names and keyboard activation.
- Keyboard focus must remain visibly indicated when reached by keyboard.
- Pointer pickup must not manufacture keyboard focus.
- Touches beginning directly on a magnet belong to that magnet drag once the drag threshold is crossed and must not scroll the document during the active drag.
- Touches beginning on empty board space remain scroll gestures unless the stationary pusher hold activates.

## Removed/superseded mechanisms — do not resurrect

The following mechanisms were deliberately removed after causing real regressions. They should not exist as dormant code, CSS overrides, compatibility paths, or commented-out alternatives.

1. **Page-coordinate drag math (`pageX/pageY`)** for direct magnet dragging. It produced scroll-depth-dependent displacement on iOS Safari.
2. **Separate individual CSS `scale:` on a translated magnet.** It composed with the transform in a way that scaled board translation and made deeply positioned magnets jump on pickup.
3. **Programmatic pointer `.focus()` plus a held-state `outline: none` workaround.** Pointer pickup now clears/prevents focus at the interaction source; keyboard focus remains intentional.
4. **One-hop lifted-neighbor “escape target” logic** that only nudged the immediate neighbor.
5. **Special lifted-neighbor velocity caps** such as the former `LIFTED_NEIGHBOR_MAX_SPEED` path.
6. **Disabling resting-resting collisions/coupling while a magnet is held** (the former lifted-state suppression path). That prevented pressure from propagating through a packed board.
7. **Runtime CSS/JS patches that merely hide magnet defects.** Fix the owning transform, coordinate, lifecycle, or physics code instead.

When replacing a magnet behavior, delete the superseded implementation in the same PR: remove old constants, state flags, branches, CSS selectors, comments, and tests that encode the old model. Do not leave an inactive implementation “just in case.” Git history is the archive.

## Regression coverage that must remain meaningful

Primary browser coverage lives in `tests/e2e/magnet-surface-interactions.spec.ts` and related magnet/navigation tests. At minimum, magnet changes must continue to cover:

- deep-scroll mobile drag alignment;
- pickup geometry that does not scale board translation;
- pointer pickup clearing focus rather than covering a focus ring;
- visible local held-pressure response on desktop and touch;
- pressure propagation through multiple resting magnets on mobile;
- empty-space desktop pushing and touch scroll/pusher arbitration;
- long-label containment;
- navigation order/geometry stability;
- compact/wide persistence separation;
- drag/click suppression and fling/release behavior;
- Play/rest semantics and first-paint stability.

Run `pnpm check` at minimum for magnet changes, and use the browser/repository validation path for interaction-sensitive changes as required by root `AGENTS.md`.

## Source ownership

Current source-of-truth files:

- `src/components/magnets/MagnetBoard.tsx` — lifecycle, drag, pressure, collisions, pusher, release waves, persistence integration.
- `src/components/magnets/MagnetBoard.module.css` — magnet rendering and pickup presentation.
- `src/components/magnets/magnetMath.ts` — packing, collision/math helpers, coordinate scaling.
- `src/persistence/magnetLayoutStore.ts` — viewport-specific saved layouts.
- `tests/e2e/magnet-surface-interactions.spec.ts` — direct interaction regressions.
- `tests/e2e/magnet-nav-order.spec.ts` and related navigation tests — navigation layout/order invariants.

If magnet behavior is implemented somewhere else, first ask whether that logic belongs in one of these owning layers rather than creating a second physics or presentation system.