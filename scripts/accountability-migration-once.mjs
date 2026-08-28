import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const BASE_COMMIT = '819ea6d624fc23219ccc1d6f2e966b7a6333166b';
const catalogPath = 'src/data/editorialCatalog.json';
const legacyPath = 'src/data/generated/legacyData.json';
const auditPath = 'docs/accountability-content-audit.md';
const reviewPath = 'docs/content-evidence-review.md';

const accountabilityNeed = {
  title: 'Accountability',
  category: 'Community/Belonging',
  catalogOrder: 23,
  feelings: [
    { title: 'Angry', slug: 'angry' },
    { title: 'Scared', slug: 'scared' },
    { title: 'Confused', slug: 'confused' },
    { title: 'Antagonistic', slug: 'antagonistic' },
    { title: 'Hostile', slug: 'hostile' },
    { title: 'Bewildered', slug: 'bewildered' },
    { title: 'Hurt', slug: 'hurt' },
    { title: 'In pain', slug: 'in-pain' },
    { title: 'Anxious', slug: 'anxious' },
    { title: 'Frustrated', slug: 'frustrated' },
    { title: 'Embarrassed', slug: 'embarrassed' },
    { title: 'Sad', slug: 'sad' },
  ],
  fauxFeelings: [
    { title: 'Blamed', slug: 'blamed' },
    { title: 'Criticized', slug: 'criticized' },
    { title: 'Humiliated', slug: 'humiliated' },
  ],
  summary: 'Accountability concerns being able to recognize our part in what happens and respond to the effects of our actions. People judge responsibility by considering how a person was connected to an outcome, what expectations applied, and how much control they had, and we create forms of answerability in which choices or judgments can be explained or justified. How that answerability is structured matters; accountability does not have one uniformly helpful effect. Responsibility itself does not require blame or self-punishment. Clinical work describes treating people as responsible agents while blame is deliberately avoided, and research on interpersonal transgressions finds that taking responsibility can coexist with self-acceptance and efforts to repair. When this Need is active, we may be wanting responsibility to be something that can be acknowledged and responded to rather than ignored or disowned.',
  narrative: "Schlenker and colleagues studied how people judge responsibility. Their model connects a person to an event and to expectations about conduct. In two studies, responsibility judgments changed with the strength of those connections, especially perceived personal control, and people sought information relevant to them when making responsibility judgments. Causal involvement alone was not the whole judgment; the expectations that applied and the person's relationship to the event also mattered.\n\nLerner and Tetlock reviewed research on accountability arrangements in which people expected to explain or justify judgments and choices. The effects varied with the ground rules and timing. Depending on the conditions, accountability could reduce particular cognitive biases, leave them unchanged, or make them stronger. Their review describes forms of answerability whose effects depend on how they are structured.\n\nPickard examines clinical treatment in which some behaviors can harm the person or other people. She describes encouraging people to recognize their agency and responsibility while clinicians deliberately avoid hostile blame. In this clinical model, recognizing responsibility and using blame are separate responses.\n\nWoodyatt and Wenzel followed people after interpersonal transgressions and distinguished genuine self-forgiveness from self-punishment and from responses that minimized responsibility. Genuine self-forgiveness involved working through the offense, taking responsibility, and accepting oneself while acknowledging failure. In their prospective research, it was associated with greater self-esteem and empathy toward the other person. Taking responsibility did not require remaining in a self-punitive stance.",
  sources: [
    { url: 'https://pubmed.ncbi.nlm.nih.gov/7984709/', description: 'Schlenker, B. R., Britt, T. W., Pennington, J., Murphy, R., & Doherty, K. (1994). The triangle model of responsibility. Psychological Review, 101(4), 632–652.', kind: 'scholarly' },
    { url: 'https://pubmed.ncbi.nlm.nih.gov/10087938/', description: 'Lerner, J. S., & Tetlock, P. E. (1999). Accounting for the effects of accountability. Psychological Bulletin, 125(2), 255–275.', kind: 'scholarly' },
    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3272423/', description: 'Pickard, H. (2011). Responsibility Without Blame: Empathy and the Effective Treatment of Personality Disorder. Philosophy, Psychiatry, & Psychology, 18(3), 209–223.', kind: 'scholarly' },
    { url: 'https://guilfordjournals.com/doi/10.1521/jscp.2013.32.2.225', description: 'Woodyatt, L., & Wenzel, M. (2013). Self-Forgiveness and Restoration of an Offender Following an Interpersonal Transgression. Journal of Social and Clinical Psychology, 32(2), 225–259.', kind: 'scholarly' },
  ],
  strategies: [
    { title: 'Map the responsibility', slug: 'map-the-responsibility' },
    { title: 'Draft a repair', slug: 'draft-a-repair' },
  ],
};

