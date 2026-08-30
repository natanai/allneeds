# Observation Inference 2.1: retrieval-first staging revision

Status: staging implementation for live product review on `site-test`. The stored model metadata remains `2.1.0` while this retrieval-first behavior is being evaluated. If the behavior is accepted for promotion, bump the model version as part of finalization rather than treating the staging experiment as already settled.

## Product job

Observation is a local vocabulary exploration aid. It is not a language model, diagnostic system, clinical inference engine, or probability estimator. Observation text stays in the browser.

The page should help a person who knows what happened but may not yet have Feeling or Need words. It should therefore prefer a useful place to start over an empty result screen.

For ordinary nonblank language input, Explore returns up to four Feelings and up to four Needs and is designed to fill all four positions. Blank input and input without ordinary language, such as emoji alone, may remain empty.

All returned words are possibilities to consider. The person remains the authority on what fits.

## Retrieval-first pipeline

The ranking pipeline is intentionally layered:

1. **Direct self-report.** Canonical Feelings and Needs the person affirmatively names for themselves rank highest.
2. **Specific authored relationships.** Faux Feeling relationships, reusable observable event families, and migrated authored Observation cues contribute stronger related evidence.
3. **Deterministic keyword retrieval.** The observation is treated as a search query over canonical Need-centered documents. Keyword retrieval contributes broader candidate Needs.
4. **Need-to-Feeling projection.** Candidate Needs supply canonical Feeling relationships for the selected `Unmet` or `Met` view.
5. **Catalog-derived starter completion.** When stronger layers do not fill the result set, broad starter Needs and Feelings derived from the canonical catalogs fill remaining exploration positions.

The specific event grammar is therefore a ranking boost, not permission for the page to return anything at all.

## Search documents

`src/domain/observationInference/retrieve.ts` builds one deterministic search document per canonical Need from existing owned material:

- Need title and slug;
- Need summary and category;
- titles of canonically linked Faux Feelings;
- titles, summaries, and body-signal wording of canonically linked Feelings;
- existing authored Observation cue identifiers/examples associated with the Need;
- existing reusable event-family identifiers, labels, and explanations associated with the Need.

The retrieval layer does not author a second Feeling-to-Need taxonomy. It indexes relationships and content already owned by the canonical catalogs and Observation source.

Search uses normalized tokens, a small deterministic stemming layer, stopword filtering for ranking, field weights, and inverse document frequency. A rare term in a Need title or Faux Feeling relationship can therefore contribute more than a common term occurring across many Need documents.

Stopwords affect ranking but do not control whether exploration is available. If the input contains ordinary language but yields no useful keyword hit, the starter layer still provides vocabulary.

## Starter completion

Starter completion is explicit and lowest-confidence. It does not masquerade as a keyword match.

There is no hand-authored `explorationPools` dataset. Starter Needs are derived deterministically from the canonical Need graph using relationship breadth and category diversity. Starter Feelings are derived from the canonical Feeling graph, filtered by the selected Met/Unmet lens and ranked by relationship breadth.

This preserves the ownership boundary:

> canonical catalogs + canonical Observation relationships → deterministic retrieval/ranking → exploration result

The starter layer exists to guarantee a useful browsing doorway, not to claim that an arbitrary situation implies those Needs.

## Evidence tiers

The runtime has four tiers:

- `direct`: the person directly named a canonical Feeling or Need for themselves;
- `related`: a strong canonical relationship or specific authored event/cue supports the candidate;
- `broad`: keyword retrieval or a broader relationship supports the candidate;
- `exploratory`: a catalog-derived starting point fills an otherwise empty exploration position.

`direct` remains narrowly protected. Event-family and migrated cue evidence can never become direct self-report. Keyword retrieval and starter completion can never become direct self-report.

`Why these?` must describe these distinctions honestly. It may say that some results are broader starting points. It must not imply that the app determined the person's internal state.

## Met and Unmet

Needs are the stable center of the Met/Unmet interaction.

A Need can matter whether it is being tended well or poorly. Changing the mode does not make the Need valid or invalid and should not require the engine to re-understand the English sentence from scratch.

After Need candidates are ranked, canonical Feeling relationships for those Needs are projected through the selected lens:

- `Unmet` permits Feelings whose canonical satisfaction metadata is `unmet` or `both`;
- `Met` permits Feelings whose canonical satisfaction metadata is `met` or `both`.

A directly self-reported Feeling remains visible even when its canonical satisfaction metadata differs from the selected lens, because the user's own wording outranks the derived lens.

Starter Feelings are also mode-filtered, so both Met and Unmet can remain useful even when the original event-family mapping only authored one side.

## Direct-self-report boundary

A canonical Feeling or Need becomes direct only as the whole input or inside an affirmative first-person frame such as `I feel anxious` or `I need rest`.

