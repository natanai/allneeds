# Observation guide consolidation: source-to-claim review

Date: 2026-10-11  
Scope: `src/data/observationGuide.json` and its React renderer on `/observations`.

## Ownership and reader experience

The former `desktop.sections` and `mobile.sections` were independently authored sets of guidance. The production React page rendered only `mobile.sections` at every viewport, so the longer legacy guide was retained as unused content rather than providing desktop users with more information.

There is now **one** `sections` collection. Every device renders the same explanations, worked examples, measurement concepts, caveats, and references. Details keep the material collapsed until requested. Desktop uses a two-column layout for worked examples; smaller widths stack them. The Quick Check Info controls, example sentence, editor, and deeper guide retain distinct jobs.

This is general writing and observational guidance, **not** a claim that a personal account can be assessed for truth by an algorithm. Observations and interpretations can be recorded together while distinguishing them. The editor's local highlight/Quick Check rules are not validated psychological measures.

## Sources retained or introduced

Public citation numbers are determined by the source's *first use*, not old source-list indices. The references below are not all equivalent types of evidence. The quoted applications are deliberately narrower than causal or treatment claims.

| Visible number | Source and direct link | Supports here | Does **not** establish |
| --- | --- | --- | --- |
| [1] | IRIS Center (Vanderbilt University), [Defining Behavior](https://iris.peabody.vanderbilt.edu/case-study/defining-behavior/) | Observable, measurable descriptions; operational definitions, examples and non-examples for formal records. | That interpretation, emotion, or experiences of harm are false or forbidden in personal writing. |
| [2] | Nock & Kurtz (2005), [Direct behavioral observation in school settings](https://doi.org/10.1016/S1077-7229(05)80058-6), *Cognitive and Behavioral Practice* | The role of context and specific behaviors when collecting structured observation data in school settings. | That one method is empirically optimal for every interpersonal conflict or personal journal. |
| [3] | IRIS Center, [Measuring Behavior](https://iris.peabody.vanderbilt.edu/case-study/measuring-behavior/) | Count/frequency, duration, latency, and operational measurement concepts. | That the software automatically measures these values with professional accuracy. |
| [4] | IRIS Center, [Descriptive Assessments](https://iris.peabody.vanderbilt.edu/module/fba-elem/cresource/q2/p06/) | Antecedent, behavior, consequence recording and pattern evaluation in a formal functional behavioral assessment. | That a single ABC observation proves a behavioral function or another person's intent. |
| [5] | Essig, Rotta & Poling (2023), [Interobserver agreement and procedural fidelity: An odd asymmetry](https://pmc.ncbi.nlm.nih.gov/articles/PMC10098472/), *Journal of Applied Behavior Analysis* | Why reliability and fidelity deserve explicit attention when multiple observers record behavior. The article is a review of reporting practices in behavior-analytic journals. | A validation study of this app or a controlled demonstration that a particular observer-calibration method works. |

The editorial explanation that extra context may make **an account easier to follow** is presented as a practical purpose, not a quantified evidence claim. Findings from professional direct observation are not asserted to establish effectiveness of NVC or to diagnose motives.

## Retired citation problems

The old combined inventory listed 18 links; the short guide referenced eight of their original indices. Matching indices to real article titles revealed significant claim/source mismatches:

- **PMC4766977** had been labeled “behavioral observation reliability guidance,” but is *Clinical Processes in Behavioral Couples Therapy*. It is not a primary authority on observer reliability.
- **PMC8773921** had been labeled “measurement-focused language guidance,” but is *Evidence for the Concreteness of Abstract Language: A Meta-Analysis of Neuroimaging Studies*. It does not establish the effectiveness of inserting counts in personal narratives.
- **PMC6353691** had been described as research on “concreteness and comprehension,” but specifically studies the memory advantage of concrete vs. abstract words, not the effects of adding time/place/observable behavior to conflict accounts.
- **PMC4841258** studies functional analyses in 176 inpatient cases and should not be presented as general evidence that any ABC note or personal account determines behavioral function.
- **PMC10098472** is retained under its real topic, interobserver agreement *and procedural fidelity reporting*, not as an “observer calibration study.”

Other older links concerning trust, social connection, affect labeling, or general psychological needs are not reproduced without a direct, reviewable link to the specific claim that the Observation guide now needs to make. That is intentional source curation, not deletion of otherwise usable features: users retain all conceptual jobs of the guide and a focused reference library. The removed legacy copy remains recoverable in Git history.

## Verification boundaries

- The authored guide's citations use one canonical reference collection. Tests check sequential first-use numbers, anchor matching, valid direct HTTPS URLs, and absence of retired mismatched citations.
- A browser regression compares section titles and reference count at 390px and 1280px and checks mobile reference navigation.
- Connector-only editing cannot execute `pnpm check` or Playwright; these are still mandatory before merge.
- Direct source-to-claim inspection was conducted using the cited IRIS Center resources and article abstracts/catalog entries. It is not a systematic review and does not clinically validate this writing aid.