const accountabilityStrategies = [
  {
    title: 'Map the responsibility',
    slug: 'map-the-responsibility',
    description: 'Choose one outcome you want to understand more clearly. List the people and factors that contributed to what happened, including your own actions. Then consider how responsibility is distributed among them. Write the part you believe was yours without taking responsibility for what was outside your control.',
    needs: [{ title: 'Accountability', slug: 'accountability' }],
    provenance: 'system',
    evidence: {
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7853755/',
      description: 'Murray, H., & Ehlers, A. (2021). Cognitive therapy for moral injury in post-traumatic stress disorder.',
      kind: 'scholarly',
    },
  },
  {
    title: 'Draft a repair',
    slug: 'draft-a-repair',
    description: 'If there is something you believe is yours to address, privately write one repair you could choose to make. It could be an apology or another form of amends. You do not have to send it or contact anyone. The first step is only to identify a repair that fits what you believe you are responsible for.',
    needs: [{ title: 'Accountability', slug: 'accountability' }],
    provenance: 'system',
    evidence: {
      url: 'https://www.tandfonline.com/doi/full/10.1080/15298861003669565',
      description: 'Exline, J. J., Root, B. L., Yadavalli, S., Martin, A. M., & Fisher, M. L. (2011). Reparative Behaviors and Self-forgiveness: Effects of a Laboratory-based Exercise.',
      kind: 'scholarly',
    },
  },
];

function indentJsonValue(value, spaces) {
  const pad = ' '.repeat(spaces);
  return JSON.stringify(value, null, 2).split('\n').map((line) => pad + line).join('\n');
}

// Rebuild editorialCatalog from the exact branch-base version, then insert only the approved Accountability data.
let catalog = execFileSync('git', ['show', `${BASE_COMMIT}:${catalogPath}`], { encoding: 'utf8' });
assert(!catalog.includes('"accountability": {'), 'Base catalog unexpectedly already owns Accountability.');
assert(!catalog.includes('"map-the-responsibility"'), 'Base catalog unexpectedly already contains Accountability strategy.');

const needMarker = '\n    }\n  },\n  "strategies": [';
const needIndex = catalog.lastIndexOf(needMarker);
assert(needIndex >= 0, 'Could not locate final Need boundary in editorialCatalog.');
const needInsertAt = needIndex + '\n    }'.length;
const needProperty = indentJsonValue({ accountability: accountabilityNeed }, 2).split('\n').slice(1, -1).join('\n');
catalog = catalog.slice(0, needInsertAt) + ',\n' + needProperty + catalog.slice(needInsertAt);

const strategyMarker = '\n    }\n  ],\n  "strategyProvenance": {}';
const strategyIndex = catalog.lastIndexOf(strategyMarker);
assert(strategyIndex >= 0, 'Could not locate final strategy boundary in editorialCatalog.');
const strategyInsertAt = strategyIndex + '\n    }'.length;
const strategyText = accountabilityStrategies.map((strategy) => indentJsonValue(strategy, 4)).join(',\n');
catalog = catalog.slice(0, strategyInsertAt) + ',\n' + strategyText + catalog.slice(strategyInsertAt);

