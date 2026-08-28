# Need Audit Handshake

> Status: mandatory readiness and verification protocol for every full Need audit.
>
> This document exists so that `I read the repo instructions` is testable. A full Need audit may not begin from memory, a previous handoff, or a partial reading of the rules. The agent must load the current repository contracts, demonstrate comprehension before substantive audit work, and then verify the finished proposal against the same checkpoints.

## Why this exists

Need audits combine several different kinds of constraints: the site's psychological model, epistemic limits, research standards, reader experience, strategy safety and usefulness, protected provenance, editorial style, canonical ownership, approval boundaries, and visual-review sequencing. Those rules live in several documents because they govern different parts of the product.

A shallow audit can technically cite research while still failing the product. This handshake is a proof-of-comprehension gate designed to prevent that failure.

The checklist is not ceremonial. **An agent may check an item only when it can restate the rule in its own words and explain what that rule changes about the audit it is about to perform.** `Read`, `reviewed`, `understood`, or a copied sentence from the source document is not sufficient evidence of comprehension.

If an agent loses context, is handed the work from another agent, or resumes after a substantial interruption, it must rerun the handshake before presenting an approval-ready proposal.

## Required reading before the handshake

For every full Need audit, read the current versions on the working base branch of:

1. `AGENTS.md`
2. `docs/AGENTS.md`
3. `docs/need-audit-handshake.md`
4. `docs/psychological-model.md`
5. `docs/content-evidence-review.md`
6. `docs/need-audit-proposal-format.md`
7. `docs/human-editorial-style.md`
8. `docs/editorial-style-refinements-2026-08-27.md`
9. `docs/need-function-lenses.md`
10. `docs/system-strategy-evidence-standard.md`
11. `src/data/AGENTS.md`
12. `docs/honesty-content-audit.md` as the current reference for a completed unified Need audit, strategy-evidence correction, canonical migration, legacy retirement, and separate magnet approval.
13. `docs/understanding-content-audit.md` before proposing function lenses, and whenever the audited Need plausibly contains more than one distinguishable function.
14. Any authoritative audit record already named in the repository for the Need being audited or a directly reused content structure.

Also inspect, rather than merely assume:

- the current canonical entry for the target Need in `src/data/editorialCatalog.json`, if one exists;
- the target Need's current record and strategy associations in `src/data/generated/legacyData.json`, while remembering that legacy is historical evidence rather than an authoring authority;
- `src/data/userStrategies.json` for protected repository-resident user strategies;
- relevant neighboring Need pages when conceptual overlap is a real risk.

The handshake must reflect the **current files**, not remembered rules from an earlier audit.

## First visible response: readiness handshake

When the user asks for a full Need audit, the first visible substantive response must be a completed **Need Audit Handshake** before the agent presents research conclusions or an approval proposal.

Use the exact checkpoint IDs below. Each checked line must contain a short statement of what the agent learned and how it constrains this audit. The wording does not have to match this document, and copying these descriptions verbatim is discouraged because the purpose is to demonstrate comprehension.

The response should use this shape:

```text
# Need Audit Handshake — {Need}

- [x] H01 · Psychological pathway — {what the model requires and what that changes here}
- [x] H02 · Need validity and non-conflict — {...}
...
- [x] H18 · Proposal and verification boundary — {...}

HANDSHAKE COMPLETE — {Need} audit may proceed.
```

Do not check a box speculatively. If a rule is unclear, reread its source before continuing.

## Handshake checkpoints

### H01 · Psychological pathway and inference limits

The agent understands **Observation / situation → Feeling → Need / value / motivation → Strategy** as different kinds of information. Feelings are clues, not deterministic proof of one exact Need or cause. A person, action, demand, outcome, or particular solution belongs at Strategy level rather than being treated as the Need itself.

### H02 · Need validity and non-conflict

The agent understands that every listed Need is treated as a normal, valid human value or motivation. Needs themselves do not compete or conflict. Tension belongs at the level of strategies, circumstances, resources, timing, information, support, or currently available solutions. Validating a Need does not validate every behavior used in its name.

### H03 · Reader state and intended impression

