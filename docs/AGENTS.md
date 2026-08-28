# Documentation and content-audit agent contract

This file supplements the root `AGENTS.md` for work under `docs/`.

## Mandatory Need audit handshake

Before researching, drafting, revising, or presenting a full Need audit, read and complete `docs/need-audit-handshake.md`. The H01–H18 checklist is a proof-of-comprehension gate, not a file-open checklist. The first visible substantive audit response must demonstrate what each rule means and how it constrains the target Need.

Before an approval-ready proposal, rerun those same H01–H18 checkpoints through the required verification matrix. The verification matrix is reviewer-facing metadata and appears immediately before the official proposal. The official proposal artifact itself begins at `# Need for {Need}` and remains site-content only through its final line.

## Canonical psychological model

Before auditing, drafting, revising, or approving any Need, Feeling, Observation, or Strategy content, read `docs/psychological-model.md` and treat it as a hard product-model contract.

Need audits must preserve the site's NVC-informed Observation / situation → Feeling → Need / value / motivation → Strategy model. In particular: Needs are normal and valid; Needs themselves do not compete or conflict; apparent conflict belongs at the level of Strategies, circumstances, resources, timing, information, support, or currently available solutions; and a Need page must help a reader understand why the motivation can make sense and then move toward practical ways to tend it.

A proposal is not approval-ready merely because its citations are accurate. It must also pass the model check in `docs/psychological-model.md`, including the reader-experience target, the standing alone-after-activation adversarial scenario, and the requirement that system strategies help tend the Need rather than merely extend rumination about the triggering situation.

## Full Need audit proposal format

Before presenting an official, full, final, or approval-ready Need content audit proposal, read `docs/need-audit-proposal-format.md` and follow it exactly.

Before presenting that proposal, also read and apply `docs/human-editorial-style.md`. The final site-facing copy must pass that human editorial review before it is shown for approval. Do not treat this as AI-detector evasion or add any runtime/post-processing "humanizer". The canonical proposed wording itself must avoid unnecessary templated AI-style habits while preserving accuracy and accessibility.

The approval-ready response contains the mandatory H01–H18 verification matrix followed by the official proposal artifact. **The official proposal artifact is site-content only.** Do not place analysis, rationale, change summaries, removal lists, implementation notes, source-role commentary, approval prompts, or other surrounding description inside or after that artifact. Internal audit records may contain those details.

## Current Safety record

For Safety content or strategy work, read `docs/safety-content-audit.md` first. It is the authoritative current Safety audit and supersedes the older Safety section in `docs/content-evidence-review.md`. Do not resurrect superseded Safety copy, citations, strategy titles, wording, or static Nat strategy references from the historical section.

## Protected user submissions

`src/data/userStrategies.json` is the canonical registry for repository-resident user-submitted strategies, including strategies published by the `Upload user submitted strategies` GitHub Action. **Every entry in that file is protected user-authored content.** Do not rewrite, rename, delete, reattribute, add academic citations to, or change Need associations for those entries unless the user explicitly authorizes that specific change.

Do not hard-code an assumption that Autumn is the only repository-resident user contributor. New protected submissions are expected to be added over time through the upload workflow. Historical legacy copies may exist for older submissions, but current static user provenance must be derived from the published user-strategy registry rather than from incidental contributor fields in the legacy snapshot. Nat's profile-owned strategies remain separate and must not be restored to this registry from historical repository data.

This rule supersedes older audit wording that describes a fixed number of repository-resident user submissions.

## System strategy evidence

Before documenting, approving, or revising any system-authored strategy in a content audit, read and follow `docs/system-strategy-evidence-standard.md`.

The evidence bar is **clinical defensibility**, not a requirement that every exact card instruction have its own randomized trial. Use the standard expected of a reputable psychological center: the strategy should be something a well-trained psychologist could reasonably recommend as a low-risk supportive action, and an academic reviewer should be able to trace the rationale to credible research or authoritative clinical guidance.

Prefer direct intervention evidence when it exists. Also allow established evidence-based clinical practices and carefully documented low-risk translations of supported therapeutic principles. Do not approve pseudoscience, speculative exercises invented only from Need-level theory, weak studies treated as definitive, mechanism-only claims presented as treatment evidence, or wording that overstates what the source establishes.

Record whether support is direct evidence, established clinical practice, clinically grounded translation, or an official resource when that distinction matters. Keep claims calibrated to the evidence and note important limitations internally.

If a strategy is questionable after that review, omit it rather than preserving it for deck size or variety. Production content still follows the complete-package approval gate in `docs/content-evidence-review.md`.

Every approved system strategy must retain the standardized visible **`Supporting source ↗`** link. Genuine user submissions remain governed by protected user-provenance rules and do not require scholarly citations.
