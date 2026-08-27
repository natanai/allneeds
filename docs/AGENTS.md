# Documentation and content-audit agent contract

This file supplements the root `AGENTS.md` for work under `docs/`.

## Full Need audit proposal format

Before presenting an official, full, final, or approval-ready Need content audit proposal, read `docs/need-audit-proposal-format.md` and follow it exactly.

The proposal shown to the user is **site-content only**. Do not wrap it in analysis, rationale, change summaries, removal lists, implementation notes, source-role commentary, approval prompts, or other surrounding description text. Internal audit records may contain those details; the official proposal artifact may not.

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
