# Content Evidence & Editorial Review Protocol

> Status: living document. Start here before changing explanatory, psychological, behavioral, health, strategy, or research-facing copy in allneeds.
>
> Last updated: 2026-08-25.

## Purpose

allneeds should be clear, humane, clinically careful, and evidence-aligned without presenting theory, interpretation, or value judgments as settled empirical fact. Content review is intentionally slow and claim-level. This is not a mandate for a site-wide rewrite.

The goal is to preserve good existing language, strengthen sourcing where needed, qualify claims to match the evidence, and make only changes the user has explicitly reviewed and approved.

A central editorial goal is to help readers understand why a need-related motivation may exist and what function it may serve. Especially when a motivation is uncomfortable, the copy should make it easier to recognize that tending the need in oneself or responding to it in others can be intelligible and functional rather than something to suppress automatically. This effect should come from accurate evolutionary, anthropological, developmental, motivational, clinical, or other relevant scholarship, not from sentimental reassurance or unsupported claims that every present-day impulse is adaptive.

## Non-negotiable workflow for content changes

1. **Retrieve the exact current production copy first.** Do not rewrite from memory or from a paraphrase in conversation.
2. **Identify the canonical content source before editing.** The imported `src/data/generated/legacyData.json` snapshot is not automatically the current editorial authoring surface. Reviewed V2 editorial changes belong in `src/data/editorialCatalog.json`, which is merged with the imported snapshot at build time.
3. **Audit one small unit at a time**, usually one need, feeling, strategy, section, or a few closely related sentences.
4. For each sentence, distinguish among definition/framework language, empirical description, causal claim, association, theoretical interpretation, clinical guidance, and editorial/value framing.
5. **Check source-to-claim fit.** A citation must support the particular proposition being made, not merely concern the same broad topic.
6. Prefer the smallest edit that makes the claim accurate. Do not rewrite surrounding copy merely for stylistic consistency unless the user asks for it.
7. **Present proposed copy, strategy changes, and evidence to the user before changing site content.**
8. Only after approval, change the canonical source, regenerate or materialize derived data if required, and update this document in the same PR.
9. Verify links/citations, generated-data integrity, and relevant repository checks. Do not claim validation that was not run.
10. After the content package is approved, **separately reconsider the need magnet's visual identity** before calling the need audit fully complete. Content approval does not authorize visual changes.

### Explicit user approval gate

For research-facing content work, no repository change may be made until the user has explicitly approved the complete content package under discussion. Approval must cover:

- the final citation set;
- a human-reachable verification URL for every citation;
- what each citation is being used to support;
- the short/main description;
- the expanded/details description;
- all proposed system-strategy additions, removals, renames, rewrites, or need associations;
- the strategy evidence or official-resource provenance;
- the intended implementation scope.

The sole exception is **this document, `docs/content-evidence-review.md`**, which the user has explicitly authorized to be updated during the review process so future agents can recover the current specifications and approval state.

Research, drafting, source checking, and discussion must otherwise remain read-only until the user gives explicit package approval. Do not create or merge production content branches, PRs, production data changes, copy changes, or strategy changes merely because a proposed change appears safe or helpful.

## Need-description authoring method: evolutionary function first, therapeutic meaning second

Future need audits should not treat evolutionary framing as decorative context added after modern psychological copy has already been written. It should be part of the reasoning process from the beginning.

