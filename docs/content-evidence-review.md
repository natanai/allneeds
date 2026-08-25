# Content Evidence & Editorial Review Protocol

> Status: living document. Start here before changing explanatory, psychological, behavioral, health, or research-facing copy in allneeds.
>
> Last initialized: 2026-08-24.

## Purpose

allneeds should be clear, humane, clinically careful, and evidence-aligned without presenting theory, interpretation, or value judgments as settled empirical fact. Content review is intentionally slow and claim-level. This is not a mandate for a site-wide rewrite.

The goal is to preserve good existing language, strengthen sourcing where needed, qualify claims to match the evidence, and make only changes the user has explicitly reviewed and approved.

## Non-negotiable workflow for content changes

1. **Retrieve the exact current production copy first.** Do not rewrite from memory or from a paraphrase in a conversation.
2. **Identify the canonical content source before editing.** `src/data/generated/legacyData.json` is generated output; do not assume generated output is the correct authoring surface.
3. **Audit one small unit at a time** (usually one need, feeling, strategy, section, or a few closely related sentences).
4. For each sentence, distinguish among:
   - definition or framework language;
   - empirical/descriptive claim;
   - causal claim;
   - association/correlation;
   - theoretical interpretation or proposed mechanism;
   - clinical/behavioral guidance;
   - value statement or editorial framing.
5. **Check source-to-claim fit.** A citation must support the particular proposition being made, not merely concern the same broad topic.
6. Prefer the smallest edit that makes the claim accurate. Do not rewrite surrounding copy merely for stylistic consistency unless the user asks for it.
7. **Present proposed copy and evidence to the user before changing site content.** Record approval or rejection below.
8. Only after approval, change the canonical source, regenerate derived data if required, and update this document in the same PR.
9. Verify links/citations, generated-data integrity, and any relevant repository checks. Do not claim validation that was not run.

### Explicit user approval gate

For research-facing content work, no repository change may be made until the user has explicitly approved the complete content package under discussion. Approval must cover:

- the final citation set;
- a human-reachable verification URL for every citation;
- what each citation is being used to support;
- the short/main description;
- the expanded/details description;
- the intended implementation scope.

The sole exception is **this document, `docs/content-evidence-review.md`**, which the user has explicitly authorized to be updated during the review process so that future agents can recover the current specifications and approval state.

Research, drafting, source checking, and discussion must otherwise remain read-only until the user gives explicit package approval. Do not create or merge branches, PRs, production data changes, copy changes, or documentation changes outside this file merely because a proposed change appears safe or helpful.

## Editorial style and conceptual rules

- **Do not use em dashes in proposed or production site copy.** Prefer commas, semicolons, parentheses, or sentence breaks.
- **Do not try to formally define a need in its short description.** The user treats needs as basic concepts that are better approached by gesture, examples, motivational patterns, consequences, and scholarship than by necessary-and-sufficient-condition definitions.
- Preserve the successful structure of the existing Connection short copy where possible: the need may **motivate or drive behavior**, and the copy should describe useful outcomes that can follow when those motivations are not suppressed or blocked.
- The intended effect is not sentimental reassurance. The page should let readers infer that having a need can be valuable even when the need or its associated motivations are uncomfortable.
- Reach that effect through factual, academic, and evolutionary or motivational scholarship rather than emotionally loaded claims.
- **Use short direct quotations from primary or authoritative academic sources when they materially increase confidence or precision.** Quotations should be exact, attributed, and used selectively so the page still reads naturally.
- The expanded Details section should not merely repeat the short description. It should explain the evidence around the need and, where useful, state **why each included citation is relevant and what role it plays**.
- Clearly distinguish foundational theory, modern review/synthesis, evolutionary theory, mechanistic theory, and observational outcome evidence.
- Avoid citation accumulation for its own sake. Every source in the final citation set should do a distinct job.

## Strategy audit rules

Strategies are reviewed alongside each need, but they are a distinct evidence layer from the need description.

