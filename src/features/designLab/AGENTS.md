# Design Lab agent contract

This directory owns non-production visual review surfaces for `allneeds`.

## Need magnet audit lab

Canonical route: `/design-lab/need-magnets`

- The route is intentionally not linked from normal site navigation. It is a direct-link design review surface.
- Do not copy the production magnet shell into the lab. Import `src/components/magnets/MagnetBoard.module.css` so padding, border, shadow, type, icon sizing, and Need-magnet geometry stay tied to production.
- Import `themePresets` and `themeCssValues` from the Customizer for fixed comparison swatches. The main and actual-size lab previews inherit the live page Customizer theme and roundness directly. Never maintain duplicate live palette or roundness controls here.
- Keep the current production treatment as the control when proposing a redesign.
- Add mockups in `needMagnetAuditCandidates.ts`; add transparent mask artwork under `public/design-lab/need-magnets/`.
- Candidate artwork is review-only. A candidate appearing in the lab does not authorize changing production Need magnets.
- Preserve the production shell during visual exploration unless the user explicitly approves a shell change. Candidate work should normally be limited to icon choice, full-face artwork, and Customizer-derived palette recipes.
- Every full-face proposal must remain visibly distinct in every real `themePresets` swatch, including low-chroma/near-monochrome presets such as Refrigerator. Do not hard-code a fallback color; derive at least one artwork stop from a contrast-bearing Customizer role such as `--primary`, `--text`, or `--outline` (directly or through `color-mix()`).
- Always sweep the full 0–200% roundness range through the real Customizer while reviewing candidates. The Design Lab uses the same production radius tokens, so a roundness failure should be fixed at the shared token/Customizer source rather than patched only in the lab.
- When a Need's content audit is complete, use this lab for the separate magnet identity review recorded in the content-evidence process.