The agent understands that a Need page is not a neutral encyclopedia entry. A reader may arrive while activated, ashamed, confused, disappointed, threatened, or ruminating. The page should help the reader leave with an understanding approximately like: `It makes sense that this matters to me; other humans experience this; there are understandable reasons this motivation exists; it may tell me something useful about what matters to me; and I can do something to tend it.` The page should create that impression through evidence and humane writing rather than unsupported reassurance.

### H04 · Alone-after-activation adversarial test

The agent understands the standing scenario in `docs/psychological-model.md`: imagine someone alone in a house or car, looking at their phone, processing a large feeling after leaving the situation that activated the Need. They may not feel safe, ready, or willing to re-enter that situation or contact another person. The Need page must still provide recognition and practical agency. Whenever a self-contained strategy is possible, the deck should not make tending the Need depend on confrontation, disclosure, another person's cooperation, or solving the original situation first.

### H05 · Conceptual clarity without false definition

The agent can distinguish conceptual orientation from formal definition. The audit should make the Need stable enough to distinguish from neighboring Needs and Strategies without inventing necessary-and-sufficient conditions, a fixed scientific essence, or an authoritative taxonomy that the literature does not establish.

### H06 · Claim type and source-to-claim fit

The agent will distinguish framework/editorial language, empirical description, association, causal claim, theory, clinical guidance, and interpretation. A citation must support the exact proposition being made, not merely concern the same broad topic. A real paper attached to the wrong claim is still a failed citation.

### H07 · Evolutionary and theoretical restraint

The agent will actively look for evolutionary, anthropological, developmental, motivational, clinical, or other functional grounding when relevant, but will keep ultimate and proximate explanations distinct. Theories remain theories. Present-day usefulness does not prove adaptation. The site will not call a Need innate, universal, hard-wired, evolved-for, or a formally established basic psychological need without evidence strong enough for that exact claim.

### H08 · One-paragraph Evidence and citation footholds

For an ordinary Need, the short Evidence copy is one tight paragraph that combines conceptual orientation, normalization/function, plausible motivation, necessary distinctions, and a visible conceptual foothold for every public Need-level citation. The paragraph must not become a compressed literature review. If the source set cannot fit naturally, reduce or rethink the sources rather than sprawling the paragraph.

### H09 · Details are source-first public explanation

Details should explain what the cited research examined and found in ordinary language. It must not read like an internal audit report, annotated bibliography, or sequence of broad claims followed by caveat walk-backs. Important limitations and evidence classifications belong in the internal audit record unless they are themselves necessary public information.

### H10 · Function lenses must qualify

The agent will test function lenses only when useful and will require all three conditions: a distinct lived function, distinct evidence that benefits from separate treatment, and practical recognition value. Different contexts, self-versus-other framing, or an available academic subdivision are not enough. A unified Need is the default when the qualification rule is not met.

### H11 · Strategy clinical defensibility

Every system strategy must be a low-risk action a well-trained psychologist could reasonably recommend or a careful translation of established clinical practice. The agent will distinguish direct intervention evidence, established evidence-based clinical practice, clinically grounded translation, and official resources. Mechanism evidence by itself does not justify inventing a novel exercise.

### H12 · Strategy agency and distinct pathways

Strategies must tend the Need itself rather than extend rumination about the trigger. They should widen the reader's options, preserve choice, and avoid unnecessary dependence on another person's cooperation. A smaller defensible deck is better than filler, and cards should represent genuinely useful pathways rather than cosmetic variations of one prompt.

### H13 · Protected provenance and association discipline

The agent will inspect `src/data/userStrategies.json` and preserve every protected user-authored title, wording, attribution, and Need association unless the user explicitly authorizes that specific change. User submissions do not receive retrofitted academic citations. Rejecting a system strategy for one Need removes only that association unless a separate global discard is explicitly approved.

### H14 · Human-reachable URL invariant

Every public or canonical research URL must be the direct raw human-facing destination. Strip tracking and referral parameters. Do not use ChatGPT/OpenAI links, search results, link shorteners, crawler/proxy endpoints, or machine-access workarounds. Human browser reachability is authoritative, and the exact final URL must be checked before approval.