- **Establish provenance before changing any strategy.** A strategy with a named contributor or other evidence of genuine user authorship is user-submitted.
- **Never rewrite, rename, delete, remap, or otherwise clean up a user-submitted strategy.** User strategies are experiential contributions and do not have to pass the same research-evidence gate as system-authored strategies.
- System/AI-authored strategies must earn their place. Do not retain or add strategies merely to make a list look complete.
- Prefer system strategies that are low-friction, portable, and feasible in ordinary life. The ideal action can be attempted in many settings and does not require a special purchase, location, appointment, program, or large block of time.
- A strategy should have a direct, intelligible pathway to the need being audited. If a system strategy fits another need better, prefer removing only the current need association rather than deleting the strategy globally before its other uses are reviewed.
- For system strategies, seek direct empirical support for the underlying behavioral mechanism when good research exists. Evidence supports a plausible strategy mechanism, not a guaranteed individual outcome.
- Require human-reachable scholarly URLs for strategy evidence under the same verification rules used for need-copy citations. Do not treat new strategy evidence as approved until the user has manually verified the URLs and agreed to the strategy change.
- Prefer a set of strategies that demonstrates flexibility. Different strategies should expose genuinely different routes toward the same need so users are not implicitly taught that one particular person, behavior, or solution is the only way to tend it.
- Avoid unnecessary duplication. Several strategies may involve social contact, for example, but each system strategy should add a meaningfully different action or mechanism.
- Accessibility matters. Do not turn a study-specific behavior such as eye contact into a universal requirement when a broader accessible action such as brief conversation or a follow-up question captures the supported mechanism.
- No system-strategy addition, removal, rewrite, or need-association change enters production until the user approves the exact strategy package and its evidence.

## Evidence standard

### Source hierarchy

Prefer, in roughly this order when the question permits:

1. systematic reviews and meta-analyses;
2. major peer-reviewed review articles or consensus/guideline documents from appropriate professional/scientific bodies;
3. strong longitudinal, experimental, or otherwise directly relevant primary research;
4. foundational theory papers when the claim is explicitly about that theory;
5. scholarly books or reference works for conceptual/history questions.

Secondary summaries, commercial wellness sites, popular press, search snippets, and unsourced institutional webpages should not be the authority for scientific claims when primary or peer-reviewed sources are available.

### Claim discipline

- **Theory is not empirical fact.** Use wording such as “Self-Determination Theory proposes…” when appropriate.
- **Association is not causation.** “Is associated with” should not become “causes,” “protects,” “improves,” or “leads to” without evidence supporting the causal language.
- **Mechanisms require mechanism evidence.** Do not infer nervous-system, hormonal, neural, evolutionary, or developmental mechanisms merely because an outcome association exists.
- **Universality requires unusually strong support.** Avoid “everyone,” “all humans,” “hard-wired,” “innate,” or “universal” unless the source and wording actually justify it.
- **Absence and frustration are different constructs.** For frameworks such as Basic Psychological Need Theory, distinguish low satisfaction from active frustration/thwarting when the literature does.
- **Do not medicalize ordinary experience unnecessarily.** Clinical professionalism means precision and restraint, not making normal feelings or needs sound pathological.
- **Do not cite by prestige alone.** A famous paper that is tangential is weaker support than a directly relevant paper with an appropriate design.
- Where evidence is mixed, limited, population-specific, correlational, or theory-dependent, say so.

## Citation practice for site copy

For each externally verifiable scientific claim, aim to retain enough structured citation information that a future reviewer can identify:

- authors;
- year;
- article/report title;
- journal or issuing body;
- DOI and/or PMID when one exists;
- **a stable, human-verifiable scholarly landing-page URL**;
- a short note stating **exactly what this source supports**;
- any important limitation that affects wording.

### Human-verifiable link requirement

A scientific citation is not complete for allneeds unless a person can follow a stored link to a recognizable scholarly record and independently verify the source's identity. Prefer the publisher's article page, PubMed/PMC, APA PsycNet, or another authoritative bibliographic landing page. A bare DOI may be retained as an identifier, but it should not be the only practical verification route when a stable human-facing record is available.

Agent/crawler accessibility is **not** the standard. Publishers increasingly use anti-scraping controls, bot checks, redirects, or `robots.txt` restrictions. If an agent cannot fetch a link that the user has manually verified in a normal browser, the agent must record that limitation rather than replacing the source with a more scrape-friendly secondary page. Never downgrade from a primary/authoritative record to a blog, search result, aggregator, or other weaker source merely because automated retrieval is easier.

When proposing citations in conversation, give the user a directly openable URL representation so they can manually verify it. Do not treat a source as approved merely because an agent can retrieve it.

When possible, keep identifiers and verification links separately: for example, retain the DOI as bibliographic metadata while making the clickable source URL a human-verifiable PubMed, PsycNet, PMC, or publisher record.

A source note should not overstate the paper. For example, a mortality meta-analysis can support an association between social relationships and survival across included studies; it should not by itself be used as proof that “connection is a basic psychological need.”

## Current review: Connection

### Production copy at start of review (2026-08-24)

The generated catalog currently contains this claim for **Connection**:

