# Clarity Content Audit

> Status: content approved and implemented in this audit branch on 2026-08-27. Magnet review remains separate and is required before Clarity is marked fully audited.

## Canonical production owner

Reviewed Clarity content is owned by `src/data/editorialCatalog.json` and compiled through the existing deterministic runtime catalog pipeline. `src/data/generated/legacyData.json` remains an imported historical snapshot and is not hand-edited by this audit.

No Clarity-specific React rendering, runtime CSS, runtime copy repair, or second editorial source is introduced.

## Approved page structure

Clarity uses two function lenses under one canonical Need:

1. Making things explicit
2. Getting clear within yourself

The umbrella and each lens are editorial descriptions, not claims that Clarity is a formally established scientific construct with one accepted definition.

## Approved umbrella copy

> Our value for clarity may motivate us to make something easier to distinguish or work with. This can involve making outside information more explicit or getting clearer about what matters to us. The amount of detail that feels sufficient can differ between people and situations. Clarity can help us see what is being claimed or what remains uncertain without deciding whether a claim is true or an uncertainty is resolved.

## Lens 1: Making things explicit

Recognition cue:

> I want this to be clearer.

Approved short copy:

> When something feels ambiguous, we may seek clarity by making the relevant information easier to work with. We might bring related material together, state an expectation more precisely, or identify what is still uncertain. Making a statement easier to perceive does not tell us whether it is true. Making uncertainty explicit does not make it disappear.

Approved Details:

> Chandler and Sweller studied instructional materials in which learners had to combine related information presented in separate places. Across two experiments, learners performed better when the related information was physically integrated. Their findings show that presentation can affect how easily people work with information that belongs together. [1]
>
> Tubre and Collins combined 74 correlations from studies of role ambiguity, role conflict, and job performance. Greater role ambiguity was associated with lower job performance. In this research, role ambiguity refers to uncertainty about what a person's role requires, giving one example of how unclear expectations can be studied directly. [2]
>
> Reber and Schwarz changed how easy statements were to perceive while keeping their content the same. Statements that were easier to perceive were more likely to be judged true. The experiment separates perceptual clarity from the truth of the statement itself. [3]
>
> Van der Bles and colleagues reviewed research on communicating uncertainty about facts, numbers, and scientific knowledge. The work they examined included ways of communicating probabilities, ranges, and limitations directly. This research shows how uncertainty can be made more explicit without first being resolved. [4]

Sources:

1. Chandler, P., & Sweller, J. (1992). *The split-attention effect as a factor in the design of instruction.*  
   https://doi.org/10.1111/j.2044-8279.1992.tb01017.x
2. Tubre, T. C., & Collins, J. M. (2000). *Jackson and Schuler (1985) Revisited: A Meta-Analysis of the Relationships Between Role Ambiguity, Role Conflict, and Job Performance.*  
   https://doi.org/10.1177/014920630002600104
3. Reber, R., & Schwarz, N. (1999). *Effects of perceptual fluency on judgments of truth.*  
   https://pubmed.ncbi.nlm.nih.gov/10487787/
4. van der Bles, A. M., et al. (2019). *Communicating uncertainty about facts, numbers and science.*  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC6549952/

### Source roles and limits

- Chandler and Sweller provide experimental evidence that integrating mutually referring instructional material can improve performance. This is evidence about instructional presentation, not a universal theory of Clarity.
- Tubre and Collins provide a meta-analytic association between greater workplace role ambiguity and lower job performance. The evidence is correlational and specific to role ambiguity.
- Reber and Schwarz experimentally show that perceptual fluency can change truth judgments while the truth of the statement stays unchanged. Perceptual fluency is narrower than the everyday Need label Clarity.
- van der Bles and colleagues review direct communication of epistemic uncertainty. The source supports the distinction between making uncertainty explicit and eliminating uncertainty.

## Lens 2: Getting clear within yourself

Recognition cue:

> I want to get clear on what I think or what matters to me.

Approved short copy:

> Sometimes clarity concerns our own beliefs or values rather than outside information. We may want to put what matters into words, notice when important values conflict, or recognize that we have not decided yet.

Approved Details:

> Campbell and colleagues developed a measure of self-concept clarity. It examines how clearly and confidently people define their beliefs about themselves, along with how consistent and stable those beliefs are. Their work gives one example of psychology studying clarity within a person's own view of themselves. [1]
>
> Witteman and colleagues reviewed 33 articles evaluating 43 explicit values-clarification methods used in health decisions. Across the included studies, these methods modestly reduced decisional conflict and choices that did not align with participants' stated values compared with control conditions or less explicit approaches. The methods used different ways of helping people make what mattered to them more explicit while deciding. [2]

Sources:

1. Campbell, J. D., et al. (1996). *Self-concept clarity: Measurement, personality correlates, and cultural boundaries.*  
   https://doi.org/10.1037/0022-3514.70.1.141
2. Witteman, H. O., et al. (2021). *Clarifying Values: An Updated and Expanded Systematic Review and Meta-Analysis.*  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC8482297/

### Source roles and limits

- Campbell and colleagues establish self-concept clarity as a studied psychological construct concerning beliefs about oneself. The construct is not treated as a formal definition of the broader Clarity Need.
- Witteman and colleagues synthesize explicit values-clarification methods in health decisions. The methods were heterogeneous and the review does not establish one universally best method or a hidden single true value that must be discovered.