### H15 · Human editorial style

The final public copy must pass the repository's editorial style review: no em dashes, no forced rhetorical groups of three, no stock contrast or generic signposting, no unnecessary elevated or abstract phrasing, no unexplained technical terms, no repeated template skeletons, no automatic comprehensiveness, and no broad claim followed by a mechanical walk-back. Style edits may never strengthen claims beyond their evidence.

### H16 · Complete-package approval and visual separation

Research-facing production content does not change until the user explicitly approves the complete package: short copy, Details, sources and URLs, strategies and strategy evidence, provenance decisions, and intended implementation scope. Magnet review is a separate approval stage after content implementation. A Need is fully audited only when approved content and an approved production magnet are both live.

### H17 · Canonical ownership and legacy retirement

Implementation after approval must obey Bedrock: **one canonical source → one deterministic compiler/owner → final production asset**. `legacyData.json` is a historical migration source, not an authoring surface. Move complete ownership first, verify the compiler consumes the canonical source, add regression coverage, and only then remove the superseded legacy entity or association. Never add a runtime repair layer to recreate deleted legacy data.

### H18 · Proposal and verification boundary

The agent understands that audit reasoning and the official site-facing proposal are separate artifacts. Before the proposal, it must complete the deterministic verification matrix below using these same H01–H18 IDs. The official proposal itself begins at `# Need for {Need}` and remains site-content only through its final line. No research commentary, implementation notes, approval question, or recap appears inside or after that proposal artifact.

## Pre-proposal verification matrix

After research and drafting are complete, but **before** the official proposal, produce a verification artifact titled:

`# Need Audit Verification — {Need}`

Use this exact column structure:

| Checkpoint | Result | Where checked | What was verified |
| --- | --- | --- | --- |
| H01 | PASS / FAIL | exact proposal section or audit step | concise concrete explanation |
| ... | ... | ... | ... |
| H18 | PASS / FAIL | ... | ... |

Rules:

- Use all H01–H18 checkpoints in order.
- `PASS` requires a concrete explanation. A bare `PASS`, `complies`, or `see above` does not count.
- `Where checked` should name the exact proposal location when the checkpoint concerns public content, such as `Evidence sentence 1`, `Details paragraph 3`, `Strategy: Map your options`, or `Supporting sources #2`. For process/ownership checkpoints, name the exact audit step or implementation gate that was checked.
- If H10 concludes that lenses are not warranted, record the result as `PASS` and state why the three-part qualification test did not justify them. Do not mark it `N/A` merely because the final proposal is unified.
- A checkpoint may not be marked `PASS` if the agent knows of an unresolved mismatch.
- Any `FAIL` means the proposal is not approval-ready. Fix the draft and rerun the matrix before showing the official proposal.
- The matrix is verification metadata and is **not part of the site-facing proposal**.

After the matrix passes, place the official proposal immediately after it. From the first character of `# Need for {Need}` through the final strategy/source line, follow `docs/need-audit-proposal-format.md` exactly. Do not append commentary after the proposal.

## Deterministic final check

Before sending an approval-ready response, the agent should be able to answer all of the following without reopening the documents:

- What psychological job is this page doing for a reader right now?
- What exactly is the Need pointing toward, and what neighboring concepts could be confused with it?
- Why might this motivation make human sense, at the strength the evidence actually permits?
- Which sentence in the short Evidence paragraph gives each public source its reason to exist?
- What does each Details paragraph add that the short copy already foreshadowed?
- Could the alone-after-activation reader use at least one useful strategy without re-entering the triggering situation when a self-contained route is clinically reasonable?
- Is every system strategy supported at the action level rather than merely by a Need-level mechanism?
- Did any user-authored content change without explicit authorization?
- Can every public source URL be pasted directly into a normal browser without tracking or an intermediary?
- Is the exact proposed wording free of the repository's known AI-style habits without becoming less precise?
- Has any production edit happened before complete-package approval?
- After approval, will there be exactly one canonical owner rather than a legacy record plus a repair layer?

If the agent cannot answer one of these confidently from the work already done, the audit is not ready to present.