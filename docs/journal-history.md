# Journal and emotional history

Approved for implementation on `site-test` on 2026-10-11. Start from current `main`; keep the change on the review branch until phone and desktop review is complete.

## Ownership and continuity

`JournalPage` owns route opening, local repository updates, backup/restore, and the shared full-screen shell. `JournalBook` owns writing, read-only pages, page navigation, and independent composer drafts. `HistoryWorkspace` owns graph settings and review controls. `HistoryChart` draws local SVG and exposes keyboard-operable points; it requires no external chart service. `historyModel` owns filtering, local calendar windows, aggregation, denominators, summaries, and CSV serialization.

Saved entries remain schema 1 under `allneeds.v2.journal`. Compatible optional fields are:

- `mood`: `{ kind: 'rated', value: -5..5 }`, `{ kind: 'mixed' }`, or `{ kind: 'unsure' }`. Omission means not rated.
- `experiencedAtISO`: the optional time the recorded moment happened. Charts and page ordering use this when present; otherwise they use `dateISO`.
- `createdAtISO`: the original creation time for new entries. Existing `dateISO` remains unchanged by editing and remains the creation-time fallback for older entries.
- Feeling `ratingSource: 'unknown'`: a legacy feeling label had no recorded number. Its former display fallback remains compatible, but history never uses it as a reported intensity.

Previously saved entries that already contain an explicit numeric fallback without provenance cannot be distinguished from actually entered ratings. Do not infer unknown provenance from the number 5 alone or rewrite users' historical ratings. Newly migrated unnumbered labels retain unknown provenance through subsequent saves.

The existing new-entry draft key is retained. Edit drafts use `allneeds.v2.journal.draft.<entryId>`, which is already recognized by the profile reconciliation draft-preservation policy. A draft left by the older combined composer is moved to its edit key once. Reading pages does not write a draft. New and edit drafts flush on page changes, page hide, visibility change, and unmount. Saving or clearing one draft does not clear another.

Annotations use `allneeds.v2.journal.annotations`, a versioned local repository. Generic browser backups and explicitly saved profile snapshots carry this key. It follows the existing settings-source choice during profile reconciliation, rather than silently merging conflicting annotations. Graph view settings are session-local, under `allneeds:history-view`, and are not included in browser/profile backups. Graph controls survive Journal opening/closing, route visits, and a reload in the same tab.

Normal account merging, browser backup, restore, and repository normalization preserve the optional entry fields. No backend schema or account-authentication change is required. There is no automatic sharing, diagnosis, text-based emotion inference, or telemetry of personal content.

## Plot and review rules

The initial window is today and the preceding 29 local calendar days. Other presets are 7 days, 90 days, all time, and inclusive custom dates. All time extends from the first recorded moment through the latest moment or today. Windows end exclusively at the next local midnight; navigation changes calendar days rather than assuming every day is 24 hours. Dates on the plot are proportional to elapsed milliseconds.

Mood has a fixed −5 to +5 axis. Intensity has a fixed 0 to 10 axis, with selected feelings rated 1 to 10. Frequency has a fixed 0 to 100 percent axis. Mixed, Not sure, missing mood, unselected feelings, and unknown intensity never become numeric zero. Frequency zero means no matching logged entry mentioned the selected feeling, not that the feeling was absent.

Each-entry series retain all individual records and break at unscored moments or gaps longer than one calendar day. Daily aggregates break across missing days; weekly aggregates break across missing weeks. Weeks begin on Monday. Aggregates use the arithmetic mean of reported values only, retain min/max, rating count and total entry count, and link to every matching page in that bucket. Frequency uses mention count over all matching entries in that bucket, including entries with no selected feelings. There is no smoothing, interpolation across gaps, or inferred daily score.

Filters apply before grouping and before recap calculations. A selected feeling in the filter means the entry mentions that feeling; selecting a series chooses what to plot. Intensity thresholds require at least one reported selected-series rating in the interval, or any reported feeling when viewing mood. The unfiltered intensity interval does not discard entries without feeling ratings.

The recap's median and range use the first plotted series' raw reported ratings, not medians of daily averages. Entry and day counts include all matching entries. Frequency uses the matching-entry denominator. These are descriptions of recorded moments, not estimates for unrecorded time.

Comparison uses the immediately preceding window with the same number of calendar days and identical filters. It aligns earlier marks by day within the window. Tooltips and journal pages retain the real earlier dates. Different logging frequency or selected contexts may affect a comparison.

Coincident timestamps remain separate records. Hit targets expose nearby points together when their marks overlap, so a page cannot be hidden behind another mark. The secondary entry log remains an alternative route to every matching page, including unscored pages.

CSV exports the current matching entries with settings and provenance; reflections require opt-in. User text is quoted and spreadsheet formula prefixes are neutralized. The printable recap includes the graph, period, counts, selected settings, comparison, visible context notes, and optional reflections. Files are created locally only on an explicit export action.

## Phone and desktop review

1. Open Journal. Confirm the blank ruled page fills the available body and Entry details begins closed. Write a draft, then open Entry details to choose feelings at different intensities and optionally rate mood. Try Mixed and Not sure independently of Neutral.
2. Use the page-turner along the bottom edge to turn Older and Newer, open its center control to jump to a date, and return to New entry. Check that the unfinished page returns unchanged. Swipe only the narrow binding edge on a phone.
3. Edit a saved page, leave it without saving, then return and edit again. Check that this edit and the new-page draft survive independently after reload.
4. Save a page with an earlier experienced date. Confirm its page order and graph point use that date while its original save time remains available.
5. On History, confirm the graph precedes its controls. Then select 7/30/90 days, all time, and custom dates. Navigate periods and zoom. Tap an individual point, overlapping points, an aggregate, and an unscored marker.
6. Compare two or three feelings, daily/weekly averages, and frequency. Inspect counts and ranges. Filter by a tag or Need and compare with the previous period.
7. Close Journal from a graph point. The measure, period, zoom, and filters should still be there.
8. Add a context note. Print/export first with reflections off, then with reflections on. Verify only the intended period's entries are included.
9. Try every Customizer preset, narrow portrait width, large text, keyboard-only controls, and reduced motion. Long entries should remain readable with vertical scrolling.

Automated coverage includes graph semantics, provenance, same-time records, aggregation, filtering, local calendar windows/DST, CSV safety, normalization, independent drafts, profile reconciliation, desktop/phone interactions, keyboard access, all presets, printing, route stability, and existing handoff/backup flows.