1. **Start with the recurrent problem.** Ask what recurring problem in human life the motivation may plausibly have helped individuals or groups manage: danger, resource uncertainty, caregiving, coordination, social exclusion, information gaps, energy limits, reproduction, learning, environmental navigation, or another recurring demand.
2. **Look for direct evolutionary or anthropological scholarship.** Prefer research that actually discusses the natural history, selection pressures, comparative evidence, human behavioral ecology, life history, or evolved psychology relevant to the need. Do not infer an evolutionary mechanism merely because a modern outcome is beneficial.
3. **Identify the motivational bridge.** Ask what the need plausibly moves a person toward today. Examples include seeking help, withdrawing from danger, restoring contact, gathering information, protecting boundaries, sharing resources, resting, exploring, or repairing a relationship.
4. **Translate into therapeutic meaning without prescribing.** The description should make the motivation understandable enough that the reader can consider tending it rather than reflexively suppressing it. Do not tell the reader that every urge is correct, healthy, innate, or adaptive.
5. **Add modern psychological and clinical evidence next.** Use contemporary research to explain mechanisms, distinctions, outcomes, or practical implications after the evolutionary function has been established or carefully bounded.
6. **Keep ultimate and proximate explanations distinct.** A hypothesis about why a motivation may have been retained across generations is different from evidence about how social support, threat detection, stress buffering, memory, physiology, or behavior operate now.
7. **Prefer restrained evolutionary language.** Useful forms include “Across human evolutionary history…”, “Evolutionary accounts propose…”, “Anthropological evidence suggests…”, “This motivation is consistent with…”, and “One hypothesis is…”. Avoid “evolved for,” “hard-wired,” “innate,” or “universal” unless unusually strong evidence justifies those words.
8. **Let the scholarship carry the reassurance.** The copy should not say “you should not suppress this need.” Instead, it should show why the motivation is intelligible and potentially functional so that conclusion can emerge naturally.

### Support as the current model for this method

The Support review clarified the sequence above. The first draft focused mostly on modern coping and health associations. The stronger version began instead with human interdependence and the recurrent problem of managing uncertain resources and demands that exceed one person's reliable capacity. Jaeggi and Gurven (2013) and Kaplan et al. (2012) supply the evolutionary/anthropological layer; Thoits, Cohen and Wills, Uchino, Haber et al., Feeney and Collins, and Yeo et al. then explain forms, mechanisms, distinctions, and contemporary associations. This is the preferred pattern for future needs when evolutionary relevance is similarly direct.

Safety should receive the same treatment in its later full audit: begin with threat detection, avoidance, protection, and survival consequences, then move into modern threat-response and safety scholarship. Safety strategy pruning has happened, but Safety copy/citations are **not finalized**.

## Editorial style and conceptual rules

- **Do not use em dashes in proposed or production site copy.** Prefer commas, semicolons, parentheses, or sentence breaks.
- **Do not try to formally define a need in its short description.** Needs are better approached by gesture, examples, motivational patterns, consequences, and scholarship than by necessary-and-sufficient-condition definitions.
- Preserve useful motivational framing. A need description may describe what the need can motivate or drive us to do and what can follow when those motivations can be acted on.
- The intended effect is not sentimental reassurance. Let readers infer that having a need can be functional and valuable even when the need or its associated motivations are uncomfortable.
- Reach that effect through factual, academic, evolutionary, motivational, developmental, or clinical scholarship where relevant.
- **Use short direct quotations from authoritative academic sources when they materially increase confidence or precision.** Quotations must be exact, attributed, and selective.
- The expanded Details section should not read like an annotated bibliography. It should show why each citation matters by integrating the source into a coherent explanation.
- Clearly distinguish theory from empirical fact and association from causation.
- Avoid citation accumulation for its own sake. Every final source should do a distinct job.

## Strategy audit rules

Strategies are reviewed alongside each need, but they are a distinct evidence layer from the need description.

