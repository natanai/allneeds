# Magnet component agent contract

This file applies to `src/components/magnets/**` in addition to the root `AGENTS.md`.

## Mandatory reading

Before changing magnet interaction, physics, layout, persistence integration, or magnet CSS, read:

1. `/AGENTS.md`
2. `/docs/magnet-behavior.md`
3. `/docs/design-language.md` (Magnet physics and any relevant visual sections)

`docs/magnet-behavior.md` is the canonical detailed behavior contract. If the user explicitly changes a magnet behavior, update that document in the same PR.

## Preserve the current physical model

- Treat the board as one shared physics surface.
- A held magnet stays attached to the pointer and acts as a pressure source above the surface.
- Resting magnets continue normal coupling and hard collisions while another magnet is held so pressure can propagate through packed magnets.
- Do not reintroduce a special held-neighbor speed cap, one-hop escape target, or lifted-state suppression of resting/resting physics.
- Preserve deep-scroll drag alignment, fling/release behavior, empty-space pushing, wobble, drop waves, Play/rest semantics, saved compact/wide layouts, and first-paint stability.

## No hidden legacy behavior

When replacing behavior, delete the superseded implementation rather than disabling or covering it. Remove obsolete constants, state flags, branches, CSS selectors, comments, and tests in the same PR. Git history is the archive.

In particular, do not resurrect any mechanism listed under **Removed/superseded mechanisms** in `/docs/magnet-behavior.md`, including page-coordinate drag math, separate CSS `scale:` on translated magnets, pointer-created focus plus outline-hiding CSS, one-hop scurry logic, lifted-neighbor velocity caps, or collision suppression while held.

Pointer pickup must not create a focus/selection ring. Keep keyboard `:focus-visible` for real keyboard navigation; fix pointer focus at the interaction source rather than hiding it with CSS.

## Verification

Behavior-affecting magnet work requires regression coverage at the owning layer. At minimum run the root-required foundation checks, and use browser validation for pointer/touch/physics changes. Relevant coverage lives primarily in `tests/e2e/magnet-surface-interactions.spec.ts`, `tests/e2e/magnet-nav-order.spec.ts`, and magnet math/persistence tests.