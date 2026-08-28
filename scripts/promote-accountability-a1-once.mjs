import assert from 'node:assert/strict';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const iconSource = 'public/design-lab/need-magnets/accountability-mosaic-icon.svg';
const artSource = 'public/design-lab/need-magnets/accountability-mosaic-field.svg';
const iconTarget = 'public/icons/needs/accountability.svg';
const artTarget = 'public/icons/needs/art/accountability-responsibility-mosaic.svg';
const cssPath = 'src/features/needs/NeedsPage.module.css';
const candidatesPath = 'src/features/designLab/needMagnetAuditCandidates.ts';
const candidateTestPath = 'src/features/designLab/needMagnetAuditCandidates.test.ts';
const identityTestPath = 'src/features/needs/accountabilityMagnetIdentity.test.ts';
const designLanguagePath = 'docs/design-language.md';
const auditPath = 'docs/accountability-content-audit.md';
const evidenceReviewPath = 'docs/content-evidence-review.md';
const labDir = 'public/design-lab/need-magnets';

const approvedIcon = readFileSync(iconSource, 'utf8');
const approvedArt = readFileSync(artSource, 'utf8');

// Promote the exact user-approved lab assets into the canonical production tree.
writeFileSync(iconTarget, approvedIcon);
writeFileSync(artTarget, approvedArt);

// Wire the approved A1 palette/art recipe through the existing production Need identity owner.
let css = readFileSync(cssPath, 'utf8');
assert(!css.includes("data-magnet-id='needs-accountability'"), 'Accountability production identity already exists.');
const identityCss = `\n/* Approved Need identity: Accountability · Responsibility Mosaic (A1).\n   Contributing pieces fill the face while one distinct piece remains readable as\n   a part of the whole, matching the approved responsibility-without-totalizing metaphor. */\n.boardWrapper :global([data-magnet-id='needs-accountability']) {\n  --magnet-icon: url('/icons/needs/accountability.svg');\n  background: linear-gradient(\n    135deg,\n    color-mix(in srgb, var(--quiet) 72%, var(--selection) 28%),\n    color-mix(in srgb, var(--selection) 76%, var(--positive) 24%)\n  );\n}\n\n.boardWrapper :global([data-magnet-id='needs-accountability'])::before {\n  position: relative;\n  z-index: 2;\n  background: color-mix(in srgb, var(--primary) 82%, var(--text) 18%);\n}\n\n.boardWrapper :global([data-magnet-id='needs-accountability'])::after {\n  content: '';\n  position: absolute;\n  z-index: 0;\n  inset: 0;\n  border-radius: inherit;\n  background: linear-gradient(\n    110deg,\n    color-mix(in srgb, var(--primary) 76%, var(--text) 24%),\n    color-mix(in srgb, var(--action) 70%, var(--text) 30%)\n  );\n  opacity: 0.34;\n  mask: url('/icons/needs/art/accountability-responsibility-mosaic.svg') left center / 100% 100% no-repeat;\n  -webkit-mask: url('/icons/needs/art/accountability-responsibility-mosaic.svg') left center / 100% 100% no-repeat;\n  pointer-events: none;\n}\n`;
const emptyMarker = '\n.empty {';
assert(css.includes(emptyMarker), 'Could not find Need-page identity insertion point.');
css = css.replace(emptyMarker, `${identityCss}${emptyMarker}`);
writeFileSync(cssPath, css);

// The completed review leaves the active lab; Git history remains the archive.
let candidates = readFileSync(candidatesPath, 'utf8');
const arrayStart = candidates.indexOf('export const needMagnetAuditCandidates');
assert(arrayStart >= 0, 'Could not find Design Lab candidate registry export.');
candidates = `${candidates.slice(0, arrayStart)}export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [];\n`;
writeFileSync(candidatesPath, candidates);

writeFileSync(candidateTestPath, `import { describe, expect, it } from 'vitest';\n\nimport { needMagnetAuditCandidates } from './needMagnetAuditCandidates';\n\ndescribe('need magnet audit candidates', () => {\n  it('removes the approved Accountability candidates from the active review surface', () => {\n    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'accountability')).toBe(false);\n  });\n});\n`);

for (const file of readdirSync(labDir)) {
  if (file.startsWith('accountability-')) rmSync(`${labDir}/${file}`);
}

