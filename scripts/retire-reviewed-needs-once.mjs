import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const editorialPath = 'src/data/editorialCatalog.json';
const legacyPath = 'src/data/generated/legacyData.json';
const dataAgentsPath = 'src/data/AGENTS.md';
const reviewPath = 'docs/content-evidence-review.md';
const clarityAuditPath = 'docs/clarity-content-audit.md';

const editorialTextBefore = readFileSync(editorialPath, 'utf8');
const editorial = JSON.parse(editorialTextBefore);
const legacyRaw = readFileSync(legacyPath, 'utf8');
const legacy = JSON.parse(legacyRaw);

const ownsEntity = (need) => (
  typeof need.title === 'string'
  && Number.isInteger(need.catalogOrder)
  && Array.isArray(need.feelings)
  && Array.isArray(need.fauxFeelings)
);

// Reproduce the current deterministic compiler's Need ordering before changing ownership.
const canonicalEntries = Object.entries(editorial.needs).filter(([, need]) => ownsEntity(need));
const canonicalByOrder = new Map(canonicalEntries.map(([slug, need]) => [need.catalogOrder, slug]));
const totalNeedCount = legacy.needs.length + canonicalEntries.length;
const runtimeOrderBySlug = new Map();
let legacyIndex = 0;
for (let order = 0; order < totalNeedCount; order += 1) {
  const canonicalSlug = canonicalByOrder.get(order);
  if (canonicalSlug) {
    runtimeOrderBySlug.set(canonicalSlug, order);
    continue;
  }
  const legacyNeed = legacy.needs[legacyIndex];
  assert(legacyNeed, `No legacy Need available for runtime order ${order}`);
  runtimeOrderBySlug.set(legacyNeed.slug, order);
  legacyIndex += 1;
}
assert.equal(legacyIndex, legacy.needs.length, 'Not all legacy Needs were represented in the pre-migration order.');

function formatMetadata(metadata) {
  return JSON.stringify(metadata, null, 2)
    .split('\n')
    .slice(1, -1)
    .map((line) => `    ${line}`)
    .join('\n');
}

let editorialText = editorialTextBefore;
const promotedSlugs = [];
for (const [slug, need] of Object.entries(editorial.needs)) {
  if (ownsEntity(need)) continue;

  const legacyNeed = legacy.needs.find((candidate) => candidate.slug === slug);
  assert(legacyNeed, `${slug} is reviewed editorial content but has no legacy entity to promote from.`);
  const catalogOrder = runtimeOrderBySlug.get(slug);
  assert(Number.isInteger(catalogOrder), `Could not resolve catalog order for ${slug}.`);

  const metadata = {
    title: legacyNeed.title,
    ...(legacyNeed.category ? { category: legacyNeed.category } : {}),
    catalogOrder,
    feelings: legacyNeed.feelings ?? [],
    fauxFeelings: legacyNeed.fauxFeelings ?? [],
  };

  const marker = `    ${JSON.stringify(slug)}: {\n`;
  const markerIndex = editorialText.indexOf(marker);
  assert(markerIndex >= 0, `Could not locate editorial Need block for ${slug}.`);
  const insertAt = markerIndex + marker.length;
  editorialText = `${editorialText.slice(0, insertAt)}${formatMetadata(metadata)},\n${editorialText.slice(insertAt)}`;
  promotedSlugs.push(slug);
}

const migratedEditorial = JSON.parse(editorialText);
for (const [slug, need] of Object.entries(migratedEditorial.needs)) {
  assert(ownsEntity(need), `${slug} still lacks complete canonical ownership after promotion.`);
  assert.equal(need.catalogOrder, runtimeOrderBySlug.get(slug), `${slug} changed catalog position during promotion.`);
}
writeFileSync(editorialPath, editorialText);

