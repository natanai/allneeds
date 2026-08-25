# Content Evidence & Editorial Review Protocol

> Status: living document. Start here before changing explanatory, psychological, behavioral, health, strategy, or research-facing copy in allneeds.
>
> Last updated: 2026-08-24.

## Purpose

allneeds should be clear, humane, clinically careful, and evidence-aligned without presenting theory, interpretation, or value judgments as settled empirical fact. Content review is intentionally slow and claim-level. This is not a mandate for a site-wide rewrite.

The goal is to preserve good existing language, strengthen sourcing where needed, qualify claims to match the evidence, and make only changes the user has explicitly reviewed and approved.

## Non-negotiable workflow for content changes

1. **Retrieve the exact current production copy first.** Do not rewrite from memory or from a paraphrase in conversation.
2. **Identify the canonical content source before editing.** `src/data/generated/legacyData.json` is generated output; do not assume generated output is the correct authoring surface.
3. **Audit one small unit at a time**, usually one need, feeling, strategy, section, or a few closely related sentences.
4. For each sentence, distinguish among definition/framework language, empirical description, causal claim, association, theoretical interpretation, clinical guidance, and editorial/value framing.
5. **Check source-to-claim fit.** A citation must support the particular proposition being made, not merely concern the same broad topic.
6. Prefer the smallest edit that makes the claim accurate. Do not rewrite surrounding copy merely for stylistic consistency unless the user asks for it.
7. **Present proposed copy, strategy changes, and evidence to the user before changing site content.**
8. Only after approval, change the canonical source, regenerate derived data if required, and update this document in the same PR.
9. Verify links/citations, generated-data integrity, and relevant repository checks. Do not claim validation that was not run.

### Explicit user approval gate

For research-facing content work, no repository change may be made until the user has explicitly approved the complete content package under discussion. Approval must cover:

- the final citation set;
- a human-reachable verification URL for every citation;
- what each citation is being used to support;
- the short/main description;
- the expanded/details description;
- all proposed system-strategy additions, removals, renames, rewrites, or need associations;
- the intended implementation scope.

The sole exception is **this document, `docs/content-evidence-review.md`**, which the user has explicitly authorized to be updated during the review process so future agents can recover the current specifications and approval state.

Research, drafting, source checking, and discussion must otherwise remain read-only until the user gives explicit package approval. Do not create or merge production branches, PRs, production data changes, copy changes, or documentation changes outside this file merely because a proposed change appears safe or helpful.

## Editorial style and conceptual rules

- **Do not use em dashes in proposed or production site copy.** Prefer commas, semicolons, parentheses, or sentence breaks.
- **Do not try to formally define a need in its short description.** The user treats needs as basic concepts better approached by gesture, examples, motivational patterns, consequences, and scholarship than by necessary-and-sufficient-condition definitions.
- Preserve useful motivational framing. A need description may describe what the need can motivate or drive us to do and what can follow when those motivations can be acted on.
- The intended effect is not sentimental reassurance. Let readers infer that having a need can be functional and valuable even when the need or its associated motivations are uncomfortable.
- Reach that effect through factual, academic, evolutionary, motivational, developmental, or clinical scholarship where relevant.
- **Use short direct quotations from authoritative academic sources when they materially increase confidence or precision.** Quotations must be exact, attributed, and selective.
- The expanded Details section should not read like an annotated bibliography. It should **show** why each citation matters by integrating the source into a coherent explanation.
- Clearly distinguish theory from empirical fact and association from causation.
- Avoid citation accumulation for its own sake. Every final source should do a distinct job.

## Strategy audit rules

Strategies are reviewed alongside each need, but they are a distinct evidence layer from the need description.

