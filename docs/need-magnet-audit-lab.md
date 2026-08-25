# Need magnet audit lab

The canonical visual review surface for Need magnet identity work is the hidden route:

`/design-lab/need-magnets`

It is intentionally not part of normal site navigation. The route exists so the user and future agents can review mockups in the deployed application before approving any production Need-magnet design.

## Accuracy contract

The lab must stay coupled to production rather than becoming a second hand-built approximation.

- Magnet shell styling is imported directly from `src/components/magnets/MagnetBoard.module.css`.
- Existing Need icons are loaded from the production `public/icons/needs/` assets.
- Customizer previews use the real `themePresets` and `themeCssValues` functions.
- Preset swatches therefore update automatically when presets, palette values, or preset roundness change.
- Audit-only CSS may neutralize absolute positioning/physics transforms so a magnet can sit inside a comparison card, but it must not duplicate production padding, type, border, shadow, icon sizing, or shell geometry.
- Roundness previews use the same production radius tokens. If the 0–200% sweep does not visibly affect magnets, repair the shared token/Customizer behavior rather than inventing a Design Lab-only mapping.
- Every full-face candidate must remain visibly distinct in every real preset swatch, including near-monochrome presets such as Refrigerator. Artwork should derive at least one stop from a contrast-bearing Customizer role (`--plum`, `--ink`, or `--outline`) directly or through `color-mix()`, rather than introducing a hard-coded fallback color.

## Adding a future audit mockup

1. Add or edit the transparent mask artwork in `public/design-lab/need-magnets/`.
2. Add a compact entry to `src/features/designLab/needMagnetAuditCandidates.ts`.
3. Keep the current production treatment beside candidates as the control.
4. Review the selected theme at enlarged and actual size.
5. Review every real Customizer preset swatch and sweep corner roundness through 0%, 100%, and 200% before approval.
6. Confirm that full-face art remains legible in Refrigerator and any other low-chroma preset without changing the preset merely to rescue one design.
7. Do not move a Design Lab candidate into the production Needs board until the user explicitly approves that need's magnet design.

The intended visual direction can evolve during review. The lab is a proposal surface, not an approval ledger.
