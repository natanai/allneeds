Body Cues: Methods and references

Last reviewed: 2026-08-30

What the percentage means

Body Cues compares the sensations and intensities a person selects with the app's current authored association map. The result is a clue match: a compatibility estimate under that map. It is not a probability, confidence score, diagnosis, or determination of what the person feels. Candidate matches are independent, so they do not need to add to 100 and the highest match is not automatically 100.

For candidate word f, selected cues S, selected cue intensity I(c) on a 0–1 scale, authored association strength W(c,f) on the existing 0–1.4 scale, and Wmax = 1.4:

bodyMatch(f) = Σ(I(c) × W(c,f)) / (Wmax × Σ I(c))

Zero-intensity cues are omitted. Within the reviewed candidate set, a selected cue with no authored association contributes zero. The final display is rounded to a whole percent. A 100% match means only that every selected cue has the maximum authored association for that candidate under this map.

Data ownership

The selectable regions, small body cues, and fixed links to possible words are owned in src/data/body-regions.json. Both Body Cues and Feeling word support use the same calculation over that source. Older reverse weights are retained only for descriptive details on Feeling pages; they are not used to rank words.

Evidence and limits

Published body-map studies support the broad observation that people report partly differentiable bodily patterns after emotion prompts or stimuli. They do not directly validate this app's thirty micro-cue descriptions, exact intensity bands, exact association strengths, or the reverse question “given this sensation, which emotion is present?” The current micro-cue map is an authored editorial model undergoing a claim-level audit, not an empirically calibrated classifier.

Body reports can reflect physiology, action preparation, learned concepts or metaphors, health, medication, culture, context, and individual differences. Body awareness is therefore one optional source of information. A person can use the full Body Cues page by itself, combine body clues with Overall feeling ratings in Feeling word support, or skip body clues.

Sources

Nummenmaa et al. (2014), Bodily maps of emotions. Broad prompted self-report body topographies.
https://doi.org/10.1073/pnas.1321664111

Volynets et al. (2020), Bodily maps of emotions are culturally universal. Cross-cultural similarity in prompted self-reported maps.
https://pubmed.ncbi.nlm.nih.gov/31259590/

Daikoku, Minatoya, and Tanaka (2026), Mapping emotional feeling in the body. Review distinguishing physiological, action-related, and conceptual contributions.
https://pubmed.ncbi.nlm.nih.gov/41207576/

Trevisan et al. (2019), alexithymia and interoceptive awareness meta-analysis. A small, measurement-dependent average relationship that supports keeping body awareness optional.
https://pubmed.ncbi.nlm.nih.gov/31380655/

For the combined word comparison, see How feeling-word matching works:
https://allneeds.app/docs/alexithymia-support-methods.md
