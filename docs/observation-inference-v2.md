# Observation Inference 2.0

Status: implemented for review on 2026-08-28.

## Product contract

Observation Inference 2.0 is a local, synchronous, deterministic language aid. It does not call a language model, send observation text to a server, assign a psychological probability, or claim to determine what a person feels or needs.

For every nonblank input it returns exactly four possible Feelings and four possible Needs. Close authored language evidence ranks first. When the text has no usable match, the engine fills the remaining positions from approved exploration pools. Blank input returns no suggestions.

Suggestions are possibilities to explore. Formula signals such as When, Where, What, and Measurement never add psychological weight. Feeling and Need mode is explicit: `unmet` and `met` use different approved Feeling pools and filter direct Feeling candidates by their canonical Need-satisfaction metadata.

## Canonical ownership

The hand-edited owner is `src/data/observationInference/source.json`, validated against `source.schema.json`. It contains:

- four formula slots and their exact range-producing detectors;
- 28 normalized authored cue expressions representing all 219 imported cue relationships;
- approved lexical bridges and deliberately unlinked surface wording;
- 18 observation-guidance rule groups;
- the unmet Feeling, met Feeling, and Need exploration pools;
- the exact legacy repository, branch, commit, import date, and row count used as provenance.

`scripts/compile-observation-inference.mjs` is the single compiler and validator. It validates source structure, IDs, regular expressions, relationships, flags, pool membership, current catalog ownership, and generated freshness. It emits `src/data/generated/observationInference.ts`, including source and catalog checksums. Runtime code reads only that generated index.

The compiler currently reads the repository's canonical owners for entity families: the imported catalog snapshot for still-unmigrated Feelings and Faux Feelings, and the reviewed editorial catalog for canonically migrated Needs. The generated Observation index owns the runtime lexicon, so the Observation feature has no runtime import from `src/legacy`.

## One analysis, one annotation ledger

`analyzeObservation(text, mode)` performs one immediate analysis and returns:

- UTF-16-safe annotations with exact `start` and `end` offsets;
- formula, entity, cue, guidance, and surface evidence attached to those ranges;
- the four Quick Check slot rollups derived from formula annotations;
- recognized Feeling, Need, and Faux Feeling entities for direct navigation;
- possible Feelings and Needs, their evidence tier, and their evidence annotation IDs;
- model, source, catalog, mode, and input fingerprint metadata.

The page does not run a second textarea detector. The Quick Check, inline highlights, detected-word links, caret explanations, and suggestion ranking all consume the same analysis result.

Alexithymia Support also calls this analyzer for its optional present-moment observation. That lane projects exact catalog-title entities from the analysis for reference links only; it does not run a second scanner, treat fuzzy spelling support as an exact term, or use Observation suggestions to select a Feeling or Need.

## Matching safeguards

- Catalog title and approved bridge recognition is token-boundary based and case-insensitive.
- Unicode normalization preserves source offsets because normalization is used only for comparison.
- Direct Feeling or Need wording affects ranking only as a standalone term or in an affirmative first-person frame.
- Negated, quoted, and third-person catalog language does not become a direct self-report.
- Faux Feelings contribute only their canonical Feeling and Need relationships and require first-person context.
- Authored cue expressions use direct, related, or broad evidence tiers and receive an ambiguity penalty when they map to many candidates.
- Bounded edit-distance matching supports likely single-token typos, rejects ties, ignores short tokens and stop words, and ranks below exact wording.
- Automatic invented inflections are not generated. Only canonical titles and explicit authored bridges can add non-fuzzy variants.
- `guilt` and `guilty` remain visible as the person's wording but are not silently mapped to a canonical Feeling or Need.
- Formula evidence never changes Feeling or Need scores.
- Stable catalog order resolves equal scores, followed by deterministic diversity selection and approved fallback completion.

## Single-surface highlighting

The editor is one plain-text `contenteditable` surface. The CSS Custom Highlight API paints DOM `Range` objects on that same text. There is no mirrored text layer, duplicate wrapping layout, scroll synchronization, or pixel-offset calculation to drift out of alignment.

Paste, drop, and line breaks are normalized to plain text. Normal typing is not rewritten, preserving the browser's editing and undo behavior. Selecting or placing the caret in an annotated range opens its explanation and, for catalog entities, its direct Feeling, Need, or Faux Feeling link.

When the Custom Highlight API is unavailable, editing, Quick Check signals, detected-word links, suggestions, and explanations remain available. Highlight support is a release-browser requirement rather than a reason to reintroduce a mirrored overlay.

## Retired Observation boundary

Observation 2.0 removes:

- `src/legacy/observations/`;
- `public/data/observation_cues.csv`;
- `public/data/observation_cue_modules.json`;
- `public/data/observation-guide.json`;
- Observation resource loaders and their warm-start fetches;
- Observation public-asset precache entries.

The research guide now lives at `src/data/observationGuide.json` and is bundled locally. Its disclosure markup is still instantiated only when opened.

## Verification contract

Build and test gates cover:

- all 48 canonical Feelings, 67 Needs, and 56 Faux Feelings;
- all 219 migrated cue relationships and execution of a representative authored cue;
- source/compiler freshness and rejection of CSV escape-layer artifacts;
- blank and arbitrary nonblank fallback invariants;
- direct, negated, quoted, third-person, Unicode, repeated-range, and adversarial input behavior;
- formula range identity and all four slot rollups;
- byte-stable output for the same text and mode;
- retired source, public asset, loader, and deployment boundaries;
- a dedicated Chromium, Firefox, and mobile WebKit Observation browser matrix.

A warm local benchmark on 2026-08-28 analyzed a 1,908-character observation 250 times at 8.3 ms p50, 10.4 ms p95, and 13.7 ms maximum in the repository's Node test runtime. This is a development benchmark, not a cross-device guarantee.

Manual release review still includes keyboard editing, screen-reader labeling, iPhone Safari wrapping and scroll behavior, browser zoom, font size changes, and direct navigation from detected terms.
