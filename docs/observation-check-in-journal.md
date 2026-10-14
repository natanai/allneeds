# Observations, check-in, and Journal continuity

User-approved scope, 2026-10-14. The guided check-in is the existing Alexithymia support lane at `/alexithymia-support`; it is not another Journal system. Main merge and live deployment are authorized after verification. The Observations guide research work on `site-test` is separate.

## User flow

1. Write on Observations. `Continue with check-in` is available without completing Explore; `Write directly in Journal` is secondary.
2. The existing What happened step contains the observation, ready to edit. Continue leads to the optional Body clues / Overall feeling step.
3. Words includes the Observation possibilities on its existing magnet surface, labeled by source. Body clues add their independent matches. Fits, Maybe, and Not this time remain personal choices, and intensity remains optional.
4. Your words keeps explicit Feeling/other-word choices and offers the Observation's Need possibilities as optional additions. Nothing is automatically selected.
5. Continue in Journal opens the normal full-screen review/edit/save page. One Save creates one Journal entry. Unchosen possibilities are not recorded as Feelings or Needs and do not contribute reported data to History.

History's New entry, the menu's New journal entry, and the optional Journal magnet share the same entry doorway. It offers Guided check-in first and direct writing beside it. A remembered choice is explicitly opt-in and device-local. A quiet alternate-method action remains available with a remembered preference. New entry preference can change the method or restore asking each time. Saved-entry editing and page turning retain the existing Journal behavior.

## Preservation boundaries

- The check-in stores the source text and stable canonical suggestion identities as draft context. Suggestions are not decisions, ratings, or probabilities. The Observation detector and body/overall matching math are unchanged.
- Editing check-in text does not erase earlier possibilities; their source label becomes From your earlier observation. A fresh explicit handoff from Observations refreshes the snapshot without altering kept choices.
- Use in this check-in applies to the same active check-in ID and keeps body cues, overall ratings, decisions, intensity, custom words, Needs, and personal edits. Untouched generated wording can refresh normally. Return to check-in alone applies nothing.
- An independent Observation visit encountering an unfinished check-in offers Continue saved check-in and an explicitly described Replace with new check-in. The stored draft remains unchanged until that replacement action. Compare-before-write rejects work superseded in another tab.
- Direct-writing handoff cannot append to or replace an occupied Journal draft. The existing unfinished page is offered directly, while the source observation remains available.
- When direct writing is chosen during an active check-in's guide visit, it retains that check-in's explicit choices and personal wording. Both routes share one canonical Journal transfer owner; saving completes the same matching check-in rather than leaving a second unfinished entry.
- Both handoffs write the destination successfully before navigating. The independent Observation draft stays intact after copying. Storage errors remain visible and do not imply successful continuation.
- A successful Journal save completes only the matching check-in, using the existing ID/content comparison. Unrelated drafts and saved entries remain protected.
- Route updates respect an already open modal's focus ownership. In particular, the choice-to-Journal transition keeps its Reflection focus instead of a later URL update moving focus behind the dialog.

## Verification

Foundation: typecheck, unit tests, compiled-data freshness, production build, runtime/precache and eager-route verification. Browser coverage includes phone and desktop handoffs, both Met and Unmet suggestion views, reload, body-clue preservation, personal wording, unchosen-suggestion exclusion, single-entry saving, explicit preferences, narrow/enlarged-text dialog use, unfinished drafts, stale replacement, and destination-storage failures. The full browser suite and offline/reconnect check are the release gates; final results are recorded below before publishing.

The pre-existing History viewport test used UTC instants while asserting a local-midnight boundary. Its fixture now constructs local 23:00 and 02:00 values, so the same intended calendar-day assertion works across execution time zones. Production History code is unchanged.

The existing repeated-preset History browser test also retained the previous iteration's saved one-day view, then attempted the overview drill-down again behind the already opened Journal. Each iteration now explicitly restores the 30-day overview before testing keyboard drill-down. The per-preset timeout scales with the number of presets; its assertions are retained.

The existing signed-out account smoke test still used the retired Save this browser label. Its disabled-button assertion now targets the approved Back up profile label. No account behavior was changed.

Browser checks use Chromium and simulated phone sizes. Physical iPhone Safari / installed-app behavior and VoiceOver still need device evaluation; do not describe emulation as device certification.

### Release verification, 2026-10-14

- Final `pnpm check`: passed, with 358 unit tests in 65 files, typecheck, compiled-data checks, production build, and runtime/precache verification.
- All 16 new workflow cases passed across the final scoped runs. Coverage includes phone/desktop, both Met/Unmet source views, suggestions surviving body clues and reload, optional/no-word saving, explicit Needs, preserved personal wording, same-entry direct writing, occupied drafts, stale tabs, older drafts without an ID, storage failures, explicit starting preferences, 320px enlarged text, and the menu/Journal magnet.
- The 9 shared entry/navigation/fixture checks passed. These include corrected History preset iteration, signed-out backup labeling, direct-writing focus, persistent navigation geometry, public-feed reuse, and startup readiness.
- The final browser-Back and legacy-resume checks passed (3/3). Choosing a method consumes the entry intent, and explicitly resuming an older draft assigns its visit identity before opening its saved step.
- Offline/reconnect verification passed: version-safe cache-first upgrade, a fresh offline client, cached deep routes, same-port restart, and cache-miss reconnect. Local Chromium launch options were supplied externally; no browser/environment-specific configuration was added to the repository.
- A broader 164-case sweep passed 161 cases initially. Two stale fixtures were corrected and passed on follow-up; one browser closed before the feed test started, and that test passed with a fresh browser. A subsequent broad follow-up stopped at the native prepaint case without a final report and is not counted as a completed pass. The enlarged-text geometry check also had one immediate-measurement failure in a mixed run and passed unchanged in an isolated rerun. There is no claim that a single uninterrupted full-suite run was green.

The final affected-flow runs, including the enlarged-text rerun, cover 29 distinct browser cases. The broader sweep is additional regression evidence, not a substitute for the final flow checks or physical-phone evaluation.

## Phone evaluation

1. Reload allneeds.app. Open Observations and write a short moment; try Continue with check-in before Explore. Confirm the first step contains your text.
2. Repeat after Explore. Notice some Feeling and Need suggestions, then continue. Add a body clue and confirm the earlier words remain available and labeled by source.
3. Keep a word as Fits or Maybe, add a suggested Need, and continue into Journal. Review/save once; History should contain one new entry with only your kept choices.
4. In History, tap New entry. Try Guided check-in and direct writing. If desired, remember a starting preference; verify the alternate method remains available and the preference can be changed.
5. Leave a check-in unfinished, then start from a different observation. Cancel the replacement choice and confirm the earlier work remains. Separately, open the Observations guide from a check-in, write there, and use Use in this check-in to apply it while retaining earlier choices.

Pay attention to whether the next action is obvious, source labels make sense, any step feels compulsory, or returning makes the app feel like it started a different entry.
