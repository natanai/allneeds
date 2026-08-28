# Need Magnet Handshake

> Status: mandatory readiness and verification protocol for Need magnet identity work.
>
> This document exists so that `I read the magnet design rules` is testable. An agent may not begin a Need magnet identity review from the everyday word alone, from a remembered design pattern, or from a partial reading of the visual rules. It must load the approved meaning of the Need, inspect the current site-wide identity vocabulary, demonstrate comprehension before making candidates, and then verify the finished live-lab set against the same checkpoints.

## Scope

This handshake applies when the user asks to **mock up, redesign, review, refine, or promote the visual identity of a specific Need magnet**.

It does not replace `docs/magnet-behavior.md` for physics, drag/fling, persistence, packing, or shared-shell behavior. If a task changes those systems too, both contracts apply.

Need magnet identity work happens **after the Need content package has been approved and implemented** unless the user explicitly asks for exploratory visual work earlier. Content approval does not approve a magnet. Magnet approval does not reopen or redefine the approved Need content.

## Why this exists

A Need magnet is a learned visual identity for one concept inside a large vocabulary. A candidate can look attractive in isolation and still fail the site if it:

- repeats another Need's visual language;
- uses a generic symbol that could belong to many Needs;
- implies a meaning the approved Need does not actually carry;
- uses two icons simply because two images look richer;
- treats full-face artwork as decoration unrelated to the icon or label;
- works only in the default palette or at rounded corners;
- changes the shared magnet shell to make one concept work;
- is reviewed as a standalone image rather than inside the real app;
- leaks into production before explicit approval.

The handshake makes those failures visible before the user has to discover them by iteration.

## Required reading and inspection

Before the readiness handshake, read the current versions from the working base branch of:

1. `AGENTS.md`
2. `docs/need-magnet-handshake.md`
3. `docs/design-language.md`, especially **Need magnet identities** and **Functional theme roles**
4. `docs/magnet-behavior.md`
5. `docs/psychological-model.md`
6. the authoritative approved content-audit record for the target Need
7. `docs/need-function-lenses.md` when the target Need has approved lenses or multiple visible icons are being considered

Also inspect the current implementation rather than relying on remembered filenames or screenshots:

- the target Need's production icon and any production full-face art;
- the **complete current Need icon inventory**, not just neighboring Needs;
- all already-approved Need identities recorded in `docs/design-language.md`;
- the current production Need-magnet identity wiring in the owning component/CSS;
- the current `/design-lab/need-magnets` candidate registry, rendering path, and regression coverage;
- every real Customizer preset used by the lab.

If the target Need does not yet have an authoritative approved content audit, stop and resolve that content boundary first rather than designing from a legacy description as though it were final meaning.

## First visible response: readiness handshake

When the user starts a new Need magnet identity review, the first visible substantive response must be a completed **Need Magnet Handshake** before candidates are created or described as review-ready.

Use the exact M01–M18 IDs below. Each checked line must restate the lesson in the agent's own words and say how it constrains the target Need. `Read`, `reviewed`, `understood`, or copied wording does not prove comprehension.

Use this shape:

```text
# Need Magnet Handshake — {Need}

- [x] M01 · Approved meaning — {what the audited Need actually points toward and what that rules in/out visually}
- [x] M02 · Identity job — {...}
...
- [x] M18 · Review and verification boundary — {...}

MAGNET HANDSHAKE COMPLETE — {Need} identity work may proceed.
```

If the agent inherits a magnet review after losing context, or the working branch predates newer `main` instructions, refresh the current instructions and rerun the handshake before continuing.

## Handshake checkpoints

### M01 · Approved meaning is the semantic source of truth

The designer understands the **approved audited meaning of this Need**, including its important conceptual boundaries. The visual identity must be downstream of that meaning, not downstream of the everyday word, a stock icon search, or the legacy page. The magnet must not silently redefine the Need.

### M02 · The job is a distinct, learnable Need identity

A Need magnet is not a decorative card with a relevant picture. Its icon, face art, and label should form a visual language that a person can learn to associate with this Need across the site. Prefer an ownable metaphor over the most obvious generic category symbol when the generic symbol would make several Needs look interchangeable.