## Important conceptual boundaries

The audit keeps several nearby concepts distinct:

- Clarity does not establish truth. A false statement can be expressed clearly.
- Clarity does not require certainty. Uncertainty can be stated clearly.
- Clarity does not require agreement. People can clearly identify where they disagree.
- Clarity does not require simplicity. Complex material can still be represented clearly.
- Clarity is not identical to Understanding. Understanding concerns making sense of something; Clarity concerns how distinctly something is represented, stated, or recognized.
- Clarity is not identical to Causality, Choice, Order, Honesty, or Integrity. Those Needs may benefit from clarity without becoming the same Need.
- More detail is not automatically more clarity. The useful degree of detail can vary by person and situation.

No evolutionary origin story is asserted for Clarity. The reviewed literature did not justify one at the evidentiary standard used by this project.

## Rejected healthcare claim

The legacy Clarity copy attributed an approximately 80 percent serious-medical-error figure to Lingard et al. (2004). That attribution is not supported by the Lingard study and is removed from the reviewed package.

Lingard and colleagues observed 90 hours across 48 surgical procedures, coded 421 communication events, and classified 129 as communication failures. Their study does not establish that 80 percent of serious medical errors are caused by communication failures.

A separate Joint Commission handoff statistic was considered but is not used to repair the legacy claim. Neither Lingard nor the Joint Commission statistic is part of the approved Clarity evidence package.

## Approved system strategies

The final static Clarity deck contains two system strategies.

### Separate what happened from what you think it means

Approved wording:

> One exercise used in cognitive behavioral therapy asks people to describe what happened, then separately write down the thoughts or interpretations that came up about it. You do not need to decide that your interpretation is wrong to make that distinction. Try two lines, mentally or in a note: “What happened:” and “What I think it means:”. Give each its own answer.

Supporting source: NHS Every Mind Matters thought record.  
https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/thought-record/

Evidence route: established clinical guidance translated into a small self-contained distinction. The card explains cognitive behavioral therapy in full rather than assuming knowledge of the abbreviation CBT.

### Name what matters here

Approved wording:

> A systematic review and meta-analysis by Witteman and colleagues found that explicit values-clarification methods modestly reduced decisional conflict and choices that did not match participants' stated values in health decisions. Think of a decision or tension that is present for you. Name what matters to you in it. If two things matter, notice whether they point in the same direction or pull against each other.

Supporting source: Witteman et al. (2021).  
https://pmc.ncbi.nlm.nih.gov/articles/PMC8482297/

Evidence route: direct intervention synthesis with a restrained personal translation. The card does not assume that one value must dominate or that values clarification guarantees a particular decision outcome.

### Strategy rejected from the final deck

`Bring the pieces together` was removed at final approval because its instructional evidence did not feel generalizable enough for a personal therapeutic strategy card. Chandler and Sweller remain useful evidence for the Making things explicit lens, but the study is not used to justify a Clarity strategy.

Earlier candidates based on bank-teller task clarification and generic problem-definition procedures were also not retained in the final deck because their translation to personal therapeutic use was not strong enough for this package.

## Legacy strategy dispositions

Seven inherited system strategies are globally discarded as part of the approved Clarity package:

- `alternate-nostril-breaths`
- `hold-something-cool`
- `name-three-sounds`
- `name-three-needs-alive`
- `circle-the-priority`
- `name-need-link`
- `trace-your-hand`

Twelve shared strategies lose only their Clarity association. Their other approved Need relationships remain:

- `5-4-3-2-1-check` remains Safety.
- `write-three-sentences` remains Honesty.
- `observation-only` remains Honesty.
- `micro-request-to-self` remains Autonomy.
- `ask-for-channel-shift` remains Autonomy and Consideration.
- `calendar-one-thing` remains Predictability and Order.
- `self-check-scale` remains Honesty.
- `name-what-s-within-control` remains Autonomy.
- `value-compass-card` remains Integrity.
- `name-a-want-a-don-t` remains Honesty and Autonomy.
- `window-quarter` remains Beauty, Calm, and Appreciation.
- `nearest-job` remains Order. Its Understanding association had already been removed by the Understanding audit.

`observation-only` may deserve wording review during a future Honesty audit, but this Clarity audit does not rewrite it.

## Provenance boundary

No current repository-resident user strategy is statically associated with Clarity. `src/data/userStrategies.json` remains untouched.

Dynamic public, profile-owned, and Bluesky-backed strategies are outside this static content audit and remain under their existing storage and moderation systems.

The Clarity category, faux-feeling relationships, and feeling relationships are unchanged because they were not audited in this scope.

## Citation URL invariant

All approved Clarity research-facing URLs are stored as direct human-facing destinations. No ChatGPT/OpenAI intermediary, search-result link, tracking parameter, proxy, or referral wrapper is part of canonical Clarity data.

## Implementation boundary

The approved package is implemented through the existing deterministic catalog owner:

`src/data/editorialCatalog.json` -> existing build-time catalog compiler -> production Need and strategy records.

The generated legacy snapshot is not edited. No Clarity-specific component branch, runtime citation repair, post-processing layer, or styling patch is required.

After this content is live, Clarity still requires a separate magnet review in `/design-lab/need-magnets`. Content approval does not authorize a production magnet change.
