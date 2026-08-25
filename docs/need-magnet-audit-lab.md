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

## Adding a future audit mockup

1. Add or edit the transparent mask artwork in `public/design-lab/need-magnets/`.
2. Add a compact entry to `src/features/designLab/needMagnetAuditCandidates.ts`.
3. Keep the current production treatment beside candidates as the control.
4. Review the selected theme at enlarged and actual size.
5. Review every real Customizer preset swatch and sweep corner roundness before approval.
6. Do not move a Design Lab candidate into the production Needs board until the user explicitly approves that need's magnet design.

The intended visual direction can evolve during review. The lab is a proposal surface, not an approval ledger.
