# Check-in sheet repairs — October 17, 2026

Baseline: `main` at `80b908bfe5f6dee765ad968c460672f34d53107b` (PR #192). Phone screenshots showed the earlier missing rating-status lines, but a fresh live-browser visit also reproduced an unresolved expanded-help layout defect. The prior selection-cue release did not resolve all sheet-density and gesture complaints.

## Changes

| Issue | Owning repair | Regression coverage |
| --- | --- | --- |
| Opening rating Info squeezed the label beside the explanation, and an invalid font shorthand left the paragraph bold. | Keep the native disclosure; give the label a stable full row and the paragraph normal full-width body flow. Explicitly name the fieldset with the label. | Expand both disclosures at 320, 390, and 1280px, plus 320px/doubled text; compare heading widths and paragraph position/type. |
| Done was below long content; the Need picker repeated its explanation and framed a board inside the sheet. | Shared optional footer outside the body scroller. Need count/Clear/Done stay visible; empty Done preserves the former leave-without-choosing behavior. Sticky search, the existing About Needs disclosure, and no extra board border. | Scroll the full list, search, select, complete, and reopen; verify viewport containment, checks, count, and no forced keyboard. Existing palette/physics cases remain unchanged. |
| Mobile sheets displayed a nonfunctional handle. | Shared header/handle-only pointer gesture with direct translation, long-downward/short-flick dismissal, cancellation/reset, and normal Close-path focus/data handling. Body scrolling, controls, maps, and magnet gestures do not initiate sheet dragging. Desktop/dialog/fullscreen behavior is not opted in. | Real touch-event tests for deliberate, short, upward, sideways, and cancelled drags; answer preservation and focus return; body scrolling; desktop non-dismissal. Pure threshold unit tests. |

No palette values, Need identities, psychological guidance, catalogue content, scoring, or persistence schemas are changed. Physics remains on by default. The explanatory wording is moved without being rewritten.

## Verification status

- Foundation gate passed: 372 tests / 68 files, TypeScript, deterministic compilers, production build and build verification.
- Browser verification is **not passed**. The normal Playwright Chromium download returned a truncated/invalid archive. A temporary npm-distributed test browser could not launch (`EACCES`, before any application test opened). No execution-permission workaround was applied.
- The supported cloud browser cannot reach the local preview (`ERR_CONNECTION_REFUSED`). GitHub's existing manual Full repository validation action is available, but this cloud browser is signed out and the connector exposes no workflow-dispatch operation.
- The new 11-case browser file and existing full regression suite must run before merge/release. Visual phone/palette review also remains pending. This branch is not a live-site completion claim.

Physical iPhone Safari, Home Screen, and VoiceOver are separate review targets; no desktop/touch-emulation result should be presented as certification of those environments.