### M03 · Cross-Need uniqueness requires a complete inventory check

Before proposing a primary symbol, compare it against the **full current Need-icon inventory and every approved Need identity**. Do not reuse another Need's primary glyph as this Need's main symbol. Do not assume a symbol is free merely because it is absent from the few neighboring Needs you happened to inspect.

### M04 · Reused motifs are subtle relational echoes, not borrowed identities

A motif already associated with another Need may appear only as a subtle secondary echo when relatedness is intentional and the target still owns a clearly different primary language. Strong reuse requires explicit user approval. The visual system should teach both relatedness and distinction, not collapse two Needs into the same icon family by accident.

### M05 · Icon count must reflect approved conceptual structure

A unified Need without approved function lenses defaults to **one primary icon**. Additional meaning should normally be carried by full-face artwork, composition, or the label. Multiple visible icons require a real approved conceptual reason, such as distinct function lenses. Visual richness by itself is not a reason for a second icon.

### M06 · Icon, full-face art, and label form one semantic composition

The primary icon, background/full-face art, and Need label should reinforce the same concept rather than behave like separate decorations. The artwork can extend, qualify, or create motion around the icon's metaphor. The label may participate in the composition when useful, including serving as a destination or resolution point, but readability and hierarchy remain intact.

### M07 · Metaphor precision and implication check

Ask what a reasonable viewer could infer from the metaphor, not only what the designer intended. Reject imagery that introduces a false obligation, moral judgment, clinical claim, interpersonal demand, or neighboring Need. For example, a communication-related image must not imply compulsory disclosure merely because the target Need concerns communication.

### M08 · Candidate directions must differ conceptually, not cosmetically

A review set should explore genuinely different **visual propositions**. Changing a curve, ornament, color balance, or icon position does not create a new direction when the metaphor is unchanged. Once the user narrows toward one metaphor family, close variants are appropriate for refinement, but the initial set should reveal real alternatives.

### M09 · Preserve the shared physical magnet shell

Need-specific identity belongs **inside the existing magnet shell**. Do not change shared padding, border/shadow semantics, corner behavior, pickup treatment, or shell proportions merely to make one Need identity work. If approved icon content changes intrinsic width, let the normal shared measurement system measure the real geometry rather than faking dimensions.

### M10 · Preserve physics, layout, and persistence semantics

Identity work must not change drag, fling, collision, wobble, empty-space pushing, Play/rest behavior, compact/wide persistence, or packing semantics. If an identity exposes a behavior defect, fix the owning shared behavior under `docs/magnet-behavior.md`; do not add Need-specific runtime patches.

### M11 · Customizer owns the palette and roundness

Use the functional theme roles defined by the Customizer. Full-face art and icon styling must survive arbitrary user palettes rather than depending on the default hues. Do not hard-code rescue colors for one candidate. The lab's main and actual-size previews inherit the real live Customizer rather than maintaining duplicate palette or roundness controls.

### M12 · Actual-size recognition and label legibility are mandatory

A concept that works only when enlarged is not ready. Inspect it at the real magnet size. The primary symbol must remain recognizable, the label must remain easy to read, and background art must not visually strike through, obscure, or compete with the Need word unless such interaction is both intentional and semantically correct.

### M13 · Stress-test every preset and the full 0–200% roundness range

Review candidates across every real preset, including near-monochrome **Refrigerator**, and across the full Customizer roundness range from square to highly rounded. A design must not depend on one palette, one corner shape, or one favorable preview size to make sense.

### M14 · SVG and edge geometry must be production-real

Transparent artwork must use real production geometry. If art is intended to meet a magnet edge, it must reach the true SVG/view-box edge, especially at 0% roundness where gaps are obvious. Do not fake icon slots, crop boundaries, label spacing, or edge contact with audit-only padding that production will not share.

### M15 · Accessibility and restraint survive the identity treatment

The Need word remains the primary readable identifier. Artwork should improve recognition without creating excessive visual noise, low-contrast ambiguity, or a different component paradigm for each Need. Preserve keyboard/focus accessibility and do not encode the Need's meaning solely in color.