- **Establish provenance before changing any strategy.** A strategy with a named contributor or other evidence of genuine user authorship is user-submitted.
- **Never rewrite, rename, delete, remap, or otherwise clean up a user-submitted strategy.** User strategies are experiential contributions and do not have to pass the same research-evidence gate as system-authored strategies.
- System/AI-authored strategies must earn their place. Do not retain or add strategies merely to make a list look complete.
- **A user-approved global discard is a deletion decision, not a hiding decision.** Do not keep an approved-for-discard system strategy eligible as a dead legacy fallback. Remove it from current catalog materialization and from the maintained source/snapshot when that source is rewritten. Git history is sufficient historical record.
- **A rejection for one need is not automatically a global deletion.** If a system strategy may still fit another need, remove only the audited need association until its other uses are reviewed.
- Prefer low-friction, portable strategies feasible in ordinary life. The ideal action can be attempted in many settings and does not require a purchase, appointment, program, special location, or large block of time.
- A strategy should have a direct, intelligible pathway to the need being audited.
- For system strategies, seek direct empirical support for the underlying mechanism when good research exists. Evidence supports plausibility, not a guaranteed individual outcome.
- Require human-reachable scholarly URLs for strategy evidence under the same verification rules used for need-copy citations. New evidence is not approved until the user manually verifies the URLs and agrees to the strategy change.
- Prefer a set that demonstrates flexibility. Different strategies should expose genuinely different routes toward the same need.
- Avoid unnecessary duplication. Each system strategy should add a meaningfully different action, context, or mechanism.
- Accessibility matters. Do not convert study-specific behaviors such as eye contact into universal requirements when a broader accessible action captures the relevant mechanism.
- No system-strategy addition, removal, rewrite, rename, or need-association change enters production until the user approves the exact strategy package and its evidence/resource provenance.

### Strategy card provenance and citation display

Strategy cards should make the source of their authority legible without treating lived experience, research evidence, and official services as the same thing.

- **Never ask users to provide citations when they submit a strategy.** User-submitted strategies are personal or experiential contributions.
- **User card:** bottom-right provenance is contributor name and location when supplied.
- **Evidence-backed system card:** bottom-right provenance is the **actual scholarly paper title**, clickable to the human-verifiable source. Do not use a generic clickable label such as “Evidence.”
- **Official-resource system card:** bottom-right provenance is the **actual service/resource name**, clickable to the official source. Do not pretend a service directory is a research citation.
- By default, a system strategy should have one best source supporting its core mechanism. The source answers “why is this here?”; it does not imply that the exact card wording was tested or that the action guarantees an outcome.
- If no defensible source or official resource can be identified, reconsider whether the system strategy has earned its place.
- As of PR #51, the live card UI already places human attribution and scholarly paper-title provenance in the bottom-right card area.

## Therapeutic strategy design method

When auditing or proposing system-authored strategies, imagine a therapeutic situation. A client and psychologist have identified a need as currently important. Ask: **what small, concrete experiment might a thoughtful clinician reasonably propose next?**

1. Start from the need, not from a generic coping-skill list.
2. Make the action specific enough that the user knows what to do and when the exercise is complete.
3. Do not assume prerequisites such as a particular relationship, money, transportation, a supportive family, or a special setting unless alternatives are built in.
4. Do not make success depend on another person cooperating when the therapeutic value can come from preparation, reflection, mapping, or another self-contained action.
5. Prefer experiments over prescriptions.
6. Deliberately consider multiple pathways before adding anything.
7. Use research to support the mechanism, not to manufacture oddly specific micro-challenges.
8. Translate research cautiously.
9. Reject AI-sounding filler names in favor of ordinary human action names.
10. Favor autonomy and optionality.

### Official support resources as saveable strategies

A resource can itself be a useful strategy when saving it to the inventory gives the user something actionable to return to. Official support-line cards are therefore allowed when directly relevant to a need.

- Keep them distinct from research-backed behavioral strategies.
- Put actionable information in the card text so the saved inventory item remains useful.
- Link the bottom-right provenance to the official service/resource.
- Map only to directly related needs rather than every downstream need the service could conceivably affect.
- Current pending Support proposal maps the US 988 and EU 116 123 cards to **Support** and **Safety** only.

## Need magnet visual review after content approval

Each completed need audit should be followed by a separate visual review of that need's magnet. This is not part of the content approval gate and should not delay content implementation once approved, but it is the next design step.

The problem to solve is that need magnets can become a visually same-y flood of words even when each has a small icon. Future reviews should ask whether the audited concept suggests a more meaningful visual identity while preserving the site's shared magnet language and Customizer behavior.

Directions worth considering include:

- transparent SVG artwork analogous to the abstract art used on Feeling magnets;
- more thoughtful replacement or evolution of the need icon;
- restrained coloration or internal design variation that remains driven by Customizer variables rather than hard-coded per-need colors;
- visual motifs that increase recognition without turning need magnets into unrelated card designs;
- maintaining text legibility, accessibility, responsive sizing, play-state physics, and all Customizer presets.