- **Establish provenance before changing any strategy.** A strategy with a named contributor or other evidence of genuine user authorship is user-submitted.
- **Never rewrite, rename, delete, remap, or otherwise clean up a user-submitted strategy.** User strategies are experiential contributions and do not have to pass the same research-evidence gate as system-authored strategies.
- System/AI-authored strategies must earn their place. Do not retain or add strategies merely to make a list look complete.
- Prefer low-friction, portable strategies feasible in ordinary life. The ideal action can be attempted in many settings and does not require a purchase, appointment, program, special location, or large block of time.
- A strategy should have a direct, intelligible pathway to the need being audited. If a system strategy fits another need better, prefer changing only the need association rather than deleting it globally before its other uses are reviewed.
- For system strategies, seek direct empirical support for the underlying mechanism when good research exists. Evidence supports plausibility, not a guaranteed individual outcome.
- Require human-reachable scholarly URLs for strategy evidence under the same verification rules used for need-copy citations. New evidence is not approved until the user manually verifies the URLs and agrees to the strategy change.
- Prefer a set that demonstrates flexibility. Different strategies should expose genuinely different routes toward the same need so users are not taught that one person, behavior, or solution is the only way to tend it.
- Avoid unnecessary duplication. Each system strategy should add a meaningfully different action, context, or mechanism.
- Accessibility matters. Do not convert study-specific behaviors such as eye contact into universal requirements when a broader accessible action captures the relevant mechanism.
- **Do not restrict Connection strategies to interpersonal contact.** Depending on the need, useful routes may involve another person, oneself, memory, writing, environment, place, activity, ritual, or other forms of contact and orientation.
- No system-strategy addition, removal, rewrite, rename, or need-association change enters production until the user approves the exact strategy package and its evidence.

## Therapeutic strategy design method

When auditing or proposing system-authored strategies, imagine a therapeutic situation. A client and psychologist have identified a need as currently important. Ask: **what small, concrete experiment might a thoughtful clinician reasonably propose next?** The strategy card should be able to stand on its own as that experiment.

Use the following design test:

1. **Start from the need, not from a generic coping-skill list.** Ask what actions, forms of attention, environments, memories, or interactions could plausibly move the person toward this need.
2. **Make the action extremely specific.** The user should know what to do, for how long if relevant, and what the stopping point is. Prefer instructions such as “set a five-minute timer and write…” over labels such as “practice connection” or vague wellness language.
3. **Do not assume prerequisites that may not exist.** Do not require a recent positive event, a particular relationship, a supportive family, money, transportation, a special setting, or an existing social network unless the strategy explicitly offers an alternative.
4. **Do not make success depend on another person cooperating.** Interpersonal strategies may suggest “someone you trust,” but the action should still be complete if the other person does not reply, reciprocate, agree, or behave as hoped. Sending may be optional when the therapeutic value can come from the preparation or reflection itself.
5. **Prefer experiments over prescriptions.** The strategy is something to try, notice, and learn from. Do not imply it is the correct way to meet the need or that it will work for everyone.
6. **Look for multiple pathways.** During an audit, deliberately consider at least several categories before adding anything: direct interpersonal contact, written or symbolic contact, autobiographical memory, self-connection, present-environment or place connection, activity or shared-interest connection, and planning/mapping future options. Not every need requires every category.
7. **Use research to support the mechanism, not to manufacture a strategy.** Start with a clinically intelligible action, then ask whether evidence supports the underlying process. Do not invent oddly specific micro-challenges merely because a study manipulated something similar.
8. **Translate research cautiously.** A broad intervention literature can justify a mechanism or direction without proving the exact card wording. Record when a strategy is an evidence-informed practical translation rather than a directly tested intervention.
9. **Reject AI-sounding filler.** Avoid titles such as “One kind text,” “Specific thank-you,” or other synthetic micro-challenge phrasing when an ordinary human action name is clearer. Strategy names should sound like things a clinician or client might naturally say.
10. **Favor autonomy and optionality.** Good strategy sets demonstrate that one need can be tended in multiple ways. They should reduce the sense of being trapped by the single strategy, person, or outcome currently on the user's mind.

### Connection example: how this method was applied

The Connection audit clarified the method above.

