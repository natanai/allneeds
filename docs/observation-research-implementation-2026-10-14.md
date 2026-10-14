# Approved Observation guide implementation

Date: 2026-10-14. Base: `site-test` commit `3653152cbf1bb5517d681467bae96a68d30e3d8c`.

Status: **VERIFIED FOR THE AUTHORIZED PRODUCTION RELEASE.** The user authorized preparing the completed guide against their newer `main`, merging, and live deployment on 2026-10-14. This supersedes the original site-test-only publication boundary. [PR #190](https://github.com/natanai/allneeds/pull/190) contains the main-based release. [PR #183](https://github.com/natanai/allneeds/pull/183) preserves the reviewed staging integration and its completed checks below.

Staging branch: `agent/observation-approved-guide-2026-10-14`.

Production integration: `agent/observation-guide-release-2026-10-14`, based on main `82099c28fe8859da4a9e6c1bff3a62df6d4bb4b6`. Carry over the approved guide and research records while retaining current main's check-in handoff, independent drafts, Journal, profile backup, theme, and navigation implementation. The new `ObservationHelpContent` export remains the owner used by check-in help. No site-test branch merge is used to replace newer application files.

## Approved content boundary

The [approved package](./observation-research-guide-proposal-2026-10-14.md) and [source-to-claim approval](./observation-research-editorial-approval-2026-10-14.md) remain unchanged. The complete approved document has SHA-256 `28e8e4257311e02fa443599f7ab4a283e0a3190167a672e1d8c701f91d53beea`.

`src/data/observationGuide.json` owns the short introduction, research introduction, eight content topics, four fictional examples and 18 source records. The ninth topic is the Source library. Tests compare all public paragraphs, example cells, bibliography wording and URLs directly with the approved document. Markdown title emphasis becomes plain bibliography text; grouped references become separately accessible numbered links. No substantive copy is rewritten during implementation.

The other 34 source records remain outside this package. No optional, held or excluded candidate has been silently promoted. Historical appraisals and reference identities remain in the research documentation and Git history, not as unused alternate runtime data.

## Rendering and interaction

- Preserve the desktop three-column topic index and native mobile Research topic picker, using the same complete dataset at every width.
- Replace the superseded study cards with the approved narrative paragraphs. Remove their obsolete four-field renderer, callout/list branches, topic descriptions and CSS rather than leaving dormant preview variants.
- Bind Why try this? to the same canonical data and remove its stale hard-coded copy and four unrelated active links.
- Render inline citations in both the research introduction and topic paragraphs. Each number maps to the matching source in first-use order [1]–[18]; grouped citations expose each number separately.
- Citation activation selects the Source library, scrolls to the selected reference and places keyboard focus on it. Repeated activation while already in the library clears the pending target so later topic changes do not unexpectedly move focus.
- Show each approved bibliographic description and the raw original publisher or official-resource URL. Internal source-fit notes and approval metadata are not rendered.
- Use plain React text instead of interpreting guide strings as HTML. Citation links retain accessible names, visible focus and Customizer-owned control sizing; long source URLs wrap within the available width.
- Constrain the page and Quick Check grids to their available width. The title and guide text can wrap, and Quick Check status text can move onto another row when enlarged text needs more space. Labels and Info actions retain their meanings and touch targets.

Quick Check, editor/highlight analysis, Feelings/Needs matching, saved drafts, Journal handoff, protected user strategies and all other page workflows are unchanged.

## Verification performed

| Check | Result |
| --- | --- |
| Exact approved copy fingerprint, all paragraphs, examples, bibliography and URLs | PASS, standalone Node assertions and regression tests |
| 18 unique references, first-use numbering and URL hygiene | PASS |
| Observation inference and alexithymia compiled-data checks | PASS |
| `pnpm check` | PASS: compilation, TypeScript, 330 tests across 61 files, production build and production-asset verification |
| Targeted guide data and React markup tests | PASS: 7 data tests and 5 rendering tests, included in the foundation suite |
| Production precache and local assets | PASS: 151 runtime-preloaded assets, including two local fonts |
| Playwright Observation hierarchy tests | PASS: six cases in the repository's pinned Chromium, including all five normal widths and doubled text at 320 pixels |
| `git diff --check` | PASS |
| Desktop/mobile browser interaction and visual captures | PASS in Chromium; final phone/desktop guide, examples, references and enlarged-text captures reviewed |

The responsive regression covers all nine topics and all source URLs at 320, 390, 759, 760 and 1280 pixels, including both sides of the existing 760-pixel navigation breakpoint. Separate checks cover single and grouped citations, repeated reference activation, keyboard focus and viewport placement. The enlarged-text case checks all 18 reference-link bounds and the document's width at 320 pixels.

The ordinary dependency installation encountered a host package-manager error. The supported Sites installer subsequently installed the unchanged locked dependencies successfully and passed the 272-entry supply-chain policy check. No policy bypass, dependency change, lockfile change or new validation workflow was used. The production build completed with its non-failing large-chunk warning; no unrelated bundling changes were made.

## Completed site-test browser gate

The managed workspace still does not expose `control-browser`, so no local preview server or substitute browser was started. Browser checks were completed in GitHub Actions using the repository's existing validation pipeline on an isolated branch. Its temporary push trigger was limited to that branch, the validation file and an explicit validation commit message; it was removed afterward by restoring the original manual-only workflow. Neither the review branch nor `site-test` gains an automatic validation or publishing trigger.

The [final CI run](https://github.com/natanai/allneeds/actions/runs/38605325735) passed foundation checks and all six browser cases in 22.5 seconds, with no browser retries. Its application content exactly matches guide commit `10dcbb0a8f3fdaeb55fb6710a81fe37cb477f666`; the sole tree difference is the temporary validation workflow. Subsequent integration-record edits are documentation only. The preceding runs exposed large-text minimum-width problems in the page and Quick Check grids; those failures remain in the CI history. The fix preserves the strict containment assertions rather than weakening them.

Physical iPhone Safari, Home Screen, VoiceOver and actual device text-size checks are not certified by this Chromium run. The 200% root-font case is a reflow simulation. It confirms guide and URL containment; it does not certify every shared navigation magnet's enlarged label.

The original staging handoff required separate publication authorization; the subsequent user instruction authorizes the production release below. No renewed source-and-copy approval is needed unless the approved wording or source uses change.

## Main-based release verification

The integration retains main's current check-in handoff and shared `ObservationHelpContent` export, Journal entry doorway, profile backup, Refrigerator material, navigation and persistence logic. The only changed runtime files are the guide data, Observation page and its CSS Module. The approved copy and source URLs remain byte-for-byte identical to the staged guide. All 65 relative links in the carried-over research records resolve.

- Foundation checks passed locally and in GitHub Actions: 366 unit tests in 66 files, typecheck, both compiled-data freshness checks, production build, and verification of 151 runtime assets and two local fonts.
- The [complete browser sweep](https://github.com/natanai/allneeds/actions/runs/38650512626) completed 171 cases without retries: 169 passed, including all seven guide cases, native layout checks, the current Refrigerator material, and the Observation-to-check-in flows. Two existing check-in fixtures acted during route transitions. The trace showed the Body Cues test editing the closing sheet's slider, and the Journal test pressing Escape before its destination dialog opened.
- Explicit destination readiness checks retain the original assertions rather than adding delays or weakening expected data. The [49-case follow-up](https://github.com/natanai/allneeds/actions/runs/38652098124) passed 48 cases, including Journal dismissal and every guide case. One later Body Cues excursion exposed the same old-sheet race, so all four excursions now wait for the full tool and the closing sheet's removal.
- The [final validation](https://github.com/natanai/allneeds/actions/runs/38652725037) passed foundation checks, the complete Body Cues handoff three times without retries, and offline/reconnect verification. It preserves the applied 80% clue, the separate 15% tool draft, unapplied 85% edits, subsequent 95% edits, and the absence of a stale-draft alert. Offline coverage includes version-safe cache-first upgrade, a fresh offline client, cached deep routes, same-port restart and cache-miss reconnect.
- Application bytes were unchanged after the complete sweep; the follow-ups changed only two test fixtures. Final application/test source is `01d75c78e84f31c82ff7164ba05ae3f61d83197d`. Its isolated validation snapshot differs only in the temporary workflow. Subsequent release-record changes are documentation only. These results cover the 171 distinct browser cases across runs; they are not a claim that one uninterrupted full-suite run was green.
- Phone/desktop guide, examples, bibliography, doubled-text and Refrigerator captures were inspected. All nine topics and 18 raw source links remain contained and accessible. Physical iPhone Safari, Home Screen and VoiceOver evaluation remains the user's device-review step.

The temporary validation trigger was restored to the original manual-only workflow after completion (`705dbcdd26c4435fe4f339ca9a3e3013224fcb8d`). PR #190 contains no workflow change. The existing main Pages pipeline owns publication after merge.
