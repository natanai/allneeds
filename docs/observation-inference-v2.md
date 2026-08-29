# Observation Inference 2.1

Status: approved implementation in review on 2026-08-29.

## Product contract

Observation Inference 2.1 is a local, synchronous, deterministic language aid. It does not call a language model, send observation text to a server, assign a psychological probability, or claim to determine what a person feels or needs.

For nonblank input it returns **up to four evidence-bearing possible Feelings and up to four evidence-bearing possible Needs**. It may return fewer than four, or none. A suggestion is allowed into the result set only when the analysis ledger contains language evidence connecting it to the person's text. The engine does not fill empty positions merely to make a result set look complete.

Suggestions are possibilities to explore. Formula signals such as When, Where, What, and Measurement never add psychological weight. Feeling and Need mode remains explicit as `unmet` and `met`. The mode filters **derived Feeling possibilities** by canonical Need-satisfaction metadata. It never suppresses a Feeling the person directly names for themselves.

`Unmet` and `Met` are an inference lens, not a diagnosis or claim that a Need exists only when something is lacking. A Need remains a value or motivation that can matter whether it is currently being tended well, poorly, partially, or in more than one way.

## Evidence tiers and the direct-self-report boundary

`direct` has a narrow meaning in 2.1: the person directly named a canonical Feeling or Need for themselves, either as the whole input or inside an affirmative first-person frame such as `I feel anxious` or `I need rest`.

Observable events may support **related** or **broad** possibilities, but they do not become direct statements about the person's internal state. This applies both to the reusable 2.1 event families and to the older imported authored cue expressions.

The raw imported cue records preserve their historical `tier: direct` value only as provenance metadata. The deterministic Observation compiler is the single owner of the source-to-product translation and emits those imported cues as `related` production evidence. Newly authored event families may be only `related` or `broad`. The runtime analyzer therefore does not depend on a second repair layer to reinterpret event evidence after generation.

Quoted, third-person, and negated Feeling wording does not become direct self-report. Another person saying `I am angry` inside a quote is not treated as the user's Feeling.

## Honest insufficient-information boundary

No arbitrary word-count minimum exists. The threshold is semantic evidence rather than input length.

A one-word input such as a canonical Feeling or Need can contain useful direct evidence. Arbitrary or unrelated wording such as `banana`, `🙂`, or a concrete Observation with no psychological cue may appropriately yield no Feeling or Need suggestions.

The page distinguishes two honest zero-result states:

- when the writing still has little concrete event information, it says it could not connect the wording yet and invites the person to add more detail;
- when Quick Check already shows a substantially concrete Observation, it says **No specific Feeling or Need matches yet** rather than implying the Observation itself is incomplete.

Quick Check is independent from psychological inference. A person can write a strong concrete Observation that satisfies all four writing signals while the psychological inference correctly returns no suggestions.

## Canonical ownership

The hand-edited owner is `src/data/observationInference/source.json`, validated against `source.schema.json`. It contains:

- four formula slots and their exact range-producing detectors;
- 28 normalized imported authored cue expressions representing the 219 legacy cue relationships;
- six reusable 2.1 observable-event families;
- approved lexical bridges and deliberately unlinked surface wording;
- 18 observation-guidance rule groups;
- the exact legacy repository, branch, commit, import date, and row count used as provenance.

The six initial event families are:

1. personal evaluation directed toward the user;
2. dismissal or minimization of experience;
3. interruption while speaking;
4. social exclusion or omission;
5. a decision made under constrained time or choice;
6. a change after a prior agreement.

These are compositional event detectors rather than one-off sentence templates. They may recognize multiple ordinary phrasings while remaining bounded to authored regular expressions and canonical candidate lists. The directed-evaluation family reuses the canonical `trait-labels` guidance lexicon and explicitly excludes positive labels such as `hero`, `angel`, `saint`, `savior`, `rockstar`, and `superstar` from that psychological event family.

`scripts/compile-observation-inference.mjs` is the single compiler and validator. It validates source structure, IDs, regular expressions, relationships, flags, event-family lexicon ownership, current catalog ownership, legacy provenance-only tier metadata, and generated freshness. `explorationPools` are not part of schema 2 and the compiler fails if they are reintroduced.

