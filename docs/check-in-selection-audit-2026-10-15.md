# Check-in selection-cue audit — October 15, 2026

Baseline: current `main`, `e6ddd7c2b4c687f1ee8949a891b690ee87f558c7`. The user reported that selected Feelings and Needs could look unchanged with their custom palette and requested a whole-flow audit. Their exact saved palette was not available; verification uses the five real presets and deliberately identical fill roles, including light, dark, and matching-outline cases.

## Findings and treatment

| Surface/state | Finding | Treatment |
| --- | --- | --- |
| What happened: entered text and recognized-word previews | Writing and preview labels already distinguish entered text from suggestions. Previews are not selected answers. | Preserve these meanings; never check a word merely because it was detected. |
| Clues: selected body sensations | Existing check/plus, expanded intensity, and selected-cue count already provide non-color confirmation. | Preserve and test selection/deselection. |
| Clues: current body area | Desktop rail relied on face/ink colors; its existing check means an area contains cues, not that it is the open area. Mobile's native chooser already names the area. | Add an inset leading stroke to the current desktop area; preserve the separate cue check and mobile chooser. |
| Clues: full-list view and empty-body choice | Changing action text, area heading/count, and the clue summary already describe these states. | No new answer check on a view-switch action. |
| Overall feeling: placed point | Position, outlined marker, coordinates, and Point selected already describe the chosen point. | Preserve; selecting an alternative replaces rather than confirms that point. |
| Overall feeling: Mixed / Not sure alternatives | The current response was repeated in the summary, but the two buttons themselves relied on fill/border colors. Enlarged-text inspection also caught a clipped alternative inside the sheet, despite a passing document-width check. | Add a small check to the selected response; keep the other unmarked. Let the shared grid stack when labels need more width. Test containment inside the sheet, not just document overflow. Shared with Journal. |
| Optional situation scales | Selected positions relied on fill and a one-pixel lift. An untouched scale's Not sure button misleadingly exposed a pressed state. Valid stored values can also fall between the five buttons. | Use an inset ring and explicit Selected: N of 5 / No rating selected text. An in-between value says Previous rating retained, without rounding the data or checking an invented position. Not sure clears the rating; it is not a separately stored response. |
| Words: Matches and partial comparisons | A kept decision could be omitted from the magnet detail, leaving only tone and a match percentage or missing-comparison explanation. Search/My words also dropped score context after a choice. | Always show the actual Fits / Maybe / Not this time decision alongside available context. Only Fits receives a small check. |
| Words: Observation provenance | From your observation identifies origin, not endorsement. | Preserve origin and add decision text only after the person chooses. |
| Words: decision and intensity buttons | Existing ARIA states were not accompanied by a palette-independent button cue. | Add reserved decorative checks without changing accessible names, completion/cancellation, or previously reported ratings. A check beside Maybe acknowledges that tentative response, not certainty about a Feeling. |
| Words: Matches / All words / My words | Current view relied on surface/shadow colors. | Underline the selected view; preserve radio semantics and arrow-key behavior. |
| Your words: kept terms and selected-Need review | Explicit Fits/Maybe text and the selected-only review surfaces already distinguish kept answers from possibilities. Reference buttons are not toggle controls. | Preserve these semantics; do not falsely add aria-pressed to a reference action. |
| Need catalogue toggles | The shared Need face overrides the tone color, and content magnets had no visual selected treatment. Even distinct palette roles could therefore look unchanged. | Add a check in a reserved slot owned by the existing selected property. Toggling changes visibility, not measured size, navigation state, pickup, or physics. |
| Shared Need icon ink | Fixed black masked glyphs disappear on dark faces even when the label and new selection check are readable. | Use current foreground ink for the same shared glyph. Preserve identity-specific artwork/ink overrides; this is not an icon redesign. |
| Journal handoff | The shared Journal Need picker already has explicit checkboxes; the map is the same component as the check-in. | Retain Need checks and carry the map improvement through the existing shared owner. |
| Stage, clear/Undo, and speech controls | Step name/count, clearing status/Undo, and Read aloud/Stop reading text/icon already expose state without a selected fill. | Preserve and cover through existing workflow regressions. |

The non-color rule follows [W3C's Use of Color guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html): shape or text must carry information that otherwise depends on color. This is a targeted interaction repair, not a claim of complete WCAG conformance, a clinical outcome, or a first-use study.

## Verification

`tests/e2e/check-in-selection-cues.spec.ts` exercises real persisted theme values, not runtime style overrides: five presets, identical light fills, identical dark fills, fills identical to outlines, 320px/doubled base text, long Need names, keyboard selection/replacement, Matches/search/My words, partial comparisons, custom words, source provenance, clear/Undo, and reopening a chooser. Physics stays on. Shared magnet rendering/style tests guard against marking ordinary suggestions or navigation as selected and against removing the reserved slot.

Results:

- Final-source `pnpm check` passed: 370 tests across 67 files, type checking, deterministic compilers, production build, and build verification.
- The complete browser suite passed all 183 cases in 16.9 minutes before the final icon-ink and restored-rating-caption refinements. This includes the check-in, Journal handoffs, keyboard focus, physical dragging/pressure, persistent navigation geometry, all-Need mobile containment, and offline-shell regressions.
- After those two refinements, the focused selection/map/Refrigerator run passed 21 cases. One remaining case failed during browser-context setup (`Browser.setDownloadBehavior`) before the app opened; that exact unchanged long-Need case passed in a fresh run in 3.8 seconds. All 12 new selection cases therefore have passing final-source executions, alongside the shared-map and seven Refrigerator checks. This is not reported as a clean final-source `pnpm check:all` run.
- Final-source offline/reconnect verification passed: version-safe cache-first upgrade, fresh offline client, cached deep routes, same-port restart, and cache-miss reconnect.
- Light, dark, Refrigerator, and 320px/doubled-text word, scale, and Need screenshots were visually inspected. The clipped-alternative discovery prompted a stronger within-sheet containment assertion instead of relying only on document width.

Browser checks used Playwright 1.62.1 with a temporary Chromium 153.0.8010.0 launcher. The normal Playwright browser archive could not be retrieved in this environment. The pinned-browser repository validation path remains available for an independent check; physical iPhone results remain pending.

## Boundaries and phone review

- No theme values, catalog identities, scoring, psychological guidance, persistence schema, uncertainty meanings, or Journal save rules are changed. Checks use Customizer-owned foreground ink; they do not overwrite the user's palette.
- Identical fill roles are supported; arbitrary foreground/background combinations can still make all text unreadable. This change is not a general palette-contrast enforcement system.
- Chromium tests and doubled root font size do not establish physical iPhone Safari, Home Screen, VoiceOver, or actual iOS text/zoom behavior. On a review build, repeat selecting/deselecting two Needs, Fits → Maybe → Not this time, map point → Mixed → Not sure, optional-scale rating/clear, and clear/Undo using the user's actual palette. A choice should be recognizable without comparing colors, and Maybe must remain visibly tentative.
- Browser installation helpers, test-launch configuration, and screenshots remain outside committed application dependencies/configuration. These validation steps did not publish a production build.