Protected user-submitted strategies currently associated with Connection include:

- `Call a friend`
- `Play a social video game`
- `Read a character driven novel`

These remain exactly as submitted.

For system-authored strategies, the review rejected adding extra social-skills-style micro-challenges merely to increase count. It also rejected treating interpersonal contact as the only legitimate route to Connection. The preferred candidate directions are:

- **Write a letter.** Set a five-minute timer. Choose someone you trust, miss, or would like to feel closer to. Write what has been happening in your life and one thing you wish they knew. Sending it is optional.
- **Remember a connected moment.** Recall one moment when you felt connected to a person, animal, place, group, or activity. Write where you were, what was happening, one detail that made the moment feel connected, and one part of the experience you could recreate.
- **Map your connection options.** On paper, make three headings: People, Places, Groups. List any person, place, or group where you have felt even slightly more connected. Leave a heading blank if needed. Circle the easiest option to move toward and write one specific next step.
- **Notice where you are.** Stop for one minute. Notice one thing you can see, one sound you can hear, one physical sensation, and one detail that makes the place distinct. Write it down, photograph it, or simply spend a few seconds with it.

These are **approved in direction and wording by the user as strategy candidates**, but they are not production-approved until the associated evidence URLs are manually verified and the complete Connection package is approved.

The reasoning matters more than the exact examples: each action is concrete, can usually be attempted without special resources, does not require another person to cooperate, and represents a different pathway toward Connection. Future audits should seek this kind of diversity rather than reproducing these exact four cards for unrelated needs.

## Evidence standard

### Source hierarchy

Prefer, in roughly this order when the question permits:

1. systematic reviews and meta-analyses;
2. major peer-reviewed review articles or consensus/guideline documents;
3. strong longitudinal, experimental, or otherwise directly relevant primary research;
4. foundational theory papers when the claim is explicitly about that theory;
5. scholarly books or reference works for conceptual/history questions.

Secondary summaries, commercial wellness sites, popular press, search snippets, and unsourced institutional webpages should not be the authority for scientific claims when primary or peer-reviewed sources are available.

### Claim discipline

- **Theory is not empirical fact.** Use wording such as “Self-Determination Theory proposes…” where appropriate.
- **Association is not causation.** “Is associated with” should not become “causes,” “protects,” “improves,” or “leads to” without appropriate evidence.
- **Mechanisms require mechanism evidence.** Do not infer nervous-system, hormonal, neural, evolutionary, or developmental mechanisms merely because an outcome association exists.
- **Universality requires unusually strong support.** Avoid “everyone,” “all humans,” “hard-wired,” “innate,” or “universal” unless the evidence and wording justify it.
- **Absence and frustration are different constructs.** For frameworks such as Basic Psychological Need Theory, distinguish low satisfaction from active frustration/thwarting when the literature does.
- **Do not medicalize ordinary experience unnecessarily.** Clinical professionalism means precision and restraint.
- **Do not cite by prestige alone.** Direct relevance is more important than fame.
- Where evidence is mixed, limited, population-specific, correlational, or theory-dependent, say so.

## Citation practice

For each externally verifiable scientific claim, retain enough structured information for a future reviewer to identify:

- authors;
- year;
- article/report title;
- journal or issuing body;
- DOI and/or PMID when one exists;
- **a stable, human-verifiable scholarly landing-page URL**;
- what the source supports;
- important limitations affecting wording.

### Human-verifiable link requirement

A scientific citation is not complete for allneeds unless a person can follow a stored link to a recognizable scholarly record and independently verify the source. Prefer publisher pages, PubMed/PMC, APA PsycNet, or another authoritative bibliographic landing page. A bare DOI may be retained as metadata but should not be the only practical verification route when a stable human-facing record exists.

Agent/crawler accessibility is not the standard. If the user manually verifies a legitimate scholarly page that an automated agent cannot fetch, record the limitation rather than replacing it with a weaker source.

