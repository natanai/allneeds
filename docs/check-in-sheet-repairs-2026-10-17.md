# Check-in sheet repairs — October 17, 2026

Baseline: `main` at `80b908bfe5f6dee765ad968c460672f34d53107b` (PR #192). Phone screenshots showed the earlier missing rating-status lines, but a fresh live-browser visit also reproduced an unresolved expanded-help layout defect. The prior selection-cue release did not resolve all sheet-density and gesture complaints.

## Changes

| Issue | Owning repair | Regression coverage |
| --- | --- | --- |
| Opening rating Info squeezed the label beside the explanation, and an invalid font shorthand left the paragraph bold. | Keep the native disclosure; give the label a stable full row and the paragraph normal full-width body flow. Explicitly name the fieldset with the label. | Expand both disclosures at 320, 390, and 1280px, plus 320px/doubled text; compare heading widths and paragraph position/type. |
| Done was below long content; the Need picker repeated its explanation and framed a board inside the sheet. | Shared toolbar and footer outside the body scroller. Need count/Clear/Done stay visible; empty Done preserves the former leave-without-choosing behavior. The existing About Needs disclosure and no extra board border. A stable picker height and short Clear label prevent filtering and enlarged text from crowding out the chosen magnet. Query changes return the results scroller to its beginning. | Scroll the full list, search, select, complete, and reopen; verify viewport containment, checks, count, stable panel position/height and the whole selected magnet below Search. No forced keyboard. |
| Mobile sheets displayed a nonfunctional handle. | Shared header/handle-only pointer gesture with direct translation, long-downward/short-flick dismissal, cancellation/reset, and normal Close-path focus/data handling. Body scrolling, controls, maps, and magnet gestures do not initiate sheet dragging. Desktop/dialog/fullscreen behavior is not opted in. | Real touch-event tests for deliberate, short, upward, sideways, and cancelled drags; answer preservation and focus return; body scrolling; desktop non-dismissal. Pure threshold unit tests. |

No palette values, Need identities, psychological guidance, catalogue content, scoring, or persistence schemas are changed. Physics remains on by default. The explanatory wording is moved without being rewritten.

## Verification status

- Final application source `3d18b5db53a5695f29d8a70d933403843b0d6aa1` passed [Full repository validation, run 39087736496](https://github.com/natanai/allneeds/actions/runs/39087736496): 372 tests / 68 files, TypeScript, deterministic compilers, production build and build verification; all 11 focused sheet cases; all 195 full-suite browser cases in 12.1 minutes, without failures or flaky retries; and offline/reconnect verification.
- Browser checks used the repository's pinned Playwright 1.62.1 and Chromium 151.0.7922.34 on GitHub's runner. The validation commit differs from the release application only in its validation workflow; the trigger was restored to manual-only after startup. The release PR contains no workflow or dependency changes.
- Visually inspected final CI screenshots for expanded rating help, normal phone Need selection, 320px/doubled-text Need containment, identical light fill roles, and identical dark fill roles. The selected Need, its check, Search, count/Clear and Done remain visible in the strengthened smallest-screen case.
- Local-browser limits remain documented: the normal download returned a truncated archive, the temporary npm browser could not launch (`EACCES`), and Cloud Browser could not reach the local preview. No execution-permission workaround or authenticated browser session was used. CI supplied the missing browser verification.
- This record establishes release readiness, not a claim that a particular deployment is already serving. Main deployment and live asset/UI verification are separate post-merge checks.

## First CI run and follow-up

The existing Full repository validation workflow ran once on a dedicated validation-only branch using a narrow branch/path push trigger. That trigger was restored to manual-only immediately after the run started; the release PR has no workflow changes. No browser sign-in was used.

[Run 39086085300](https://github.com/natanai/allneeds/actions/runs/39086085300) exercised all 195 cases: 190 passed, one existing moving-magnet scroll wait passed on retry, and four new Need cases failed because their exact Safety locator no longer matched after its accessible name correctly became Safety, selected. All four expanded-help viewport cases and all three gesture cases passed. The four Need assertions now use a state-stable accessible locator. The visual-only scroll in the existing selection case uses native scrollIntoView rather than waiting for a playing physical object to become motionless; physics remains on and application behavior is unchanged by that test adjustment.

Visual inspection also found a real 320px/doubled-text problem: the footer consumed too much of a filtered, content-shrinking sheet. The picker now keeps its workspace height while filtering, uses a stable count/Clear area beside Done, and shows the shorter visible Clear label with the original full accessible name. The strengthened regression requires the entire selected magnet to remain between Search and the scroller's lower edge. The first run is not described as a pass; the final passing run is recorded above.

[Run 39087522763](https://github.com/natanai/allneeds/actions/runs/39087522763) ran the focused cases first and stopped early: seven passed, one enlarged-text containment check failed, and three were not run. The selected magnet was still about 14px beneath sticky Search. Search now occupies a real shared toolbar row outside the scrolling results, rather than an overlapping sticky layer. The same strict containment assertion remains; it was not relaxed to accept occlusion.

Physical iPhone Safari, Home Screen, and VoiceOver are separate review targets; no desktop/touch-emulation result should be presented as certification of those environments.