Do not independently generate or ship need-magnet art during a content audit. After content approval, present visual directions for explicit user review. The next planned magnet design reviews are **Connection and Support**.

## Evidence standard

### Source hierarchy

Prefer, in roughly this order when the question permits:

1. systematic reviews and meta-analyses;
2. major peer-reviewed review articles or consensus/guideline documents;
3. strong longitudinal, experimental, or otherwise directly relevant primary research;
4. foundational theory papers when the claim is explicitly about that theory;
5. scholarly books or reference works for conceptual/history questions.

For an explicitly evolutionary claim, direct evolutionary anthropology, behavioral ecology, comparative psychology, or other natural-history scholarship can outrank a general modern meta-analysis because source-to-claim fit matters more than hierarchy alone.

### Claim discipline

- Theory is not empirical fact.
- Association is not causation.
- Mechanisms require mechanism evidence.
- Evolutionary benefit or present-day usefulness does not by itself prove adaptation.
- Avoid “everyone,” “all humans,” “hard-wired,” “innate,” or “universal” unless unusually strong support exists.
- Do not medicalize ordinary experience unnecessarily.
- Direct relevance is more important than prestige.
- Where evidence is mixed, limited, population-specific, correlational, or theory-dependent, say so.

## Citation practice

For each scientific claim retain authors, year, title, journal/issuing body, DOI and/or PMID where available, a stable human-verifiable landing page, what the source supports, and limitations that constrain wording.

Prefer publisher pages, PubMed/PMC, APA PsycNet, or another authoritative scholarly landing page. Agent/crawler accessibility is not the standard. A legitimate page manually verified by the user should not be replaced merely because an automated crawler cannot fetch it.

## Connection: approved package

Connection completed its approval cycle on 2026-08-24. Do not revise it without a new explicit review.

Approved short copy:

> As a highly social species, humans appear to have evolved strong motivations to maintain connection with others. Across human evolutionary history, social bonds supported protection, caregiving, cooperation, and group living, making social connection consequential for survival and reproduction across generations. This need may drive us to seek others, maintain relationships, repair social ruptures, and coordinate with the people around us. Evolutionary accounts propose that even the discomfort of disconnection may help motivate behavior directed toward restoring socially important bonds.

Approved need-level sources:

1. Baumeister & Leary (1995), _The need to belong: Desire for interpersonal attachments as a fundamental human motivation._ https://psycnet.apa.org/record/1995-29052-001
2. Ryan & Deci (2000), _Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being._ https://pubmed.ncbi.nlm.nih.gov/11392867/
3. Vansteenkiste, Ryan, & Soenens (2020), _Basic psychological need theory: Advancements, critical themes, and future directions._ https://link.springer.com/article/10.1007/s11031-019-09818-1
4. Cacioppo, Cacioppo, & Boomsma (2014), _Evolutionary mechanisms for loneliness._ https://pmc.ncbi.nlm.nih.gov/articles/PMC3855545/
5. Coan & Sbarra (2015), _Social Baseline Theory: The Social Regulation of Risk and Effort._ https://pmc.ncbi.nlm.nih.gov/articles/PMC4375548/
6. Holt-Lunstad, Smith, & Layton (2010), _Social relationships and mortality risk: A meta-analytic review._ https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316

Approved Connection strategies: three protected human submissions (`call-a-friend`, `play-a-social-video-game`, `read-a-character-driven-novel`) plus four reviewed system strategies (`write-a-letter-for-connection`, `remember-a-connected-moment`, `map-your-connection-options`, `notice-where-you-are`). `one-kind-text` and `specific-thank-you` are global discards. `ambient-postcard` lost only its Connection association.

## Support: current complete proposal, pending explicit approval

**Status: not yet approved for production.** The user has positively endorsed the short-copy direction and the evolutionary-therapeutic method, but explicitly requested a final complete package before approval.

### Proposed short copy

