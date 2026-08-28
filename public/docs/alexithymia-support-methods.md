# How Alexithymia Support compares words

_Last reviewed: 2026-08-28_

This check-in compares clues you choose with reviewed profiles of emotion words. The result is a compatibility estimate, not a probability or a determination of what you feel. More than one word can match the same clues, and your own judgment is the final step.

## Body clues

The body channel uses the same regions, sensations, authored forward association strengths, and scorer as the full Body Cues page. For candidate `f`, selected cues `S`, cue intensity `I(c)` on `0–1`, association strength `W(c,f)` on `0–1.4`, and `Wmax = 1.4`:

`bodyMatch(f) = Σ(I(c) × W(c,f)) / (Wmax × Σ I(c))`

Candidates are calculated independently. An active cue with no authored association contributes zero within the covered candidate set; an unselected cue contributes nothing. The body maps in the research were prompted self-reports, not tests of the reverse inference from one sensation to one emotion. The app's micro-cues and exact weights remain a reviewed editorial map rather than a calibrated classifier. [Read the full Body Cues methods](./body-scan-sourcing-review.md).

## Feeling shape

The optional Feeling-shape card uses four broad dimensions: pleasantness (Valence), energy (Arousal), power or control (Power), and expectedness (Novelty). The person can answer any dimension or choose `Not sure`; `Not sure` is missing information, not the midpoint. At least two answered dimensions are required before shape is scored.

The fixed word coordinates come from Table A2 of Soriano et al. (2026). The source's complete English table ranges are mapped to `0–1`:

| App dimension | Source dimension | Raw range |
| --- | --- | ---: |
| Pleasantness | Valence | −1.37 to 1.74 |
| Energy | Arousal | −2.68 to 1.79 |
| Power / control | Power | −1.66 to 2.63 |
| Expectedness | Novelty | −2.57 to 3.38 |

For used dimensions `D`, the app calculates:

`shapeMatch(f) = Σ(1 − |user(d) − profile(f,d)|) / |D|`

The five-position input and distance formula are transparent allneeds editorial rules. The cited study supplies group-level norms for the shared meanings of words; it did not validate this app's percentage or identify an individual's present emotion. Candidates without a complete source profile remain selectable but are not shape-scored.

## Combining channels

When both Body and Feeling shape were used and a candidate has complete coverage for both, the displayed Clue match is their equal average:

`clueMatch(f) = Σ channelMatch(f,k) / |K(f)|`

Equal weighting is an allneeds editorial choice, not a claim that the channels are equally diagnostic. A candidate missing coverage for any used channel appears as `Unscored for one or more of your clues`; the app does not compare a one-channel number with a two-channel number. Only the final display is rounded to a whole percent.

## What is not scored

The app does not score the observation text, Faux Feelings, unprofiled or user-entered terms, Need selections, or the person's `Fits`, `Maybe`, and `Not this time` decisions. Exact catalog terms found in an observation are linked for reference only. No Need is selected, inferred, or inserted by the app.

## Word roles

- **Feeling** means one of the unchanged official allneeds Feeling words.
- **Faux Feeling** means one of the unchanged official Faux Feeling terms: a word that may combine emotion with an interpretation of what happened. The label does not mean the event was unreal.
- **Working term** is lane-local research language or a word entered by the person. It does not enter or alter an official catalog.

Alexithymia Support does not add, remove, reclassify, or silently substitute official Feeling, Need, or Faux Feeling words. An automatic route exists only for an explicitly reviewed bridge.

## Limits

This is a present-moment support tool, not a test, diagnosis, treatment, or therapy. Alexithymia is multidimensional, and people differ in which clues are available. Body maps are prompted self-reports rather than diagnostic physiological signatures; Feeling-shape profiles are group-level word-meaning norms rather than personal emotion models. Context, language, culture, neurodiversity, medication, health, and individual learning can all matter. A compatibility estimate cannot determine what someone feels.

## Sources

- [Luminet and Nielson (2025), *Alexithymia: Toward an Experimental, Processual Affective Science with Effective Interventions*](https://doi.org/10.1146/annurev-psych-021424-030718) — current multidimensional account and uncertainty in mechanisms.
- [Mazza et al. (2026), systematic review and meta-analysis of therapies addressing alexithymia](https://pubmed.ncbi.nlm.nih.gov/41525940/) — bounds the product claim; this check-in is not one of the studied therapies.
- [Nunes da Silva (2021), clinical intervention guidelines](https://pubmed.ncbi.nlm.nih.gov/34749373/) — supports respectfully connecting events, vocabulary, and bodily sensations without transferring a therapeutic relationship into the app.
- [Trevisan et al. (2019), alexithymia and interoceptive awareness meta-analysis](https://pubmed.ncbi.nlm.nih.gov/31380655/) — supports making body clues optional rather than the only entrance.
- [Nummenmaa et al. (2014), *Bodily maps of emotions*](https://doi.org/10.1073/pnas.1321664111) — broad prompted self-report body topographies and their limits for reverse inference.
- [Posner, Russell, and Peterson (2005), *The circumplex model of affect*](https://doi.org/10.1017/S0954579405050340) — broad affective dimensions; not a discrete-emotion detector.
- [Soriano et al. (2026), *Emotion word meaning and grammatical class: do nouns and adjectives mean the same?*](https://doi.org/10.1016/j.langsci.2026.101807) — CC BY 4.0 English CoreGRID factor scores used for the fixed Feeling-shape profiles and noun/adjective bridge review.
