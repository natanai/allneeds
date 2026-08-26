# Need Function Lenses

> Status: standing editorial and implementation rule.
>
> Established during the Understanding audit on 2026-08-26.

## Purpose

Some everyday Need labels can reasonably gather more than one related psychological or behavioral function under one human-readable concept. When forcing those functions into one undifferentiated explanation would blur meaningful distinctions or stretch evidence beyond what it actually supports, allneeds may use optional **function lenses** within a single Need page.

A function lens is not a second Need and is not a formal scientific definition. It is a reader-facing way to show that the same broad Need can arise through distinguishable functions or motivational pathways.

The goal is recognition and evidence precision, not taxonomy for its own sake.

## Qualification rule

A Need should receive function lenses only when **all three** conditions are met:

1. **Distinct lived function:** the proposed functions are meaningfully distinguishable in ordinary experience, not merely different wording for the same thing.
2. **Distinct evidence:** scholarship supports treating the functions separately enough that combining them would obscure source-to-claim fit, important limitations, or genuine theoretical distinctions.
3. **Recognition value:** showing the distinction helps a reader recognize, communicate, or tend the Need differently.

If any one of these conditions is missing, keep one unified Need explanation.

Do not add lenses merely because a concept can be subdivided academically. Prefer the simpler page when the distinction does not materially help the reader.

## Editorial rules

- Keep one canonical Need title and one unified short/main description.
- Introduce lenses as ways the Need **can function**, **can involve**, or **can show up**, not as competing formal definitions.
- Avoid labels such as `Definition 1` and `Definition 2` unless unusually strong scholarship establishes actual technical definitions and the user explicitly approves that framing.
- Each lens should have a short, plain-language title and a concise recognition-oriented summary.
- A brief first-person recognition cue may be used when helpful, for example `I want to understand this` versus `I want us to understand each other`. Such cues are editorial recognition aids, not empirical quotations or diagnostic criteria.
- Each lens may have its own expanded narrative and citation set when that improves source-to-claim fit.
- Sources should live with the lens they actually support. Do not duplicate a source across lenses merely to make both sets look substantial.
- Overall Need-level sources may remain only when they genuinely span the umbrella concept rather than one particular lens.
- Keep theory, association, causal evidence, clinical guidance, and editorial interpretation distinguished exactly as required by `docs/content-evidence-review.md`.
- Function lenses do not authorize stronger claims about universality, innateness, adaptation, or the existence of a scientifically established discrete Need.

## Strategy relationship

Strategies continue to belong to the canonical Need unless a future approved product decision introduces lens-specific strategy metadata.

During an audit, reviewers should still ask which functional pathway a strategy addresses. A healthy deck should ideally cover meaningfully different useful pathways rather than clustering around only one lens, but no filler should be added to create artificial symmetry.

Protected user strategies remain governed by `src/data/userStrategies.json` and the protected-user-content rules. A lens does not authorize changing a user strategy's wording, provenance, or Need associations.

## Canonical data and rendering rule

Function lenses must follow the repository's ownership rule:

> One canonical source -> one deterministic compiler/owner -> the final production asset.

When implemented, lens content belongs in the canonical editorial Need data, not in page-specific conditionals, runtime repair logic, or a second patch layer.

The runtime Need model may expose an optional lens collection. The existing single-summary/single-evidence behavior must remain the default for Needs without lenses.

The Need page must render lenses generically from data. Do not implement slug-specific presentation such as `if need.slug === 'understanding'`.

The implementation should remain backward-compatible with Needs that have no lenses and should not force existing audited Needs into the new structure.

## Presentation rule

When lenses are present, both should remain readily visible so the feature actually teaches the distinction. Do not default to a tab design that hides one function behind the other.

Preferred presentation is a compact `This need can involve` or equivalent section with stacked cards on narrow screens and an appropriate side-by-side treatment on wider screens when readable. Each lens can expose its own Details and citations without turning the page into separate mini-pages.

Reuse the existing Need-page visual language and Customizer-owned theme roles. Do not create fixed lens colors or an Understanding-specific visual system.

## Approval and audit boundary

Function lenses are part of the complete Need content package and require explicit user approval before production implementation.

A complete package for a lensed Need must include:

- the unified short/main description;
- each lens title and recognition summary;
- each lens expanded narrative, when used;
- each lens citation set and internal source-role/limitation notes;
- any overall Need-level evidence retained outside the lenses;
- the full strategy audit and provenance decisions;
- intended implementation scope.

Adding, removing, renaming, or materially reframing a lens after approval reopens that Need's content review.

Do not retrofit lenses onto Connection, Support, Safety, or another already audited Need solely because the feature exists. Reconsider an existing Need only through a new review cycle when the qualification rule independently warrants it.

## First candidate: Understanding

Understanding is the first candidate identified for this structure. The audit is considering two distinguishable functions: making sense of information, events, causes, or uncertainty; and understanding between people. Recording this candidate does not itself approve the final Understanding wording, citations, strategies, schema implementation, or production UI. Those remain subject to the complete-package approval gate.
