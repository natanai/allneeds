# Approved Observation guide implementation

Date: 2026-10-14. Base: `site-test` commit `3653152cbf1bb5517d681467bae96a68d30e3d8c`.

Status: **IMPLEMENTED ON A DEDICATED BRANCH; BROWSER VALIDATION REQUIRED BEFORE MERGE.** Target: `site-test`, not `main`. No deployment. The user authorized this implementation by saying “proceed” after the source-and-copy approval and implementation handoff.

Branch: `agent/observation-approved-guide-2026-10-14`.

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
| Playwright Observation hierarchy test collection | PASS: five tests collected; not executed |
| `git diff --check` | PASS |
| Desktop/mobile browser interaction and visual checks | NOT RUN; required before merging this application change |

The responsive regression covers all nine topics and all source URLs at 320, 390, 759, 760 and 1280 pixels, including both sides of the existing 760-pixel navigation breakpoint. Separate checks cover single and grouped citations, repeated reference activation, keyboard focus and viewport placement. These assertions are authored and collected, not represented as browser passes.

The ordinary dependency installation encountered a host package-manager error. The supported Sites installer subsequently installed the unchanged locked dependencies successfully and passed the 272-entry supply-chain policy check. No policy bypass, dependency change, lockfile change or new validation workflow was used. The production build completed with its non-failing large-chunk warning; no unrelated bundling changes were made.

## Browser gate and next handoff

This managed environment does not expose the `control-browser` capability. The Sites skill, Implementation and Managed Linux preview guidance, requires skipping browser QA in that condition and forbids an improvised preview server or browser-control path. Accordingly, no preview server or browser was started. The earlier Observation evidence review and repository workflow require the browser checks before merge, so the application PR remains draft and unmerged.

Next: run `pnpm check` and the Observation hierarchy/browser regressions in a permitted browser-validation environment, verify the research intro, complete topics, four examples, source URL wrapping and reference-focus behavior on desktop and mobile, then merge the scoped PR into `site-test`. Publication or merging application changes to `main` still needs separate authorization. No renewed source-and-copy approval is needed unless the approved wording or source uses change.
