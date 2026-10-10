How feeling-word matching works

Last reviewed: 2026-08-30

Plain-language summary

This check-in helps when feelings are hard to identify or describe. That difficulty is sometimes called alexithymia, but you do not need that label or a diagnosis to use the page.

You can choose body sensations, rate a few parts of the overall feeling, or browse without choosing clues. The app compares only the clues you choose with fixed descriptions of emotion words. A displayed percentage means “similar to these clues,” not “this is probably what you feel.” More than one word can fit, and you make the final choice.

The app does not score what you wrote about the event. It does not infer a Need, select a word for you, diagnose anything, or send the check-in to a language model.

Body clues

The body part of the comparison uses the same regions and sensations as the full Body Cues page. Each possible word has an authored strength for each body cue. A selected cue counts more when you set a higher intensity. A cue you leave off does not count.

For readers who want the calculation, for possible word f and selected cues S:

bodyMatch(f) = Σ(I(c) × W(c,f)) / (Wmax × Σ I(c))

I(c): the intensity you chose for cue c, converted to a 0–1 scale.
W(c,f): the authored link between that cue and word f, on a 0–1.4 scale.
Wmax: 1.4, the largest available link value.

Each word is calculated independently. The source body maps are reports from groups of people who were asked where emotions felt active in the body. They do not show that one sensation proves one emotion. The app’s smaller cue list and exact strengths are reviewed editorial choices, not a diagnostic classifier.

Full Body Cues methods and references:
https://allneeds.app/docs/body-scan-sourcing-review.md

Overall feeling

The optional Overall feeling card asks about four broad qualities.

What the app asks: Pleasant or unpleasant
Research term: Valence
Source range: −1.37 to 1.74

What the app asks: Energy
Research term: Arousal
Source range: −2.68 to 1.79

What the app asks: Ability to influence what happens
Research term: Power
Source range: −1.66 to 2.63

What the app asks: Familiar or surprising
Research term: Novelty
Source range: −2.57 to 3.38

You can answer any rating or choose Not sure. Not sure means the app has no information for that rating; it is not treated as the middle. At least two answered ratings are needed before this part is compared.

The fixed word values come from Table A2 of Soriano et al. (2026). The source values are converted to a 0–1 scale. For the ratings you answered, called D below:

shapeMatch(f) = Σ(1 − |user(d) − profile(f,d)|) / |D|

In plain language, the app measures the distance between each rating you chose and the fixed value for that word, then averages those similarities. The five-position control and this distance calculation are allneeds editorial rules. The study describes group-level meanings of words; it did not validate this app’s percentage or identify any individual person’s present emotion.

Combining body and overall-feeling clues

When both kinds of clues can be compared for a word, the app gives them equal weight:

clueMatch(f) = Σ channelMatch(f,k) / |K(f)|

Equal weight is an allneeds editorial choice. It does not mean body clues and overall-feeling ratings are equally good at identifying an emotion. If a word cannot be compared with every kind of clue you used, it appears under “More words to consider” without a combined percentage. Only the displayed result is rounded to a whole percent.

What is not compared

The app does not assign a percentage to:

- the event text you write
- Faux Feelings
- words without the needed fixed descriptions
- words you enter yourself
- Needs you choose
- your Fits, Maybe, or Not this time decisions

Recognized Feeling, Need, and Faux Feeling words in the event text become reference links only. The app does not select or insert them.

What the word labels mean

Feeling means a word in the allneeds Feeling list, with a linked Feeling page.

Faux Feeling means a word that may combine an emotion with an interpretation of what happened. This label does not mean the event was unreal.

Other emotion word means a useful emotion word in this check-in that is not part of the linked allneeds Feeling list.

Your word means a word you entered for this check-in.

The support page does not add, remove, or reclassify the site’s Feeling, Need, or Faux Feeling words. It creates a page link only when that exact relationship has been reviewed.

Limits

This is a present-moment support tool, not a test, diagnosis, treatment, or therapy. People differ in which clues they can notice. Context, language, culture, neurodiversity, medication, health, and individual learning can all matter. Body maps are group self-reports, and overall-feeling profiles are group-level word meanings. A similarity percentage cannot determine what one person feels.

Sources

Luminet and Nielson (2025), Alexithymia: Toward an Experimental, Processual Affective Science with Effective Interventions. A current multidimensional account and a review of uncertainty in the mechanisms.
https://doi.org/10.1146/annurev-psych-021424-030718

Mazza et al. (2026), systematic review and meta-analysis of therapies addressing alexithymia. Used to bound product claims; this check-in is not one of the studied therapies.
https://pubmed.ncbi.nlm.nih.gov/41525940/

Nunes da Silva (2021), clinical intervention guidelines. Support for respectfully connecting events, vocabulary, and bodily sensations without treating an app as a therapeutic relationship.
https://pubmed.ncbi.nlm.nih.gov/34749373/

Trevisan et al. (2019), alexithymia and interoceptive awareness meta-analysis. Support for making body clues optional rather than the only way in.
https://pubmed.ncbi.nlm.nih.gov/31380655/

Nummenmaa et al. (2014), Bodily maps of emotions. Broad prompted body-location reports and their limits for working backward from sensation to emotion.
https://doi.org/10.1073/pnas.1321664111

Posner, Russell, and Peterson (2005), The circumplex model of affect. Broad qualities of emotional experience, not a detector of discrete emotions.
https://doi.org/10.1017/S0954579405050340

Soriano et al. (2026), Emotion word meaning and grammatical class: do nouns and adjectives mean the same? CC BY 4.0 English CoreGRID factor scores used for the fixed overall-feeling profiles and noun/adjective bridge review.
https://doi.org/10.1016/j.langsci.2026.101807