> Across human evolutionary history, survival often depended on sharing food, care, information, labor, and risk rather than meeting every demand alone. This need may draw us to seek help, make our needs visible, notice when others need assistance, and offer or accept emotional, informational, or practical support. Tending to support can distribute burdens, preserve capacity during hardship, and make difficult circumstances more manageable than they would be alone.

### Proposed expanded Details

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

### Proposed Support need-level citations

1. **Jaeggi, A. V., & Gurven, M. (2013). _Natural cooperators: food sharing in humans and other primates._ Evolutionary Anthropology, 22(4), 186–195.** DOI 10.1002/evan.21364. PMID 23943272. Human-verifiable URL: https://pubmed.ncbi.nlm.nih.gov/23943272/  
   Use for: natural history of human sharing, risk buffering, and evolved cooperative psychology. Limitation: review/synthesis centered strongly on food sharing; do not use it to prove that every form of modern support is an adaptation.
2. **Kaplan, H. S., Schniter, E., Smith, V. L., & Wilson, B. J. (2012). _Risk and the evolution of human exchange._ Proceedings of the Royal Society B, 279(1740), 2930–2935.** DOI 10.1098/rspb.2011.2614. PMID 22513855. Human-verifiable URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC3385467/  
   Use for: exchange among non-kin as a hallmark of human sociality and experimental support for risk-reduction accounts of reciprocal exchange. Limitation: laboratory foraging/exchange model does not establish all modern helping motives.
3. **Thoits, P. A. (2011). _Mechanisms linking social ties and support to physical and mental health._ Journal of Health and Social Behavior, 52(2), 145–161.** DOI 10.1177/0022146510395592. PMID 21673143. Human-verifiable URL: https://pubmed.ncbi.nlm.nih.gov/21673143/  
   Use for: emotional sustenance versus active coping assistance and proposed support mechanisms. Limitation: review/theoretical synthesis.
4. **Cohen, S., & Wills, T. A. (1985). _Stress, social support, and the buffering hypothesis._ Psychological Bulletin, 98(2), 310–357.** PMID 3901065. Human-verifiable URL: https://pubmed.ncbi.nlm.nih.gov/3901065/  
   Use for: direct-effect versus stress-buffering models and matching support resources to stressor demands. Limitation: foundational 1985 review; do not turn buffering into a universal causal guarantee.
5. **Uchino, B. N. (2009). _Understanding the Links Between Social Support and Physical Health: A Life-Span Perspective With Emphasis on the Separability of Perceived and Received Support._ Perspectives on Psychological Science, 4(3), 236–255.** DOI 10.1111/j.1745-6924.2009.01122.x. PMID 26158961. Human-verifiable URL: https://pubmed.ncbi.nlm.nih.gov/26158961/  
   Use for: conceptual distinction between perceived availability and received supportive behavior. Limitation: theoretical/review treatment focused heavily on physical-health pathways.
6. **Haber, M. G., Cohen, J. L., Lucas, T., & Baltes, B. B. (2007). _The relationship between self-reported received and perceived social support: a meta-analytic review._ American Journal of Community Psychology, 39(1–2), 133–144.** DOI 10.1007/s10464-007-9100-9. PMID 17308966. Human-verifiable URL: https://pubmed.ncbi.nlm.nih.gov/17308966/  
   Use for: 23-study estimate showing received and perceived support are related but not interchangeable, average r = .35. Limitation: concerns measured support constructs rather than the allneeds concept itself.
7. **Feeney, B. C., & Collins, N. L. (2015). _A New Look at Social Support: A Theoretical Perspective on Thriving through Relationships._ Personality and Social Psychology Review, 19(2), 113–147.** PMID 25125368. Human-verifiable URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC5480897/  
   Use for: theoretical account of support in adversity and in opportunities for exploration/growth. Limitation: theoretical model centered largely on close relationships.