### M16 · The live Magnet Lab is the canonical approval surface

Put candidates in `/design-lab/need-magnets` using the real magnet shell, live Customizer, actual-size preview, and preset comparisons. Do not substitute image generation, a standalone illustration, detached HTML, or a screenshot-only concept when repository access is available. Those may inspire thinking, but they are not the approval artifact.

### M17 · Production stays unchanged until explicit candidate approval

A lab review is reversible exploration. Do not replace the production Need icon/art/CSS while the user is comparing candidates. When the user explicitly approves a named candidate, promote **that reviewed identity** through the existing production ownership path, add/update regression coverage, update `docs/design-language.md`, and remove the completed candidate set from the active lab. Git history is the archive.

### M18 · Review and verification boundary

Before telling the user that a candidate set is **ready in the live lab**, complete the M01–M18 verification matrix below. The matrix must point to the actual assets, lab behavior, inventory check, or design decision where each invariant was verified. Any `FAIL` means the set is not review-ready. Approval remains the user's decision; a passing matrix never authorizes production promotion.

## Pre-review verification matrix

After candidates are implemented in the live-lab branch, but **before** claiming the lab is ready for review, produce:

`# Need Magnet Verification — {Need}`

Use this exact structure:

| Checkpoint | Result | Where checked | What was verified |
| --- | --- | --- | --- |
| M01 | PASS / FAIL | exact asset, lab candidate, inventory step, or design decision | concise concrete explanation |
| ... | ... | ... | ... |
| M18 | PASS / FAIL | ... | ... |

Rules:

- Include M01–M18 in order.
- A bare `PASS`, `complies`, or `see above` does not count.
- `Where checked` must be concrete: for example `A2 icon + face art`, `public/icons/needs inventory`, `Refrigerator preset row`, `actual-size preview`, `0% roundness`, or `production diff check`.
- For M03, identify that the **complete current primary-icon inventory** was checked, not only selected neighboring Needs.
- For M05, state whether the Need is unified or lensed and why the chosen number of visible icons matches that approved structure.
- For M08, name the distinct conceptual proposition of each active candidate. If all candidates are refinements inside a user-selected direction, state that the review has intentionally narrowed to refinement mode.
- For M12–M15, verification must be based on the real lab rendering path, not assumptions from raw SVG source alone.
- For M17, confirm that production identity files remain unchanged during review.
- Any `FAIL` means revise the lab set and rerun the matrix before calling it review-ready.

The verification matrix is reviewer-facing metadata. It does not replace the live lab itself.

## Approval and promotion verification

When the user approves a candidate, do not rerun the design contest. Promote the approved direction faithfully unless the user asks for a change.

Before reporting the promotion complete, verify:

1. the exact approved primary icon and full-face art are in the canonical production asset tree;
2. production identity wiring uses the existing deterministic ownership path rather than a runtime repair layer;
3. shared magnet shell/physics behavior was not forked for this Need;
4. regression coverage protects the approved identity and any newly generalized rule;
5. `docs/design-language.md` records the approved identity and any reusable design rule learned during review;
6. the completed Need candidates are removed from the active Design Lab;
7. repository checks/deployment required by the repo contract passed before claiming the identity is live.

## Deterministic final questions

Before creating the lab set, the designer should be able to answer:

- What does the approved Need actually mean, and what does it specifically **not** mean?
- What visual metaphor is each candidate proposing?
- Which existing Need identities are most likely to be confused with it?
- Has the complete primary-icon inventory been checked?
- Is any reused motif merely a subtle nod, or has another Need's identity been borrowed?
- Why does this candidate have exactly this number of visible icons?
- What semantic work does the full-face art do that the icon alone does not?
- Could the artwork accidentally imply a different Need, obligation, or behavior?
- Does the Need word remain readable and visually intentional at actual size?
- Does the design still work in Refrigerator and at 0% roundness?
- Has any shared shell, physics, layout, or persistence behavior been changed for visual convenience?
- Is the live Design Lab, rather than a standalone image, the artifact the user will approve?
- Is production still untouched until explicit approval?

If the designer cannot answer one of these from the work already done, the candidate set is not ready for review.
