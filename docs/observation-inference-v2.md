# Observation Inference 2.0

Status: approved correction implemented for review on 2026-08-29.

## Product contract

Observation Inference 2.0 is a local, synchronous, deterministic language aid. It does not call a language model, send observation text to a server, assign a psychological probability, or claim to determine what a person feels or needs.

For nonblank input it returns **up to four evidence-bearing possible Feelings and up to four evidence-bearing possible Needs**. It may return fewer than four, or none. A suggestion is allowed into the result set only when the analysis ledger contains language evidence connecting it to the person's text. The engine does not fill empty positions merely to make a result set look complete.

Suggestions are possibilities to explore. Formula signals such as When, Where, What, and Measurement never add psychological weight. Feeling and Need mode remains explicit as `unmet` and `met`. The mode filters **derived Feeling possibilities** by canonical Need-satisfaction metadata. It never suppresses a Feeling the person directly names for themselves.

`Unmet` and `Met` are an inference lens, not a diagnosis or claim that a Need exists only when something is lacking. A Need remains a value or motivation that can matter whether it is currently being tended well, poorly, partially, or in more than one way.

## Honest insufficient-information boundary

No arbitrary word-count minimum exists. The threshold is semantic evidence rather than input length.

A one-word input such as a canonical Feeling or Need can contain useful direct evidence. Arbitrary or unrelated wording such as `banana`, `🙂`, or a concrete Observation with no psychological cue may appropriately yield no Feeling or Need suggestions.

When no evidence-bearing candidates exist, the Observation page says it does not yet have enough information to connect the wording with specific Feelings or Needs. It may offer the canonical Feeling and Need browsers as deliberate exploration, but generic browse items are not Observation-derived suggestions.

Quick Check is independent from this boundary. A person can write a strong concrete Observation that satisfies all four writing signals while the psychological inference correctly returns no suggestions.

## Canonical ownership

The hand-edited owner is `src/data/observationInference/source.json`, validated against `source.schema.json`. It contains:

- four formula slots and their exact range-producing detectors;
- 28 normalized authored cue expressions representing all 219 imported cue relationships;
- approved lexical bridges and deliberately unlinked surface wording;
- 18 observation-guidance rule groups;
- the exact legacy repository, branch, commit, import date, and row count used as provenance.

`scripts/compile-observation-inference.mjs` is the single compiler and validator. It validates source structure, IDs, regular expressions, relationships, flags, current catalog ownership, and generated freshness. It emits `src/data/generated/observationInference.ts`, including source and catalog checksums. Runtime code reads only that generated index.

The compiler currently reads the repository's canonical owners for entity families: the imported catalog snapshot for still-unmigrated Feelings and Faux Feelings, and the reviewed editorial catalog for canonically migrated Needs. The generated Observation index owns the runtime lexicon, so the Observation feature has no runtime import from `src/legacy`.

## One analysis, one annotation ledger

`analyzeObservation(text, mode)` performs one immediate analysis and returns:

- UTF-16-safe annotations with exact `start` and `end` offsets;
- formula, entity, cue, guidance, and surface evidence attached to those ranges;
- the four Quick Check slot rollups derived from formula annotations;
- recognized Feeling, Need, and Faux Feeling entities for direct navigation;
- zero to four possible Feelings and zero to four possible Needs, their evidence tier, and their evidence annotation IDs;
- model, source, catalog, mode, and input fingerprint metadata.

Every returned psychological suggestion has one or more `SuggestionEvidence` entries. There is no evidence-free Observation suggestion tier.

The page does not run a second textarea detector. Quick Check, inline highlights, recognized-word links, caret explanations, and suggestion ranking all consume the same analysis result.

Feeling word support also calls this analyzer for its optional present-moment observation. That lane projects exact catalog-title entities from the analysis for reference links only; it does not run a second scanner, treat fuzzy spelling support as an exact term, or use Observation suggestions to select a Feeling or Need.

## Matching safeguards