// Every reviewed editorial Need is now canonical, so no corresponding Need entity may remain in legacy.
const reviewedSlugs = new Set(Object.keys(migratedEditorial.needs));
const originalNonNeedFamilies = Object.fromEntries(Object.entries(legacy).filter(([key]) => key !== 'needs'));
const removedLegacySlugs = legacy.needs.filter((need) => reviewedSlugs.has(need.slug)).map((need) => need.slug);
legacy.needs = legacy.needs.filter((need) => !reviewedSlugs.has(need.slug));
assert.deepEqual(
  Object.fromEntries(Object.entries(legacy).filter(([key]) => key !== 'needs')),
  originalNonNeedFamilies,
  'A non-Need legacy family changed while retiring reviewed Needs.',
);
for (const slug of reviewedSlugs) {
  assert(!legacy.needs.some((need) => need.slug === slug), `${slug} still exists as a legacy Need entity.`);
}
writeFileSync(legacyPath, JSON.stringify(legacy, null, 2) + (legacyRaw.endsWith('\n') ? '\n' : ''));

// Make the retirement rule explicit for future Need implementations.
let dataAgents = readFileSync(dataAgentsPath, 'utf8');
const retirementHeading = '## Canonical Need legacy retirement';
if (!dataAgents.includes(retirementHeading)) {
  const insertBefore = '## Protected user strategy registry\n';
  assert(dataAgents.includes(insertBefore), 'Could not find insertion point in src/data/AGENTS.md.');
  const rule = `${retirementHeading}\n\n\`src/data/editorialCatalog.json\` is the reviewed current Need lane. Once a Need package is approved for implementation, it must receive complete canonical entity ownership there, including its title, catalog position, Feeling relationships, and Faux Feeling relationships, before its superseded Need entity is physically removed from \`src/data/generated/legacyData.json\`. The approved implementation must complete both steps; do not ship a reviewed Need as a partial editorial override that still depends on its own legacy Need record.\n\nEvery Need present in \`editorialCatalog.json\` must therefore be absent from the legacy \`needs\` array. Reverse Need references inside still-legacy-owned Feeling or Faux Feeling entities are cross-entity relationships owned by those entity families and remain until those families receive their own canonical migration. They are not duplicate Need ownership.\n\nRegression coverage must enforce this generically so future audited Needs cannot drift back into legacy ownership. Do not hand-edit the generated snapshot to achieve retirement; use the deterministic migration/compiler ownership path required by the root Bedrock rule.\n\n`;
  dataAgents = dataAgents.replace(insertBefore, rule + insertBefore);
  writeFileSync(dataAgentsPath, dataAgents);
}

let review = readFileSync(reviewPath, 'utf8');
const oldLegacyBullet = '- `src/data/generated/legacyData.json` remains the historical imported snapshot, but profile-owned Nat strategy records have been physically removed from it. Approved global discards remain barred from the live catalog.';
const newLegacyBullet = '- `src/data/generated/legacyData.json` is migration evidence only for entities that do not yet have canonical ownership. Every reviewed Need in `src/data/editorialCatalog.json` must have complete entity ownership and be physically absent from the legacy `needs` array. Reverse Need references inside still-legacy-owned Feeling or Faux Feeling entities remain until those entity families migrate. Approved global discards remain barred from the live catalog.';
assert(review.includes(oldLegacyBullet), 'Could not find the legacy implementation note in content-evidence-review.md.');
review = review.replace(oldLegacyBullet, newLegacyBullet);
writeFileSync(reviewPath, review);

let clarityAudit = readFileSync(clarityAuditPath, 'utf8');
const oldClarityOwner = 'Reviewed Clarity content is owned by `src/data/editorialCatalog.json` and compiled through the existing deterministic runtime catalog pipeline. `src/data/generated/legacyData.json` remains an imported historical snapshot and is not hand-edited by this audit.';
const newClarityOwner = 'Reviewed Clarity content is owned by `src/data/editorialCatalog.json` and compiled through the existing deterministic runtime catalog pipeline. Clarity now has complete canonical entity ownership there, and the superseded Clarity Need entity is physically absent from `src/data/generated/legacyData.json`. Reverse Clarity references inside still-legacy-owned Feeling or Faux Feeling entities remain until those entity families receive their own canonical migration.';
assert(clarityAudit.includes(oldClarityOwner), 'Could not find the outdated Clarity ownership paragraph.');
clarityAudit = clarityAudit.replace(oldClarityOwner, newClarityOwner);
writeFileSync(clarityAuditPath, clarityAudit);

console.log(`Promoted reviewed Needs to complete canonical ownership: ${promotedSlugs.join(', ') || 'none'}`);
console.log(`Physically retired reviewed legacy Need entities: ${removedLegacySlugs.join(', ') || 'none'}`);