When proposing citations in conversation, give the user a directly openable URL representation. Do not treat a source as approved merely because an agent can retrieve it.

## Current review: Connection

### Production copy at start of review

Current generated expanded copy:

> “Forming strong social connections has profound benefits for both mental and physical health. Extensive research suggests that the quality and quantity of one’s social relationships are linked not only to psychological well-being but also to longevity and disease risk. In a large meta-analysis of 148 studies, individuals with richer social connections had about a 50% greater likelihood of survival over the study periods than those who were more isolated (Holt-Lunstad et al., 2010). In fact, the protective effect of social connection on mortality was found to be comparable to well-known health factors like not smoking and maintaining a healthy weight. Strong interpersonal connection provides emotional support, buffers stress, and contributes to greater life satisfaction, whereas lack of connection (loneliness) is associated with higher risks of depression and physical illness.”

Earlier short/original copy:

> “As highly social creatures, humans often thrive on close relationships that provide mutual care. This need may drive us to spend meaningful time with others, share experiences, and cultivate trust and empathy. When we foster genuine connection, we gain emotional support and joy in companionship, and we build resilience through having others to lean on during difficult times.”

The user prefers the motivational structure of the earlier short copy, but wants the final short description to lean more clearly on evolutionary scholarship and less on emotionally dependent framing.

### Working citation pool with user-verified human links

These six sources have human-reachable URLs the user manually opened and verified. They are working sources until the complete Connection package is approved.

**Baumeister, R. F., & Leary, M. R. (1995). _The need to belong: Desire for interpersonal attachments as a fundamental human motivation._ Psychological Bulletin, 117(3), 497–529.**  
Human-verifiable record: https://psycnet.apa.org/record/1995-29052-001  
DOI: 10.1037/0033-2909.117.3.497  
Use for: belongingness as a powerful motivation and the persistence of interpersonal bonds. Present as a hypothesis evaluated against empirical literature.

**Ryan, R. M., & Deci, E. L. (2000). _Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being._ American Psychologist, 55(1), 68–78.**  
Human-verifiable record: https://pubmed.ncbi.nlm.nih.gov/11392867/  
DOI: 10.1037/0003-066X.55.1.68  
PMID: 11392867  
Use for: Self-Determination Theory framing of relatedness as one of three postulated psychological needs.

**Vansteenkiste, M., Ryan, R. M., & Soenens, B. (2020). _Basic psychological need theory: Advancements, critical themes, and future directions._ Motivation and Emotion, 44, 1–31.**  
Human-verifiable record: https://link.springer.com/article/10.1007/s11031-019-09818-1  
DOI: 10.1007/s11031-019-09818-1  
Use for: modern review of BPNT, including the distinction between need satisfaction and need frustration.

**Cacioppo, J. T., Cacioppo, S., & Boomsma, D. I. (2014). _Evolutionary mechanisms for loneliness._ Cognition & Emotion, 28(1), 3–21.**  
Human-verifiable full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC3855545/  
Human-verifiable PubMed record: https://pubmed.ncbi.nlm.nih.gov/24067110/  
DOI: 10.1080/02699931.2013.837379  
Use for: evolutionary theory concerning why sensitivity to social isolation may have adaptive value. Do not imply loneliness is always adaptive or harmless.

**Coan, J. A., & Sbarra, D. A. (2015). _Social Baseline Theory: The Social Regulation of Risk and Effort._ Current Opinion in Psychology, 1, 87–91.**  
Human-verifiable full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC4375548/  
Human-verifiable PubMed record: https://pubmed.ncbi.nlm.nih.gov/25825706/  
DOI: 10.1016/j.copsyc.2014.12.021  
Use for: the theoretical proposal that social partners can mitigate risk and reduce individual effort. Keep attribution explicit.

**Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). _Social relationships and mortality risk: A meta-analytic review._ PLOS Medicine, 7(7), e1000316.**  
Human-verifiable record: https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316  
DOI: 10.1371/journal.pmed.1000316  
PMID: 20668659  
Use for: population-level association between stronger social relationships and survival across 148 studies and 308,849 participants. Do not turn the association into an individual causal guarantee.