const parsedCatalog = JSON.parse(catalog);
assert.deepEqual(parsedCatalog.needs.accountability, accountabilityNeed);
for (const strategy of accountabilityStrategies) {
  assert.deepEqual(parsedCatalog.strategies.find((item) => item.slug === strategy.slug), strategy);
}
writeFileSync(catalogPath, catalog);

// Retire only the superseded legacy Accountability Need entity. Reverse Feeling/Faux Feeling references remain untouched.
const legacyRaw = readFileSync(legacyPath, 'utf8');
const legacyHadNewline = legacyRaw.endsWith('\n');
const legacy = JSON.parse(legacyRaw);
const originalOtherFamilies = Object.fromEntries(Object.entries(legacy).filter(([key]) => key !== 'needs'));
const accountabilityIndices = legacy.needs.map((need, index) => need.slug === 'accountability' ? index : -1).filter((index) => index >= 0);
assert.deepEqual(accountabilityIndices, [22], 'Expected exactly one legacy Accountability Need at index 22 after Honesty retirement.');
legacy.needs.splice(accountabilityIndices[0], 1);
assert(!legacy.needs.some((need) => need.slug === 'accountability'));
assert.deepEqual(Object.fromEntries(Object.entries(legacy).filter(([key]) => key !== 'needs')), originalOtherFamilies, 'A non-Need legacy family changed during Accountability retirement.');
const reverseRefs = [...legacy.feelings.flatMap((item) => item.needs ?? []), ...legacy.fauxFeelings.flatMap((item) => item.needs ?? [])].filter((need) => need.slug === 'accountability');
assert(reverseRefs.length > 0, 'Expected reverse Accountability references to remain in legacy-owned families.');
writeFileSync(legacyPath, JSON.stringify(legacy, null, 2) + (legacyHadNewline ? '\n' : ''));

// Mark the authoritative audit record implemented now that canonical ownership and legacy retirement are both present.
let audit = readFileSync(auditPath, 'utf8');
audit = audit.replace(
  '> Status: content approved for implementation 2026-08-27. Accountability is not fully audited until its redesigned magnet is separately approved and live.',
  '> Status: content approved and implemented 2026-08-27. Accountability is not fully audited until its redesigned magnet is separately approved and live.',
);
audit = audit.replace(
  'The approved implementation gives Accountability complete canonical ownership in `src/data/editorialCatalog.json`, including title, category, catalog order, Feeling and Faux Feeling relationships, approved Evidence content, sources, and the two system strategies.\n\nThe deterministic runtime catalog compiler must consume that complete canonical record directly. Once canonical ownership is present, the superseded Accountability Need entity in `src/data/generated/legacyData.json` is physically retired.',
  'Accountability now has complete canonical ownership in `src/data/editorialCatalog.json`, including title, category, catalog order, Feeling and Faux Feeling relationships, approved Evidence content, sources, and the two system strategies.\n\nThe deterministic runtime catalog compiler consumes that complete canonical record directly. The superseded Accountability Need entity in `src/data/generated/legacyData.json` is physically retired.',
);
writeFileSync(auditPath, audit);

// Record the implemented content package in the living review ledger without altering any existing audited package.
let review = readFileSync(reviewPath, 'utf8');
assert(!review.includes('\n## Accountability\n'), 'Accountability already exists in content-evidence review ledger.');
const reviewHadNewline = review.endsWith('\n');
review = review.replace(/\s+$/, '');
review += '\n\n## Accountability\n\n**Status:** content audited and implemented 2026-08-27; redesigned magnet review pending. The authoritative current content record is `docs/accountability-content-audit.md`.\n';
if (!reviewHadNewline) review = review.replace(/\n$/, '');
writeFileSync(reviewPath, review);

console.log('Applied deterministic Accountability canonical migration and legacy retirement.');
