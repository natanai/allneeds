# Check-in UX audit repairs

The October 13, 2026 audit examined the live four-stage support lane and source at `36525b56413224777f8c0f70ff69532864c60686`. The user approved proceeding with the repair plan. This record describes the implementation and verification; it does not replace the original audit's observations with claims about user-study outcomes.

## Findings and resulting behavior

| Audit finding | Resulting behavior | Main regression coverage |
| --- | --- | --- |
| F01: Help detours break continuity | Observation help and recognized-word previews stay in sheets. Full canonical references have a dedicated return that survives further reference navigation in the same visit. The full Body Cues tool has a check-in working copy and explicit apply action; its independent draft remains separate. | `check-in-clarity.spec.ts`: observation help, nested reference return, Body Cues handoff |
| F02: No word yet clears choices | Words has one continuation: Continue with kept words, or Continue without a word when none are kept. Clearing is a separate reversible action. | `check-in-clarity.spec.ts`: clear words/undo, uncertainty-only handoff |
| F03: Skip erases observation | Skip advances and retains writing. Clear observation offers Undo. | `check-in-clarity.spec.ts`: observation/history/undo |
| F04: Body uncertainty erases cues | Existing clues show Clear body clues with Undo. Nothing clear in my body is offered when there are no selected clues. Done preserves choices. | `check-in-clarity.spec.ts`: mobile area chooser/clear/undo |
| F05: Need uncertainty has conflicting meanings | Add/Edit Needs opens browsing; Done preserves; Leave without choosing closes an empty picker; Clear selected Needs explicitly clears with Undo. | `check-in-clarity.spec.ts`: sentence/Need changes, viewport matrix |
| F06: Generated statements become stale | Untouched generated text updates with its source choices. Edited text stays intact and signals when choices have changed. | `check-in-clarity.spec.ts`: sentence updates and personal edits |
| F07: Rebuild destroys personal edits | Updating edited wording opens a replacement preview. Keep my wording cancels; replacing offers Undo. | `check-in-clarity.spec.ts`: replacement/undo |
| F08: Maybe becomes a stronger assertion | Generated wording uses “I might feel”; Journal context retains Fits/Maybe. Older entries keep missing decisions unknown. History graph semantics are unchanged. | `alexithymiaTerms.test.ts`, `journalRepository.test.ts`, `check-in-clarity.spec.ts` |
| F09: Uncertainty-only check-ins cannot finish | Body, mood, and uncertainty context can reach Journal and satisfy save validation without invented prose, labels, Needs, or ratings. | `workflowDrafts.test.ts`, `alexithymiaTerms.test.ts`, `check-in-clarity.spec.ts` |
| F10: Occupied Journal has no recovery action | Open unfinished Journal preserves that draft and provides return after saving/closing. The incoming check-in never replaces it. | `check-in-clarity.spec.ts`, `check-in-magnet-and-map.spec.ts` |
| F11: Handoff sounds like a completed save | Continue in Journal explains review and Save at the destination. It is the persistent primary action on mobile Review. Saved feedback still follows the actual Journal save. | `check-in-clarity.spec.ts`, `workflow-continuity.spec.ts` |
| F12: Body-area discovery depends on horizontal scrolling | Mobile has a full-width labeled chooser, all nine areas, a position count, selected-area markers, and an in-sheet All body cues view. Desktop keeps the area rail. | `check-in-clarity.spec.ts`: mobile chooser and viewport matrix |
| F13: Back and reference returns disagree | Stage changes create history entries. Explicit returns restore the stage, view/query, and scroll. Independent reloads offer fresh/continue with saved step/time. | `check-in-clarity.spec.ts`, `workflow-continuity.spec.ts` |
| F14: Search ignores its selected scope | Search stays in Matches, All words, or My words. Empty states distinguish no matches from no selections. | `check-in-clarity.spec.ts`: scoped search/reload |
| F15: Unicode custom-word identities collide | Versioned code-point identities preserve punctuation, emoji, and non-Latin words. Read-boundary migration retains the first known historic choice when old IDs collided rather than inventing extra selections. | `alexithymiaTerms.test.ts`, `workflowDrafts.test.ts`, `check-in-clarity.spec.ts` |
| F16: Custom-word detail suggests unavailable matching | Words without a profile state that they are not compared with clues. | `check-in-clarity.spec.ts`: Unicode words |
| F17: Word-view radios lack arrow behavior | Roving tab stop, arrows, Home, and End update focus and selection coherently. | `check-in-clarity.spec.ts`: radio arrows |
| F18: Need Search receives forced initial focus | Shared dialog entry focuses a non-input control; Search opens through deliberate interaction. | `check-in-clarity.spec.ts`: Need picker focus |
| F19: Stages and optional scales lack orientation | New stages focus their heading without forcing text entry. Scale descriptions include endpoint meanings. | `check-in-clarity.spec.ts`: stage focus and scale descriptions |
| F20: Stage changes reset the wrong scroller | Forward stages reset the owning workspace; temporary reference returns restore its position. | `check-in-clarity.spec.ts`: long mobile stage/return |

