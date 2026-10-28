# Content Evidence & Editorial Review Protocol

> Status: living document. Start here before changing explanatory, psychological, behavioral, health, strategy, or research-facing copy in allneeds.
>
> Last updated: 2026-10-28.

## Purpose

allneeds should be clear, humane, clinically careful, and evidence-aligned without presenting theory, interpretation, or value judgments as settled empirical fact. Content review is intentionally slow and claim-level.

A central editorial goal is to help readers understand why a need-related motivation may exist and what function it may serve. Especially when a motivation is uncomfortable, the copy should make it easier to recognize that tending the need in oneself or responding to it in others can be intelligible and functional rather than something to suppress automatically. This effect should come from accurate evolutionary, anthropological, developmental, motivational, clinical, or other relevant scholarship, not from sentimental reassurance or unsupported claims that every present-day impulse is adaptive.

## Non-negotiable workflow

1. Retrieve the exact current production copy first.
2. Identify the canonical authoring surface before editing. Reviewed V2 editorial changes belong in `src/data/editorialCatalog.json`; `src/data/generated/legacyData.json` is an imported historical snapshot, not the preferred hand-edit surface.
3. Audit one small unit at a time, usually one need plus its strategies.
4. Distinguish definition/framework language, empirical description, causal claim, association, theory, clinical guidance, and editorial framing.
5. Check source-to-claim fit. A citation must support the proposition being made, not merely the broad topic.
6. Present the complete proposed package before changing production content.
7. Do not change production research-facing content until the user explicitly approves the complete package.
8. After approval, update this review record, implement through the normal branch/PR workflow, and verify repository checks/deployment.
9. After a need's content package is approved, separately reconsider that need magnet's visual identity. Content approval does not authorize visual changes.
10. A need is only marked **fully audited** once both the approved content package and an approved redesigned production magnet are live. The redesigned magnet is the site's visual cue that the need has completed the audit process.

### Complete-package approval gate

Approval must cover:

- final short/main description;
- final expanded/details copy;
- final citation set and a human-reachable URL for each source;
- what each source supports and important limitations, retained internally for reviewers;
- all system-strategy additions, removals, rewrites, renames, and need associations;
- protected user-strategy provenance;
- scholarly or official-resource supporting links for system strategies;
- intended implementation scope.

The one preapproval production-repo exception is this document, `docs/content-evidence-review.md`, which may be updated as the review evolves.

### Academic source URL formatting (2026-10-12 clarification)

