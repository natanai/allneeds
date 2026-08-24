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

When possible, keep identifiers and verification links separately: for example, retain the DOI as bibliographic metadata while making the clickable source URL a human-verifiable PubMed, PsycNet, or publisher record.

A source note should not overstate the paper. For example, a mortality meta-analysis can support an association between social relationships and survival across included studies; it should not by itself be used as proof that “connection is a basic psychological need.”

## Current review: Connection

### Production copy at start of review (2026-08-24)

The generated catalog currently contains this claim for **Connection**:

> “Forming strong social connections has profound benefits for both mental and physical health. Extensive research suggests that the quality and quantity of one’s social relationships are linked not only to psychological well-being but also to longevity and disease risk. In a large meta-analysis of 148 studies, individuals with richer social connections had about a 50% greater likelihood of survival over the study periods than those who were more isolated (Holt-Lunstad et al., 2010). In fact, the protective effect of social connection on mortality was found to be comparable to well-known health factors like not smoking and maintaining a healthy weight. Strong interpersonal connection provides emotional support, buffers stress, and contributes to greater life satisfaction, whereas lack of connection (loneliness) is associated with higher risks of depression and physical illness.”

At the start of this review, the entry lists only Holt-Lunstad, Smith, & Layton (2010) as a supporting source.

### Initial assessment

The existing Holt-Lunstad et al. source is strong evidence that social relationship measures are associated with mortality outcomes, but it is not the best authority for the separate proposition that connection/relatedness itself should be treated as a basic or fundamental psychological need.

The current paragraph also combines several distinct propositions—mortality, disease risk, stress buffering, life satisfaction, depression, and the status of connection as a need. Those propositions should not all inherit authority from one mortality meta-analysis. Before changing the paragraph, review each claim separately and either source it directly, qualify it, or remove it if it is not doing useful work.

### Candidate sources: direct support for belonging / relatedness as a need

**Baumeister, R. F., & Leary, M. R. (1995). _The need to belong: Desire for interpersonal attachments as a fundamental human motivation._ Psychological Bulletin, 117(3), 497–529.**  
Human-verifiable record: https://psycnet.apa.org/record/1995-29052-001  
DOI: 10.1037/0033-2909.117.3.497  
Verification note: user manually verified the APA PsycNet record on 2026-08-24. Automated access may be blocked by APA's crawler restrictions; that is not grounds to replace this link.  
Use for: the belongingness hypothesis; the authors evaluate evidence for a pervasive motivation to form and maintain lasting, positive interpersonal bonds.  
Important wording note: this is a foundational theoretical/empirical review supporting a hypothesis, so prefer language such as “Baumeister and Leary argued/reviewed evidence that…” over “science proves humans need…”

**Ryan, R. M., & Deci, E. L. (2000). _Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being._ American Psychologist, 55(1), 68–78.**  
Human-verifiable record: https://pubmed.ncbi.nlm.nih.gov/11392867/  
DOI: 10.1037/0003-066X.55.1.68  
PMID: 11392867  
Verification note: user manually verified this PubMed record on 2026-08-24.  
Use for: within Self-Determination Theory, relatedness is one of three proposed basic psychological needs (with autonomy and competence), with need satisfaction linked to motivation and well-being.  
Important wording note: attribute the “basic psychological need” classification to SDT rather than presenting one theory’s taxonomy as theory-free fact.

**Vansteenkiste, M., Ryan, R. M., & Soenens, B. (2020). _Basic psychological need theory: Advancements, critical themes, and future directions._ Motivation and Emotion, 44, 1–31.**  
Human-verifiable record: https://link.springer.com/article/10.1007/s11031-019-09818-1  
DOI: 10.1007/s11031-019-09818-1  
Verification note: user manually verified this Springer record on 2026-08-24.  
Use for: a modern review of Basic Psychological Need Theory; relatedness is described as warmth, bonding, care, connecting to others, and feeling significant to them. The review also discusses criteria for calling a psychological motive a “basic need” and the evidence base across contexts and cultures.  
Important wording note: especially useful for defining what “need” means in this theoretical literature and avoiding casual use of the term.

### Candidate sources: health/outcome relevance of social relationships

