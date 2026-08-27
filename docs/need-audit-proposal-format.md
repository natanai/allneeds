# Full Need Audit Proposal Format

> Standing repository rule for the user-facing approval proposal at the end of a full Need content audit. This supplements `docs/content-evidence-review.md` and controls proposal presentation when the two documents address different concerns.

## Core distinction

The internal audit and the official proposal are different artifacts.

The **internal audit** may contain research notes, source-role analysis, limitations, provenance checks, strategy dispositions, rejected alternatives, implementation planning, and other material needed to reach a defensible result.

The **official full Need audit proposal shown to the user for approval** is a clean snapshot of the final site-facing content being proposed. It is not an audit report and must not contain the reasoning that produced it.

## Hard rule: site content only

From the first character of the official proposal through the last, include only content that is proposed to appear on the site, plus the links that content will use.

Do not add any surrounding description text before, between, or after the proposed site content. In particular, do not include:

- a preface, summary, recommendation, or explanation of the proposal;
- phrases such as `I recommend`, `here is the proposal`, `why this works`, `what changed`, or `for approval`;
- research commentary, source-role notes, evidence-strength discussion, or limitations that will remain internal;
- strategy-removal lists, rejected strategies, migration notes, or comparisons with the old page;
- slugs, evidence classifications, internal provenance labels, implementation scope, file paths, branch/PR plans, test plans, or other repository metadata;
- confidence statements, caveats addressed to the user, or an approval question after the content;
- any prose whose purpose is to explain the proposal rather than be part of the proposed site itself.

A formal proposal therefore begins directly with the Need's site-facing content and ends directly with the last piece of proposed site-facing content.

## What the proposal must show

Show the complete final static audited state for every site-facing area owned by the audit. Use the same order and labels the Need page uses where practical.

For an ordinary Need without function lenses, the proposal contains:

1. the Need title;
2. the exact main Evidence copy;
3. the exact Details copy, when present;
4. the exact public Supporting sources and raw human-facing URLs;
5. the final static Strategies deck in display order;
6. for each system strategy, its exact title, card wording, and `Supporting source ↗` link target;
7. for each protected repository-resident user strategy in that final static deck, its exact title, wording, and contributor text exactly as it will render.

For a Need with approved function lenses, also show the exact site-facing `This need can involve` content for every lens:

- lens title;
- recognition cue, when present;
- lens summary;
- lens Details copy, when present;
- lens Supporting sources and raw human-facing URLs.

Do not add an umbrella source section merely for proposal symmetry if the approved site structure does not contain one.

Dynamic community/profile strategies are not part of the canonical static audit proposal because they are loaded from community/profile storage rather than owned by the static Need audit. Repository-resident protected user strategies that are part of the static deck are included because they are part of the final site state.

## Details: source-grounded explanation

The Details area exists for readers who want to understand the evidence underneath the shorter Need copy. Its primary job is to explain, in readable prose, what the cited research actually examined and found so that the shorter description feels traceable to its sources.

Write Details **from the citations outward**, not from a broad claim backward toward a citation.

- Every empirical statement in Details must be completely supported by the citation attached to that passage.
- Prefer describing the study or review itself: what researchers examined, the population or setting when materially relevant, what they found, and the narrow distinction or function that finding helps illuminate.
- Let the connection between the cited evidence and the shorter Need description emerge through the explanation. Do not repeatedly announce `this supports our definition` or otherwise turn Details into internal audit commentary.
- Do not make a stronger or broader claim and then repair it with a sentence beginning `however`, `this does not show`, `this does not establish`, `because the evidence is correlational`, or similar walk-back language. If a qualification would be necessary to make the preceding claim accurate, narrow the preceding claim instead.
- Scope information may still be stated when it is itself useful for understanding what the citation studied. For example, saying that a meta-analysis concerned workplace role ambiguity or that an intervention study concerned health decisions can help a reader understand the evidence without first overstating it.
- Do not convert association into causation, a specific experimental result into a universal principle, a clinical construct into a definition of the Need, or processing ease into truth or understanding.
- Details should not contain uncited synthesis claims that go materially beyond the cited studies. If a synthesis statement is important enough to appear, it must be directly warranted by the cited evidence available in that section.
- Internal limitations, evidence classifications, reasons for rejecting broader wording, and source-to-claim policing belong in the internal audit record, not in the public Details prose.

A useful paragraph usually has this shape: **study/review context → actual finding → restrained conceptual implication**. The implication must remain inside what the evidence can bear.

## Final-state semantics

The proposal is a final-state snapshot, not a change log.

The Strategies section is the proposed final static deck. A grandfathered system strategy that is not shown there is not part of the proposed audited deck. Do not append a separate `Removed strategies` section to explain its absence.

Likewise, do not annotate unchanged retained content with labels such as `unchanged`, `kept`, or `existing`. If it is part of the final audited site state and belongs in the proposal, show the content itself.

Internal records must still preserve the complete-package approval information required by `docs/content-evidence-review.md`, including evidence roles and limitations, protected provenance, explicit removal/discard decisions, and implementation scope. Those records are not pasted into the official proposal.

## Allowed structure

Markdown may be used to make the proposal readable, but headings and labels should represent actual site information architecture or the proposed content itself rather than editorial commentary.

A normal non-lensed proposal should follow this shape:

```text
# Need for {Need}

## Evidence
{exact main copy}

### Details
{exact expanded copy}

### Supporting sources
1. {exact public citation description}
   {raw URL}
2. ...

## Strategies

### {strategy title}
{exact strategy card wording}
[Supporting source ↗]({raw supporting URL})

### {user strategy title}
{exact protected user wording}
{exact contributor text as rendered}
```

A lensed proposal should follow this shape where applicable:

```text
# Need for {Need}

## Evidence
{exact umbrella main copy, if the site has it}

## This need can involve

### {lens title}
{recognition cue}

{lens summary}

#### Details
{lens narrative}

#### Supporting sources
1. {exact public citation description}
   {raw URL}

### {next lens title}
...

## Strategies
...
```

The placeholder text above documents structure only. Never include placeholder labels, internal annotations, or explanatory prose in an actual official proposal.

## Revision behavior

During collaborative drafting, the user may ask questions, compare alternatives, or request rationale. Normal discussion is allowed during that exploratory phase.

Once the assistant presents something as the **official**, **full**, **final**, or **approval-ready** Need audit proposal, this format becomes mandatory. If the user asks for a revised official proposal, return the revised site-content-only proposal again rather than wrapping it in a recap of the revisions.

After the user approves it, implementation/reporting messages may return to normal conversational form. The site-content-only restriction applies specifically to the official proposal artifact shown for approval.