// Regression coverage protects the exact approved identity and the lab/production boundary.
writeFileSync(identityTestPath, `import { readFileSync } from 'node:fs';\nimport { describe, expect, it } from 'vitest';\n\nimport { needMagnetAuditCandidates } from '../designLab/needMagnetAuditCandidates';\n\nconst css = readFileSync('src/features/needs/NeedsPage.module.css', 'utf8');\nconst icon = readFileSync('public/icons/needs/accountability.svg', 'utf8');\nconst art = readFileSync('public/icons/needs/art/accountability-responsibility-mosaic.svg', 'utf8');\n\ndescribe('approved Accountability magnet identity', () => {\n  it('ships Responsibility Mosaic A1 through the canonical Need identity owner', () => {\n    expect(css).toContain(\"data-magnet-id='needs-accountability'\");\n    expect(css).toContain(\"--magnet-icon: url('/icons/needs/accountability.svg')\");\n    expect(css).toContain(\"mask: url('/icons/needs/art/accountability-responsibility-mosaic.svg')\");\n    expect(css).toContain('var(--quiet) 72%');\n    expect(css).toContain('var(--selection) 76%');\n    expect(css).toContain('var(--primary) 82%');\n    expect(css).toContain('opacity: 0.34');\n  });\n\n  it('uses the approved four-piece icon and full-face mosaic geometry', () => {\n    expect(icon.match(/<rect /g)).toHaveLength(4);\n    expect(icon).toContain('x=\"13.2\" y=\"13.2\" width=\"7.6\" height=\"7.6\"');\n    expect(art).toContain('viewBox=\"0 0 320 96\"');\n    expect(art.match(/<rect /g)).toHaveLength(7);\n    expect(art).toContain('x=\"0\" y=\"0\" width=\"86\" height=\"44\"');\n    expect(art).toContain('x=\"268\" y=\"18\" width=\"52\" height=\"60\"');\n  });\n\n  it('keeps the completed Accountability review out of the active Design Lab', () => {\n    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'accountability')).toBe(false);\n  });\n});\n`);

// Record the approved identity in the living visual language.
let designLanguage = readFileSync(designLanguagePath, 'utf8');
assert(!designLanguage.includes('Accountability · Responsibility Mosaic'), 'Accountability identity already recorded in design language.');
const physicsMarker = '\n## Magnet physics\n';
assert(designLanguage.includes(physicsMarker), 'Could not find design-language magnet identity insertion point.');
const identityRecord = `\n- **Accountability · Responsibility Mosaic (A1) is approved.** It replaces the former clipboard/checkmark compliance metaphor with one Accountability-specific four-piece mosaic icon and a larger field of contributing pieces. The composition represents recognizing the part that is ours without claiming the whole outcome, matching the audited distinction between responsibility and totalizing blame. The face blends \`Quiet\`/\`Selection\` into \`Selection\`/\`Positive\`; the icon derives from \`Primary\`/\`Text\`; and the mosaic art fades from \`Primary\`/\`Text\` toward \`Action\`/\`Text\` at restrained opacity. Canonical production references are \`src/features/needs/NeedsPage.module.css\`, \`public/icons/needs/accountability.svg\`, and \`public/icons/needs/art/accountability-responsibility-mosaic.svg\`.\n`;
designLanguage = designLanguage.replace(physicsMarker, `${identityRecord}${physicsMarker}`);
writeFileSync(designLanguagePath, designLanguage);

// Close the Accountability audit record now that its separate visual gate is approved.
let audit = readFileSync(auditPath, 'utf8');
const oldStatus = '> Status: content approved and implemented 2026-08-27. Accountability is not fully audited until its redesigned magnet is separately approved and live.';
const newStatus = '> Status: fully audited. Content package approved and implemented 2026-08-27; Responsibility Mosaic (A1) magnet approved for production 2026-08-28.';
assert(audit.includes(oldStatus), 'Could not find Accountability audit status to close.');
audit = audit.replace(oldStatus, newStatus);
const oldVisual = `## Visual audit\n\nContent approval does not approve the Accountability magnet. After the approved content is implemented and verified, Accountability proceeds to separate visual review in \`/design-lab/need-magnets\`. Accountability becomes fully audited only after an approved redesigned production magnet is live.`;
const newVisual = `## Visual audit\n\nThe user approved **A1 · Responsibility Mosaic** on 2026-08-28 in the live \`/design-lab/need-magnets\` review surface. The approved identity uses one four-piece mosaic icon and a larger full-face field of contributing pieces to represent recognizing one's part without claiming the whole outcome. Production promotion replaces the former clipboard/checkmark icon, keeps the shared magnet shell and physics unchanged, and uses only Customizer-owned functional color roles. The completed Accountability candidate set is removed from the active lab after promotion.\n\nWith the approved Responsibility Mosaic identity promoted through the canonical production Need styling path, Accountability is fully audited.`;
assert(audit.includes(oldVisual), 'Could not find Accountability visual-audit section to close.');
audit = audit.replace(oldVisual, newVisual);
writeFileSync(auditPath, audit);

let evidenceReview = readFileSync(evidenceReviewPath, 'utf8');
const oldEvidenceStatus = '**Status:** content audited and implemented 2026-08-27; redesigned magnet review pending. The authoritative current content record is `docs/accountability-content-audit.md`.';
const newEvidenceStatus = '**Status:** fully audited. Content implemented 2026-08-27; Responsibility Mosaic (A1) magnet approved and promoted 2026-08-28. The authoritative current record is `docs/accountability-content-audit.md`.';
assert(evidenceReview.includes(oldEvidenceStatus), 'Could not find Accountability status in content-evidence review.');
evidenceReview = evidenceReview.replace(oldEvidenceStatus, newEvidenceStatus);
writeFileSync(evidenceReviewPath, evidenceReview);

console.log('Promoted approved Accountability A1 identity and retired its completed lab set.');
