# Test and check ownership

Updated November 10, 2026 after the direct Feeling-intensity release. Remove a check when its behavior has been retired or a current check owns the same guarantee. Repair obsolete selectors and fixtures when the user behavior still exists. Passing tests that only assert an old label is absent do not describe the current interaction.

| Guarantee | Current owner |
| --- | --- |
| Canonical generated data matches its source | Compiler `--check` commands in `pnpm build` |
| TypeScript correctness | `tsc -b` in `pnpm build`; standalone `pnpm typecheck` remains available |
| Domain rules, protected content, migration, persistence, and profile safety | Vitest suites |
| Deployed assets, metadata, runtime precache, local fonts, canonical catalog import/preloading, and worker cache policy | `scripts/verify-production-build.mjs` |
| Landmarks, titles, shell ordering/containment, and compact Customizer placement | `tests/e2e/route-shell.spec.ts` |
| Boot readiness and warm route/nav continuity | `startup-nav-readiness.spec.ts` and `native-stability.spec.ts` |
| Modal focus, keyboard dismissal, and restoration | `native-stability.spec.ts` and check-in dialog/keyboard suites |
| Observation editing, annotations, Quick Check, research disclosures, and responsive hierarchy | Dedicated Observation browser suites |
| Direct Feeling rating, clearing, art, gestures, dismissal/recovery, and Journal transfer | `check-in-inline-intensity.spec.ts`, with role/theme coverage in the other check-in suites |
| Installed-shell upgrade, offline deep links, fresh offline client, stopped server, and reconnect | `scripts/verify-offline-reconnect.mjs`, run by `pnpm test:e2e` |

## Retired checks

- Removed the duplicate `pnpm typecheck` phase from `pnpm check`; the build still performs the same TypeScript validation.
- Removed the unit test that spawned the Observation compiler a second time. Compiler validation remains in the build; the unit suite still checks complete catalog identities, formula slots, cue provenance, and canonical relationships. Historical catalog/expression counts now follow their canonical owners rather than fixed migration-era totals.
- Removed the production verifier's JSX/CSS/function-name scans and historical model-version/source-format assertions. Current browser suites exercise those interactions. The canonical catalog import boundary remains; the verifier checks the emitted catalog chunk and its preload rather than the Vite plugin's function spelling. Required brand metadata accepts the current asset URL with or without cache-version query parameters.
- Removed the browser network-toggle offline smoke case, superseded by the stopped-server verifier.
- Removed the one-off mobile Observation layout smoke case. Its editor/hierarchy behavior remains covered by the dedicated Observation suites, while its compact floating-Customizer assertion now runs across every route in both compact shell matrices. Unused route flags for never-tested exceptions are removed.
- Removed assertions for deleted Fits/rating-confirmation buttons, the old Observation recipe and result prose, and old generic matching explanations. Current tests retain positive checks for immediate rating/persistence, scoped annotation behavior, per-detail help, and raw matched-term explanations.

Old saved-profile fixtures, ownership-retirement tests, and protected user-strategy tests remain relevant. They protect existing data and current canonical ownership. No test is skipped or excluded to hide a failure.

Current lifecycle boundaries also matter: a changed profile reloads its document, and returning to a check-in restores scroll/focus on an animation frame. Profile tests wait for the applied document; resumed slider and enlarged-text checks wait for the stage heading's focus before interacting or measuring. Their data, intensity, and overflow assertions retain the same expectations and tolerances.

## Validation

Run `pnpm check` for the foundation layer. Run `pnpm check:all` for release validation with the pinned Playwright browsers installed. A browser test count excludes the standalone outage verifier; it is a separate mandatory part of `pnpm test:e2e`.

The cleanup reduces the foundation suite from 386 to 385 cases and the shared browser suite from 214 to 212. It also removes the duplicate TypeScript phase and source-string checks described above; the reduced counts are not a target for future deletions.

- Local foundation validation passed. [Hosted full-suite validation](https://github.com/natanai/allneeds/actions/runs/42927372841) passed all 385 foundation cases and offline verification. Browser results were 209 passed, two passed on retry, and one profile test failed while reading an outgoing document during reload.
- [Final targeted validation](https://github.com/natanai/allneeds/actions/runs/42929455646) passed all 385 foundation cases, all 19 profile/direct-Feeling flows, and 15 repetitions of the three timing-sensitive cases with retries disabled. Offline/reconnect verification passed again. All 212 browser cases have passing results across the full and targeted runs; this does not describe one clean full-suite invocation.
- Six counterfactual artifact probes still rejected an empty app icon, external account URL in the precache, missing catalog preload, remote font dependency, unsafe cache lookup, and runtime legacy catalog import. Clean fixtures and metadata with changed/absent cache-version queries passed.
- The workflow's temporary branch trigger was restored to its original manual-only configuration. Application components, CSS, assets, authored content, dependencies, and protected user data are unchanged by this cleanup.
