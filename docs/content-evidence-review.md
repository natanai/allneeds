# Content Evidence & Editorial Review Protocol

> Status: living document. Start here before changing explanatory, psychological, behavioral, health, strategy, or research-facing copy in allneeds.
>
> Last updated: 2026-08-26.

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

**Status:** content audited and implemented 2026-08-27; redesigned magnet review pending. The authoritative current content record is `docs/accountability-content-audit.md`.