**Holt-Lunstad, J., Smith, T. B., & Layton, J. B. (2010). _Social relationships and mortality risk: A meta-analytic review._ PLOS Medicine, 7(7), e1000316.**  
DOI: https://doi.org/10.1371/journal.pmed.1000316  
PMID: 20668659  
Use for: meta-analytic association between stronger social relationships and survival across 148 studies / 308,849 participants.  
Important wording note: the paper reports observational mortality associations. Avoid turning its effect estimate into a universal individual prediction or using it alone to prove that connection is a basic psychological need.

**Holt-Lunstad, J., Smith, T. B., Baker, M., Harris, T., & Stephenson, D. (2015). _Loneliness and social isolation as risk factors for mortality: A meta-analytic review._ Perspectives on Psychological Science, 10(2), 227–237.**  
DOI: https://doi.org/10.1177/1745691614568352  
PMID: 25910392  
Use for: associations of loneliness, social isolation, and living alone with mortality risk across included studies.  
Important wording note: useful when discussing isolation/loneliness as distinct constructs; neither should automatically be treated as the simple inverse of “connection.”

**Slavich, G. M. (2020). _Social Safety Theory: A biologically based evolutionary perspective on life stress, health, and behavior._ Annual Review of Clinical Psychology, 16, 265–295.**  
DOI: https://doi.org/10.1146/annurev-clinpsy-032816-045159  
PMID: 32141764  
Use for: a peer-reviewed theoretical review of social safety/threat and proposed psychobiological pathways linking social experiences with stress and health.  
Important wording note: use only if the Connection copy actually needs a mechanistic/evolutionary explanation; label it as theory/review rather than using it to decorate a simpler claim with neuroscience.

### Potential additional evidence (not yet necessary for production copy)

**Tang, M., Wang, D., & Guerrien, A. (2020). _A systematic review and meta-analysis on basic psychological need satisfaction, motivation, and well-being in later life: Contributions of self-determination theory._ PsyCh Journal, 9(1), 5–33.**  
DOI: https://doi.org/10.1002/pchj.293  
PMID: 31177644  
Use for: synthesis of basic psychological need satisfaction and well-being in later life.  
Limitation: age/population scope means it should not be generalized to all people without other evidence.

### Status / approval ledger

| Date | Area | Decision | Production copy changed? | Notes |
| --- | --- | --- | --- | --- |
| 2026-08-24 | Connection | Research initiated; candidate citations assembled | **No** | User requested a slow, careful evidence review. No replacement Connection wording has yet been approved. |
| 2026-08-24 | Citation infrastructure / Connection | Human-verifiable links required; three direct-need sources manually verified | **No** | User supplied verified APA PsycNet, PubMed, and Springer landing pages. Agent access restrictions must not cause substitution with weaker sources. |

## Handoff for the next agent

1. Read this file before proposing scientific/clinical copy changes.
2. Do **not** make a broad “professionalize all copy” pass.
3. Continue with **Connection** unless the user chooses another item.
4. The next useful step is to audit the existing Connection paragraph claim by claim and propose the smallest evidence-aligned revision, with each sentence mapped to a source.
5. Do not edit production Connection copy until the user approves the proposed wording.
6. Before any production content edit, identify the canonical authoring source that generates `src/data/generated/legacyData.json`; do not manually treat generated output as canonical without evidence.
7. For every scientific citation, preserve a human-verifiable authoritative landing-page URL even when automated agents cannot crawl it. Record DOI/PMID separately when available.
8. After an approved production change, append a ledger entry here with the exact scope, sources, limitations, files changed, and validation performed.

## Open questions to resolve over time

- What file/process is the canonical authoring source for the generated legacy catalog?
- What citation presentation should users see in the UI (inline author-year, expandable sources, source notes, etc.) versus what should remain structured data?
- Should certain sentences be framed explicitly as NVC/SDT/framework language rather than general psychological fact?
- Which categories of copy require empirical sourcing, and which are clearly labeled reflective prompts or practical suggestions that should not be dressed up as scientific claims?

Keep this document cumulative but concise enough that a future agent can recover the editorial state without needing the original conversation.