Existing safeguards remain:

- quoted Feeling language is not the user's direct self-report;
- another person's Feeling or Need cannot become direct merely because an earlier `I feel` or `I need` appears in the same sentence;
- reported questions and attributions such as `She asked if I am angry` do not become direct;
- negated nested self-attributions such as `I don't think I am angry` do not become direct;
- Faux Feeling relationship inference requires the Faux Feeling to belong to the user's own experience frame.

Quoted and third-person wording may still contribute to broad keyword retrieval because retrieval is explicitly a vocabulary search, not a claim of direct ownership.

## Observable event families

The six existing event families remain:

1. personal evaluation directed toward the user;
2. dismissal or minimization of experience;
3. interruption while speaking;
4. social exclusion or omission;
5. a decision made under constrained time or choice;
6. a change after a prior agreement.

They provide stronger `related` evidence when their bounded grammar matches. They no longer determine whether the page is allowed to return vocabulary.

Quote safeguards remain intact. For example, `They said “you are stupid” to me` may match the directed-evaluation family, while `They said “the computer is stupid” to me` must not be treated as a personal evaluation of the user. Both inputs may still receive broader exploratory vocabulary from the retrieval pipeline.

## Quick Check

Quick Check remains independent from psychological ranking. It reports whether the writing contains time, context/people, sensory detail, and an optional count/quote.

Formula evidence never becomes direct, related, broad, or exploratory psychological evidence merely because Quick Check recognized it. A concrete observation can receive exploration vocabulary through retrieval/starter completion without Quick Check itself causing a particular Need.

## Page behavior

The primary journey remains:

`write → Explore Feelings & Needs → review possibilities → revise or continue`

For ordinary language, the normal Explore state is a result state rather than a dead-end no-match state.

The page retains:

- `Revise observation`, which preserves text and returns focus to the editor;
- `Clear observation`, which is the destructive action;
- `Unmet | Met`, which changes derived Feeling possibilities while retaining Need exploration;
- `Why these?`, now subtitled `How these were chosen` because some candidates may be broader search or starter results rather than a literal highlighted substring;
- recognized catalog terms and the single-surface highlight editor;
- Quick Check, the example sentence, Observation Recipe, and Journal handoff.

The old zero-result component remains only as a defensive UI fallback for input that produces no exploration at all. Ordinary language is not expected to reach it under the retrieval-first contract.

## Single-surface highlighting

The editor remains one plain-text `contenteditable` surface. CSS Custom Highlight paints ranges on that same text. Do not reintroduce a mirrored overlay or a second textarea detector.

Retrieval does not need to create fake highlight ranges. Inline highlights continue to represent actual recognized terms, formula ranges, guidance ranges, cue ranges, and event-family evidence. Broader retrieval/starter provenance belongs in result metadata and `Why these?`, not as invented text spans.

## Canonical ownership and Bedrock

The existing canonical Observation source remains `src/data/observationInference/source.json`, validated by `source.schema.json` and compiled by `scripts/compile-observation-inference.mjs` into `src/data/generated/observationInference.ts`.

The canonical entity catalogs remain the owners of Feelings, Needs, Faux Feelings, and their relationships. Retrieval reads those canonical runtime entities and the generated Observation relationship index. It does not maintain a second hand-authored search taxonomy.

`explorationPools` remain retired and must not be restored. Guaranteed exploration is derived deterministically from the canonical catalog graph rather than stored as another fallback content source.

The current staging implementation builds the small search-document index once at module initialization. If profiling shows that this work is material on cold start, move the deterministic projection into the existing Observation compiler rather than creating a runtime cache/repair layer.

## Verification contract

Regression coverage should enforce behavior rather than depend on one privileged corpus of example sentences.

Required invariants include:

- blank or non-language-only input may return no suggestions;
- ordinary language input returns four Needs and four Feelings under the current staging contract;
- a combinatorial set of independently assembled subjects/actions/contexts also receives four-by-four exploration;
- direct self-report remains highest priority;
- event families and migrated cues remain non-direct;
- keyword retrieval and starter completion remain non-direct;
- Met and Unmet both remain populated and derive Feelings from surviving Need candidates;
- quoted, negated, attributed, third-person, identity, and Faux Feeling ownership safeguards remain intact;
- object-directed negative language does not become a personal-evaluation event merely because retrieval still returns broader vocabulary;
- repeated analysis of the same input remains deterministic;
- Quick Check does not become psychological evidence;
- no network or language-model dependency is introduced;
- retired public Observation assets and legacy loaders remain retired;
- single-surface editing/highlighting and desktop/mobile layout contracts remain intact.

Fresh batches of natural-language examples are quality audits for ranking. They are not the mechanism guaranteeing nonempty results. The guarantee comes from the retrieval/starter pipeline itself.