### Other previously identified candidates not yet approved for final use

- Holt-Lunstad, Smith, Baker, Harris, & Stephenson (2015), loneliness/social isolation and mortality.
- Slavich (2020), Social Safety Theory.
- Tang, Wang, & Guerrien (2020), basic psychological need satisfaction and later-life well-being.

### Strategy evidence awaiting manual URL verification

The following evidence was discussed for the four preferred Connection strategy candidates. Do not treat it as approved until the user manually verifies the associated human-reachable URLs.

- loneliness/social-connection intervention reviews for the general principle that effective approaches can target different pathways rather than only increasing social contact;
- expressive-writing evidence for relational writing, with the limitation that writing is not established as a direct loneliness treatment in every study;
- reminiscence-based evidence for recalling connection, with population/generalizability limits where relevant;
- broader environmental/place-connection literature for orienting toward present environment, without claiming the exact one-minute exercise is a validated loneliness intervention.

## Status / approval ledger

| Date | Area | Decision | Production copy changed? | Notes |
| --- | --- | --- | --- | --- |
| 2026-08-24 | Connection | Research initiated; candidate citations assembled | **No** | Slow, claim-level evidence review. |
| 2026-08-24 | Citation infrastructure | Human-verifiable links required | **No** | User verification beats crawler accessibility. |
| 2026-08-24 | Review process | Full-package approval required before production change | **No** | Includes copy, citations, URLs, strategy changes, and implementation scope. |
| 2026-08-24 | Editorial style | Do not formally define needs; preserve motivational framing; avoid em dashes; use direct scholarly quotations selectively | **No** | Details should integrate sources naturally rather than explain “why this paper was included.” |
| 2026-08-24 | Connection citations | Six working sources have user-verified URLs | **No** | Citation set remains provisional until complete-package approval. |
| 2026-08-24 | Strategy review | Provenance and evidence audit added | **No** | User-submitted strategies immutable; system strategies must earn their place. |
| 2026-08-24 | Therapeutic strategy method | Strategy-generation method clarified and Connection candidate directions accepted | **No** | Future agents should propose small, specific therapeutic experiments, avoid prerequisites and dependence on others, and deliberately consider multiple pathways including self/environment. Connection strategy evidence still requires manual URL verification. |

## Handoff for the next agent

1. Read this file before proposing scientific, clinical, or strategy changes.
2. Do not make a broad “professionalize all copy” pass.
3. Continue with Connection unless the user chooses another item.
4. Keep repo activity read-only except updates to this file until the user explicitly approves the complete package.
5. Do not formalize a need as a definition. Describe motivation, function, consequences, and relevant scholarship.
6. Avoid em dashes in proposed site copy.
7. Prefer concise, exact quotations from authoritative sources when they strengthen transparency and reader confidence.
8. Integrate citations into the Details narrative so their relevance is self-evident.
9. Audit strategy provenance first. Never alter user-submitted strategies.
10. For system strategies, use the therapeutic strategy design method above. Favor concrete, low-friction experiments with clear steps, few assumptions, minimal dependence on others, and distinct pathways to the need.
11. Before any production content edit, identify the canonical authoring source that generates `src/data/generated/legacyData.json`.
12. After the user approves the final citation set, all human-reachable URLs, short copy, expanded Details, exact strategy package, and implementation scope, make the production change through the repository's normal branch/PR workflow and append an approval ledger entry here.

## Open questions

- What file/process is the canonical authoring source for the generated legacy catalog?
- What citation presentation should users see in the UI versus what should remain structured metadata?
- How should evidence metadata for system-authored strategies be stored and surfaced without implying guaranteed outcomes?
- Which strategy evidence URLs for the current Connection candidates will the user manually verify and approve?

Keep this document cumulative but concise enough that a future agent can recover the editorial state without needing the original conversation.
