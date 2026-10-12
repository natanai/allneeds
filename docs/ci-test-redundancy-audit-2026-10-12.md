# CI and regression-test redundancy audit — 2026-10-12

Scope: `natanai/allneeds`, `main` at `c51e171cd8a96a2dc6f5e10c127c132ffa0a8f59`; compared the `site-test` validation workflow and a recent Actions execution. This is an inventory and source-level overlap audit, **not a claim that the complete suite was rerun**.

## What the numbers mean

- GitHub Actions reported **324 total historical workflow runs** when queried, not 324 checks on each commit.
- The successful [October 12 validation run](https://github.com/natanai/allneeds/actions/runs/38199954558) reported **319 passing Vitest tests in 60 files**. That run was on `site-test` and its totals should not be represented as the exact `main` count after this change.
- There are **29 Playwright `.spec.ts` files** in the `main` tree, most containing multiple browser scenarios.
- That same run executed only **12 browser tests** in `observation-inference.spec.ts` and `observation-mobile-hierarchy.spec.ts`. The checked-out historical workflow at commit `3a73c00` explicitly selected these two files even though the step title said "Run full browser regression suite serially." The currently checked-in `main` and `site-test` workflow definitions have returned to the unfiltered `playwright test --workers=1` command. Therefore, the 12-test pass must not be treated as proof that all 29 Playwright spec files passed.

## Workflow inventory (`main`)

| Workflow | Trigger | Purpose | Audit |
| --- | --- | --- | --- |
| `pages.yml` | Push to `main` or `site-test` as defined on `main`, or manual | Test, build and publish static app | Keep. The `site-test` copy of this workflow currently specifies `main` only; reconcile branch versions in deployment-specific work, not as test deduplication. |
| `backend.yml` | Relevant `backend/**` changes on `main`, or manual | Check, deploy and smoke-test Worker | Keep: separate deployment target and critical sign-in/session behavior. |
| `batch1-validation.yml` | Manual | Foundation, Playwright browser and offline/reconnect regressions | Keep: more thorough than build/deploy foundation checks and intentionally does not fire on every push. |
| `upload-user-submitted-strategies.yml` | Manual | Import and publish protected user-submitted strategies | Keep: distinct administrative action, not a second test pipeline. |

## Overlap findings and decisions

| Finding | Decision | Reason |
| --- | --- | --- |
| `pnpm check` ran the Alexithymia generator before invoking `pnpm build`, which checks the generated result again. | Remove the preliminary generator invocation. | `build` already uses `compile-alexithymia-support.mjs --check`. A read-only check detects a stale checked-in generated asset rather than silently repairing it before verification. Authoring still has `pnpm compile:alexithymia`. |
| `pnpm check` ran `pnpm typecheck` and then `pnpm build`, which already runs `tsc -b`. | Run TypeScript once through `build`. | No reduction in release TypeScript validation, only duplicate invocation removed. `pnpm check` remains unit tests followed by the full production build (including compilation and production asset checks). |
| Accountability absence from the active Design Lab was asserted in `src/features/designLab/needMagnetAuditCandidates.test.ts` and again in `src/features/needs/accountabilityMagnetIdentity.test.ts`. | Remove the duplicate assertion from the latter. | The Design Lab regression retains the exact same invariant; the Accountability file retains its distinct icon/CSS and geometry checks. |
| Need magnet tests overlap by theme (identity/CSS vs actual SVG geometry). | Retain. | Their assertions protect different integration and asset-boundary failures. |
| Need editorial approvals have both data-level tests and browser-rendering tests. | Retain. | Source integrity and actual displayed content are different failure modes; editorial decisions remain explicitly guarded. |
| Observation inference has unit, browser, mobile-annotation and guidance tests. | Retain. | They cover deterministic classification, DOM integration, mobile reading order and evidence presentation respectively. |
| Journal/account and offline workflows have unit and end-to-end tests. | Retain. | Persistence/reconciliation algorithms and actual browser flows must both be covered, especially before releasing changes affecting private journal data. |
| An additional `playwright.observation.config.ts` defines Chromium, Firefox and mobile WebKit projects. | Retain, but distinguish it from default CI. | It is a separate optional cross-browser observation matrix, not automatically exercised by the default Chromium-only job. |

## Validation boundary and follow-up

The source inventory and the exact duplicated assertion were examined. No unit-test file was deleted wholesale, and no substantive feature regression coverage was intentionally reduced. Source-level reasoning verifies that the production build still performs the canonical generated-data checks, TypeScript build, asset generation, and production build verification.

The GitHub connection does not expose a manual workflow dispatch action, and the environment could not install/run the repository locally. **This branch has not yet passed an execution of the revised scripts.** Before merging, dispatch "Full repository validation" on the audit branch and verify the unfiltered browser suite plus outage test. The default browser project is desktop Chromium (tests sometimes set mobile viewports); that is not equivalent to real iOS Safari or mobile WebKit verification.

Do not replace the full suite with temporary narrowed commands while continuing to call the job "full"; if focused tests are needed, label them honestly and restore the full release gate before treating a run as release evidence.
