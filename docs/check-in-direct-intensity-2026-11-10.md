# Direct Feeling intensity in check-in

Approved interaction: November 10, 2026. Source baseline: `70b1d41d4d455de9db462fde85f4d966c9abb5a9`. Review: [PR #200](https://github.com/natanai/allneeds/pull/200).

## Behavior

Words-stage Feeling magnets display their existing canonical artwork and the exact shared `IntensitySlider` component. Its source and CSS are unchanged. Only placement and the existing range/value/callback props differ.

| Action | Result |
| --- | --- |
| Untouched zero | Available, unselected word; no reported measurement. |
| Set 1–10 | Immediately keep the catalog Feeling as Fits at that intensity. |
| Return to zero | Clear selection and rating; retain the visible candidate. |
| × | Mark Not this time for this check-in and hide the candidate in every Words view and search. |
| Undo | Restore the previous word choice and reported rating. |
| Show dismissed words → Restore | Make the candidate available again, without selecting it or restoring an old rating. |
| ⋯ or label button | Open optional definitions and manual choices. Canonical Feeling ratings apply immediately; Maybe remains tentative and clears a rating. |

Other emotion words, Faux Feelings, and personal words retain their existing roles and manual keeping behavior. They do not acquire catalog ratings or invented Need mappings. Need selection remains binary. The final recap remains a read-only preview and sentence-building surface.

The Words footer keeps the selected count, Continue, and any Undo reachable. Its duplicate Back to clues action is removed; the existing app-bar Back still performs that navigation. Desktop keeps its context/choice rail. Selected-word summaries wrap instead of relying on a sideways strip.

## Ownership and gesture boundaries

- `MagnetBoard` measures and moves the complete compound shell. Its real label button is the drag handle; native slider and action buttons are siblings rather than nested inside it.
- Native input never starts magnet pointer capture. Control pointer/focus interaction holds its own magnet steady as a normal surface obstacle; other magnets retain their pressure, collision, and play behavior.
- Value and selection feedback do not reset layout readiness or rebuild the physics map. Genuine compound size changes are observed by the existing measurement owner, including enlarged-text reflow.
- `withWordChoice` owns setting/clearing decisions, ordering, and ratings. A newly confirmed catalog Feeling requires an explicit integer 1–10. Zero is never persisted as a reported intensity. Existing saved data is not retroactively rated.
- Draft persistence, stale-tab protection, sentence generation, Feeling-to-Need suggestions, and Journal transfer retain their existing owners. Definitions, catalog associations, research sources, and user strategies are unchanged.
- The superseded pending Fits/rating-confirmation flow, scroll-to-rating effect, and unused confirmation/skip CSS are removed. The design-language and magnet contracts document the replacement.

## Verification

- Local `pnpm check` passed: 386 tests across 70 files, TypeScript, deterministic compilers, production build, and build verification. The catalog chunk retains its baseline hash; `src/components/intensity/IntensitySlider.tsx` and its CSS have no diff.
- Local browser verification could not execute: the normal Playwright archive was truncated, and installed Chromium failed at process startup because a required socket operation is unavailable. None of those local browser cases is counted as an application pass.
- [First pinned-browser run](https://github.com/natanai/allneeds/actions/runs/42917213050): seven of eight new cases passed. The label-drag check failed because it demanded more vertical travel than the single-result board permits. The corrected test checks the actual clamped endpoint on both axes; it does not change the application’s drag constraints or lower a movement tolerance.
- [Second pinned-browser run](https://github.com/natanai/allneeds/actions/runs/42917931509): all ten direct-interaction cases passed. These cover 320px, 390px, 1280px, doubled base text, artwork in Matches/search, native touch and mouse rating, keyboard adjustment, stable geometry, label dragging without rating changes, clearing, persisted dismissal, visible Undo, explicit restore, Maybe, and the exact rating saved through Journal.
- Phone, desktop, and enlarged-text screenshots from the second run were visually inspected. The enlarged-text review prompted a compact Words footer with the existing app-bar Back as the return path.

The second run’s broader suite stopped after five failures (26 passed, 183 not run). They exposed one application defect: pointer capture retargeted label clicks to the compound shell, bypassing the child label button. Activation now runs at the shell for captured label clicks and at the native handle for keyboard clicks, while control clicks remain isolated. The focused test now covers pointer label opening and keyboard opening/focus return. A subsequent temporary-workflow formatting error prevented that run from starting jobs and supplies no application validation result.

[The corrected validation run](https://github.com/natanai/allneeds/actions/runs/42919467867) passed all ten focused cases, including those label and keyboard checks, plus offline/reconnect verification. The broader run passed 61 cases before stopping on five theme variants of an incorrectly scoped Body-clue test locator. The test now checks the selected slider's actual active ancestor; production Body-clue behavior is unchanged.

[The subsequent full run](https://github.com/natanai/allneeds/actions/runs/42920980300) passed the 386 foundation tests, all ten focused browser cases, and offline/reconnect verification. Its broader result was 203 passed, one passed on retry, five failed, and five not run after the failure limit. All selection-cue theme variants, shared magnet/physics checks, and the previously documented History/account cases executed successfully. The one retry was the 320px Observations reference-exit case, where the footer intercepted its initial automated click.

The five remaining failures were stale test assumptions in unchanged application surfaces: three profile-reconciliation cases looked for October fixtures inside the current rolling 30-day History period, one Journal case used `0` instead of the slider's current `zero` accessible label, and one Body Cues case addressed a removed input ID and the old 0–100 UI range. The tests now explicitly select All time, use the actual accessible slider name, and check the equivalent 6.5/10 measurement. Their data-integrity and persistence assertions remain intact.

[The final targeted follow-up](https://github.com/natanai/allneeds/actions/runs/42923174019) passed 386 foundation tests, all ten direct Feeling cases, all 17 profile-reconciliation/workflow-continuity cases (including the five previously interrupted cases), the separate 320px reference-exit recheck, and offline/reconnect verification. No browser case failed or needed a retry in that run. All 214 configured browser cases have passing results across the broader run and these targeted follow-ups; this is not a claim of one clean full-suite invocation. The final phone, enlarged-text, and desktop feature screenshots were visually inspected.

The existing validation workflow is restored to its original manual-only configuration; this feature does not add a permanent automatic validation trigger or change dependencies. Validation is not described as a clean single full-suite pass.

## Physical phone review

Automated Chromium touch and doubled-root-text checks do not certify actual iPhone Safari, Home Screen mode, VoiceOver, or iOS text enlargement. On the review build:

1. Reach Words with and without clues. Set a Feeling to 7 and return it to zero; selection should follow immediately without opening a sheet or moving the magnet.
2. Set it to 7, dismiss it, and Undo. Dismiss again, reopen the dismissed list, and Restore; it should return available at zero.
3. Open word options and keep Maybe; confirm it remains tentative. Set a positive intensity and confirm Fits replaces Maybe.
4. Drag the label area, adjust the slider, and scroll between magnets. Each gesture should retain its intended ownership. Search keyboard, browser bars, and the home indicator must not cover the active control or Continue.
5. Continue through Needs and Journal, save deliberately, and inspect the reported intensity. Repeat with actual text enlargement and VoiceOver adjustable-slider gestures.

Deployment is separate from branch validation. This record does not by itself assert that production is serving the change.