Additional repairs found during regression work: observation help stays reachable during text entry, pointer actions retain textarea focus until activation so mobile layout changes do not swallow taps, check-in returns do not fade through the underlying navigation, contextual Body Cues edits persist before an immediate return, removing the last Review word still permits uncertainty-only completion, storage failures are visible and block a lossy reference exit, and unavailable speech produces useful feedback. A two-tab test also exposed a shared storage-event feedback loop: shell listeners now react only to their owned keys, and unchanged navigation settings retain their identity. Stale check-in screens refuse to replace a newer or completed draft and keep their current text available with a conflict message.

## Verification

- Foundation: `TZ=UTC pnpm check` passed with 348 tests across 63 files, type checking, deterministic compilers, and production-build verification. UTC matches the repository CI environment; the existing History viewport test assumes UTC calendar boundaries.
- The production catalog data chunk remains unchanged. No authored catalog, evidence source, association, scoring formula, user strategy, or shared magnet-physics implementation changed.
- Browser regression: 132 of 133 selected cases passed in the broader serial run, including all 17 new check-in cases. The desktop route sweep completed its layout assertions but failed its no-console-warning assertion after one Chromium cross-world service-worker preload warning. That case passed in an isolated clean rerun (1/1), with no app or committed test changes. This is not represented as a clean first-pass full-suite run.
- Offline/reconnect: `TZ=UTC pnpm test:e2e:outage` passed, covering version-safe cache-first upgrade, a fresh offline client, cached deep routes, same-port restart, and cache-miss reconnect.

The new browser coverage exercises widths 320, 375, 390, 430, 768, and 1280, plus 844×390 landscape and reduced-motion states. This is layout and interaction coverage in Chromium, not a claim about physical iPhone behavior.

Browser validation uses Playwright 1.62.1 with a temporary local Chromium 153.0.8010.0 launcher. The environment could not retrieve Playwright's normal browser archive; the launcher and browser remain outside the repository, and no app dependency or committed test configuration was changed for that workaround. The normal pinned Chromium and WebKit/device checks remain release validation.

Two unrelated checks failed identically on the untouched audit baseline in a separate checkout, using the same browser:

| Existing check | Baseline failure |
| --- | --- |
| `journal-history.spec.ts`: History and journal inherit every preset, stay within a narrow phone, and allow keyboard reading | The Journal is already open when the test tries to click the day-entry button behind it. |
| `native-stability.spec.ts`: Bluesky account and profile paths are actionable instead of placeholder controls | The test expects disabled Save this browser / Load saved profile controls that the current account UI no longer renders. |

Those two cases are explicitly excluded from the final broader run using `--grep-invert 'History and journal inherit every preset|Bluesky account and profile paths are actionable'`; they are not counted as passing or silently skipped in committed test code. Their production behavior and test definitions remain outside this check-in repair.

## Remaining release validation

Physical iPhone Safari and Home Screen checks remain necessary for software-keyboard visibility, safe areas, touch gestures, background/foreground durability, and VoiceOver. Also run the original audit's first-use tasks with an unfamiliar person; selector tests cannot prove that the area chooser or continuation wording is discoverable.

The work refuses stale multi-tab writes; it does not automatically merge them. Identity checks also prevent an old Body Cues or Journal handoff from completing a different check-in. Signed-in profile backup, arbitrary user-selected theme contrast, 200% text, and physical-device accessibility remain distinct validation cases. None are represented here as tested user outcomes.