> “Forming strong social connections has profound benefits for both mental and physical health. Extensive research suggests that the quality and quantity of one’s social relationships are linked not only to psychological well-being but also to longevity and disease risk. In a large meta-analysis of 148 studies, individuals with richer social connections had about a 50% greater likelihood of survival over the study periods than those who were more isolated (Holt-Lunstad et al., 2010). In fact, the protective effect of social connection on mortality was found to be comparable to well-known health factors like not smoking and maintaining a healthy weight. Strong interpersonal connection provides emotional support, buffers stress, and contributes to greater life satisfaction, whereas lack of connection (loneliness) is associated with higher risks of depression and physical illness.”

The earlier short/original copy is:

> “As highly social creatures, humans often thrive on close relationships that provide mutual care. This need may drive us to spend meaningful time with others, share experiences, and cultivate trust and empathy. When we foster genuine connection, we gain emotional support and joy in companionship, and we build resilience through having others to lean on during difficult times.”

The user prefers the underlying structure and tone of this earlier short copy over attempts to define Connection. In particular, preserve the ideas that the need may drive or motivate behavior and that acting on those motivations can have useful outcomes.

### Initial assessment

The existing Holt-Lunstad et al. source is strong evidence that social relationship measures are associated with mortality outcomes, but it is not the best authority for the separate proposition that connection/relatedness itself should be treated as a basic or fundamental psychological need.

The current expanded paragraph also combines several distinct propositions, including mortality, disease risk, stress buffering, life satisfaction, depression, and the status of connection as a need. Those propositions should not all inherit authority from one mortality meta-analysis. Before changing the paragraph, review each claim separately and either source it directly, qualify it, or remove it if it is not doing useful work.

### Working citation pool with user-verified human links

These sources have human-reachable URLs that the user manually opened and verified. They are **working candidates, not yet final approval of the Connection package**.

**Baumeister, R. F., & Leary, M. R. (1995). _The need to belong: Desire for interpersonal attachments as a fundamental human motivation._ Psychological Bulletin, 117(3), 497–529.**  
Human-verifiable record: https://psycnet.apa.org/record/1995-29052-001  
DOI: 10.1037/0033-2909.117.3.497  
Use for: foundational belongingness review; evidence concerning a powerful motivation to form and maintain interpersonal bonds.  
Useful exact language from the abstract: “frequent, nonaversive interactions within an ongoing relational bond.”  
Important wording note: present this as a hypothesis evaluated against empirical literature, not as theory-free proof.

**Ryan, R. M., & Deci, E. L. (2000). _Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being._ American Psychologist, 55(1), 68–78.**  
Human-verifiable record: https://pubmed.ncbi.nlm.nih.gov/11392867/  
DOI: 10.1037/0003-066X.55.1.68  
PMID: 11392867  
Use for: foundational Self-Determination Theory framing in which relatedness is one of three postulated psychological needs and need satisfaction is linked with motivation and well-being.  
Important wording note: attribute the “basic psychological need” classification to SDT.

**Vansteenkiste, M., Ryan, R. M., & Soenens, B. (2020). _Basic psychological need theory: Advancements, critical themes, and future directions._ Motivation and Emotion, 44, 1–31.**  
Human-verifiable record: https://link.springer.com/article/10.1007/s11031-019-09818-1  
DOI: 10.1007/s11031-019-09818-1  
Use for: modern review of Basic Psychological Need Theory, including the distinction between need satisfaction and need frustration and the contemporary evidence base around relatedness.  
Useful exact language: relatedness “denotes the experience of warmth, bonding, and care” and is satisfied by “connecting to and feeling significant to others.”  
Important wording note: use this to explain BPNT's account, not to impose a formal definition of Connection on the site.

**Cacioppo, J. T., Cacioppo, S., & Boomsma, D. I. (2014). _Evolutionary mechanisms for loneliness._ Cognition & Emotion, 28(1), 3–21.**  
Human-verifiable full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC3855545/  
Human-verifiable PubMed record: https://pubmed.ncbi.nlm.nih.gov/24067110/  
DOI: 10.1080/02699931.2013.837379  
Use for: evolutionary theory concerning why sensitivity to perceived social isolation may have adaptive value.  
Useful exact language from the abstract: “loneliness serves a variety of adaptive functions in specific habitats.”  
Important wording note: this is an evolutionary account and review. Do not imply that loneliness is always adaptive, desirable, harmless, or beneficial when prolonged.

**Coan, J. A., & Sbarra, D. A. (2015). _Social Baseline Theory: The Social Regulation of Risk and Effort._ Current Opinion in Psychology, 1, 87–91.**  
Human-verifiable full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC4375548/  
Human-verifiable PubMed record: https://pubmed.ncbi.nlm.nih.gov/25825706/  
DOI: 10.1016/j.copsyc.2014.12.021  
Use for: Social Baseline Theory's proposal that access to relational partners can mitigate risk and reduce individual effort, supporting careful language about shared effort and social resources.  
Useful exact language from the abstract: SBT “suggests the human brain expects access to social relationships that mitigate risk and diminish the level of effort needed.”  
Important wording note: identify this as a theoretical perspective rather than settled mechanism.

**Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). _Social relationships and mortality risk: A meta-analytic review._ PLOS Medicine, 7(7), e1000316.**  
Human-verifiable record: https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316  
DOI: 10.1371/journal.pmed.1000316  
PMID: 20668659  
Use for: meta-analytic association between stronger social relationships and survival across 148 studies and 308,849 participants.  
Useful exact language: the authors report “a 50% increased likelihood of survival for participants with stronger social relationships.”  
Important wording note: this supports population-level observational association and consequence, not proof that Connection is a need or a guaranteed individual causal effect.

### Other previously identified candidates not yet user-approved for final use

Do not move these into the final Connection citation set unless the user is given a human-reachable URL, manually verifies it, and explicitly agrees that it belongs.

- Holt-Lunstad, Smith, Baker, Harris, & Stephenson (2015), loneliness/social isolation and mortality.
- Slavich (2020), Social Safety Theory.
- Tang, Wang, & Guerrien (2020), basic psychological need satisfaction and later-life well-being.

### Status / approval ledger

| Date | Area | Decision | Production copy changed? | Notes |
| --- | --- | --- | --- | --- |
| 2026-08-24 | Connection | Research initiated; candidate citations assembled | **No** | User requested a slow, careful evidence review. No replacement Connection wording has yet been approved. |
| 2026-08-24 | Citation infrastructure / Connection | Human-verifiable links required | **No** | Agent access restrictions must not cause substitution with weaker sources. |
| 2026-08-24 | Review process | Full-package approval required before any repo change except this file | **No** | User must agree to citations, human-reachable URLs, citation relevance, short copy, expanded copy, and implementation scope before production work begins. |
| 2026-08-24 | Editorial style | Do not define needs; preserve motivational/action framing; avoid em dashes; use direct scholarly quotations selectively | **No** | Expanded Details should explain why included citations are relevant. |
| 2026-08-24 | Connection citations | Six working sources have user-verified human-reachable URLs | **No** | Baumeister & Leary 1995; Ryan & Deci 2000; Vansteenkiste et al. 2020; Cacioppo et al. 2014; Coan & Sbarra 2015; Holt-Lunstad et al. 2010. Citation set is still provisional until user approves the complete package. |
| 2026-08-24 | Strategy review | Strategy provenance and evidence audit added to the review process | **No** | User-submitted strategies are immutable. System-authored strategies must be portable, directly relevant, evidence-aligned, non-filler, and meaningfully distinct. Exact Connection strategy changes remain provisional pending user approval and manual verification of any new evidence URLs. |

## Handoff for the next agent

1. Read this file before proposing scientific/clinical copy changes.
2. Do **not** make a broad “professionalize all copy” pass.
3. Continue with **Connection** unless the user chooses another item.
4. Keep all repo activity read-only except updates to this file until the user explicitly approves the complete Connection package.
5. Do not formalize Connection as a definition. Preserve the user's preferred orientation toward what the need may motivate and what can follow when those motivations can be acted on.
6. Avoid em dashes in proposed site copy.
7. Prefer concise, exact quotations from authoritative academic sources when they strengthen transparency and reader confidence.
8. The expanded Details section should explain what each citation contributes and clearly distinguish theory from empirical outcome evidence.
9. Audit strategies for provenance before content review. Never alter user-submitted strategies. System strategies need direct relevance, portability, distinctness, and appropriate evidence.
10. Before any production content edit, identify the canonical authoring source that generates `src/data/generated/legacyData.json`; do not manually treat generated output as canonical without evidence.
11. After the user approves the final citation set, all human-reachable URLs, the short description, the expanded Details copy, strategy changes, and implementation scope, make the production change through the repository's normal branch/PR workflow and append an approval ledger entry here.

## Open questions to resolve over time

- What file/process is the canonical authoring source for the generated legacy catalog?
- What citation presentation should users see in the UI (inline author-year, expandable sources, source notes, etc.) versus what should remain structured data?
- Should certain sentences be framed explicitly as NVC/SDT/framework language rather than general psychological fact?
- Which categories of copy require empirical sourcing, and which are clearly labeled reflective prompts or practical suggestions that should not be dressed up as scientific claims?
- How should evidence metadata for system-authored strategies be stored and surfaced so strategy research is auditable without implying guaranteed outcomes?

Keep this document cumulative but concise enough that a future agent can recover the editorial state without needing the original conversation.