8. **Yeo, G., Lansford, J. E., & Rudolph, K. D. (2025). _How does perceived social support relate to human thriving? A systematic review with meta-analyses._ Psychological Bulletin, 151(9), 1089–1124.** DOI 10.1037/bul0000491. PMID 41100292. Human-verifiable URL: https://pubmed.ncbi.nlm.nih.gov/41100292/  
   Use for: current large-scale synthesis of 604 studies and 1,014 effect sizes across several domains. Limitation: primarily perceived-support associations; not proof that a particular supportive act causes a given outcome.

### Proposed Support strategy set

Protected human submissions, unchanged:

1. **Call a friend** (`call-a-friend`). Keep exact human-authored wording and contributor provenance.
2. **Call a parent** (`call-a-parent`). Keep exact human-authored wording and contributor provenance.

Proposed evidence-backed system strategies:

3. **Map your support.**  
   Proposed text: “Set a five-minute timer. Write down any people, groups, services, places, or resources you could turn to. Next to each, write what kind of help it could realistically offer: listening, information, practical help, company, or something else. Leave anything blank if no option comes to mind.”  
   Need mapping: Support only.  
   Card citation title: **The Community Navigator Study: Results from a feasibility randomised controlled trial of a programme to reduce loneliness for people with complex anxiety or depression.**  
   URL: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0233535  
   Evidence interpretation: supports social-network mapping and concrete planning as components of a structured intervention. It does not prove this exact five-minute card wording.
4. **Prepare one request for help.**  
   Proposed text: “Choose one thing that would be easier with help. Write the smallest concrete request that would make a difference. Add a person, group, or service you could ask if one comes to mind. You do not have to send it.”  
   Need mapping: Support only.  
   Card citation title: **Surprisingly Happy to Have Helped: Underestimating Prosociality Creates a Misplaced Barrier to Asking for Help.**  
   URL: https://pubmed.ncbi.nlm.nih.gov/36067802/  
   Evidence interpretation: across scenarios, recalled experiences, and live interactions with 2,118 US adults, people needing help underestimated willingness to help and how positively helpers would feel. This does not imply that asking is always safe or that any particular person will help.

Proposed official-resource system strategies:

5. **Call or text 988 (US).**  
   Proposed text: “If you are in the United States and want a trained person to talk with right now, call or text 988. The 988 Lifeline supports people dealing with mental health struggles, emotional distress, alcohol or drug use concerns, or simply needing someone to talk to. It is available 24/7.”  
   Need mapping: Support + Safety.  
   Bottom-right resource title: **988 Suicide & Crisis Lifeline**  
   Official URL: https://988lifeline.org/  
   Resource status: official service information, not a scholarly strategy citation.
6. **Call 116 123 (EU).**  
   Proposed text: “If you are in the European Union, try 116 123 for an emotional support helpline. It is a free European helpline number used in most EU countries, although coverage is not yet EU-wide. Where available, the service offers non-judgmental listening for loneliness, psychological crisis, or suicidal thoughts.”  
   Need mapping: Support + Safety.  
   Bottom-right resource title: **EU 116 123 Emotional Support Helplines**  
   Official user-facing URL: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/faq/index_en.htm  
   Authoritative service definition: https://eur-lex.europa.eu/eli/dec/2007/698/oj/eng  
   Resource status: official EU resource, not a scholarly strategy citation. Coverage varies by member state.

Proposed Support association removals only, not global deletion:

- `floor-starfish`
- `pillow-nest`
- `name-support-options`
- `name-one-help-to-ask`

These may still have other need associations to audit later. No global deletion is proposed in the Support package.

### Proposed implementation scope after approval

- Add the approved Support short copy, Details narrative, and eight need-level sources to `src/data/editorialCatalog.json`.
- Materialize exactly six Support strategy cards listed above.
- Preserve both protected human strategies without rewriting them.
- Add two evidence-backed system strategies and two official-resource strategies.
- Remove Support associations from the four superseded system strategies without globally deleting them.
- Map both official hotline/resource strategies to Support and Safety.
- Ensure official-resource cards use official service provenance rather than being represented as research evidence.
- Preserve the bottom-right provenance presentation established in PR #51.
- Add catalog/browser regression coverage for exact Support copy, source count/URLs, exact strategy set, provenance, resource mappings, and removed Support associations.
- Do not change Connection or Safety explanatory copy as part of the Support implementation.