- Catalog title and approved bridge recognition is token-boundary based and case-insensitive.
- Unicode normalization preserves source offsets because normalization is used only for comparison.
- Direct Feeling or Need wording affects ranking only as a standalone term or in an affirmative first-person frame.
- A directly self-reported Feeling remains available regardless of the selected `met` or `unmet` inference lens.
- Negated, quoted, and third-person catalog language does not become a direct self-report.
- Faux Feelings contribute only their canonical Feeling and Need relationships and require first-person context.
- Authored cue expressions use direct, related, or broad evidence tiers and receive an ambiguity penalty when they map to many candidates.
- Bounded edit-distance matching supports likely single-token typos, rejects ties, ignores short tokens and stop words, and ranks below exact wording.
- Automatic invented inflections are not generated. Only canonical titles and explicit authored bridges can add non-fuzzy variants.
- `guilt` and `guilty` remain available as internal unlinked surface wording but are not silently mapped to a canonical Feeling or Need. Surface wording does not receive a public highlight, explanation card, or duplicate “your wording” panel.
- Guidance prompts are invitations to add detail, not corrections. Identity or diagnosis wording such as `I am autistic` is not flagged. Words about harm, pressure, and coercion may retain their meaning while inviting specific events or constraints.
- Formula evidence never changes Feeling or Need scores.
- Stable catalog order resolves equal scores, followed by deterministic diversity selection. No fallback completion follows ranking.

## Observation page experience

The primary journey is `write → Explore Feelings & Needs → review possibilities or an honest insufficient-information state → continue if useful`.

The page uses the model-aligned `Unmet | Met` control. Public copy explains that a Need can matter either way and that the choice changes derived Feeling possibilities rather than the importance of the Need.

When evidence exists, the page uses `Needs that may be alive in you` and `Possible Feelings`, with a `Why these?` disclosure that explains actual evidence from the person's text. The disclosure is not rendered when no suggestions exist.

Recognized catalog terms remain accessible through inline highlighting and a secondary `Recognized words` disclosure. Quick Check, the example sentence, and the Observation Recipe remain writing supports rather than required diagnostic steps.

Desktop uses a task-and-context workspace: editor, primary action, results, and Journal continuation stay in the main work column while Quick Check, the example, and the recipe occupy a quieter support rail. Mobile collapses to one linear column with no document-level horizontal panning.

## Single-surface highlighting

The editor is one plain-text `contenteditable` surface. The CSS Custom Highlight API paints DOM `Range` objects on that same text. There is no mirrored text layer, duplicate wrapping layout, scroll synchronization, or pixel-offset calculation to drift out of alignment.

Paste, drop, and line breaks are normalized to plain text. Normal typing is not rewritten, preserving the browser's editing and undo behavior. A pointer activation inside an actionable annotated range opens its explanation and, for catalog entities, its direct Feeling, Need, or Faux Feeling link. Merely finishing a word or placing the caret immediately after it does not open a card; annotation ends use exclusive offsets. Keyboard caret navigation can inspect an actionable range.

When the Custom Highlight API is unavailable, editing, Quick Check signals, recognized-word links, suggestions, and explanations remain available. Highlight support is a release-browser requirement rather than a reason to reintroduce a mirrored overlay.

## Retired Observation boundary

Observation 2.0 removes:

- `src/legacy/observations/`;
- `public/data/observation_cues.csv`;
- `public/data/observation_cue_modules.json`;
- `public/data/observation-guide.json`;
- Observation resource loaders and their warm-start fetches;
- Observation public-asset precache entries;
- evidence-free exploration completion as an Observation inference behavior.

The research guide lives at `src/data/observationGuide.json` and is bundled locally. Its disclosure markup is still instantiated only when opened.

## Verification contract

Build and test gates cover:

- all 48 canonical Feelings, 67 Needs, and 56 Faux Feelings;
- all 219 migrated cue relationships and execution of a representative authored cue;
- blank, arbitrary nonblank, one-word canonical, partial-evidence, and no-evidence behavior;
- the invariant that every returned suggestion has evidence;
- direct self-reported Feelings surviving either inference lens;
- direct, negated, quoted, third-person, Unicode, repeated-range, and adversarial input behavior;
- formula range identity and all four slot rollups without psychological weighting;
- internal-only surface wording, exclusive annotation boundaries, and no typing-triggered duplicate card;
- identity-safe guidance and non-invalidating harm/coercion explanations;
- byte-stable output for the same text and mode;
- retired source, public asset, loader, and deployment boundaries;
- honest zero-result UI, model-aligned `Unmet | Met`, and absence of `missing / supported` copy;
- desktop task-and-context and mobile single-column hierarchy;
- a dedicated Chromium, Firefox, and mobile WebKit Observation browser matrix.

A warm local benchmark on 2026-08-28 analyzed a 1,908-character observation 250 times at 8.3 ms p50, 10.4 ms p95, and 13.7 ms maximum in the repository's Node test runtime. This is a development benchmark, not a cross-device guarantee.

Manual release review still includes keyboard editing, screen-reader labeling, iPhone Safari wrapping and scroll behavior, browser zoom, font size changes, direct navigation from recognized terms, and both result and no-result states.