The compiler emits `src/data/generated/observationInference.ts`. The generated module is a deterministic projection: it imports the validated canonical Observation source, normalizes provenance-only legacy `direct` cue metadata to `related` production evidence, and projects the repository's canonical runtime Feelings, Needs, and Faux Feelings rather than embedding a second full copy of those catalogs. The compiler still reconstructs the canonical catalog during generation/checking so every referenced slug and relationship is validated and a catalog checksum is recorded. The source checksum is the content-addressed Git blob checksum of the canonical source, so changing that source makes the generated projection stale until regenerated.

This preserves the Bedrock ownership chain:

> `source.json` + canonical entity catalogs → one Observation compiler/validator → generated Observation production module.

Runtime Observation code consumes the generated module and does not read from `src/legacy`.

## One analysis, one annotation ledger

`analyzeObservation(text, mode)` performs one immediate analysis and returns:

- UTF-16-safe annotations with exact `start` and `end` offsets;
- formula, entity, imported cue, event-family, guidance, and surface evidence attached to those ranges;
- the four Quick Check slot rollups derived from formula annotations;
- recognized Feeling, Need, and Faux Feeling entities for direct navigation;
- zero to four possible Feelings and zero to four possible Needs, their evidence tier, and their evidence annotation IDs;
- model, source, catalog, mode, and input fingerprint metadata.

Every returned psychological suggestion has one or more `SuggestionEvidence` entries. There is no evidence-free Observation suggestion tier.

The page does not run a second textarea detector. Quick Check, inline highlights, recognized-word links, caret explanations, event-family matching, and suggestion ranking all consume the same analysis result.

Feeling word support also calls this analyzer for its optional present-moment observation. That lane projects exact catalog-title entities from the analysis for reference links only; it does not run a second scanner, treat fuzzy spelling support as an exact term, or use Observation suggestions to select a Feeling or Need.

## Quick Check 2.1

Quick Check remains a writing aid rather than an inference score. Its four slots are unchanged: time, context/people, direct sensory detail, and optional count/quote.

2.1 broadens only the **observable context** vocabulary needed for ordinary prose. Speech-participant constructions such as `a coworker said…`, `my partner asked…`, or a named speaker can satisfy the people/context signal. A direct quote can satisfy the sensory and optional quote signal. These formula annotations do not add psychological weight by themselves.

## Matching safeguards

- Catalog title and approved bridge recognition is token-boundary based and case-insensitive.
- Unicode normalization preserves source offsets because normalization is used only for comparison.
- Direct Feeling or Need wording affects ranking only as a standalone term or in an affirmative first-person frame.
- A directly self-reported Feeling remains available regardless of the selected `met` or `unmet` inference lens.
- Negated, quoted, and third-person catalog language does not become a direct self-report.
- Faux Feelings contribute only their canonical Feeling and Need relationships and require first-person context.
- Reusable event families can contribute only `related` or `broad` evidence.
- Imported authored cue records may preserve historical `direct` metadata in the hand-edited import source, but the compiler emits them only as `related`/`broad` production evidence.
- Bounded edit-distance matching supports likely single-token typos, rejects ties, ignores short tokens and stop words, and ranks below exact wording.
- Automatic invented inflections are not generated. Only canonical titles and explicit authored bridges can add non-fuzzy variants.
- `guilt` and `guilty` remain available as internal unlinked surface wording but are not silently mapped to a canonical Feeling or Need. Surface wording does not receive a public highlight, explanation card, or duplicate “your wording” panel.
- Guidance prompts are invitations to add detail, not corrections. Identity or diagnosis wording such as `I am autistic` is not flagged. Words about harm, pressure, and coercion may retain their meaning while inviting specific events or constraints.
- Formula evidence never changes Feeling or Need scores.
- Stable catalog order resolves equal scores, followed by deterministic diversity selection. No fallback completion follows ranking.

## Observation page experience

The primary journey is `write → Explore Feelings & Needs → review possibilities or an honest zero-result state → revise or continue if useful`.

The page uses the model-aligned `Unmet | Met` control. Public copy explains that a Need can matter either way and that the choice changes derived Feeling possibilities rather than the importance of the Need.

