# Design Lab agent contract

This directory owns non-production visual review surfaces for `allneeds`.

## Need magnet audit lab

Canonical route: `/design-lab/need-magnets`

- The route is intentionally not linked from normal site navigation. It is a direct-link design review surface.
- Do not copy the production magnet shell into the lab. Import `src/components/magnets/MagnetBoard.module.css` so padding, border, shadow, type, icon sizing, and Need-magnet geometry stay tied to production.
- Import `themePresets` and `themeCssValues` from the Customizer. Never maintain a second list of preset colors or roundness values here.
- Keep the current production treatment as the control when proposing a redesign.
- Add mockups in `needMagnetAuditCandidates.ts`; add transparent mask artwork under `public/design-lab/need-magnets/`.
- Candidate artwork is review-only. A candidate appearing in the lab does not authorize changing production Need magnets.
- Preserve the production shell during visual exploration unless the user explicitly approves a shell change. Candidate work should normally be limited to icon choice, full-face artwork, and Customizer-derived palette recipes.
- When a Need's content audit is complete, use this lab for the separate magnet identity review recorded in the content-evidence process.