## Safety: current status

Safety has received an interim strategy cleanup but **has not completed the full copy/citation audit**. Current strategy work retained protected human submissions and two evidence-backed system strategies, while removing weaker Safety associations. Do not treat that interim curation as approval of the Safety description or citation set.

After Support is approved and implemented, return to Safety and apply the evolutionary-function-first authoring method. The Safety short description should make the direct survival relevance of detecting and responding to danger legible while preserving claim discipline. The expanded evidence should distinguish evolved threat sensitivity from present-day overgeneralization or maladaptive persistence rather than implying that every fear response accurately signals current danger.

## Status / approval ledger

| Date | Area | Decision | Production changed? | Notes |
| --- | --- | --- | --- | --- |
| 2026-08-24 | Connection complete package | Explicitly approved | Yes | Seven strategies total; six need-level sources; three protected human strategies plus four reviewed system strategies. |
| 2026-08-24 | Strategy discard semantics | Global discard means deletion; need-specific rejection means association removal | Yes | Stale imported associations must not leak back into runtime. |
| 2026-08-25 | Safety interim strategies | User authorized interim pruning before full audit | Yes | Safety description/citations remain unfinished. |
| 2026-08-25 | Strategy card provenance UI | Actual paper titles and human attribution moved to bottom-right provenance area | Yes | PR #51. |
| 2026-08-25 | Need authoring method | Evolutionary function first, therapeutic meaning second | No | New standing method for future need audits. |
| 2026-08-25 | Need magnet review | Reconsider magnet visual identity after content approval | No | Connection and Support are first planned visual reviews. |
| 2026-08-25 | Support complete proposal | Pending explicit approval | No | Eight need-level sources and six proposed strategies, including US/EU support-line resource cards. |

## Handoff for the next agent

1. Read this file before proposing scientific, clinical, strategy, or audited need-visual changes.
2. Do not make broad “professionalize all copy” passes.
3. For a new need, begin with the evolutionary-function-first authoring method when relevant rather than adding evolutionary language afterward.
4. Ask what recurrent problem the need-related motivation may have helped humans manage, locate direct scholarship, then connect that function to the present-day motivational pattern.
5. Let scholarship make need-related motivation intelligible rather than explicitly instructing readers not to suppress it.
6. Do not formalize needs as definitions and do not use em dashes in proposed site copy.
7. Audit strategy provenance first. Never alter user-submitted strategies and never ask users for citations.
8. System strategy cards should show the actual paper title at bottom right; official-resource strategies should show the official service/resource title; user cards should show contributor name/location.
9. Keep strategy sets small, concrete, portable, varied, and directly related to the audited need.
10. After content approval, separately reconsider the need magnet's visual identity with Customizer-compatible design ideas. Do not ship art without explicit visual approval.
11. Connection is approved. Support is pending the complete package recorded above. Safety copy/citations remain unfinished.
12. Reviewed V2 editorial changes belong in `src/data/editorialCatalog.json`; the imported legacy snapshot supplies unreviewed baseline data.
13. After a future package is approved, use the repository's normal branch/PR workflow, run available validation, and append the approval result here.

## Current implementation notes

- `src/data/editorialCatalog.json` is the V2-owned authoring surface for approved post-import editorial changes.
- `vite.config.ts` merges that source with the imported snapshot and applies explicit global discard and need-association removal directives.
- The V2 `Strategy` model carries explicit provenance and optional source metadata for reviewed system strategies.
- Need strategy cards now display contributor or actual scholarly paper title in the bottom-right provenance area; official-resource provenance still needs to be represented explicitly when the first resource strategies are approved.
- `src/data/generated/legacyData.json` remains the historical import snapshot. Approved global discards are barred from the live catalog even if an old imported row remains there; when that snapshot is safely rematerialized, globally discarded rows should be omitted.

Keep this document cumulative but concise enough that a future agent can recover the editorial state without needing the original conversation.
