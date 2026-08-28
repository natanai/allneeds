# Strategy-data agent contract

This file supplements the root `AGENTS.md` for work under `src/data/`.

## Mandatory Need audit handshake

Before auditing, drafting, revising, or implementing a full Need package, read and complete `docs/need-audit-handshake.md`. The H01–H18 checklist must be demonstrated before substantive audit conclusions, and the same IDs must be used in the pre-proposal verification matrix.

The verification matrix is audit metadata. The official proposal artifact that follows it begins at `# Need for {Need}` and remains site-content only. Research-facing production changes still require explicit complete-package approval before implementation.

## Canonical psychological model

Before adding, auditing, revising, or implementing Need, Feeling, Observation, or Strategy data, read `docs/psychological-model.md` and treat it as a hard product-model contract.

Need content must preserve the site's NVC-informed Observation / situation → Feeling → Need / value / motivation → Strategy model. Needs are normal and valid; Needs themselves do not compete or conflict; apparent conflict belongs at the level of Strategies, circumstances, resources, timing, information, support, or currently available solutions. Need pages should help a person understand why the motivation can make sense and then move toward practical ways to tend it.

System strategies must support that same arc. They should help the reader tend the Need itself, widen available Strategies, and reduce dependence on solving the triggering situation first whenever a self-contained action is possible. The standing alone-after-activation scenario in `docs/psychological-model.md` must be tested explicitly. Do not preserve a strategy merely because it is inherited, symmetrical with another deck, or loosely related to the situation that brought up the Need.

## Full Need audit proposal format

Before presenting an official, full, final, or approval-ready Need content audit proposal, read `docs/need-audit-proposal-format.md` and follow it exactly.

The approval-ready response contains the mandatory H01–H18 verification matrix followed by the official proposal. The proposal artifact itself is a clean snapshot of proposed final site content only. Keep source-role notes, limitations, removal/discard rationale, provenance analysis, implementation scope, file paths, and other audit metadata in internal/audit records rather than inside or after the formal proposal.

## Current Safety record

For Safety data, strategy, citation, or copy work, read `docs/safety-content-audit.md` before editing. It is the authoritative current Safety audit and supersedes the older Safety section in `docs/content-evidence-review.md`.

## Current Understanding record

For Understanding data, function-lens structure, strategy, citation, or copy work, read `docs/understanding-content-audit.md` before editing. It is the authoritative current Understanding audit. Understanding is the first approved production use of the function-lens model.

## Current Clarity record

For Clarity data, function-lens structure, strategy, citation, or copy work, read `docs/clarity-content-audit.md` before editing. It is the authoritative current Clarity audit. Do not restore the superseded healthcare error claim, removed legacy strategy associations, or rejected strategy candidates from historical data.

## Need function lenses

Before proposing or implementing multiple functions, facets, pathways, or sub-meanings within one Need, read `docs/need-function-lenses.md` and follow its qualification, editorial, rendering, and approval rules.

Function lenses are optional and must earn their place through three requirements: a meaningfully distinct lived function, distinct evidence that benefits from separate source-to-claim treatment, and practical recognition value for the reader. Do not subdivide Needs merely because an academic taxonomy is possible.

When lenses are approved, they remain part of one canonical Need. Their content must be owned by canonical editorial data and rendered generically through the deterministic catalog pipeline. Do not create slug-specific page conditionals or runtime repair layers for a lensed Need.

## Canonical Need legacy retirement

`src/data/editorialCatalog.json` is the reviewed current Need lane. Once a Need package is approved for implementation, it must receive complete canonical entity ownership there, including its title, catalog position, Feeling relationships, and Faux Feeling relationships, before its superseded Need entity is physically removed from `src/data/generated/legacyData.json`. The approved implementation must complete both steps; do not ship a reviewed Need as a partial editorial override that still depends on its own legacy Need record.

Every Need present in `editorialCatalog.json` must therefore be absent from the legacy `needs` array. Reverse Need references inside still-legacy-owned Feeling or Faux Feeling entities are cross-entity relationships owned by those entity families and remain until those families receive their own canonical migration. They are not duplicate Need ownership.

Regression coverage must enforce this generically so future audited Needs cannot drift back into legacy ownership. Do not hand-edit the generated snapshot to achieve retirement; use the deterministic migration/compiler ownership path required by the root Bedrock rule.

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

### Citation URL hard check

Every research-facing URL stored in canonical editorial data must be the **direct raw human-reachable destination** a person is intended to visit in a normal browser.

- Prefer the publisher article page, PubMed/PMC, APA PsycNet, DOI destination, government/health-system page, or other authoritative human-facing landing page.
- Never store a ChatGPT/OpenAI link, search-results URL, crawler/proxy URL, analytics redirect, link shortener, or another machine/intermediary destination in place of the source.
- Strip tracking and referral parameters such as `utm_*`, `gclid`, `fbclid`, `mc_cid`, `mc_eid`, and nonessential referral values such as `origin=crossref`.
- Query parameters that are functionally required to identify the resource, such as a publisher's article `?id=...`, are allowed.
- Agent or crawler reachability is not a reason to replace a legitimate human-facing source with a proxy.
- Before an editorial audit is approved or merged, verify citation URLs in both the audit record and canonical production data. Automated hygiene checks are a floor, not a substitute for opening the human-facing destination when practical.

These rules do not apply to genuine user-submitted strategy wording. Preserve user strategy text and provenance according to the repository's protected-user-content rules.

Research-facing production changes still require explicit complete-package approval before implementation.
