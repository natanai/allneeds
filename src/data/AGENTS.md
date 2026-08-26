# Strategy-data agent contract

This file supplements the root `AGENTS.md` for work under `src/data/`.

## Current Safety record

For Safety data, strategy, citation, or copy work, read `docs/safety-content-audit.md` before editing. It is the authoritative current Safety audit and supersedes the older Safety section in `docs/content-evidence-review.md`.

## Current Understanding record

For Understanding data, function-lens structure, strategy, citation, or copy work, read `docs/understanding-content-audit.md` before editing. It is the authoritative current Understanding audit. Understanding is the first approved production use of the function-lens model.

## Need function lenses

Before proposing or implementing multiple functions, facets, pathways, or sub-meanings within one Need, read `docs/need-function-lenses.md` and follow its qualification, editorial, rendering, and approval rules.

Function lenses are optional and must earn their place through three requirements: a meaningfully distinct lived function, distinct evidence that benefits from separate source-to-claim treatment, and practical recognition value for the reader. Do not subdivide Needs merely because an academic taxonomy is possible.

When lenses are approved, they remain part of one canonical Need. Their content must be owned by canonical editorial data and rendered generically through the deterministic catalog pipeline. Do not create slug-specific page conditionals or runtime repair layers for a lensed Need.

## Protected user strategy registry

`src/data/userStrategies.json` is the canonical registry for repository-resident user-submitted strategies, including strategies published by `.github/workflows/upload-user-submitted-strategies.yml`. Treat **every entry in this file as protected user-authored content**, regardless of contributor name, location, age of submission, or how many contributors are present.

Do not rewrite, rename, delete, reattribute, add system evidence to, or change Need associations for a published user strategy unless the user explicitly authorizes that specific change. The upload workflow is expected to add more protected entries over time, so tests and runtime code must not hard-code a fixed contributor count or assume Autumn is the only repository-resident contributor.

Older user submissions may also exist in `generated/legacyData.json`. When a legacy submission is represented in `userStrategies.json`, the user-strategy registry is authoritative and its exact wording/provenance must win. A contributor field in the legacy snapshot by itself is not sufficient authority to create a new current static user submission. Nat's profile-owned strategies remain separate in profile/D1 storage and must not be reconstructed from legacy data.

Regression coverage should enforce the boundary generically: the runtime set of static `user` strategies must match the published user-strategy registry, and each published strategy must retain its title, wording, Need associations, and contributor metadata.

## Research-backed system strategies

Before adding, retaining, rewriting, renaming, or changing Need associations for a system-authored strategy, read and follow `docs/system-strategy-evidence-standard.md` and `docs/content-evidence-review.md`.

A system strategy must be **clinically defensible**, not necessarily supported by a randomized trial of the exact card wording. Use the level of care expected at a reputable psychological center: the action should be a reasonable low-risk recommendation for the problem being addressed, and its rationale should be traceable to credible research or authoritative clinical guidance.

Prefer direct intervention evidence when available. Established evidence-based clinical practices and carefully documented low-risk translations of supported therapeutic principles may also qualify. Do not use pseudoscience, speculative exercises invented only from Need-level theory, correlational evidence treated as treatment proof, mechanism-only evidence presented as proof that a self-help instruction works, or a weak study treated as definitive.

Keep card instructions inside the evidence and clinical rationale. Do not invent unsupported duration, frequency, sequence, ratios, thresholds, or stronger outcomes than the source establishes. A strategy may support one part of a Need without claiming to resolve or objectively verify the whole Need.

For audit purposes, distinguish **direct evidence**, **established clinical practice**, **clinically grounded translation**, and **official resource** when useful. The public card does not need to display that classification.

Every approved system strategy must include one best human-verifiable supporting source and render through the standardized **`Supporting source ↗`** provenance link. Appropriate sources may include scholarly research, evidence-based guidelines, or authoritative clinical guidance. Authoritative public-service cards may use an `official-resource` source.

These rules do not apply to genuine user-submitted strategy wording. Preserve user strategy text and provenance according to the repository's protected-user-content rules.

Research-facing production changes still require explicit complete-package approval before implementation.