- Display and copy the original publisher's or scholarly society's **article landing-page URL** (for example, `https://link.springer.com/article/10.1007/s10560-018-0584-y`), **not** a generic `https://doi.org/...` redirect as the visible/raw citation.
- Keep the bare DOI identifier (for example, `10.1007/s10560-018-0584-y`) as separate bibliographic metadata when useful. DOI-based discovery can still support title and version verification.
- Strip ChatGPT referral domains, `utm_*` and other tracking/referral parameters; preserve only genuine publisher-required query parameters (such as APA's `doiLanding?doi=...`).
- If an article is not yet published, use the actual author/preprint repository page and clearly mark peer-review status. If there is no verifiable publisher article page, use a verified scholarly record and state that limitation; **never fabricate a publisher URL**.
- Historical citation inventories may preserve original links for provenance. New proposals and copy should follow this rule, and older approved source links should be converted only after independently confirming the publisher matches the article.

## Need-description authoring method: evolutionary function first, therapeutic meaning second

Evolutionary framing is part of the reasoning process, not a decorative paragraph added after modern psychological copy is written.

1. **Start with the recurrent problem.** Ask what recurring problem in human life the motivation may plausibly have helped individuals or groups manage: danger, resource uncertainty, caregiving, coordination, exclusion, information gaps, energy limits, reproduction, learning, environmental navigation, or another recurring demand.
2. **Look for direct evolutionary or anthropological scholarship.** Prefer research that actually discusses natural history, selection pressures, comparative evidence, human behavioral ecology, life history, or evolved psychology relevant to the need.
3. **Identify the motivational bridge.** Ask what the need plausibly moves a person toward today, such as seeking help, withdrawing from danger, restoring contact, gathering information, protecting boundaries, sharing resources, resting, exploring, or repairing.
4. **Translate into therapeutic meaning without prescribing.** The reader should be able to understand why the motivation may be worth listening to without being told that every urge is correct, healthy, innate, or adaptive.
5. **Add modern psychological/clinical evidence next.** Use it to explain mechanisms, distinctions, outcomes, and present-day implications.
6. **Keep ultimate and proximate explanations distinct.** A hypothesis about why a motivation may have been retained across generations is different from evidence about how it operates now.
7. **Use restrained evolutionary language.** Prefer phrases such as “Across human evolutionary history…”, “Evolutionary accounts propose…”, “Anthropological evidence suggests…”, or “One hypothesis is…”. Avoid “hard-wired,” “innate,” “universal,” or “evolved for” without unusually strong evidence.
8. **Let the scholarship carry the reassurance.** Do not write “you should not suppress this need.” Show why the motivation is intelligible and potentially functional.

Support and Safety are the current clearest models for this sequence. Support begins with human interdependence and risk/resource sharing, then moves into modern social-support research. Safety begins with the recurrent survival problem of danger, then moves into threat imminence, learned safety, fear generalization, and the distinction between defensive systems and conscious fear.

## Optional Need function lenses

When one everyday Need label contains distinguishable functions that meet the qualification rule in `docs/need-function-lenses.md`, the approved package may use function lenses rather than forcing all evidence into one undifferentiated narrative.

- Lenses must satisfy distinct lived function, distinct evidence, and practical recognition value.
- They remain parts of one canonical Need and are not formal scientific definitions.
- Each lens may own its own expanded copy and citation set so source-to-claim fit stays precise.
- Do not retrofit lenses merely because a concept can be subdivided academically.
- Understanding is the first approved production use; its authoritative package is `docs/understanding-content-audit.md`.

## Editorial style rules

- Do not use em dashes in proposed or production site copy.
- Do not formally define a need. Gesture toward function, motivation, consequences, and scholarship.
- Preserve motivational framing: what the need may drive or draw us to do.
- Do not sentimentalize or medicalize ordinary experience.
- Distinguish theory from fact and association from causation.
- Use short direct scholarly quotations only when they materially improve precision or transparency.
- Expanded Details should read as a coherent explanation, not an annotated bibliography.
- Avoid citation accumulation. Every source should do a distinct job.

## Need-level citation display

The public citation area should be simple and human-verifiable.

- Show the study/article citation or title.
- Show a direct raw human-clickable URL.
- Do **not** show internal notes such as “Use for,” “Why this source is here,” or “Limitations” in the public citation area.
- Internal reviewer notes about source role and limitations should remain in this audit document when useful for future agents.
- Prefer publisher pages, PubMed/PMC, APA PsycNet, or another authoritative scholarly landing page.
- Agent/crawler accessibility is not the standard. A legitimate page manually verified by the user should not be replaced simply because an automated crawler cannot fetch it.

## Strategy audit rules

- Establish provenance before changing any strategy.
- Never rewrite, rename, delete, or “clean up” a genuine user-submitted strategy.
- A user's wording and authorship are protected. Need associations may be reconsidered during an audit only when the user authorizes that review.
- User strategies do not need academic citations.
- If a contributor selected only one need for a submission, preserve that association unless the contributor or user explicitly approves changing it. This rule preserved Autumn's `comfy-gaming` association with Safety.
- **Current static user-submission boundary:** `src/data/userStrategies.json` is the canonical registry for all repository-resident published user strategies. Do not hard-code a fixed contributor count or assume one historical contributor is the only current submission. Nat's former repository strategies were migrated to Nat's verified Bluesky-backed profile and removed from static catalog data, Need references, migration fixtures, and one-time migration files. D1/profile storage is their current source of truth. Do not restore profile-owned Nat strategies to `editorialCatalog.json`, `legacyData.json`, `userStrategies.json`, fixtures, tests, or audit strategy lists as static submissions.
- Historical audit decisions that mention Nat-authored submissions describe the state at the time of those reviews. They do not authorize reintroducing those strategies into the repository. When documenting the current static package, list only strategies that actually ship from repository catalog data.
- System strategies must earn their place. Do not retain filler merely to create a larger deck.
- Prefer concrete, low-friction actions that can be attempted in ordinary life.
- A system strategy should have a direct, intelligible pathway to the need being audited.
- Prefer multiple genuinely different pathways rather than minor variations of the same coping prompt.
- Research should support the underlying mechanism rather than manufacture oddly specific micro-challenges.
- Do not make success depend on another person cooperating when the useful action can be completed through preparation, reflection, mapping, or another self-contained step.
- A rejection for one need is not automatically global deletion. Remove only that need association unless the user explicitly approves global discard.
- A user-approved global discard is a deletion decision. Do not preserve it as an eligible hidden fallback merely because it existed in the historical import.

### Strategy-card provenance display

Use the same compact model established on the Connection page:

- **User strategy:** contributor name and location, when supplied, in the bottom-right provenance area.
- **System strategy:** visible link text is simply **`Supporting source ↗`**, linking directly to the relevant scholarly article or official resource.
- Keep the actual source title/service name in source metadata and accessible labeling, but do not replace the compact visible label with a long paper title.
- By default, a research-backed system strategy should have one best scholarly source.
- Official-resource strategies may link to an authoritative service page instead of a research article. Mark these distinctly in source metadata as `official-resource`; do not represent them as scholarly evidence.

## Official support resources as saveable strategies

An official support resource can itself be a useful saveable strategy when the inventory entry gives the user something actionable to return to.

- Put the actionable information in the card text.
- Use **Supporting source ↗** to link to the official service page.
- Mark its source kind as `official-resource`.
- Map it only to directly related needs.
- The approved US 988 and EU 116 123 cards map to **Support** and **Safety**.

## Need magnet visual review after content approval

Each approved content audit must be followed by a visual review of that need's magnet. The redesigned production magnet is the visible cue that the Need has completed its full audit.

Use `/design-lab/need-magnets` as the review surface. Future agents should put previews into the live Design Lab rather than handing the user standalone HTML when repository access is available.

The problem: need magnets can become a visually same-y flood of words even when each has a small icon. Future reviews should ask whether the concept suggests a more meaningful visual identity while preserving the shared magnet language and Customizer behavior.

Directions worth considering:

- transparent SVG artwork analogous to Feeling magnets;
- more thoughtful need-specific iconography;
- full-face artwork that can visually grow from or replace the left icon while preserving production spacing when useful;
- restrained coloration/internal design variation driven by functional Customizer roles rather than hard-coded per-need colors;
- visual motifs that improve recognition without turning every need into a wholly different component;
- preserved text legibility, accessibility, responsive sizing, play-state physics, square-corner behavior, and every Customizer preset.

Do not ship need-magnet art as part of content approval. Content must be implemented first, then visual candidates are reviewed separately.

## Evidence standard

Prefer, when appropriate:

1. systematic reviews and meta-analyses;
2. major peer-reviewed reviews or consensus/guideline documents;
3. strong longitudinal, experimental, or directly relevant primary research;
4. foundational theory papers when the claim is explicitly theoretical;
5. scholarly books/reference works for conceptual or historical questions.

For explicitly evolutionary claims, direct evolutionary anthropology, behavioral ecology, comparative psychology, or natural-history scholarship may outrank a general modern meta-analysis because source-to-claim fit matters more than hierarchy alone.

Remember:

- theory is not fact;
- association is not causation;
- mechanisms require mechanism evidence;
- present-day usefulness does not by itself prove adaptation;
- universality requires unusually strong support;
- direct relevance matters more than prestige.

## Alexithymia support and body-cue review

**Status:** complete package approved 2026-08-28 and implemented in the `test/observation-2-alexithymia` combined review branch. The fixed-catalog, present-moment, no-recommendation boundary below is the production contract; new candidate claims or catalog changes still require a separate review.

**Plain-language addendum approved 2026-08-29; public name refined 2026-10-11.** The internal feature and public doorway use `Alexithymia support`. Public role labels are `Feeling`, `Faux Feeling`, `Other emotion word`, and `Your word`; the public shape control is `Overall feeling`. First-use copy defines alexithymia, Need, and Faux Feeling, while preserving the person's authority. This display-language decision does not reclassify a term, alter a score, infer a Need, or add a recommendation.

### Audience, purpose, and product boundary

The Alexithymia Support lane is a client-facing, in-the-moment translation aid. Its use case is a person who wants help identifying what they feel and need now, often after a real interaction and in preparation to communicate with another person. It should help the person notice available clues, compare possible feeling words, identify present Needs, and put their own working interpretation into words. It should be academically and clinically credible without presenting itself as therapy, a treatment, a diagnostic test, or an automated therapist.

The lane must remain tactile. Research explanations belong in short contextual disclosures and a human-readable Methods and References surface. The primary experience should use direct manipulation, the site's Feeling and Need magnets, compact choices, comparison, and progressive disclosure rather than long academic paragraphs.

The current canonical catalogs are fixed inputs to this project: 48 Feelings, 67 Needs, and 56 Faux Feelings. The Alexithymia Support and body-cue work must not add, remove, or reclassify an official catalog term. A particularly strong case for changing catalog membership requires a separate proposal and explicit discussion; it must not arrive indirectly through a research import, scoring correction, route alias, or vocabulary bridge.

The lane does not own strategies for tending Needs. It must not prescribe breathing patterns, grounding exercises, coping actions, requests, or other direct regulation recommendations. Once a person identifies one or more possible Needs, the lane should funnel to the canonical Need pages. Those pages own the site's system and community strategy ecosystem, including strategy evidence and provenance.

Helping the person communicate what they found is part of the lane's core purpose, not a strategy recommendation. The lane may assemble an editable statement from the person's own observation, selected Feeling words, and selected Needs. It must not choose a Need because it is listed first, insert a fallback Need, generate a request, or imply that a suggested action follows from the identified Need. Copy and read-aloud actions may support use during a real conversation.

This boundary also applies to Alexithymia Support disclosures embedded on Feeling pages. A panel titled Alexithymia Support should not contain a separate `Try now` strategy library that bypasses the Need pages.

### Intended experiential structure

The lane has one use: investigate the person's present experience. It is not a detached learning mode, role-play exercise, scenario quiz, or neutral Feeling-word practice area. A current interaction or event may supply context, but the lane is trying to establish what is present now rather than classify a hypothetical character or reconstruct what the person should have felt in the past.

The check-in should move through four compact jobs:

1. Anchor the check-in in the present moment and, if useful, briefly record what happened.
2. Collect whichever clues are accessible now. Situation or appraisal, body sensation, thought or attentional pattern, action urge, energy, and pleasantness are possible clue channels. Every channel is skippable, and body awareness is optional rather than the required entrance.
3. Compare possible Feeling or research terms as hypotheses, show how well each term matches the clues the person entered, and let the person keep more than one or keep no word yet.
4. Let the person choose the canonical Feelings and Needs that express their current working picture, then compose, copy, read aloud, or journal that picture. Selected Need magnets lead to their canonical Need pages and strategy decks.

Candidate terms should be presented as tactile magnets. Selecting a magnet may open a compact comparison sheet with definition, situation or appraisal cues, body associations, thought patterns, action urges, and the entered clues that affected its placement. The person remains the authority: use choices such as `Fits`, `Maybe`, and `Not this time`; allow `No word yet`, uncertainty, and more than one Feeling.

An audited score may be displayed as `Clue match`, because the intended number is an estimate of how well a term matches what the person entered. It is not a probability that the person has the emotion, the app's certainty, or a percentage share of all possible Feelings. Candidate scores must be independent rather than forced to sum to 100, and the strongest candidate must not be normalized to 100 merely because it ranks first. A 100 percent clue match is possible only when the candidate meets the audited maximum for every scored clue the person entered. When the person has entered too little scored information, show `Not enough clues for a match` rather than false precision. The nearby disclosure should say, in substance, `This estimates how well the word matches the clues you entered. It cannot determine what you feel.` Exact production copy still requires approval.

Need selection should reuse the canonical Need catalog and magnet interaction. The lane may help the person browse or narrow that catalog, but it must not state that an emotion proves a particular Need. The final action is to open a Need page and encounter its strategy deck, not to receive a lane-local recommendation.

### Mobile and tactile interaction rule

The iOS home-screen use case is primary, not a compressed desktop afterthought. At a compact viewport, the lane should present one immediate job on one working stage rather than expanding every body region and every explanation into one long bordered document. The supplied 2026-08-26 screenshots show the costs of the current pattern: repeated heavy card outlines, text-heavy `CHECK IN` and `COMPLETED` controls, a large open-region panel, and enough vertical expansion that comparing or revising clues requires extensive scrolling.

The approved design-language rules apply directly:

- use the app's compact/full-bleed mobile stage where appropriate, respect iOS safe areas, and prevent horizontal panning or overflow;
- keep the current working clues and primary next action in view while optional explanations open through progressive disclosure;
- use the canonical `MagnetBoard` interaction for Feeling and Need magnets rather than creating a second physical system;
- use short, tappable clue choices and a compact selected-clue tray instead of keeping all body regions and all sensation descriptions expanded in the document;
- use a bottom sheet or similarly compact disclosure for candidate details and `How this was compared`, so evidence does not displace the tactile task;
- use familiar icons for Back, Close, Undo/Clear, Info, Copy, Read aloud, and Journal when surrounding context makes the action clear, with accessible names and approximately 44-pixel targets;
- retain text for choices whose meaning would be ambiguous as an icon, including Feeling terms, Need terms, `Fits`, `Maybe`, `Not this time`, and uncertainty choices;
- keep progress compact and resumable. A person interrupted by the conversation or by iOS backgrounding should return to the same present-moment check-in.

Space efficiency must come from staging and hierarchy, not smaller tap targets or hidden functionality. The mobile release package needs reviewed references at the real `390 x 844` test viewport and in iOS standalone mode, including large-text and reduced-motion checks.

### Vocabulary bridge rule

Research vocabulary and the site's canonical Feeling taxonomy are related but not interchangeable. A paper may use an emotion word that the allneeds model does not classify as a Feeling. The lane may retain that word as a sourced research or working term when doing so helps the person recognize their experience, but it must preserve the distinction instead of silently treating the word as a canonical Feeling.

Every displayed term must declare one of these roles in canonical authored data:

1. a canonical allneeds Feeling;
2. a canonical allneeds Faux Feeling;
3. a sourced research or clinical term that is not in either catalog.

The third role is lane-local. Displaying a noncanonical research or working term does not add it to the Feeling, Need, or Faux Feeling catalogs. The person's final Feeling and Need selections continue to come from the unchanged canonical catalogs.

A research term may point to a canonical Feeling, Faux Feeling, or Need only when that exact bridge is supported by an approved source or an explicitly reviewed editorial map. If no supported bridge exists, the interface must say that no allneeds translation has been established and allow the person to browse and choose canonical magnets themselves. Do not invent a connection, substitute a nearby word as though it were equivalent, or infer a Need from the term alone.

`Guilt` illustrates the rule. It exists in the legacy Alexithymia support vocabulary, but the current canonical catalog has neither a `Guilt` Feeling nor a `Guilty` Faux Feeling. The implementation must not silently turn it into `Embarrassed`, `Blamed`, or any other catalog entry unless a specific bridge is reviewed and approved. It may remain visible as a research or working term while the user decides which canonical Feeling and Need words, if any, fit their present experience.

Existing audited Faux Feeling relationships are the primary vocabulary bridge when they apply. The V2 runtime records preserve the current Faux Feeling titles and their Feeling and Need relationships, but neither the runtime model nor the public Faux Feeling page carries source metadata. The canonical legacy `Faux Feelings.csv` at the imported provenance commit also owns the same relationship fields without a source column. This is a machine-readable provenance gap, not evidence that the relationships were never audited. Recover the existing audit history and intended source attribution before adopting a replacement list. If additional academic sources are needed, add them to support the relevant claims or relationship provenance without changing catalog membership or silently remapping existing terms.

### Body Cues preservation and relationship to this lane

Body Cues remains a first-class experience. Its tactile body-region check-in, sensation choices, and intensity sliders can be useful when a person can access bodily information, and this review is not authorization to replace or remove that page.

The Alexithymia Support lane must nevertheless be more than a reskinned body scan. It has a different job: help a person in a real present-moment situation combine whichever clues are available, compare possible words, select their own canonical Feelings and Needs, and prepare to communicate. Body sensation is one optional clue channel alongside context or appraisal, thoughts or attention, action urges, energy, and pleasantness. A person may start with body cues, use them later, or skip them.

Both experiences should read from one canonical authored cue-association table and one shared, audited scorer. Alexithymia Support may open or reuse the relevant compact Body Cues interaction, but it must not maintain a second copy of the cue vocabulary, weights, or reverse-inference rules. Body Cues may retain its fuller scan-and-slider experience; Alexithymia Support should return selected observations to its compact clue tray rather than expanding the complete Body Cues page inside the lane.

### Body-cue evidence rule

The site's current body-cue resources require a new source-to-claim audit before they can be treated as reviewed production evidence.

- Emotion body-map studies generally ask participants where sensations are experienced after an emotion word or stimulus is supplied. They can support the proposition that people report partly differentiable bodily patterns for emotions.
- The app currently reverses that direction by treating a selected sensation as evidence for an emotion. Evidence about `bodily report given an emotion` does not by itself establish `emotion given a bodily report`. The reverse inference additionally depends on base rates, context, health state, medication, culture, concepts, and the specificity of the cue.
- Published body maps use broad spatial activation and deactivation. They do not directly validate the current thirty micro-cue descriptions, exact intensity bands, or hand-assigned relative weights.
- Contemporary review work treats bodily maps as potentially combining bottom-up physiology, action preparation, and conceptual or metaphorical knowledge. They should not be described as direct physiological readouts.
- The relationship between alexithymia and interoceptive awareness is small on average and varies by measure and population. A body-first gate therefore cannot stand in for alexithymia support generally.

Until each stronger claim is supported, body-cue selections should be treated as the person's observations. They may help organize exploration, but the interface must not display a probability, diagnostic confidence, or false numerical precision. A compatibility percentage is permissible only if its numerator, denominator, weights, missing-data behavior, and interpretation are documented and audited. If associations are retained, their data must distinguish sourced findings from clinically grounded or editorial translations and identify the evidence and limitation for each level.

### Legacy implementation findings and remaining corrections

- **Corrected 2026-08-27:** Body Cues divided each selected-cue score by the sum of all candidate scores, so its percentages always summed to 100. The approved shared scorer now calculates candidates independently.
- **Corrected 2026-08-27:** The Alexithymia lane divided every body candidate by the largest candidate score, making its strongest body candidate exactly 100 percent. Its body channel now uses the shared independent scorer, and the compass no longer displays a percentage without an approved denominator.
- **Corrected in production scoring 2026-08-27; source migration remains:** the imported reverse-inference compiler divides each cue's authored weight by the total weight of every cue associated with that emotion, then clamps the result to a minimum of `0.1`. These per-emotion-normalized values created a sparse-emotion bias when compared across emotions. Production Body Cues and Alexithymia body matching now read the forward authored weights instead; the generated reverse data remains a non-scoring legacy detail resource pending canonical source/compiler restoration.
- The sparse-emotion bias changed real legacy rankings. For `Temperature flush`, the reverse data gives Pride `1.0` and Anger `0.17`, which previously displayed approximately 62.5 percent Pride and 10.6 percent Anger. The canonical authored weights point in the opposite direction: Pride is `0.6` and Anger is `1.2`. The approved scorer now displays approximately 43 and 86 percent respectively. The defect did not invalidate the sensation choices themselves.
- **Corrected 2026-08-27:** `Not it` created a device-wide rejection count that suppressed the same emotion in unrelated later contexts. `Not this time` is now current-check-in state outside the score, and the obsolete device-wide key is excluded from profile snapshots.
- V2 imports generated `body-regions.json` and `reverse-inference.json` outputs but not the legacy canonical cue rows, deterministic compiler, reviewed override file, or evidence-registry ownership that produced them. Those source assets remain recoverable from the exact provenance commit and should be restored rather than reconstructed from generated JSON.
- `body-regions.json` contains exact emotion weights without claim-level evidence metadata. `reverse-inference.json` contains a second set of relative weights and heuristic intensity bands. The legacy evidence registry assigns every body option the same broad body-map sources; it does not validate each of the thirty micro-cue associations or its exact weight.
- Four authored forward associations remain absent from the imported reverse detail data: `chest-open` to `love-caring`, `gut-nausea` to `disgust`, `throat-dry` to `excited`, and `throat-gag` to `disgust`. The shared scorer reads the forward source, so the supported `excited` association now contributes. Unsupported candidate keys remain filtered from display until their catalog role and evidence are reviewed.
- Evidence keys for individual body cues currently resolve to the same general body-map citations rather than cue-specific support.
- **Corrected at the display boundary 2026-08-27:** body-cue data can contain `disgust` and `love-caring`, but the Alexithymia emotion library has no entries for those keys. Both experiences now filter unsupported candidate keys rather than rendering an incomplete or nonselectable result; the underlying authored rows remain available for the source audit.
- **Corrected 2026-08-28:** `Guilt` remains available as a clearly labeled Working term, while the canonical Feeling and Faux Feeling catalogs remain unchanged. It has no Feeling route or silent semantic bridge; the person may choose canonical words themselves.
- **Corrected 2026-08-28:** Feeling-page Alexithymia panels no longer include emotion-matched breathing, `Try now` skills, or other direct actions. They retain descriptive clues and route into the present-moment check-in; strategies remain on Need pages.
- **Corrected 2026-08-28:** the support lane no longer inserts the first Need listed for an emotion or a `support` fallback. Its editable statement uses only the person's own observation and selected canonical Feelings and Needs.
- **Corrected 2026-08-27:** the public methods page no longer says all mappings carry evidence metadata enforced through CI. It publishes the approved formula and distinguishes the broad body-map evidence from the still-audited micro-cues and authored strengths.

### Approved urgent shared-scorer correction

**Status:** approved and implemented 2026-08-27. This narrow correction addresses the demonstrated normalization defect while the claim-level association audit continues. It preserves the current Body Cues interface, sensation vocabulary, and authored forward associations.

For a candidate Feeling `f`, selected cues `S`, selected cue intensity `I(c)` on a `0–1` scale, authored forward association strength `W(c,f)` on the existing `0–1.4` scale, and the fixed schema maximum `Wmax = 1.4`:

`clueMatch(f) = 100 × Σ(I(c) × W(c,f)) / (Wmax × Σ I(c))`, for all `c` in `S`.

Rules and interpretation:

- read `W(c,f)` directly from the one canonical authored forward-association table; do not use the per-emotion-normalized `relativeWeight` values;
- treat an unselected or zero-intensity cue as missing from `S`, not as evidence against every candidate;
- for a selected cue with no authored association to candidate `f`, use `W(c,f) = 0` for this map-compatibility calculation while clearly describing the map as incomplete and editorially reviewed rather than exhaustive;
- calculate every candidate independently; do not divide by the other candidates' scores and do not normalize the first-ranked candidate to `100`;
- display a whole-number `Clue match` plus the number and kinds of clues on which it is based; do not display decimal precision or call the number probability, confidence, certainty, accuracy, or diagnostic likelihood;
- return no match when there is no positive-intensity selected clue. A `100` can occur only when every selected intensity-weighted clue carries the maximum authored association for that candidate, and still means perfect fit to the entered clues under this authored map—not certainty about the person's emotion;
- keep current-check-in `Fits`, `Maybe`, and `Not this time` decisions outside the score. Do not persist a rejection penalty into other situations;
- use this calculation as the body channel inside Alexithymia Support. A later multi-channel `Clue match` must combine only channels the person used and must publish its own denominator and missing-data behavior before implementation.

With one selected `Temperature flush` cue, this correction would rank the current authored associations as Anger approximately `86`, Excited `71`, Shame `71`, and Pride `43`, rather than the current approximately `11`, `9`, `18`, and `63` percent. The example demonstrates removal of the compiler inversion; it does not establish that the four authored association strengths are empirically calibrated. That separate source-to-claim review remains required.

### Research roles for the complete package

The final source set should remain small enough to understand, with each source doing a distinct job:

1. **Luminet and Nielson (2025), Alexithymia: Toward an Experimental, Processual Affective Science with Effective Interventions.** Current broad review for the multidimensional construct, facet-level differences, positive as well as negative emotions, and uncertainty in mechanisms. https://doi.org/10.1146/annurev-psych-021424-030718
2. **Mazza et al. (2026), Identifying therapies to effectively reduce alexithymia: A systematic review and meta-analysis.** Current synthesis for intervention outcomes. Its role here is to bound claims: the lane is not one of the studied therapies and must not be described as treatment merely because some interventions include emotion identification. https://pubmed.ncbi.nlm.nih.gov/41525940/
3. **Nunes da Silva (2021), Developing Emotional Skills and the Therapeutic Alliance in Clients with Alexithymia: Intervention Guidelines.** Clinical review supporting links among emotions, events, vocabulary, and body sensations. It can inform respectful clue channels, but therapeutic guidance and the therapeutic relationship cannot be transferred wholesale to a self-guided app. https://pubmed.ncbi.nlm.nih.gov/34749373/
4. **Trevisan et al. (2019), A meta-analysis on the relationship between interoceptive awareness and alexithymia.** Supports the small, measure-dependent average relationship and the decision not to make body awareness the only entrance. https://pubmed.ncbi.nlm.nih.gov/31380655/
5. **Nummenmaa et al. (2014), Bodily maps of emotions.** Found partly differentiable self-reported bodily topographies after emotion prompts and stimuli. It does not validate reverse inference, the site's micro-cues, or exact weights. https://doi.org/10.1073/pnas.1321664111
6. **Volynets et al. (2020), Bodily maps of emotions are culturally universal.** Extends cross-cultural body-map evidence while still using self-reported maps of prompted emotions. Cross-cultural similarity does not make one person's body cue diagnostic. https://pubmed.ncbi.nlm.nih.gov/31259590/
7. **Daikoku, Minatoya, and Tanaka (2026), Mapping emotional feeling in the body: A tripartite framework for understanding the embodied mind.** Review supporting the distinction among physiological, action-related, and conceptual or metaphorical contributions to body maps. https://pubmed.ncbi.nlm.nih.gov/41207576/
8. **Posner, Russell, and Peterson (2005), The circumplex model of affect.** Supports valence and arousal as broad organizing dimensions. It does not establish the current hand-written 3 x 3 emotion assignments or identify a user's discrete emotion. https://doi.org/10.1017/S0954579405050340
The attention-appraisal model may inform interaction sequencing, but it is a theoretical model with active scholarly disagreement. The lane should not present one model of alexithymia as settled fact. Digital trials centered on vocabulary drills or scenario practice do not justify adding those modes when they do not serve this lane's current-moment use case.

### Approved complete lane package

**Status:** explicitly approved 2026-08-28. This subsection authorizes the bounded production experience, its exact copy, source/data restoration, score rules, legacy removals, and regression package. It does not authorize any item outside the approval boundary below.

#### Product decision

Replace the current seven-step body-scan, breathing, regulation, journaling, and communication sequence with one resumable four-stage present-moment check-in:

1. `What happened?`
2. `What can you notice?`
3. `Which words fit?`
4. `What do you want to say?`

The check-in is a working surface rather than a lesson. A person may start it immediately after a real interaction, use only the clues they can access, keep several possible words, choose no word yet, select their own Needs, and leave with an editable statement or a direct route to the selected Need pages. The lane does not teach through hypothetical scenarios, ask the person to rehearse, or end with an instruction to practice emotion identification.

#### Exact entry copy

Public page label: `Alexithymia support`

Working title: `Find words for right now`

Introduction: `Use any clues you can notice. The app can compare possible words, but you decide what fits.`

Primary action: `Start check-in`

Resumed-draft action: `Continue check-in`

Compact information disclosure:

`This is a support tool, not a test, diagnosis, or therapy. It cannot determine what you feel.`

The expanded disclosure first explains: `Alexithymia means having difficulty identifying or describing feelings. You do not need that label or a diagnosis to use this page.`

The disclosure should be reachable through an Info icon after the first visit rather than remaining as a dismissible paragraph above every check-in.

#### Stage 1 — What happened?

Progress label: `1 of 4 · What happened?`

Heading: `What are you trying to put into words?`

Prompt: `If it helps, write one or two details someone could have seen or heard, such as what happened or the exact words used.`

Placeholder: `For example: “When we stopped talking after…”`

Controls:

- `Continue`
- `Skip`
- the shared Observation helper, when available, opens without creating a second text detector;
- detected canonical Feeling, Need, or Faux Feeling terms become linked chips, but detection does not select them or add them to a score.

The field is optional and is not analyzed for hidden emotion, intent, or diagnosis. Its jobs are to anchor the person in the actual present situation, preserve their own words, and optionally supply the `When…` clause in the final composer.

#### Stage 2 — What can you notice?

Progress label: `2 of 4 · Clues`

Heading: `What can you notice right now?`

Prompt: `Use any clue that is available. You can skip the rest.`

The stage contains two compact tactile clue cards and one selected-clue tray. Neither card is a required first step.

**Body card**

- Label: `Body`
- Helper: `Choose sensations that stand out.`
- Opens a compact bottom sheet that reuses the canonical Body Cues regions, options, intensities, and shared scorer.
- Shows one region at a time with a region picker; selected cues return to the horizontal clue tray.
- Secondary link: `Open full Body Cues`.
- Empty choice: `Nothing clear in my body`.

The full Body Cues page remains unchanged except for separately approved evidence or data corrections. The support lane does not embed its long region accordion.

**Overall-feeling card**

- Label: `Overall feeling`
- Helper: `Rate any parts you can tell. Skip anything that is unclear.`
- Contains four independently skippable five-position tactile scales:
  - `Pleasant or unpleasant`: `Unpleasant` to `Pleasant`;
  - `Energy`: `Low` to `High`;
  - `Ability to influence what happens`: `Less able to influence this` to `More able to influence this`;
  - `Familiar or surprising`: `Expected or familiar` to `Sudden or surprising`.
- Every scale has a separate `Not sure` state. `Not sure` is missing information; it is not the midpoint.
- Influence disclosure: `This asks whether you feel able to influence or respond to what is happening. It is not asking whether you should be in control.`
- Expectedness disclosure: `This asks whether what happened felt familiar or expected, or sudden and new.`

These four dimensions follow the GRID/CoreGRID affective-semantic structure. They are a compact way to compare the shape of emotion words, not a claim that every emotion episode has one fixed coordinate. Context can change the typical feature profile of an emotion word, especially its appraisals. https://doi.org/10.1080/02699931.2017.1287668

Selected-clue tray label: `Your clues`

Primary action after at least one scorable body cue or two feeling-shape dimensions: `Compare words`

Always-available secondary action: `Browse all feelings`

When no clue is available, show: `Nothing has to be clear yet. You can still browse words or choose “No word yet.”`

#### Stage 3 — Which words fit?

Progress label: `3 of 4 · Words`

Heading: `Possible words`

Prompt: `These are words to consider, not answers. More than one may fit, or none yet.`

Candidates render as magnets on the shared physical `MagnetBoard`; do not create card-shaped substitutes or a second drag engine. A compact segmented filter may show `Matches`, `All feelings`, and `My words`. Search covers the unchanged canonical catalog plus the approved lane-local working terms.

Tap a candidate magnet to open a mobile bottom sheet. The sheet contains:

1. term and public role: `Feeling`, `Faux Feeling`, `Other emotion word`, or `Your word`;
2. whole-number `Clue match`, only when the term has complete source coverage for the channels shown;
3. `How this was compared`, showing each kind of clue separately and the exact clues used;
4. one short sourced definition or the canonical Feeling-page summary;
5. the actions `Fits`, `Maybe`, and `Not this time`;
6. a route to the canonical Feeling or Faux Feeling page when one exists.

Nearby score disclosure:

`Clue match estimates how closely this word’s reviewed profile fits the clues you entered. It is not a probability, diagnosis, or determination of what you feel. You remain the judge.`

Candidate decisions are direct user judgments and remain outside the score. `Fits` and `Maybe` may contain several terms. `Not this time` applies only to the current check-in. The stage always provides `No word yet` and `Browse all feelings`.

For the first production package, do not publish the current hand-written `Typical thoughts`, `When it often appears`, action recommendations, or inferred Needs. Candidate detail may later add context, attention, and action-urge comparison rows only after every displayed row has canonical source ownership and the complete row set is approved. This deliberately avoids preserving unsourced academic-looking prose merely to make the sheet appear richer.

#### Candidate roles and complete first-release bridge map

The automatic candidate shelf is intentionally bounded to the 24 authored body-profile terms already present, excluding `love-caring`, which is a canonical Need rather than an emotion candidate. Feeling-shape data may score the same candidate set. The full 48-Feeling catalog remains available through search and `Browse all feelings`; a canonical Feeling without complete candidate-profile data remains selectable but unscored.

| Authored profile key | Displayed term | Role | Automatic bridge |
| --- | --- | --- | --- |
| `anger` | Angry | canonical Feeling | `/feelings/angry`; noun/adjective lemma only |
| `anxiety` | Anxiety | canonical Feeling | `/feelings/anxiety`; exact term |
| `bored` | Bored | working term | none |
| `calm` | Calm | canonical Feeling | `/feelings/calm`; exact term |
| `contented` | Contented | canonical Feeling | `/feelings/contented`; exact term |
| `determined` | Determined | working term | none; do not substitute Defiant |
| `disgust` | Disgust | working term | none |
| `excited` | Excited | canonical Feeling | `/feelings/excited`; exact term |
| `fear` | Fear | canonical Feeling | `/feelings/fear`; exact term |
| `frustration` | Frustrated | canonical Feeling | `/feelings/frustrated`; noun/adjective lemma only |
| `gratitude` | Gratitude | working term | none |
| `grief` | Grief | working term | none |
| `guilt` | Guilt | working term | none |
| `hopeful` | Hopeful | canonical Feeling | `/feelings/hopeful`; exact term |
| `joyful` | Joyful | canonical Feeling | `/feelings/joyful`; exact term |
| `lonely` | Lonely | canonical Feeling | `/feelings/lonely`; exact term |
| `numb` | Numb | working term | none; do not substitute Powerless |
| `overwhelm` | Overwhelmed | canonical Feeling | `/feelings/overwhelmed`; noun/adjective lemma only |
| `pride` | Proud | canonical Feeling | `/feelings/proud`; noun/adjective lemma only |
| `relief` | Relieved | canonical Feeling | `/feelings/relieved`; noun/adjective lemma only |
| `sadness` | Sad | canonical Feeling | `/feelings/sad`; noun/adjective lemma only |
| `shame` | Shame | working term | none; do not substitute Embarrassed |
| `stress` | Stress | working term | none; do not substitute Tense or Distressed |
| `tired` | Tired | canonical Feeling | `/feelings/tired`; exact term |

The six noun/adjective display bridges must use the directly corresponding lemma only. Soriano et al. (2026) found highly similar English noun/adjective emotion profiles overall while also documenting pair-specific differences; the compiler must therefore point to the exact reviewed pair rather than infer a general synonym rule. https://doi.org/10.1016/j.langsci.2026.101807

`Disgust` is the only lane-local term newly surfaced by this proposal. It already exists as an authored body-profile key for nausea and gag cues and appears in the reviewed English CoreGRID term set, but it remains a `Working term`; this package does not add it to the 48 official Feelings. https://doi.org/10.1016/j.langsci.2026.101807

The following current legacy candidates leave the automatic shelf: `Curiosity`, `Focused`, `Thoughtful`, and `Uncertain`. They are not deleted from a user’s language: if typed, they may be retained as unscored working words. They should not continue to receive automatic candidate placement from the current hand-written 3 × 3 quadrant table. The current library's `Anger`, `Frustration`, `Overwhelm`, `Pride`, `Relief`, and `Sadness` labels are replaced on the shelf by the exact canonical display words above; no catalog entry changes.

Faux Feelings do not receive an affect-shape or body score. When the shared text detector finds an exact canonical Faux Feeling, or the person searches for one, display:

`In allneeds, “[term]” is a Faux Feeling: a word that may combine an emotion with an interpretation of what happened. That label does not mean the event was unreal.`

Then link to its existing Faux Feeling page and let the person choose from the canonical related Feeling and Need magnets themselves. Do not silently replace the term.

The existing relationship table closely tracks **Differentiating Between Feelings and Faux Feelings**, a list attributed to Wisconsin International Intensive Training participants (April 2000) and edited by Susan Skye. Human-reachable copies include https://johnkinyon.com/wp-content/uploads/2019/10/Feelings-vs-Faux-Feelings.pdf and https://makinglifemorewonderful.com.au/wp-content/uploads/2021/02/Faux-Feelings-1.pdf. The current catalog also contains prior editorial additions and differences. Before the lane consumes any relationship automatically, canonical data must record the source or reviewed-editorial provenance for each retained row; this restoration does not authorize changing any of the 56 Faux Feeling titles or relationships.

#### Multi-channel Clue match

Use two independent scoring channels. Do not score the observation text, Faux Feelings, user-entered unprofiled words, or `Fits`/`Maybe`/`Not this time` decisions.

**1. Body channel**

Use the already-approved shared body formula in the preceding section, returning `B(f)` on a `0–1` scale. A candidate has body-channel coverage only when it is an explicit candidate in the authored body-profile source. Within that covered candidate universe, an absent association for a selected cue contributes zero as already approved. A term outside the authored candidate universe is `unscored`, not zero.

**2. Feeling-shape channel**

For each reviewed dimension `d`, map the person's five tactile positions and the source term's fixed published coordinate onto `0–1`. Let `u(d)` be the person's selected position and `p(f,d)` the reviewed coordinate for candidate `f`. For the set `D` of dimensions the person used:

`shapeMatch(f) = Σ(1 - |u(d) - p(f,d)|) / |D|`, for all `d` in `D`.

This distance calculation and the five-position input translation are allneeds editorial rules chosen for transparency. The cited norm studies supply the term coordinates and dimensional structure; they do not validate this app-specific percentage formula.

Rules:

- require at least two selected dimensions before displaying a shape percentage;
- treat `Not sure` as absent from `D`, not as `0.5`;
- use one fixed, documented source coordinate and normalization range for every term/dimension;
- never normalize against the candidates currently on screen or force the first result to `100`;
- a 100 percent shape match is possible only when the person's position exactly matches the source coordinate on every used dimension;
- round only the final display to the nearest whole percent;
- describe the underlying data as norms for the shared meaning of emotion words, not a model trained to identify an individual's feeling.

The preferred source is the open CC BY English noun/adjective CoreGRID analysis in Soriano et al. (2026), which reports valence, power, arousal, and novelty structure and makes the noun/adjective limitation directly auditable. If an approved candidate lacks a usable coordinate there, use a separately licensed human-rated English norm source such as Warriner et al. (2013) only after recording the exact source, scale conversion, and term form. Do not blend sources term by term without an explicit source-priority rule. https://doi.org/10.3758/s13428-012-0314-x

**3. Combined display**

For the set `K(f)` of used channels for which candidate `f` has complete source coverage:

`clueMatch(f) = 100 × Σ channelMatch(f,k) / |K(f)|`, for all `k` in `K(f)`.

Equal channel weighting is likewise an explicit allneeds editorial choice, not an empirically calibrated statement that body and feeling-shape information are equally diagnostic.

Body and overall-feeling ratings therefore have equal weight; selecting several body micro-cues does not allow the body clues to overwhelm the broad affect ratings. Display the total only when every kind of clue the person used can be compared for that candidate. Put terms with partial or absent coverage in `More words to consider` with `These words fit some clues, but the app cannot compare every clue you chose`; do not compare a one-kind number directly with a two-kind number.

Example disclosure:

- `Body clues: 64% from 2 cues`
- `Overall feeling: 81% from pleasant or unpleasant, energy, and ability to influence what happens`
- `Combined result: 73%. The app gives body clues and overall-feeling ratings equal weight.`

If only one complete kind of clue was used, name it: `64% body clue match` or `81% overall-feeling match`. If neither can be compared, tell the person which input is needed instead of saying that their clues were “not scored.”

This is a transparent compatibility calculation, not a validated diagnostic or emotion-recognition probability. Published word profiles describe shared semantic expectations; they do not establish what a particular person feels in a particular context.

#### Stage 4 — What do you want to say?

Progress label: `4 of 4 · Your words`

Heading: `What fits right now?`

The stage contains two tactile trays:

1. `Your feeling words` — the person's `Fits` and optional `Maybe` terms, with role labels and remove/reorder controls;
2. `Needs` — the unchanged full 67-Need magnet catalog with search. No Need is preselected, and no fallback Need is inserted.

Needs detected verbatim in the person's observation may be offered as `Words you already used`; this is text recognition, not emotion-to-Need inference. A selected Faux Feeling may link to its canonical detail page, but the lane must not automatically import its related Needs into the person's statement.

Need selector copy:

- Heading: `What matters to you here?`
- Helper: `A Need is something that matters, such as safety, connection, rest, or understanding. A Feeling can be a clue, but it cannot prove which Need fits.`
- Search placeholder: `Search all needs`
- Empty choice: `Not sure yet`

Each selected Need remains a real magnet and provides `Open ways to support this Need`, which routes to the canonical Need page. The lane itself provides no strategy card, breathing exercise, grounding action, regulation suggestion, repair instruction, or generated request.

Communication composer heading: `Put it into your words`

Helper: `Start with the words you chose, then edit the sentence however you want.`

`Build sentence` may assemble:

`When [the person's observation], I feel [the person's selected canonical Feelings, Faux Feelings, or working terms] because I need [the person's selected Needs].`

Rules:

- omit an unfilled clause rather than supplying a term;
- never insert `support`, the first related Need, or any other fallback;
- retain a Faux Feeling or working term when the person chose it; preserve its role in structured state without policing their spoken language;
- if the person explicitly selects `No word yet`, the optional sentence fragment is `I’m not sure what I feel yet.`;
- after construction, the statement is an ordinary editable text area and must not be overwritten by later background calculations;
- do not generate an NVC request or advise how anyone should meet the Need.

Actions use familiar icons with accessible labels: `Copy`, `Read aloud`, `Add to Journal`, and `Start over`. Journal handoff carries the person's observation, selected term roles, selected Needs, and the editable statement into the shared Journal draft; it does not create a separate Alexithymia journal. Completing the check-in keeps selected Need magnets visible with direct strategy-page routes.

Completion copy:

`These are the words that fit for this moment. You can change them whenever more becomes clear.`

There is no repetition or practice prescription.

#### Mobile stage and native-app behavior

At `390 × 844`, use the page as one edge-to-edge working stage below the persistent app shell:

- compact app bar with Back icon, `Check in`, four progress segments, Info icon, and Close icon;
- no large editorial hero after entry;
- one main job per viewport, one light surface hierarchy, and no repeated heavy rectangular outlines;
- selected clues or selected words remain in a compact horizontal tray near the top;
- primary action sits in a safe-area-aware sticky bottom bar and never covers content;
- Body, Overall feeling, candidate detail, and Need catalog use bottom sheets that can expand to full height for large text;
- approximately 44-pixel targets for Back, Close, Clear/Undo, Info, Copy, Read aloud, Journal, search, and sheet handles/actions;
- visible text remains for ambiguous choices and all term labels;
- no horizontal document panning; a horizontal tray scrolls only within its named region;
- iOS backgrounding and route changes flush the draft so the same stage, clue selections, candidate decisions, Needs, and edited statement return;
- reduced motion removes decorative transitions while preserving direct magnet manipulation and understandable state changes.

All surfaces use Customizer-owned functional color roles, outline, corner, typography, and shadow tokens. Verify Default, Refrigerator, Pixel Art, Matrix, and every other shipped preset rather than special-casing the default. The candidate role must be conveyed by a text badge and accessible name, not color alone.

#### Public Methods and References copy

Public title: `How feeling-word matching works`

Opening:

`This check-in compares clues you choose with reviewed profiles of emotion words. The result is a compatibility estimate, not a probability or a determination of what you feel. More than one word can match the same clues, and your own judgment is the final step.`

Required compact sections:

1. `Body clues` — publish the approved body formula, source ownership, current micro-cue limitation, and reverse-inference limitation.
2. `Overall feeling` — explain the four dimensions, exact source dataset, fixed normalization ranges, per-axis closeness formula, and two-dimension minimum.
3. `Combining channels` — publish the equal-channel formula and coverage rule.
4. `What is not scored` — observation text, Faux Feelings, unprofiled terms, Need selection, and user candidate decisions.
5. `What the word labels mean` — distinguish canonical Feelings, canonical Faux Feelings, other emotion words, and words entered by the person; state that the catalogs are unchanged.
6. `Limits` — profiles are group-level word-meaning norms; body maps are prompted self-reports rather than diagnostic physiological signatures; context and individual differences matter; the lane is not therapy or diagnosis.
7. `Sources` — provide human-reachable raw URLs and identify the claim or data role of every source.

Academic source text stays on this surface and in compact `How this was compared` disclosures. It does not become paragraphs between the person and the next tactile action.

#### Removal scope

Delete rather than hide the superseded lane mechanisms:

- the optional paced-breathing entrance and breathing timer;
- quadrant `care` lists, emotion `regulation` lists, matched-breath logic, and the entire regulation step;
- the stand-alone Journal step;
- the repeated-practice ending;
- automatic first-Need selection and the `support` fallback;
- the current hand-written 3 × 3 quadrant candidate order and its unsupported candidates;
- lane-local `communication` sentences that contain inferred Needs or requests;
- `Try now` skills and direct recommendations inside Feeling-page Alexithymia panels;
- obsolete state fields, CSS selectors, tests, and legacy support-data imports owned only by those mechanisms.

Feeling pages may retain a compact `How this feeling may show up` disclosure for reviewed, descriptive material and a clear `Start a present-moment check-in` route. They must not own a second intervention library.

#### Canonical ownership and migration

Use one new authored source for the lane's candidate/profile records, definitions, role, exact catalog link, feeling-shape coordinates, body-profile key, source references, and coverage flags. A deterministic build owner validates it and emits the runtime asset. Do not hand-edit `src/data/generated/legacyData.json`, continue importing `src/legacy/alexithymia-support-data.js`, or repair generated content in a React component.

The body clue table and shared scorer remain separately canonical and are referenced by key; the lane does not copy their weights. The Feeling, Need, and Faux Feeling catalogs remain the existing canonical sources. The shared Observation detector owns exact term detection. The Journal repository owns saved check-ins.

Draft schema v2 should preserve compatible v1 body cues, energy, valence, and a recognized selected term through one explicit persistence-boundary migration. It should discard breathing/timer/care-step state that no longer has a product meaning. Never keep dormant old-phase branches merely to read the old draft.

#### Accessibility and regression package

Production implementation requires automated coverage for:

- exact catalog counts remain 48 Feelings, 67 Needs, and 56 Faux Feelings;
- every candidate declares a valid role, source, coverage, and bridge state;
- no working term can enter an official catalog or acquire a route through fallback slug generation;
- body, shape, combined, rounding, zero, missing, partial-coverage, and 100-percent score cases;
- candidate results remain independent and `Not this time` stays check-in-local;
- no Need or request appears without direct user selection;
- draft migration, reload, route return, page hide, reset, and Journal handoff;
- screen-reader names, focus return from every sheet, keyboard operation of scales and magnets, live match updates, large text, reduced motion, and contrast across presets;
- compact `390 × 844` and wide layouts, including iOS safe areas and no horizontal overflow;
- Feeling-page recommendation removal and canonical Need-page strategy routing.

The release check must include `pnpm check`, the repository's available browser suite, and reviewed screenshots at `390 × 844`, large-text compact, and wide desktop sizes. Browser testing must exercise at least: body-only, shape-only, combined clues, no-word-yet, Faux Feeling detection, a working term with no bridge, multiple selected words, no Need selected, and one selected Need opened to its strategy page.

#### Approval boundary

Approval of this package would authorize implementation of this bounded experience and its exact copy, source/data restoration, scoring, removals, and tests. It would not authorize:

- adding, removing, or reclassifying an official Feeling, Need, or Faux Feeling;
- changing any existing Faux Feeling relationship while adding provenance;
- adding candidate-specific thoughts, situations, action urges, or body claims beyond the approved scored sources;
- adding a lane-local strategy, coping recommendation, regulation exercise, generated request, diagnosis, or treatment claim.

No body-cue or emotion score should be retained merely to preserve continuity with the legacy implementation. If the approved source coordinates or licensing cannot be recovered for a candidate, that candidate remains tactile and selectable but unscored until a new complete review is approved.

# Approved need packages

## Connection

**Status:** fully audited. Content implemented 2026-08-24; approved Constellation magnet promoted in the later visual pass. Do not revise without a new review cycle.

Approved short copy:

> As a highly social species, humans appear to have evolved strong motivations to maintain connection with others. Across human evolutionary history, social bonds supported protection, caregiving, cooperation, and group living, making social connection consequential for survival and reproduction across generations. This need may drive us to seek others, maintain relationships, repair social ruptures, and coordinate with the people around us. Evolutionary accounts propose that even the discomfort of disconnection may help motivate behavior directed toward restoring socially important bonds.

Approved need-level sources:

1. Baumeister & Leary (1995), _The need to belong: Desire for interpersonal attachments as a fundamental human motivation._ https://psycnet.apa.org/record/1995-29052-001
2. Ryan & Deci (2000), _Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being._ https://pubmed.ncbi.nlm.nih.gov/11392867/
3. Vansteenkiste, Ryan, & Soenens (2020), _Basic psychological need theory: Advancements, critical themes, and future directions._ https://link.springer.com/article/10.1007/s11031-019-09818-1
4. Cacioppo, Cacioppo, & Boomsma (2014), _Evolutionary mechanisms for loneliness._ https://pmc.ncbi.nlm.nih.gov/articles/PMC3855545/
5. Coan & Sbarra (2015), _Social Baseline Theory: The Social Regulation of Risk and Effort._ https://pmc.ncbi.nlm.nih.gov/articles/PMC4375548/
6. Holt-Lunstad, Smith, & Layton (2010), _Social relationships and mortality risk: A meta-analytic review._ https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316

Current repository-resident Connection strategies are the four reviewed system strategies: `write-a-letter-for-connection`, `remember-a-connected-moment`, `map-your-connection-options`, and `notice-where-you-are`. Nat-authored Connection strategies that were part of the earlier audit were later migrated to profile ownership and are not static repository strategies.

`one-kind-text` and `specific-thank-you` are global discards. `ambient-postcard` lost only its Connection association.

## Support

**Status:** fully audited. Content approved and implemented 2026-08-25; approved `S1B2 · Soft Terraces` magnet promoted to production 2026-08-25.

Approved short copy:

> Across human evolutionary history, survival often depended on sharing food, care, information, labor, and risk rather than meeting every demand alone. This need may draw us to seek help, make our needs visible, notice when others need assistance, and offer or accept emotional, informational, or practical support. Tending to support can distribute burdens, preserve capacity during hardship, and make difficult circumstances more manageable than they would be alone.

Approved expanded copy:

> Evolutionary anthropology gives human support-seeking and support-giving a deep historical context. Jaeggi and Gurven describe food sharing as having a “central role in shaping evolved human life history, social organization, and cooperative psychology.” They argue that humans expanded patterns of sharing in part to buffer risk in a demanding and uncertain foraging niche. Kaplan and colleagues likewise call exchange among non-kin a “hallmark of human sociality” and report experimental evidence consistent with risk reduction helping motivate reciprocal exchange under variable resource availability. These sources do not establish that every modern desire for help is an adaptation to a particular ancestral problem, but they place dependence on shared resources firmly within the natural history of our species. [1][2]
>
> Modern social-support research shows that what people provide one another can take importantly different forms. Thoits distinguishes two broad categories, “emotional sustenance” and “active coping assistance.” Support can therefore involve empathy and reassurance, but it can also involve information, practical help, problem-solving, material resources, or other assistance that changes what a person has to carry alone. [3]
>
> The usefulness of support also depends on how well it corresponds to the situation. Cohen and Wills reviewed evidence for both general benefits associated with social integration and a stress-buffering process. Their buffering account emphasizes support resources that are responsive to demands produced by a stressful event. Having people nearby, receiving some form of help, and receiving the kind of help that is actually useful are therefore not interchangeable ideas. [4]
>
> Research also distinguishes believing that support is available from actually receiving supportive behavior. Uchino argues that perceived and received support have distinct antecedents and may operate through different pathways. Haber and colleagues' meta-analysis of 23 studies found that the two were related, but only moderately, with an average correlation of r = .35. A person can therefore receive assistance without experiencing themselves as well supported, or experience a dependable source of support even when they are not currently receiving help. [5][6]
>
> Support is not limited to surviving emergencies. Feeney and Collins propose that supportive relationships can matter both while coping with adversity and while pursuing opportunities for exploration and growth. A large systematic review and meta-analysis by Yeo, Lansford, and Rudolph synthesized 604 studies and 1,014 effect sizes and found that perceived emotional, informational, instrumental, and combined support were associated with outcomes across mental health, physical health, education, work, and risk-taking. These associations do not mean that any particular supportive act will necessarily produce a particular outcome. [7][8]
>
> Taken together, these literatures make human reliance on support less mysterious. Sharing burdens, resources, information, protection, and care has repeatedly been part of how humans manage demands that exceed what one individual can reliably handle. From this perspective, impulses to seek support or respond to another person's need for it need not be interpreted simply as failures of self-sufficiency. They are intelligible parts of a deeply cooperative human repertoire. What constitutes useful support still depends on the person, the circumstances, and the kind of assistance that is actually needed.

Approved need-level sources:

1. Jaeggi, A. V., & Gurven, M. (2013). _Natural cooperators: food sharing in humans and other primates._ Evolutionary Anthropology, 22(4), 186–195. https://pubmed.ncbi.nlm.nih.gov/23943272/
2. Kaplan, H. S., Schniter, E., Smith, V. L., & Wilson, B. J. (2012). _Risk and the evolution of human exchange._ Proceedings of the Royal Society B, 279(1740), 2930–2935. https://pmc.ncbi.nlm.nih.gov/articles/PMC3385467/
3. Thoits, P. A. (2011). _Mechanisms linking social ties and support to physical and mental health._ Journal of Health and Social Behavior, 52(2), 145–161. https://pubmed.ncbi.nlm.nih.gov/21673143/
4. Cohen, S., & Wills, T. A. (1985). _Stress, social support, and the buffering hypothesis._ Psychological Bulletin, 98(2), 310–357. https://pubmed.ncbi.nlm.nih.gov/3901065/
5. Uchino, B. N. (2009). _Understanding the Links Between Social Support and Physical Health: A Life-Span Perspective With Emphasis on the Separability of Perceived and Received Support._ Perspectives on Psychological Science, 4(3), 236–255. https://pubmed.ncbi.nlm.nih.gov/26158961/
6. Haber, M. G., Cohen, J. L., Lucas, T., & Baltes, B. B. (2007). _The relationship between self-reported received and perceived social support: a meta-analytic review._ American Journal of Community Psychology, 39(1–2), 133–144. https://pubmed.ncbi.nlm.nih.gov/17308966/
7. Feeney, B. C., & Collins, N. L. (2015). _A New Look at Social Support: A Theoretical Perspective on Thriving through Relationships._ Personality and Social Psychology Review, 19(2), 113–147. https://pmc.ncbi.nlm.nih.gov/articles/PMC5480897/
8. Yeo, G., Lansford, J. E., & Rudolph, K. D. (2025). _How does perceived social support relate to human thriving? A systematic review with meta-analyses._ Psychological Bulletin, 151(9), 1089–1124. https://pubmed.ncbi.nlm.nih.gov/41100292/

Internal source-role notes for future reviewers:

- [1] and [2]: evolutionary/anthropological grounding for sharing, exchange, and risk distribution. Do not claim every modern support-seeking act is a specific adaptation.
- [3]: emotional sustenance versus active coping assistance.
- [4]: direct-effect and stress-buffering accounts; do not present buffering as universal.
- [5] and [6]: perceived versus received support are related but not interchangeable.
- [7]: theoretical model of support in adversity and growth contexts.
- [8]: large contemporary synthesis of perceived-support associations; not proof that a particular supportive act causes a specific outcome.

Current repository-resident Support strategies:

1. `map-your-support` — system. Supporting source: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0233535
2. `prepare-one-request-for-help` — system. Supporting source: https://pubmed.ncbi.nlm.nih.gov/36067802/
3. `call-or-text-988` — system official resource. Support + Safety. Supporting source: https://988lifeline.org/
4. `call-116-123` — system official resource. Support + Safety. Supporting source: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/faq/index_en.htm

Nat-authored Support strategies from the earlier audit are now profile-owned and are not part of the static repository package.

Remove the Support association only from `floor-starfish`, `pillow-nest`, `name-support-options`, and `name-one-help-to-ask`. Do not globally delete those strategies during the Support audit.

## Safety

**Status:** a later dedicated record supersedes this historical section. Read `docs/safety-content-audit.md` for the authoritative approved Safety copy, evidence, strategy set, limitations, and current production status.

This retained section documents the earlier review state and should not be used to restore superseded Safety copy or sources.

Approved short copy from the earlier review state:

> Across evolutionary history, detecting and responding to danger had direct consequences for survival. Humans retain flexible defensive systems that shift behavior as threats become more likely or immediate. This need may draw us to create distance from danger, seek shelter or trustworthy people, set boundaries, reduce exposure to harm, and look for cues that tell us when it is safe enough to stand down. Tending to safety can help us protect ourselves and others when danger is present while making room for rest, exploration, connection, and other goals when it is not.

Approved expanded copy from the earlier review state:

> Evolutionary accounts place protection from danger among the oldest problems living systems have had to solve. LeDoux argues that what humans share with other animals is not necessarily one inherited conscious “fear system,” but ancient defensive survival functions that detect threats and organize protective behavior. Mobbs and colleagues similarly propose that human defense includes prediction, prevention, threat assessment, searching for safety, and rapid responses when danger becomes imminent. These frameworks help explain why protective motivation can carry such urgency. They do not establish that every modern feeling of unsafety accurately identifies a present danger. [1][2]
>
> Defense is also not one fixed reaction. In a human experiment using an approaching virtual predator, Mobbs and colleagues found that patterns of neural activity shifted as the threat became more imminent. Threat-imminence accounts likewise distinguish responses to uncertain or potential danger from responses when a threat has been detected or is approaching contact. From this perspective, scanning, pausing, withdrawing, escaping, seeking protection, or rapidly reacting can all be intelligible parts of a system attempting to match behavior to perceived circumstances. This does not mean that every defensive impulse is accurate or that any particular reaction is necessarily the safest action to take. [3][6]
>
> Safety can be learned too. Christianson and colleagues describe safety signals as cues that “predict the nonoccurrence of an aversive event” and review evidence from rodents, nonhuman primates, and humans showing that learned safety cues can inhibit fear and stress responses. This matters because tending to Safety is not only about getting away from danger. It can also involve taking in credible information that danger has ended, is farther away, or is not present in the current situation. [4]
>
> Protective learning can also generalize beyond the circumstances in which danger was originally encountered. Cooper and colleagues' meta-analysis of 16 studies found greater conditioned fear generalization in people with anxiety-related disorders than in comparison groups. The authors emphasize that generalization can be adaptive when similar situations really do share danger, but costly when defensive responding spreads too broadly to innocuous cues. An alarm therefore deserves attention without having to be treated as proof. A therapeutic approach can make room for protective motivation while remaining curious about what the present environment says about both threat and safety. [5]
>
> LeDoux also cautions against treating the mechanisms that detect and respond to threats as identical to the conscious feeling of fear. This distinction keeps Safety from collapsing into Calm. A person can feel activated while taking sensible protective action, and feeling calm does not by itself establish that a situation is safe. Taken together, these literatures support a balanced picture: protective motivation is deeply tied to survival, effective defense changes with context, and recognizing genuine safety is part of the protective system rather than its opposite. Tending to Safety therefore need not mean suppressing alarm or obeying it automatically. It can mean making room for protective signals, reducing actual danger where possible, and updating as circumstances provide new information. [1][4][5]

Approved need-level sources from the earlier review state:

1. _As soon as there was life, there was danger: the deep history of survival behaviours and the shallower history of consciousness._ https://pubmed.ncbi.nlm.nih.gov/34957848/
2. _The ecology of human fear: survival optimization and the nervous system._ https://pubmed.ncbi.nlm.nih.gov/25852451/
3. _When fear is near: threat imminence elicits prefrontal-periaqueductal gray shifts in humans._ https://pubmed.ncbi.nlm.nih.gov/17717184/
4. _Inhibition of Fear by Learned Safety Signals: A Mini-Symposium Review._ https://pubmed.ncbi.nlm.nih.gov/23055481/
5. _A meta-analysis of conditioned fear generalization in anxiety-related disorders._ https://pubmed.ncbi.nlm.nih.gov/35501429/
6. _Negative valence systems: sustained threat and the predatory imminence continuum._ https://pubmed.ncbi.nlm.nih.gov/36286244/

Internal source-role notes from the earlier review state:

- [1] LeDoux: strongest evolutionary framing. Ancient defensive survival functions are not equivalent to a single inherited conscious fear system. This is an evolutionary/theoretical synthesis, not proof that the site's Safety construct is one discrete adaptation.
- [2] Mobbs et al.: functional sequence including prediction, prevention, assessment, searching for safety, escape, and rapid defense. Treat the proposed Survival Optimization System as a theoretical synthesis rather than settled neural fact.
- [3] Mobbs et al. 2007: human experimental evidence that defensive neural processing changes with threat imminence. Laboratory threat paradigms should not be generalized into a claim that every ordinary-life danger response follows the exact same sequence.
- [4] Christianson et al.: key evidence that cues predicting nonoccurrence of harm can inhibit defensive responding. Experimental safety learning is narrower than every subjective experience of feeling safe.
- [5] Cooper et al.: meta-analytic evidence that conditioned fear can generalize more broadly in anxiety-related disorders. This supports curiosity and discrimination, not dismissing an individual's current alarm as inaccurate.
- [6] Fanselow: modern predatory-imminence review distinguishing potential from acute threat. Much of the framework builds on nonhuman defensive-behavior research, so public copy stays at the level of context-sensitive defensive function.

Current repository-resident Safety strategy set from the earlier review state:

1. `comfy-gaming` — protected Autumn submission, unchanged. Safety retained because it is the only need Autumn selected for the submission.
2. `5-4-3-2-1-check` — system.
3. `slow-breathing-safety` — system. Supporting source: https://pubmed.ncbi.nlm.nih.gov/38137060/
4. `call-or-text-988` — system official resource. Support + Safety. Supporting source: https://988lifeline.org/
5. `call-116-123` — system official resource. Support + Safety. Supporting source: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/faq/index_en.htm

Nat-authored Safety strategies from the earlier audit are profile-owned. They may appear dynamically through profile/community data, but they are not static repository strategies and must not be restored to the repository catalog or this static strategy set.

Approved Safety association removals from the earlier review state:

- `crunch-the-numbers`: remove Safety only; preserve strategy wording/authorship and its other need associations.
- `road-trip`: remove Safety only; preserve strategy wording/authorship and its other need associations.
- Existing interim Safety removals remain in force: `back-to-wall-lean`, `butterfly-taps`, `hand-on-heart-breaths`, `floor-starfish`, `feel-your-feet`, `wrap-in-a-blanket`, `name-support-options`, `exit-count`, and `seat-press`.

No new Safety strategy is added merely to enlarge the deck.

Editorial distinctions used in the earlier Safety review:

- **Safety:** danger, harm, protection, defensive responding, and credible cues that danger is absent or has ended.
- **Security:** longer-term stability, resources, continuity, dependable protection, and reduced vulnerability to future disruption.
- **Calm / Peace:** experiential or arousal states. Someone can be safe without feeling calm, or calm without objectively being safe.
- **Trust:** expectations about the reliability or intentions of people and relationships.
- **Control:** capacity to influence circumstances or outcomes.

## Understanding

**Status:** complete content/evidence/strategy package explicitly approved 2026-08-26 and authorized for production implementation. Magnet visual review remains pending, so Understanding is not yet fully audited.

Understanding is the first approved production use of optional Need function lenses. The page keeps one umbrella Need description and presents two evidence-separated recognition lenses, **Making sense** and **Understanding between people**, with both visible together rather than hidden behind tabs.

The authoritative complete package, including the final umbrella copy, both lens narratives, nine lens-local citations, internal source roles and limitations, three approved system strategies, two legacy association removals, provenance boundary, and implementation scope, is recorded in `docs/understanding-content-audit.md`.

Do not reconstruct Understanding from the older `generated/legacyData.json` claim or its former citations. In particular, the historical `PMC5789218` citation is not an Understanding source and must not be restored.

# Approval ledger

| Date | Area | Decision | Production status |
| --- | --- | --- | --- |
| 2026-08-24 | Connection | Complete content/evidence/strategy package approved | Implemented |
| 2026-08-24 | Strategy discard semantics | Global discard means deletion; need-specific rejection means association removal | Implemented |
| 2026-08-25 | Authoring method | Evolutionary function first, therapeutic meaning second | Standing rule |
| 2026-08-25 | Need magnet review | A need is only fully audited after approved content and approved production magnet; magnet is the visual completion cue | Standing rule |
| 2026-08-25 | Citation display | Public need citations show citation/title + raw URL only; internal role/limitations stay in audit docs | Standing rule |
| 2026-08-25 | Strategy source display | System cards visibly use `Supporting source ↗`; user cards show human provenance | Implemented UI rule |
| 2026-08-25 | Support | Complete content/evidence/strategy package and S1B2 Soft Terraces magnet approved | Fully audited and implemented |
| 2026-08-25 | Safety | Complete package approved; authoritative current record moved to `docs/safety-content-audit.md` | Content implemented; Layered Cover magnet approved and live |
| 2026-08-25 | Profile strategy ownership | Nat's former static strategies were migrated to the verified profile and removed from repository catalog data and references | Implemented and regression-guarded |
| 2026-08-26 | Need function lenses | Optional lenses require distinct lived function, distinct evidence, and recognition value; remain one canonical Need and render generically | Standing rule; first use is Understanding |
| 2026-08-26 | Understanding | Umbrella copy, two function lenses, nine lens-local citations, three system strategies, and two legacy association removals approved | Authorized for content implementation; magnet pending |
| 2026-08-28 | Observation Inference 2.0 | Local deterministic exploratory-matching contract, non-probabilistic explanation copy, approved fallback safeguards, shared highlight/detector model, legacy retirement, and implementation plan approved | Implemented on combined review branch; not yet merged |
| 2026-08-28 | Alexithymia Support | Complete present-moment lane, fixed-catalog roles, shared scoring, source package, and no-recommendation boundary approved | Implemented on combined review branch; browser/device validation pending |
| 2026-08-29 | Observation and Alexithymia support | Plain-language labels, internal-only surface terms, deliberate annotation activation, and non-invalidating guidance approved | Implemented on test branch; browser/device validation pending |
| 2026-10-13 | Check-in UX audit repairs | User approved the audit repair plan: explicit navigation/clearing, in-flow help and body-area discovery, tentative sentence/Journal provenance, protected personal edits, uncertainty-only handoff, recovery, search/focus, and regression coverage. No catalog, association, scoring, clinical claim, or Need-strategy changes authorized or included. | Implemented on dedicated review branch; physical iOS and first-use validation pending |
| 2026-10-14 | Check-in Observation help | User feedback identifies redundant help and lost access to the fuller Observations page. Consolidate existing guidance in the help sheet, reuse the approved concrete-action/quote example, and restore the full page as an explicitly described exit with saved-check-in return. No new psychological claim, evidence source, detector, or catalog change. | Follow-up implementation and regression verification |
| 2026-10-14 | Check-in map and Read aloud | User phone feedback authorizes a selected-point state, clearly alternative Mixed feelings/Not sure choices, a separate quieter Clear action, and a working Stop reading toggle. Mood meanings, coordinates, matching, and the device-provided voice remain unchanged. | Follow-up implementation and regression verification |
| 2026-10-14 | Compact writing tips | User authorizes a fresh follow-up after the accidental PR #184 merge and PR #185 rollback: one compact Writing tips dialog, one existing example, one Close control, and an Observations guide link labeled Leaves check-in. Existing approved concrete-writing guidance is retained without new research claims; the Observations research branch is untouched. | Dedicated review branch; leave unmerged for user review |
| 2026-10-14 | Observations, check-in, and Journal continuity | User approves the existing Alexithymia support lane as the guided Journal creation path, prefilled Observation handoff, preserved unselected suggestions with source labels, direct-writing alternative, explicit remembered entry preference, and protected unfinished drafts. User authorizes main merge and live deployment after verification. No catalog, detector, association, score, treatment claim, or strategy change. | Implemented on dedicated main-based branch; verification recorded in `docs/observation-check-in-journal.md` |
| 2026-10-14 | Observation research continuation | [52-record source register](./observation-research-current-decisions.md), four preview-source appraisals, and [complete 18-reference copy proposal](./observation-research-guide-proposal-2026-10-14.md) prepared; source and exact-copy decisions PENDING | Research documentation only; no public implementation or deployment approval |
| 2026-10-14 | Observation source and copy approval | User delegated the review/approval decision; [corrected complete 18-source package](./observation-research-guide-proposal-2026-10-14.md) approved for its exact educational claims after clinical-evidence and academic editorial review. [Approval record](./observation-research-editorial-approval-2026-10-14.md) documents corrections, source access and scope; other 34 records remain pending | Authorized for educational implementation on site-test; not yet implemented. No main merge or deployment authorization; no independent licensed-clinician sign-off or app clinical validation |
| 2026-10-14 | Observation approved-guide integration | User authorized implementation and continuation on site-test; exact approved copy, examples and 18 citation uses integrated into the canonical guide and renderer. [Implementation record](./observation-research-implementation-2026-10-14.md) documents completed validation and limits | Validated for site-test through PR #183: 330 tests, production build and six scoped Chromium cases pass. Final captures reviewed; enlarged-text overflow repaired. No production publication |
| 2026-10-14 | Observation guide production release | User subsequently authorizes integration against newer main, completion checks, merge and live deployment for phone review. Exact approved copy, 18 source uses and review limits remain unchanged. | Main-based PR #190: 366 unit tests pass; browser sweep, corrected test readiness boundaries, repeated handoff, offline checks and visual review are recorded in the [implementation record](./observation-research-implementation-2026-10-14.md). No independent licensed-clinician certification or app-effectiveness claim. |
| 2026-10-28 | Check-in Feeling descriptions | Complete 48-Feeling summary repair and nine additional-word definition review; Numb rewrite. Exact copy, citations, access limits, and scope are recorded in [Feeling descriptions review](#feeling-descriptions-review-2026-10-28). | Exact package approved 2026-10-28; canonical implementation and requested Needs/recap changes tracked in PR #194, with validation and release status below. |

## Implementation notes / handoff

- Reviewed V2 content belongs in `src/data/editorialCatalog.json`.
- `vite.config.ts` merges the reviewed editorial source with the imported snapshot and the curated static `userStrategies.json` lane at build time.
- `src/data/userStrategies.json` is the canonical registry for repository-resident published user strategies. Nat's profile-owned strategies live in D1/profile storage and must not be duplicated in repository catalog data, fixtures, migration artifacts, or static audit lists.
- Strategy provenance is explicit (`system` or `user`). Supporting-source metadata may distinguish `scholarly`, `clinical-guidance`, and `official-resource`.
- Need strategy cards visibly use `Supporting source ↗` for system sources and human contributor metadata for user strategies.
- `src/data/generated/legacyData.json` is migration evidence only for entities that do not yet have canonical ownership. Every reviewed Need in `src/data/editorialCatalog.json` must have complete entity ownership and be physically absent from the legacy `needs` array. Reverse Need references inside still-legacy-owned Feeling or Faux Feeling entities remain until those entity families migrate. Approved global discards remain barred from the live catalog.
- Function-lens content, when approved, belongs in the same canonical editorial Need record and must pass through the deterministic catalog compiler. Do not create a second runtime repair path.
- Do not revise an approved need package without a new explicit review/approval cycle.
- Understanding's next step after content deployment is its live Design Lab magnet review. Do not mark Understanding fully audited until that approved magnet is promoted.

## Honesty

**Status:** content audited and implemented 2026-08-27; redesigned magnet review pending. The authoritative current content record is `docs/honesty-content-audit.md`.

## Accountability

**Status:** fully audited. Content implemented 2026-08-27; Responsibility Mosaic (A1) magnet approved and promoted 2026-08-28. The authoritative current record is `docs/accountability-content-audit.md`.

# Feeling descriptions review, 2026-10-28

**Status: exact package explicitly approved by the user on 2026-10-28 and implemented on the dedicated review branch. Publication status and implementation checks are recorded below.**

## Review scope and result

The user requested a repair of the Calm description shown in the Alexithymia support check-in and a review of the other feeling-word descriptions for the same problem. The screenshot matches the current catalog summary for Calm.

Production baseline: `0c5b73e19f6963a0d38332aafbdfb72149fb0ce5` (main, PR #193). The review covers all **48 canonical Feeling summaries** and all **nine additional emotion-word definitions** available in this check-in, including unscored catalog words. It also checks the shared Faux Feeling explanation and the explanation attached to a user-entered word.

**Proposed changes: 48 Feeling-summary replacements and one additional-word definition replacement (Numb). Eight additional-word definitions are retained verbatim.** The shared Faux Feeling and user-word explanations need no repair for the issue raised.

Every current Feeling summary opens with a body, expression, movement, or thought script and follows with a purported function or explanation. Several individual associations may be plausible. The recurring problem is presenting these scripts as the principal description of the word, then adding mechanisms or evolutionary functions without entry-level source support. Qualifiers such as “may” do not by themselves supply that support. This is an editorial and source-to-claim judgment, not a claim that every physiological or evolutionary topic mentioned has been disproved.

Specific corrections include removing the Calm parasympathetic/integration explanation, Inspired dopamine claim, Peaceful polyvagal claim, Relieved cortisol/reset claim, and Energized metabolic-balance claim. Hurt currently describes only physical pain. In pain identifies pain with nerve signals and a location needing healing. Distressed says Needs compete, contrary to the canonical psychological model.

## Evidence and editorial decisions

1. Explain what a word ordinarily refers to before offering a research interpretation. A dictionary supports that ordinary meaning; it does not establish a neural mechanism, an evolved function, or the effectiveness of this check-in.
2. Group-level bodily associations do not establish required signs for a particular person. The within-category variability reviewed in R2 and R3 does not support treating the old scripts as diagnostic checklists. It does not make bodily observations useless.
3. Preserve the catalog as the site’s practical vocabulary. Overlapping words such as Afraid, Scared, and Frightened need not represent distinct biological categories. Anxiety and Anxious remain separate catalog entries with an explicit noun/adjective relationship.
4. Use research only for the proposition it actually supports. The new Calm and Excited entries use the low-/high-arousal distinction in R1; Loneliness, Inspiration, Pain, and Tiredness use the bounded conceptual claims assigned below. No source is used to infer an individual’s Need or tell the person what action to take.
5. Let the amount of supported information determine the length. Some words need one sentence. Do not pad them with body imagery, a ceremonial “researchers say” sentence, or a speculative adaptation story.

The proposed copy was read against `docs/human-editorial-style.md`: no em dashes, no imposed body-cue triads, no unsupported mechanism claims, no universal safety inference, and no repeated evolutionary closing formula. Ordinary definitions are editorial paraphrases rather than formal scientific definitions or clinical criteria.

## Approved implementation boundary

- Use the same approved summary on the full Feeling page and in every check-in sheet. `candidateTerm` and `catalogOnlyTerms` already read `Feeling.summary`; no check-in-only text replacement or runtime “humanizer” is proposed.
- Move the reviewed Feeling entities into `src/data/editorialCatalog.json` under one canonical Feeling owner and teach the deterministic catalog compiler to consume that owner. Preserve catalog order, slugs, titles, relationships, poem content, and other non-summary fields. Retire superseded legacy Feeling records through a deterministic migration after ownership is complete; do not hand-edit improved prose into the imported snapshot or retain shadow summary fallbacks.
- Replace only the Numb `definition` in the authored `src/data/alexithymiaSupport.json`; keep its current role, source URL, profile key, coordinates, and scoring unchanged. Regenerate its compiled asset through the existing compiler.
- Carry the per-entry source sets below with the canonical summaries so provenance cannot drift from copy. The source register specifies the exact bibliography and raw human-facing URLs for review. Public source rendering is outside this copy-only package and must not be silently added as a UI redesign. The current check-in-to-Feeling-page navigation remains the same.
- No expanded/details narrative currently exists for these Feeling summaries, and this package adds none. The final text is exactly the proposed paragraph for each entry below.
- Catalog membership stays at 48 Feelings, 67 Needs, and 56 Faux Feelings. No term is added, removed, or reclassified. No Need content, associations, body-cue map, weights, shape coordinates, matching formula, observation detector, Journal content, strategy, or user submission is changed.
- No system-strategy addition, removal, rename, rewrite, or association change is proposed. Repository-resident and profile-owned user content remain protected.
- After approval, add meaningful coverage at the compiler/data boundary for canonical Feeling ownership, complete 48-entry coverage, source ownership, and consumption of the same summary by candidate and catalog-only check-in terms. Run the foundation gate and scoped existing check-in browser cases after implementation. Do not use literal-copy snapshot tests as a substitute for scientific review.

## Source register

All source destinations were checked on 2026-10-28. Publisher/official destinations are preserved even where automated access was blocked; access notes identify whether full text, abstract, or indexed primary text was examined. A failed crawler fetch is not evidence that the human-facing URL is wrong. No generic doi.org redirects, search-result links, tracking parameters, or ChatGPT links are proposed as citations.

### Lexical references

Each Feeling entry links to its exact Merriam-Webster destination below. These references establish ordinary usage only. Definitions were read at the publisher, including the relevant emotional sense where a word has several senses. Additional linked headwords were checked when a definition was circular: terror, disappointed, resentment, boredom, hope, pride, relief, and distress. Source links are separate from the final proposed paragraph.

### R1

McManus, M. D., Nakamura, J., & Siegel, J. T. (2024). Hiding in plain sight: The distinct importance of low-arousal positive affect. Motivation and Emotion, 48, 336–422.

https://link.springer.com/article/10.1007/s11031-024-10062-5

**Claim supported:** Calm/relaxation as low-arousal positive states and excitement as higher-arousal positive affect.

**Limit:** A narrative synthesis following a systematic search, not a validated rule for identifying an individual's state. The lexical part of each entry is an editorial paraphrase.

**Access:** Publisher full text examined.

DOI identifier: `10.1007/s11031-024-10062-5`.

### R2

Siegel, E. H., et al. (2018). Emotion fingerprints or emotion populations? A meta-analytic investigation of autonomic features of emotion categories. Psychological Bulletin, 144(4), 343–393.

https://doi.apa.org/doi/10.1037/bul0000128

**Claim supported:** Variation within emotion categories and limits on identifying an emotion from an assumed autonomic pattern. Directly supports the variability sentence in Fear; also constrains editorial decisions across the review.

**Limit:** Laboratory studies in nonclinical adults do not settle every theory of emotion or establish that bodily information is useless.

**Access:** Full text examined in PMC; publisher destination resolved from the article DOI but automated publisher access failed.

DOI identifier: `10.1037/bul0000128`.

Author manuscript/full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC5876074/

### R3

Behnke, M., Kreibig, S. D., Kaczmarek, L. D., Assink, M., & Gross, J. J. (2022). Autonomic nervous system activity during positive emotions: A meta-analytic review. Emotion Review, 14(2), 132–160.

https://journals.sagepub.com/doi/full/10.1177/17540739211073084

**Claim supported:** Reviewer evidence for removing confident positive-emotion physiology explanations.

**Limit:** Differences in some measures and considerable variability do not justify replacing the old prose with a claim that no physiological differences can ever be found.

**Access:** Publisher full text examined.

DOI identifier: `10.1177/17540739211073084`.

**Reviewer evidence only.** This source constrains the repair; it is not assigned to a new public paragraph.

### R4

Hawkley, L. C., & Cacioppo, J. T. (2010). Loneliness matters: A theoretical and empirical review of consequences and mechanisms. Annals of Behavioral Medicine, 40(2), 218–227.

https://academic.oup.com/abm/article-lookup/doi/10.1007/s12160-010-9210-8

**Claim supported:** Perceived shortfall in the quantity or quality of connection; loneliness is not equivalent to being alone.

**Limit:** Only this conceptual distinction is used; the entry makes no claim about an individual's evolutionary function or health prognosis.

**Access:** PMC full text and PubMed abstract examined. Publisher link was obtained from PubMed; automated publisher access failed.

DOI identifier: `10.1007/s12160-010-9210-8`.

Author manuscript/full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC3874845/

### R5

Thrash, T. M., & Elliot, A. J. (2003). Inspiration as a psychological construct. Journal of Personality and Social Psychology, 84(4), 871–889.

https://content.apa.org/journals/psp/84/4/871

**Claim supported:** The proposed construct includes evocation, a sense of going beyond an existing possibility, and motivation. The new entry is a plain-language conceptual paraphrase.

**Limit:** The abstract supports this bounded description; it supplies no evidence for the deleted dopamine claim or a single neural explanation.

**Access:** PubMed abstract examined. Publisher link was obtained from PubMed; full text was not accessible.

DOI identifier: `10.1037/0022-3514.84.4.871`.

Verified scholarly record: https://pubmed.ncbi.nlm.nih.gov/12703654/

### R6

Raja, S. N., et al. (2020). The revised International Association for the Study of Pain definition of pain: Concepts, challenges, and compromises. Pain, 161(9), 1976–1982.

https://journals.lww.com/pain/abstract/2020/09000/the_revised_international_association_for_the.6.aspx

**Claim supported:** Pain has sensory and emotional aspects, is personal, and is not identical to nociception or a visible tissue injury.

**Limit:** This definition does not diagnose a cause or prescribe care. Emotional hurt is handled separately through the ordinary-language Hurt entry.

**Access:** PMC full text and IASP terminology page examined; publisher access returned a payment wall.

DOI identifier: `10.1097/j.pain.0000000000001939`.

Author manuscript/full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC7680716/

Official terminology: https://www.iasp-pain.org/resources/terminology/

### R7

Billones, R., Liwang, J. K., Butler, K., Graves, L., & Saligan, L. N. (2021). Dissecting the fatigue experience: A scoping review of fatigue definitions, dimensions, and measures in non-oncologic medical conditions. Brain, Behavior, & Immunity - Health, 15, 100266.

https://www.sciencedirect.com/science/article/pii/S2666354621000697

**Claim supported:** Fatigue has physical and mental dimensions; the old simple energy-store explanation is not retained.

**Limit:** The review concerns medical populations and does not establish a cause for ordinary tiredness. The entry uses a broad word meaning and does not equate tiredness with a disorder.

**Access:** PubMed abstract and indexed publisher text examined; full-text fetches were blocked.

DOI identifier: `10.1016/j.bbih.2021.100266`.

Verified scholarly record: https://pubmed.ncbi.nlm.nih.gov/34589772/

### A1

American Psychological Association. APA Dictionary of Psychology: anger.

https://dictionary.apa.org/anger

**Claim supported:** Anger can concern frustration, perceived injury, or injustice; emotion and aggression are distinguishable.

**Limit:** A lexical reference, not evidence of a dedicated anger circuit or of treatment effectiveness.

**Access:** APA's topic page and indexed dictionary entry examined.

### A2

American Psychological Association. APA Dictionary of Psychology: anxiety.

https://dictionary.apa.org/anxiety

**Claim supported:** Apprehension about a possible unwanted event; anxious is the adjective.

**Limit:** Used for meaning only; the entry does not apply diagnostic criteria or impose a sharp fear/anxiety boundary on an individual.

**Access:** Indexed primary dictionary text examined; direct fetch returned the page shell.

### A3

American Psychological Association. APA Dictionary of Psychology: sadness.

https://dictionary.apa.org/sadness

**Claim supported:** Unhappiness, commonly associated with loss, with a range of intensity.

**Limit:** A lexical description does not establish a depressive disorder or a required precipitating event.

**Access:** Indexed primary dictionary text examined; tracking parameters omitted from the citation URL.

### A4

American Psychological Association. APA Dictionary of Psychology: distress.

https://dictionary.apa.org/distress

**Claim supported:** An unpleasant emotional state whose specific quality can be unspecified or difficult to identify.

**Limit:** A broad term, not a distinct mechanism or proof of a particular Need.

**Access:** Indexed primary dictionary text examined; direct fetch returned the page shell.

### A5

American Psychological Association. APA Dictionary of Psychology: jealousy.

https://dictionary.apa.org/jealousy

**Claim supported:** The narrower relationship-threat sense of jealousy; the Merriam-Webster entry separately supports ordinary envy-related usage.

**Limit:** No partner, rival, relationship type, or cause is inferred from the person's choice of word.

**Access:** Indexed primary dictionary text examined.

## Exact proposed Feeling summaries

The current paragraph is copied verbatim from the baseline for comparison. Only the paragraph under **Proposed** is replacement site copy. **Review finding** and **Sources** are review metadata. Source identifiers resolve to the complete bibliography above; the Merriam-Webster title and URL specify the lexical reference for that entry.

Calm is first for direct comparison with the user’s screenshot. The remaining entries are alphabetical; this review order does not change the live catalog order.

### Calm

Catalog slug: `calm`.

**Current**

> Your breathing steadies, muscles soften, and thoughts move with easy clarity. Calm often arrives when your nervous system registers safety and the pace of life matches your capacity. Researchers often link this regulated state to the parasympathetic response that lets bodies recover and integrate experience.

**Proposed**

Calm describes feeling settled or at ease, with little agitation. Researchers generally group it with other quiet, pleasant states, such as relaxation.

**Review finding:** Remove the bodily triad, effortless-thought imagery, safety inference, and the unsupported parasympathetic recovery-and-integration explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *calm*: https://www.merriam-webster.com/dictionary/calm
- R1: https://link.springer.com/article/10.1007/s11031-024-10062-5

### Afraid

Catalog slug: `afraid`.

**Current**

> Your body may tighten, your pupils widen, and your heart race as adrenaline prepares you for protection or escape. This feeling can arise when something seems uncertain or unsafe. Many scientists suggest fear may have evolved to help humans detect and respond quickly to danger.

**Proposed**

Afraid means feeling fear or apprehension about something. It overlaps with scared and frightened.

**Review finding:** Remove the fixed adrenaline and pupil narrative and the generic evolutionary attribution.

**Sources:**

- Merriam-Webster.com Dictionary, *afraid*: https://www.merriam-webster.com/dictionary/afraid

### Agitated

Catalog slug: `agitated`.

**Current**

> You might feel restless energy in your limbs, shallow breathing, or an urge to move. This state may appear when your mind or environment feels unsettled. It may have evolved to signal the body to prepare for action or to restore balance.

**Proposed**

Agitated means feeling upset or unsettled.

**Review finding:** Remove the bodily script and the speculative claim that agitation evolved to restore balance.

**Sources:**

- Merriam-Webster.com Dictionary, *agitated*: https://www.merriam-webster.com/dictionary/agitated

### Alarmed

Catalog slug: `alarmed`.

**Current**

> Your heartbeat may spike suddenly, your breath catch, and your body freeze before deciding whether to flee or fight. This feeling may appear when something unexpected challenges your sense of safety. Evolutionarily, this rapid response helps orient attention toward immediate threats.

**Proposed**

Alarmed means feeling urgently concerned or frightened about a possible danger.

**Review finding:** Remove the fixed freeze-flee-fight sequence and the unsupported evolutionary attribution.

**Sources:**

- Merriam-Webster.com Dictionary, *alarmed*: https://www.merriam-webster.com/dictionary/alarmed

### Angry

Catalog slug: `angry`.

**Current**

> Heat might rise in your chest or face, your jaw may tighten, and you may feel energy building to act. Anger often appears when you perceive an obstacle to something deeply important or when a boundary feels crossed. Biologists often view anger as an evolved signal to mobilize energy toward defending fairness or protection.

**Proposed**

Anger involves displeasure about something experienced as hurtful or unfair, or about a blocked goal. Feeling angry does not by itself mean acting aggressively.

**Review finding:** Remove the bodily script and the unsupported general attribution to biologists; preserve the distinction between an emotion and behavior.

**Sources:**

- Merriam-Webster.com Dictionary, *angry*: https://www.merriam-webster.com/dictionary/angry
- A1: https://dictionary.apa.org/anger

### Antagonistic

Catalog slug: `antagonistic`.

**Current**

> You might feel your chest puff or muscles stiffen as your body prepares to assert itself. This feeling may arise when you sense opposition or threat to your viewpoint or values. Researchers often link such states to dominance and defense systems meant to establish boundaries within social groups.

**Proposed**

Antagonistic describes a feeling of opposition or dislike toward someone or something.

**Review finding:** Remove the postural script and the unsupported dominance-system explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *antagonistic*: https://www.merriam-webster.com/dictionary/antagonistic

### Anxiety

Catalog slug: `anxiety`.

**Current**

> Your stomach may flutter, muscles tense, and thoughts race through possible futures. Anxiety can surface when the unknown feels risky or when you sense you must stay alert. Scientists often believe it may have evolved to help anticipate and prevent harm before it happens.

**Proposed**

Anxiety involves apprehension or worry about possible danger or an unwanted outcome. The concern can be specific or difficult to identify.

**Review finding:** Remove the body script and the unsupported ancestral harm-prevention explanation; the description does not imply an anxiety disorder.

**Sources:**

- Merriam-Webster.com Dictionary, *anxiety*: https://www.merriam-webster.com/dictionary/anxiety
- A2: https://dictionary.apa.org/anxiety

### Anxious

Catalog slug: `anxious`.

**Current**

> You may notice tightness in your shoulders, a quickened pulse, or restlessness in your legs. This feeling may visit when uncertainty combines with concern about outcomes. It reflects the brain’s vigilance system — a useful adaptation that once helped early humans stay safe from unseen dangers.

**Proposed**

Anxious means feeling worried or apprehensive about what might happen. It is the adjective for anxiety.

**Review finding:** Remove the bodily script and ancestral vigilance story; do not invent a distinct biological category for the adjective.

**Sources:**

- Merriam-Webster.com Dictionary, *anxious*: https://www.merriam-webster.com/dictionary/anxious
- A2: https://dictionary.apa.org/anxiety

### Bewildered

Catalog slug: `bewildered`.

**Current**

> Your eyes may widen, your forehead wrinkle, and your mind pause as it struggles to make sense of conflicting signals. This feeling can arise when the world suddenly seems unfamiliar. Cognitive scientists suggest confusion encourages humans to slow down and seek new understanding.

**Proposed**

Bewildered means feeling very confused or unable to make sense of what is happening.

**Review finding:** Replace the facial and cognitive script; do not claim that bewilderment necessarily improves understanding.

**Sources:**

- Merriam-Webster.com Dictionary, *bewildered*: https://www.merriam-webster.com/dictionary/bewildered

### Confused

Catalog slug: `confused`.

**Current**

> Your thoughts may feel cloudy or circular, and your body may grow still as your mind tries to orient. Confusion can appear when information conflicts or when expectations aren’t met. It may have evolved to prompt re-evaluation, allowing flexible problem-solving.

**Proposed**

Confused means having difficulty understanding something or making sense of what is happening.

**Review finding:** Use the everyday sense; remove the bodily script and speculative evolutionary problem-solving explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *confused*: https://www.merriam-webster.com/dictionary/confused

### Contented

Catalog slug: `contented`.

**Current**

> Your breath may sink deeper and muscles let go as you register that life feels sufficiently met. Contentment arises when needs feel attended to without striving for more. Studies associate this settled satisfaction with gratitude practices that calm stress responses.

**Proposed**

Contentment is a feeling of satisfaction with how things are at the moment.

**Review finding:** Remove the bodily script, the implication that Needs are all attended to, and the unsourced gratitude-practice and stress-response claim.

**Sources:**

- Merriam-Webster.com Dictionary, *contented*: https://www.merriam-webster.com/dictionary/contented

### Defiant

Catalog slug: `defiant`.

**Current**

> Your spine may straighten and your chest expand as energy gathers to resist control. This feeling may appear when autonomy or dignity feels threatened. Psychologists often view defiance as an adaptive impulse to preserve agency and self-direction.

**Proposed**

Defiant describes feeling resistant to a demand or to someone trying to direct you. It can involve an urge to refuse or push back.

**Review finding:** Remove the postural script and the unsupported general claim that defiance is adaptive; the feeling does not justify any particular behavior.

**Sources:**

- Merriam-Webster.com Dictionary, *defiant*: https://www.merriam-webster.com/dictionary/defiant

### Desperation

Catalog slug: `desperation`.

**Current**

> You may notice shallow breathing, trembling, or frantic energy as your body seeks a way out. This feeling can arise when options seem few and survival feels uncertain. Biologically, such intensity pushes organisms to take immediate action to restore safety.

**Proposed**

Desperation describes severe distress when there seems to be little hope of a way out. It can include an urgent wish for things to change.

**Review finding:** Remove the body script and the unsupported claim that biological intensity requires immediate safety-restoring action.

**Sources:**

- Merriam-Webster.com Dictionary, *desperation*: https://www.merriam-webster.com/dictionary/desperation

### Disappointment

Catalog slug: `disappointment`.

**Current**

> Your shoulders might drop, your face soften, and energy leave your body. This feeling visits when hopes or expectations go unmet. Scientists suggest it may have evolved to help people pause and reassess goals after unmet outcomes.

**Proposed**

Disappointment is the displeasure or sadness felt when a hoped-for or expected outcome does not happen.

**Review finding:** Remove the bodily script and the unsupported adaptation story.

**Sources:**

- Merriam-Webster.com Dictionary, *disappointed*: https://www.merriam-webster.com/dictionary/disappointed

### Distressed

Catalog slug: `distressed`.

**Current**

> Your breathing may quicken, your face tighten, or your chest feel heavy. This feeling can arise when multiple needs compete or when uncertainty feels unmanageable. The human stress response may have evolved to mobilize resources for coping or seeking support.

**Proposed**

Distress is emotional discomfort or suffering. The word can describe a mixture of unpleasant feelings without naming one specific emotion.

**Review finding:** Remove the bodily script, unsupported stress-function story, and the model-inconsistent statement that Needs compete.

**Sources:**

- Merriam-Webster.com Dictionary, *distress*: https://www.merriam-webster.com/dictionary/distress
- A4: https://dictionary.apa.org/distress

### Embarrassed

Catalog slug: `embarrassed`.

**Current**

> You may feel warmth rise to your face, look down, or avoid eye contact. This feeling occurs when you believe others see you in a way you didn’t intend. Social scientists find embarrassment may have evolved to repair trust by signaling awareness of social norms.

**Proposed**

Embarrassment is feeling self-conscious or awkward about how you appear to other people. It can follow unwanted attention or a perceived social mistake.

**Review finding:** Remove the facial and gaze script and the unsupported general claim that embarrassment evolved to repair trust.

**Sources:**

- Merriam-Webster.com Dictionary, *embarrassed*: https://www.merriam-webster.com/dictionary/embarrassed

### Energized

Catalog slug: `energized`.

**Current**

> Muscles can feel ready and responsive when energy surges through your system. Feeling energized often follows meaningful rest, nourishment, or inspiration. Researchers connect it with metabolic balance that supports sustained focus and movement.

**Proposed**

Energized means feeling lively or having energy available for activity.

**Review finding:** Remove the muscular imagery, assumed causes, and the unsupported metabolic-balance and sustained-focus explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *energized*: https://www.merriam-webster.com/dictionary/energized

### Enraged

Catalog slug: `enraged`.

**Current**

> You might feel heat surge, muscles clench, and vision narrow. This intense state often follows perceived injustice or harm. From an evolutionary view, rage focuses all energy on removing immediate threats or restoring violated boundaries.

**Proposed**

Enraged means intensely angry or furious.

**Review finding:** Remove the bodily script and the claim that rage directs all energy toward removing threats.

**Sources:**

- Merriam-Webster.com Dictionary, *enraged*: https://www.merriam-webster.com/dictionary/enraged

### Excited

Catalog slug: `excited`.

**Current**

> Your pulse may quicken and attention sharpen as anticipation builds. Excitement surfaces when a valued event draws near or fresh challenges invite engagement. Psychologists describe it as high-arousal energy that prepares the body for purposeful action.

**Proposed**

Excitement is a state of heightened enthusiasm or eager anticipation. It usually involves more emotional activation than calm or relaxation.

**Review finding:** Remove the pulse and attention script and the claim that this state prepares the body for purposeful action.

**Sources:**

- Merriam-Webster.com Dictionary, *excited*: https://www.merriam-webster.com/dictionary/excited
- R1: https://link.springer.com/article/10.1007/s11031-024-10062-5

### Fear

Catalog slug: `fear`.

**Current**

> Your heartbeat accelerates, palms sweat, and you may instinctively scan your surroundings. This feeling surfaces when safety seems at risk. Evolutionarily, fear’s quick activation of the fight–flight system has been essential for survival.

**Proposed**

Fear is an unpleasant feeling related to perceived danger or harm. Its bodily expression varies with the person and situation.

**Review finding:** Remove the fixed heart-rate and sweating script and the identification of conscious fear with one fight-or-flight system.

**Sources:**

- Merriam-Webster.com Dictionary, *fear*: https://www.merriam-webster.com/dictionary/fear
- R2: https://doi.apa.org/doi/10.1037/bul0000128

### Frightened

Catalog slug: `frightened`.

**Current**

> You may feel frozen, breathless, or small in your body. This state may arise when a danger feels overwhelming. The freeze response is an ancient mammalian defense meant to increase survival when escape seems impossible.

**Proposed**

Frightened means feeling afraid in response to something perceived as threatening. It overlaps with scared and afraid.

**Review finding:** Do not equate this everyday word with a particular defensive response or an inability to escape.

**Sources:**

- Merriam-Webster.com Dictionary, *frightened*: https://www.merriam-webster.com/dictionary/frightened

### Frustrated

Catalog slug: `frustrated`.

**Current**

> Your jaw may tighten, brows knit, and energy surge as effort meets resistance. Frustration often arrives when repeated attempts don't land the outcome you imagined. Researchers often view it as a signal to pause, adjust strategy, or seek collaboration before energy is depleted.

**Proposed**

Frustration is the unpleasant feeling associated with an obstacle to a goal or an effort that is not producing the intended result.

**Review finding:** Remove the body script and the implied advice to pause, collaborate, or change strategy.

**Sources:**

- Merriam-Webster.com Dictionary, *frustrated*: https://www.merriam-webster.com/dictionary/frustrated

### Helpless

Catalog slug: `helpless`.

**Current**

> Your body may feel heavy, your movements slow, and your energy drained. This feeling may come when repeated effort fails to bring change. Researchers often see helplessness as a signal to conserve energy until new strategies or support appear.

**Proposed**

Helpless describes feeling unable to deal with a situation or change it through your own actions.

**Review finding:** Remove the bodily script and the unsupported claim that helplessness signals energy conservation; do not infer a history of failed efforts.

**Sources:**

- Merriam-Webster.com Dictionary, *helpless*: https://www.merriam-webster.com/dictionary/helpless

### Hopeful

Catalog slug: `hopeful`.

**Current**

> Your gaze may brighten as you glimpse pathways toward what matters. Hope grows when resources, support, or possibilities seem within reach. Researchers describe it as a forward-looking motivation system that helps people persist through uncertainty.

**Proposed**

Hopeful means wanting a positive outcome and seeing it as possible. The outcome can still be uncertain.

**Review finding:** Remove the gaze imagery, assumed access to resources, and the reduction of hope to one motivation system.

**Sources:**

- Merriam-Webster.com Dictionary, *hope*: https://www.merriam-webster.com/dictionary/hope

### Hostile

Catalog slug: `hostile`.

**Current**

> You might sense tension in your jaw or shoulders, with thoughts focused on opposition. This feeling surfaces when you perceive someone as adversarial or unsafe. It may have evolved to protect social standing and resources within groups.

**Proposed**

Hostile describes strong unfriendliness or ill will toward someone or something. It can include feeling opposed to them.

**Review finding:** Remove the bodily script and the unsupported social-standing and resource-defense adaptation claim.

**Sources:**

- Merriam-Webster.com Dictionary, *hostile*: https://www.merriam-webster.com/dictionary/hostile

### Hurt

Catalog slug: `hurt`.

**Current**

> You may feel sharp, throbbing, or dull sensations signaling that a part of you needs care. Pain can focus attention where healing or rest is required. The capacity to feel physical pain is widely viewed as a universal adaptation protecting organisms from further harm.

**Proposed**

Hurt can mean emotional pain, including feeling wounded by someone's words or actions. The word is also used for physical pain.

**Review finding:** The current entry reduces hurt to physical pain and adds an uncited universal adaptation claim.

**Sources:**

- Merriam-Webster.com Dictionary, *hurt*: https://www.merriam-webster.com/dictionary/hurt

### Impotent

Catalog slug: `impotent`.

**Current**

> You may feel your limbs heavy, your chest sunken, and energy withdrawn inward. This feeling may appear when you sense no power to influence events. It may have evolved to conserve resources when immediate action cannot change the outcome.

**Proposed**

Here, impotent means feeling unable to affect a situation or accomplish what you intend.

**Review finding:** Use the existing nonsexual, everyday sense of lacking power; remove the bodily script and energy-conservation adaptation claim.

**Sources:**

- Merriam-Webster.com Dictionary, *impotent*: https://www.merriam-webster.com/dictionary/impotent

### In pain

Catalog slug: `in-pain`.

**Current**

> Your body’s nerve signals draw focus to a specific spot that needs attention or healing. Pain may bring tears, tension, or stillness. Universally, it may have evolved to protect the body from further harm and prompt restoration.

**Proposed**

Pain is an unpleasant experience involving sensation and emotion. It can occur without a visible injury.

**Review finding:** Correct the identification of pain with nerve signals and a location that requires healing; remove the universal adaptation claim.

**Sources:**

- Merriam-Webster.com Dictionary, *pain*: https://www.merriam-webster.com/dictionary/pain
- R6: https://journals.lww.com/pain/abstract/2020/09000/the_revised_international_association_for_the.6.aspx

### Inspired

Catalog slug: `inspired`.

**Current**

> Your eyes may widen and posture lift as fresh ideas gather momentum. Inspiration surfaces when something resonates with your values and reveals new possibilities. Neuroscientists note this spark often rides dopamine pathways that fuel curiosity and creative exploration.

**Proposed**

Inspiration involves a sense of new possibility and motivation to act on it. It may be prompted by an idea or by something encountered.

**Review finding:** Remove the bodily script and the unsupported dopamine-pathway explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *inspiration*: https://www.merriam-webster.com/dictionary/inspiration
- R5: https://content.apa.org/journals/psp/84/4/871

### Irritated

Catalog slug: `irritated`.

**Current**

> You might feel heat behind your eyes or tension around your mouth. Irritation tends to arise from repeated small frustrations or overstimulation. Scientists view it as a mild activation of the same defensive systems that produce anger.

**Proposed**

Irritated means feeling annoyed or bothered, including when something repeatedly frustrates you.

**Review finding:** Remove the bodily script and the unsupported claim that this is a specified defensive-system activation.

**Sources:**

- Merriam-Webster.com Dictionary, *irritated*: https://www.merriam-webster.com/dictionary/irritated

### Jealous

Catalog slug: `jealous`.

**Current**

> You may feel tightness in the chest or stomach, and your attention may fixate on a valued bond or resource. This feeling surfaces when something precious feels threatened by loss to another. Evolutionary psychologists often describe jealousy as a mechanism to protect attachment and investment in relationships.

**Proposed**

Jealousy can involve distress about a valued relationship seeming threatened by someone else. In everyday use, jealous can also mean wanting an advantage someone else has.

**Review finding:** Remove the bodily script and the uncited evolutionary relationship-protection explanation; keep ordinary usage distinct from the narrower relationship sense.

**Sources:**

- Merriam-Webster.com Dictionary, *jealous*: https://www.merriam-webster.com/dictionary/jealous
- A5: https://dictionary.apa.org/jealousy

### Joyful

Catalog slug: `joyful`.

**Current**

> A smile may spread quickly and energy dance through your body when joy bursts forth. Joy often blooms in moments of connection, play, or meaning shared with others. Social scientists view it as a bonding emotion that reinforces cooperative relationships.

**Proposed**

Joyful means feeling joy, or strong happiness and delight.

**Review finding:** Remove the poetic movement and blooming imagery and the unsupported reduction of joy to social bonding.

**Sources:**

- Merriam-Webster.com Dictionary, *joyful*: https://www.merriam-webster.com/dictionary/joyful

### Lonely

Catalog slug: `lonely`.

**Current**

> Your body may ache for touch or warmth, your chest feel hollow, and your mind turn toward memories of connection. This feeling may appear when social bonds feel absent. Research suggests loneliness may have evolved as a signal motivating humans to reconnect with others for mutual survival.

**Proposed**

Loneliness is distress about having less connection, or less satisfying connection, than you want. It can occur while alone or in other people's company.

**Review finding:** Replace the imagined bodily ache and the adaptation claim with the distinction between perceived connection and being alone.

**Sources:**

- Merriam-Webster.com Dictionary, *lonely*: https://www.merriam-webster.com/dictionary/lonely
- R4: https://academic.oup.com/abm/article-lookup/doi/10.1007/s12160-010-9210-8

### Overwhelmed

Catalog slug: `overwhelmed`.

**Current**

> You may notice shallow breathing, mental fog, or the impulse to withdraw. This feeling may arise when demands exceed what your system can process. It may have evolved as a signal to pause, rest, or seek help before depletion.

**Proposed**

Overwhelmed describes feeling that the intensity of an experience, or what it asks of you, is more than you can manage.

**Review finding:** Remove the body script and the adaptation claim that also implies rest or help as a prescribed response.

**Sources:**

- Merriam-Webster.com Dictionary, *overwhelmed*: https://www.merriam-webster.com/dictionary/overwhelmed

### Peaceful

Catalog slug: `peaceful`.

**Current**

> Your face softens and attention widens when conflicts quiet and surroundings feel safe. Peacefulness appears as competing demands settle and harmony feels possible. Polyvagal research connects it with social engagement states that let people rest and relate.

**Proposed**

Peaceful describes a sense of inner quiet or freedom from agitation. It overlaps with calm and relaxed.

**Review finding:** Remove the bodily script, the inference of environmental safety, and the unsourced polyvagal explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *peaceful*: https://www.merriam-webster.com/dictionary/peaceful

### Playful

Catalog slug: `playful`.

**Current**

> You might feel quick, inventive movements and a spark of mischief when playfulness arrives. This feeling may show up when the environment feels safe enough to experiment and improvise. Biologists note that mammals use play to learn skills and deepen trust.

**Proposed**

Playful means feeling inclined toward play or a lighthearted way of interacting.

**Review finding:** Remove the movement script, the requirement of felt safety, and the cross-species learning-and-trust generalization.

**Sources:**

- Merriam-Webster.com Dictionary, *playful*: https://www.merriam-webster.com/dictionary/playful

### Powerless

Catalog slug: `powerless`.

**Current**

> You might feel tension drain from your muscles and a sense of collapse in your posture. This feeling may come when outcomes seem beyond your control. Scientists suggest it may have evolved to prevent futile effort and redirect focus toward achievable goals.

**Proposed**

Powerless describes a sense of having little or no influence over what happens.

**Review finding:** Remove the collapse script and the unsupported claim that powerlessness prevents futile effort.

**Sources:**

- Merriam-Webster.com Dictionary, *powerless*: https://www.merriam-webster.com/dictionary/powerless

### Proud

Catalog slug: `proud`.

**Current**

> Your chest may rise and shoulders open as you recognize meaningful effort bearing fruit. Pride appears when achievements align with your values and are witnessed by yourself or others. Psychologists link it to a sense of competence that strengthens bonds within communities.

**Proposed**

Proud describes pleasure or satisfaction in an achievement or a valued aspect of yourself. It can also refer to pride in someone else.

**Review finding:** Remove the postural script, the requirement that achievements align with values, and the unsupported community-bonding claim.

**Sources:**

- Merriam-Webster.com Dictionary, *pride*: https://www.merriam-webster.com/dictionary/pride

### Relaxed

Catalog slug: `relaxed`.

**Current**

> Your limbs may feel pleasantly heavy as your nervous system shifts out of high alert. Relaxation grows when you have enough time, space, and permission to unwind. Researchers associate it with parasympathetic activation that aids digestion and repair.

**Proposed**

Relaxed means feeling at ease or under less strain. It can refer to mental ease as well as reduced physical tension.

**Review finding:** Remove the body script and the broad parasympathetic, digestion, and repair mechanism; reduced tension remains a possible meaning, not a required sign.

**Sources:**

- Merriam-Webster.com Dictionary, *relaxed*: https://www.merriam-webster.com/dictionary/relaxed

### Relieved

Catalog slug: `relieved`.

**Current**

> You may feel a long exhale and loosened muscles after strain eases. Relief arrives when a feared outcome passes or support appears in time. Physiologists observe cortisol levels drop during this release, allowing the body to reset.

**Proposed**

Relief is the easing of distress or discomfort when something unwanted ends, lessens, or does not happen.

**Review finding:** Remove the bodily script and the unsupported cortisol-drop and body-reset claim.

**Sources:**

- Merriam-Webster.com Dictionary, *relief*: https://www.merriam-webster.com/dictionary/relief

### Resentful

Catalog slug: `resentful`.

**Current**

> You may feel tightness in your chest and replay thoughts of unfairness. This feeling may build when past actions still feel unresolved. Researchers often view resentment as an emotional reminder to address unmet needs for fairness or acknowledgment.

**Proposed**

Resentment is lingering bitterness or anger about something experienced as hurtful or unfair.

**Review finding:** Remove the bodily script and the claim that resentment identifies particular unmet Needs.

**Sources:**

- Merriam-Webster.com Dictionary, *resentment*: https://www.merriam-webster.com/dictionary/resentment

### Sad

Catalog slug: `sad`.

**Current**

> You might feel tears welling, shoulders drooping, and energy drawing inward. Sadness appears when something meaningful feels lost. Many scientists suggest it may have evolved to slow us down and invite reflection or social comfort.

**Proposed**

Sadness is an unhappy or sorrowful feeling, often associated with loss or disappointment. Its intensity can range from mild to severe.

**Review finding:** Remove the bodily triad and the uncited evolutionary account.

**Sources:**

- Merriam-Webster.com Dictionary, *sad*: https://www.merriam-webster.com/dictionary/sad
- A3: https://dictionary.apa.org/sadness

### Scared

Catalog slug: `scared`.

**Current**

> Your breath may quicken, your muscles tense, and you may instinctively seek closeness or escape. This feeling may arise when danger feels near. It is part of a deeply conserved biological system designed to protect from harm.

**Proposed**

Scared is an everyday word for feeling fear. People also use afraid and frightened for similar experiences.

**Review finding:** Remove the prescribed body and action pattern and the single-system biological explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *scared*: https://www.merriam-webster.com/dictionary/scared

### Tense

Catalog slug: `tense`.

**Current**

> You may feel your neck or back tighten, jaw clench, and breath stay shallow. Tension shows the body’s effort to hold itself ready under stress. Physiology suggests it’s a short-term survival mechanism that becomes uncomfortable when prolonged.

**Proposed**

Tense means feeling strained or on edge, as when waiting anxiously for something to happen.

**Review finding:** Keep the ordinary sense of strain without presenting a particular muscle and breathing pattern or a survival mechanism.

**Sources:**

- Merriam-Webster.com Dictionary, *tense*: https://www.merriam-webster.com/dictionary/tense

### Terrified

Catalog slug: `terrified`.

**Current**

> You might freeze completely, feel your heart pounding, or lose awareness of your surroundings. This feeling may arise when fear overwhelms capacity to act. Evolutionarily, the freeze response can reduce detection by predators and conserve energy.

**Proposed**

Terrified is a word for intense fear or terror.

**Review finding:** Remove the required-looking freeze narrative and the unsupported predator-detection and energy-conservation explanation.

**Sources:**

- Merriam-Webster.com Dictionary, *terror*: https://www.merriam-webster.com/dictionary/terror

### Thwarted

Catalog slug: `thwarted`.

**Current**

> Your body may lurch forward while something blocks progress, leaving lingering agitation. This feeling may come when effort meets resistance. It may have evolved to motivate persistence or creative problem-solving until the goal is met.

**Proposed**

Thwarted describes the feeling that an intended action or goal has been blocked.

**Review finding:** Remove the bodily script and the claim that this state evolved to ensure persistence or creative problem-solving.

**Sources:**

- Merriam-Webster.com Dictionary, *thwarted*: https://www.merriam-webster.com/dictionary/thwarted

### Tired

Catalog slug: `tired`.

**Current**

> You may feel heaviness in your eyelids, slower thoughts, or a pull toward stillness. Fatigue arises when energy stores are low or overstimulation persists. Rest and sleep needs may have evolved to maintain cellular repair and cognitive clarity.

**Proposed**

Tired means feeling fatigued or short of energy. Tiredness can be physical or mental.

**Review finding:** Remove the body script, the simple energy-store explanation, and the adaptation claim about repair and clarity.

**Sources:**

- Merriam-Webster.com Dictionary, *tired*: https://www.merriam-webster.com/dictionary/tired
- R7: https://www.sciencedirect.com/science/article/pii/S2666354621000697

### Upset

Catalog slug: `upset`.

**Current**

> You might feel an unsettled stomach, tight chest, or sudden tears. This feeling may emerge when emotions conflict or expectations clash with reality. It reflects the body’s signal that care and recalibration are needed.

**Proposed**

Upset is a broad word for emotional distress. It can describe sadness or anger, including feelings that are difficult to name more precisely.

**Review finding:** Remove the bodily script and the unsupported claim that the body is signaling a need for recalibration.

**Sources:**

- Merriam-Webster.com Dictionary, *upset*: https://www.merriam-webster.com/dictionary/upset
- A4: https://dictionary.apa.org/distress

## Exact additional emotion-word definitions

All nine are lane-local Other emotion words, not new canonical Feelings. Their existing definitions are lexical descriptions and do not contain the body-script/mechanism pattern. Numb is the one clarity edit: “hard to reach” is replaced with a direct description of reduced emotional feeling. The other eight proposed definitions equal production exactly.

### Bored (Other emotion word)

Profile key: `bored`.

**Current**

> Feeling uninterested or not mentally engaged.

**Retain verbatim**

Feeling uninterested or not mentally engaged.

**Lexical source:** https://www.merriam-webster.com/dictionary/bored

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

### Determined (Other emotion word)

Profile key: `determined`.

**Current**

> Feeling firmly resolved to keep moving toward something.

**Retain verbatim**

Feeling firmly resolved to keep moving toward something.

**Lexical source:** https://www.merriam-webster.com/dictionary/determined

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

### Disgust (Other emotion word)

Profile key: `disgust`.

**Current**

> A strong feeling of aversion or revulsion.

**Retain verbatim**

A strong feeling of aversion or revulsion.

**Lexical source:** https://www.merriam-webster.com/dictionary/disgust

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

### Gratitude (Other emotion word)

Profile key: `gratitude`.

**Current**

> Appreciation for something received or valued.

**Retain verbatim**

Appreciation for something received or valued.

**Lexical source:** https://www.merriam-webster.com/dictionary/gratitude

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

### Grief (Other emotion word)

Profile key: `grief`.

**Current**

> Sorrow connected with loss.

**Retain verbatim**

Sorrow connected with loss.

**Lexical source:** https://www.merriam-webster.com/dictionary/grief

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

### Guilt (Other emotion word)

Profile key: `guilt`.

**Current**

> Distress about something a person believes they did or failed to do.

**Retain verbatim**

Distress about something a person believes they did or failed to do.

**Lexical source:** https://www.merriam-webster.com/dictionary/guilt

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

### Numb (Other emotion word)

Profile key: `numb`.

**Current**

> Feeling emotionally blunted, distant, or hard to reach.

**Proposed**

Feeling little or no emotion.

**Lexical source:** https://www.merriam-webster.com/dictionary/numb

**Review finding:** The emotional sense of numb is retained; no trauma mechanism, diagnosis, trigger, or physical-sensation requirement is inferred.

### Shame (Other emotion word)

Profile key: `shame`.

**Current**

> Painful self-consciousness about oneself.

**Retain verbatim**

Painful self-consciousness about oneself.

**Lexical source:** https://www.merriam-webster.com/dictionary/shame

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

### Stress (Other emotion word)

Profile key: `stress`.

**Current**

> Feeling taxed or strained by demands.

**Retain verbatim**

Feeling taxed or strained by demands.

**Lexical source:** https://www.merriam-webster.com/dictionary/stress

**Review finding:** The current wording is a bounded ordinary-language description. Retaining it makes no mechanistic or treatment claim.

## Other term explanations checked

**Shared Faux Feeling text, retained verbatim**

> In allneeds, “[term]” is a Faux Feeling: a word that may combine an emotion with an interpretation of what happened. That label does not mean the event was unreal.

This is explicitly the site’s framework explanation, not a finding that an event was unreal or that a specific emotion has been detected. All 56 catalog terms continue to use it without relationship changes.

**User-entered word explanation, retained verbatim**

> A word you entered for this moment. It stays with this check-in and is not added to the site’s Feeling list.

This describes existing product behavior and does not interpret or rewrite the person’s chosen word.

## Preapproval verification and approval state

- Inventory check: every one of the 48 current Feeling slugs has exactly one replacement; none is missing or extra. All nine lane-local definitions are included, with eight exact retentions and one rewrite.
- Source-to-claim check: lexical meaning, bounded conceptual research, and reviewer-only physiological evidence are distinguished. Source access limitations are recorded above. The removed mechanisms are not retained as implied advice or speculative explanations.
- Model check: no new description makes a Feeling prove a Need, frames Needs as competing, or prescribes an action. Catalog roles and relationships are preserved.
- Editorial check: proposed paragraphs contain no em dashes or body-script triads. No generic biological, neurological, or evolutionary closing sentence was added to fill space.
- Baseline foundation verification on the source commit: `pnpm check` passed, including TypeScript, all **372 tests in 68 files**, production build, and production-asset verification. These checks verify the repository baseline, not scientific validity or an unimplemented UI. No new behavior tests were added for this documentation-only proposal.
- At the preapproval checkpoint, the branch changed only `docs/content-evidence-review.md`, the protocol’s express preapproval exception. The following implementation record supersedes that checkpoint after user approval.
- Implementation approval: **APPROVED 2026-10-28**. The user explicitly approved the package, covering the exact 48 summaries, the Numb replacement, eight retained definitions, associated source sets and limitations, and the canonical migration boundary. They also explicitly requested the dedicated Needs step and final-recap repair described below.


## 2026-10-28 implementation and additional check-in approval

The user approved the complete description package and requested two additional interaction repairs: give Needs their own skippable step before the sentence builder, populated from the existing Feeling-to-Need cross-references for Feelings marked Fits; and make the final page show the person's existing choices without apparent Feeling-prioritization controls. This explicit instruction supersedes the older four-stage layout and the restriction on displaying Feeling-linked Need possibilities. It does not authorize automatic Need selection or new associations.

### Canonical content implementation

- All 48 approved paragraphs and their source sets now belong to complete canonical Feeling entities in `editorialCatalog.json`. The shared `compileFeelingCatalog.mjs` owner serves the runtime catalog, Alexithymia candidate validation, and Observation lexicon validation. The superseded legacy Feeling array is empty.
- The migration preserves catalog order, titles, slugs, all 528 forward Feeling-to-Need links, Faux Feeling references, body signals, and poem wording. One inherited poem URL for Thwarted had `utm_source=chatgpt.com`; only that tracking parameter was removed, preserving the same human-facing poem destination.
- Numb uses the exact approved definition, and its generated runtime asset comes from the existing compiler. Coordinates, clue weights, catalog roles, and matching formulas are unchanged.
- The Observation lexicon generated output remains byte-identical. Its existing local retrieval vocabulary consumes the revised summaries, so broad suggestion ordering can change without changing a detector, formula, or authored relationship. Regression coverage checks the actual relationship invariant rather than the incidental previous top-four inclusion of Tired for “I need rest.” No legacy prose is retained as a hidden retrieval fallback.

### Needs stage and final recap

- The five stages are What happened, Clues, Words, Needs, and Your words. Step four opens immediately with Possible Needs, naming the canonical Feelings marked Fits that supply each link. Shared Needs appear once, in alphabetical order. Intensity does not rank Needs.
- Only canonical Feelings with existing links supply these suggestions. Maybe, Not this time, Faux Feelings, custom words, and the nine unbridged emotion words do not acquire inferred relationships. The person can still select any Need using Add Needs. Observation-derived suggestions retain their separate source labels.
- A suggestion is never a selection. Continue and Skip preserve explicit choices, and the statement and Journal use only the selected Need slugs. Changing Feeling choices updates suggestions without deleting a Need the person already chose.
- The final page is headed Your check-in. It shows Feeling words with Fits/Maybe and existing intensities in a quiet read-only list. The old reordering handler, arrow controls, row-level removals, and obsolete styles are deleted. Edit feelings returns to Words; Edit Needs returns to the Needs step.
- Personal sentence edits retain the existing protection and replacement preview. Existing v2 final-page drafts migrate once to step five under schema v3, retaining identity, choices, ratings, source context, and personal text. Earlier steps keep their positions. A failed migration write still permits viewing the saved work.

### PR #194 validation and publication

- `pnpm check` passes: TypeScript, **380 tests in 69 files**, deterministic generated-data checks, production build, and production-asset verification. The Observation lexicon remains byte-identical (`24a3d7a75bca`). `git diff --check` passes.
- A separate migration comparison verifies exact approved summary text for all 48 Feelings, the exact Numb sentence with no other candidate-data changes, all 528 Feeling-to-Need links, and unchanged Feeling identities, Faux Feeling links, and body signals.
- **84 check-in browser cases pass on the final implementation**, covering the four new Needs/recap cases and existing check-in, chooser, selection, keyboard, observation handoff, and Journal flows. The new cases cover 390px, 1280px, 320px with doubled text, explicit selection versus suggestions, shared-Need deduplication, full-catalog additions, skipping, read-only ratings, personal sentence protection, history, and reload.
- Reviewed captures show the separate Needs step and quiet recap on phone and desktop. Large-text testing found and repaired fixed-footer obstruction: the check-in scroller reserves space for its fixed controls, and the compact Continue action fits beside Skip. Edit feelings and Edit Needs are secondary text actions.
- The wider 199-case browser sweep exposed old four-stage navigation assumptions, which were updated. An unrelated Journal test incorrectly compared a local date-time with a UTC calendar-date substring; this failure was reproduced on unchanged main, and the assertion now compares the correct browser-local-to-UTC conversion without changing Journal behavior. A subsequent four-worker sweep encountered browser-session closures, route/catalog timeouts, and a 250ms route-budget failure under load. Serial confirmations and offline recovery results are recorded in PR #194; the parallel attempt is not represented as a clean full-suite pass.
- Browser checks use **Chromium 153.0.8010.0** supplied outside the repository after the bundled Chromium 151 download returned a truncated archive. No dependency, lockfile, or project browser configuration was changed for this environment workaround. Native iOS Safari and VoiceOver verification are not claimed.

The approved implementation follows the normal branch/PR workflow in [PR #194](https://github.com/natanai/allneeds/pull/194). That PR records final confirmation, merge, and deployment status.

The subsequent user-requested magnet recap replaces the plain Feeling list with the existing shared `MagnetBoard`; its current presentation contract is recorded in [the design language](./design-language.md#alexithymia-support-check-in). It retains the recorded choices and intensities, uses the existing read-only description preview, and does not alter this approved content package. Follow-up verification and release are recorded in that implementation's PR.