When evidence exists, the page uses `Needs that may be alive in you` and `Possible Feelings`, with a `Why these?` disclosure that explains actual evidence from the person's text. Event-family explanations can appear there in ordinary language. The disclosure is not rendered when no suggestions exist.

Exploring is not destructive. `Revise observation` returns focus to the existing text. A no-result state offers `Add more detail`. Directly editing the observation after results have been explored closes the now-stale result state automatically; the person explicitly explores again after the revision. `Clear observation` is the destructive action and is labeled accordingly.

Recognized catalog terms remain accessible through inline highlighting and a secondary `Recognized words` disclosure. Quick Check, the example sentence, and the Observation Recipe remain writing supports rather than required diagnostic steps.

Desktop uses a task-and-context workspace: editor, primary action, results, and Journal continuation stay in the main work column while Quick Check, the example, and the recipe occupy a quieter support rail. Mobile collapses to one linear column with no document-level horizontal panning.

## Single-surface highlighting

The editor is one plain-text `contenteditable` surface. The CSS Custom Highlight API paints DOM `Range` objects on that same text. There is no mirrored text layer, duplicate wrapping layout, scroll synchronization, or pixel-offset calculation to drift out of alignment.

Paste, drop, and line breaks are normalized to plain text. Normal typing is not rewritten, preserving the browser's editing and undo behavior. A pointer activation inside an actionable annotated range opens its explanation and, for catalog entities, its direct Feeling, Need, or Faux Feeling link. Merely finishing a word or placing the caret immediately after it does not open a card; annotation ends use exclusive offsets. Keyboard caret navigation can inspect an actionable range.

When the Custom Highlight API is unavailable, editing, Quick Check signals, recognized-word links, suggestions, and explanations remain available. Highlight support is a release-browser requirement rather than a reason to reintroduce a mirrored overlay.

## Retired Observation boundary

Observation 2.1 keeps retired:

- `src/legacy/observations/`;
- `public/data/observation_cues.csv`;
- `public/data/observation_cue_modules.json`;
- `public/data/observation-guide.json`;
- Observation resource loaders and their warm-start fetches;
- Observation public-asset precache entries;
- evidence-free exploration completion as an Observation inference behavior;
- `explorationPools` as either source data or runtime fallback.

The research guide lives at `src/data/observationGuide.json` and is bundled locally. Its disclosure markup is still instantiated only when opened.

## Verification contract

Build and test gates cover:

- all canonical Feelings, Needs, and Faux Feelings through the canonical runtime catalog projection;
- all 219 migrated cue relationships and execution of representative imported cues;
- all six initial reusable event families;
- the invariant that event/imported-cue inference never impersonates direct self-report;
- the directed-evaluation positive-label exclusions;
- ordinary speech-participant Quick Check detection without psychological weighting;
- blank, arbitrary nonblank, one-word canonical, partial-evidence, and no-evidence behavior;
- the invariant that every returned suggestion has evidence;
- direct self-reported Feelings surviving either inference lens;
- direct, negated, quoted, third-person, Unicode, repeated-range, and adversarial input behavior;
- formula range identity and all four slot rollups without psychological weighting;
- internal-only surface wording, exclusive annotation boundaries, and no typing-triggered duplicate card;
- identity-safe guidance and non-invalidating harm/coercion explanations;
- byte-stable output for the same text and mode;
- retired source, public asset, loader, and deployment boundaries;
- both honest zero-result states, model-aligned `Unmet | Met`, and absence of `missing / supported` copy;
- nondestructive revision and stale-result invalidation after edits;
- desktop task-and-context and mobile single-column hierarchy;
- a dedicated Chromium, Firefox, and mobile WebKit Observation browser matrix.

A warm local benchmark on 2026-08-28 analyzed a 1,908-character observation 250 times at 8.3 ms p50, 10.4 ms p95, and 13.7 ms maximum in the repository's Node test runtime. This is a development benchmark, not a cross-device guarantee.

Manual release review still includes keyboard editing, screen-reader labeling, iPhone Safari wrapping and scroll behavior, browser zoom, font size changes, direct navigation from recognized terms, event-family explanation language, revision focus behavior, and both zero-result states.
