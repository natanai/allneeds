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
- The main and actual-size previews inherit the live page Customizer. Do not add duplicate palette or roundness controls to the lab.
- Roundness previews use the same production radius tokens. If the 0–200% sweep does not visibly affect magnets, repair the shared token/Customizer behavior rather than inventing a Design Lab-only mapping.
- Every full-face candidate must remain visibly distinct in every real preset swatch, including near-monochrome presets such as Refrigerator. Artwork should derive at least one stop from a contrast-bearing Customizer role (`--primary`, `--text`, or `--outline`) directly or through `color-mix()`, rather than introducing a hard-coded fallback color.
- Artwork that is meant to meet an edge must actually reach that SVG/view-box edge. Bottom-anchored designs must terminate at the true bottom so 0% roundness never exposes a floating gap.

## Adding a future audit mockup

1. Add or edit transparent mask artwork in `public/design-lab/need-magnets/`.
2. Add a compact entry to `src/features/designLab/needMagnetAuditCandidates.ts`.
3. Put previews in the deployed Design Lab rather than sending standalone HTML unless the user explicitly asks for an offline artifact.
4. Include the current production treatment only while it materially helps comparison. Remove it once the direction is narrowed or the user says the control wastes review space.
5. Review the active Customizer theme at enlarged and actual size, then review every real preset swatch and sweep corner roundness through 0%, 100%, and 200% before approval.
6. Confirm that full-face art remains legible in Refrigerator and any other low-chroma preset without changing the preset merely to rescue one design.
7. If the visible icon is intentionally removed but its offset is part of the concept, preserve the production icon slot and hide only the glyph rather than faking the spacing with audit-only padding.
8. Do not move a Design Lab candidate into the production Needs board until the user explicitly approves that need's magnet design.
9. Once approved and promoted, remove the candidate from the active lab set. Git history is the archive; approved designs should not remain as review clutter.

The intended visual direction can evolve during review. The lab is a proposal surface, not an approval ledger.
