import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(root, 'src/data/observationInference/source.json');
const outputPath = resolve(root, 'src/data/generated/observationInference.ts');
const legacyCatalogPath = resolve(root, 'src/data/generated/legacyData.json');
const editorialCatalogPath = resolve(root, 'src/data/editorialCatalog.json');
const expectedSlotIds = ['time', 'context', 'sensory', 'measure'];
const allowedFlags = /^[imsu]*$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  throw new Error(`Observation inference source: ${message}`);
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} must be a nonempty string.`);
  return value;
}

function requireSlug(value, label) {
  const slug = requireString(value, label);
  if (!slugPattern.test(slug)) fail(`${label} must be a lowercase slug.`);
  return slug;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
  return value;
}

function uniqueIds(items, label) {
  const seen = new Set();
  items.forEach((item, index) => {
    const id = requireSlug(requireObject(item, `${label}[${index}]`).id, `${label}[${index}].id`);
    if (seen.has(id)) fail(`${label} contains duplicate id ${id}.`);
    seen.add(id);
  });
}

function validateDetector(detector, label) {
  const value = requireObject(detector, label);
  requireSlug(value.id, `${label}.id`);
  const pattern = requireString(value.pattern, `${label}.pattern`);
  const flags = typeof value.flags === 'string' ? value.flags : fail(`${label}.flags must be a string.`);
  if (!allowedFlags.test(flags) || new Set(flags).size !== flags.length) {
    fail(`${label}.flags must contain unique i, m, s, or u flags only.`);
  }
  try {
    new RegExp(pattern, `${flags}g`);
  } catch (error) {
    fail(`${label} cannot compile: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateSlugList(value, label, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const slugs = requireArray(value, label);
  if (slugs.length < minimum) fail(`${label} must contain at least ${minimum} entries.`);
  if (slugs.length > maximum) fail(`${label} must contain no more than ${maximum} entries.`);
  const seen = new Set();
  slugs.forEach((slug, index) => {
    requireSlug(slug, `${label}[${index}]`);
    if (seen.has(slug)) fail(`${label} contains duplicate slug ${slug}.`);
    seen.add(slug);
  });
}

function validateStringList(value, label, minimum = 0) {
  const strings = requireArray(value, label);
  if (strings.length < minimum) fail(`${label} must contain at least ${minimum} entries.`);
  const seen = new Set();
  strings.forEach((entry, index) => {
    const text = requireString(entry, `${label}[${index}]`);
    const normalized = text.toLocaleLowerCase('en-US');
    if (seen.has(normalized)) fail(`${label} contains duplicate entry ${text}.`);
    seen.add(normalized);
  });
}

function validateSource(source) {
  const value = requireObject(source, 'root');
  if (value.schemaVersion !== 2) fail('schemaVersion must be 2.');
  if (!/^\d+\.\d+\.\d+$/.test(requireString(value.modelVersion, 'modelVersion'))) {
    fail('modelVersion must use semantic versioning.');
  }
  if ('explorationPools' in value) fail('explorationPools are retired in Observation 2.1.');

  const provenance = requireObject(value.provenance, 'provenance');
  requireString(provenance.repository, 'provenance.repository');
  requireString(provenance.branch, 'provenance.branch');
  if (!/^[0-9a-f]{40}$/.test(requireString(provenance.commit, 'provenance.commit'))) {
    fail('provenance.commit must be a full Git commit hash.');
  }
  requireString(provenance.importedAt, 'provenance.importedAt');
  if (!Number.isInteger(provenance.cueRows) || provenance.cueRows < 1) {
    fail('provenance.cueRows must be a positive integer.');
  }

  const slots = requireArray(value.slots, 'slots');
  if (slots.length !== expectedSlotIds.length) fail('slots must contain exactly four entries.');
  uniqueIds(slots, 'slots');
  slots.forEach((slot, index) => {
    const item = requireObject(slot, `slots[${index}]`);
    if (item.id !== expectedSlotIds[index]) fail(`slots[${index}].id must be ${expectedSlotIds[index]}.`);
    requireString(item.label, `slots[${index}].label`);
    requireString(item.noun, `slots[${index}].noun`);
    requireString(item.question, `slots[${index}].question`);
    requireString(item.summary, `slots[${index}].summary`);
    validateStringList(item.examples, `slots[${index}].examples`, 1);
    const detectors = requireArray(item.detectors, `slots[${index}].detectors`);
    if (!detectors.length) fail(`slots[${index}].detectors must not be empty.`);
    uniqueIds(detectors, `slots[${index}].detectors`);
    detectors.forEach((detector, detectorIndex) => validateDetector(detector, `slots[${index}].detectors[${detectorIndex}]`));
  });

  const expressions = requireArray(value.expressions, 'expressions');
  if (!expressions.length) fail('expressions must not be empty.');
  uniqueIds(expressions, 'expressions');
  expressions.forEach((expression, index) => {
    const item = requireObject(expression, `expressions[${index}]`);
    validateDetector(item, `expressions[${index}]`);
    if (/\\\\[bdswnrt]/i.test(item.pattern) || item.pattern.includes('\\|')) {
      fail(`expressions[${index}].pattern still contains CSV escape-layer artifacts.`);
    }
    if (!['direct', 'related', 'broad'].includes(item.tier)) fail(`expressions[${index}].tier is invalid.`);
    validateSlugList(item.feelingSlugs, `expressions[${index}].feelingSlugs`);
    validateSlugList(item.needSlugs, `expressions[${index}].needSlugs`);
    if (!item.feelingSlugs.length && !item.needSlugs.length) fail(`expressions[${index}] has no candidates.`);
    validateSlugList(item.cueIds, `expressions[${index}].cueIds`, 1);
    validateStringList(item.examples, `expressions[${index}].examples`);
    requireString(item.provenance, `expressions[${index}].provenance`);
  });

  const lexicalBridges = requireArray(value.lexicalBridges, 'lexicalBridges');
  uniqueIds(lexicalBridges, 'lexicalBridges');
  lexicalBridges.forEach((bridge, index) => {
    const item = requireObject(bridge, `lexicalBridges[${index}]`);
    if (!['feeling', 'need', 'fauxFeeling'].includes(item.entityType)) fail(`lexicalBridges[${index}].entityType is invalid.`);
    requireSlug(item.slug, `lexicalBridges[${index}].slug`);
    validateStringList(item.terms, `lexicalBridges[${index}].terms`, 1);
    requireString(item.provenance, `lexicalBridges[${index}].provenance`);
  });

  const surfaceTerms = requireArray(value.surfaceTerms, 'surfaceTerms');
  uniqueIds(surfaceTerms, 'surfaceTerms');
  surfaceTerms.forEach((surfaceTerm, index) => {
    const item = requireObject(surfaceTerm, `surfaceTerms[${index}]`);
    requireString(item.label, `surfaceTerms[${index}].label`);
    validateStringList(item.terms, `surfaceTerms[${index}].terms`, 1);
  });

  const guidanceRules = requireArray(value.guidanceRules, 'guidanceRules');
  uniqueIds(guidanceRules, 'guidanceRules');
  const guidanceRuleById = new Map();
  guidanceRules.forEach((rule, index) => {
    const item = requireObject(rule, `guidanceRules[${index}]`);
    requireString(item.label, `guidanceRules[${index}].label`);
    requireString(item.explanation, `guidanceRules[${index}].explanation`);
    validateStringList(item.terms, `guidanceRules[${index}].terms`);
    const patterns = requireArray(item.patterns, `guidanceRules[${index}].patterns`);
    patterns.forEach((pattern, patternIndex) => validateDetector(pattern, `guidanceRules[${index}].patterns[${patternIndex}]`));
    if (!item.terms.length && !patterns.length) fail(`guidanceRules[${index}] has no terms or patterns.`);
    requireString(item.provenance, `guidanceRules[${index}].provenance`);
    guidanceRuleById.set(item.id, item);
  });

  const eventFamilies = requireArray(value.eventFamilies, 'eventFamilies');
  if (eventFamilies.length < 6) fail('eventFamilies must contain the approved initial six families.');
  uniqueIds(eventFamilies, 'eventFamilies');
  eventFamilies.forEach((family, index) => {
    const item = requireObject(family, `eventFamilies[${index}]`);
    requireString(item.label, `eventFamilies[${index}].label`);
    if (!['related', 'broad'].includes(item.tier)) fail(`eventFamilies[${index}].tier must be related or broad.`);
    validateStringList(item.lexiconExcludeTerms, `eventFamilies[${index}].lexiconExcludeTerms`);
    if (item.lexiconRuleId !== null) {
      const lexiconRuleId = requireSlug(item.lexiconRuleId, `eventFamilies[${index}].lexiconRuleId`);
      const rule = guidanceRuleById.get(lexiconRuleId);
      if (!rule) fail(`eventFamilies[${index}] references unknown guidance lexicon ${lexiconRuleId}.`);
      if (!rule.terms.length) fail(`eventFamilies[${index}] lexicon ${lexiconRuleId} has no terms.`);
      const availableTerms = new Set(rule.terms.map((term) => term.toLocaleLowerCase('en-US')));
      item.lexiconExcludeTerms.forEach((term) => {
        if (!availableTerms.has(term.toLocaleLowerCase('en-US'))) {
          fail(`eventFamilies[${index}] excludes unknown term ${term} from lexicon ${lexiconRuleId}.`);
        }
      });
    } else if (item.lexiconExcludeTerms.length) {
      fail(`eventFamilies[${index}] cannot exclude lexicon terms without lexiconRuleId.`);
    }
    const patterns = requireArray(item.patterns, `eventFamilies[${index}].patterns`);
    if (!patterns.length) fail(`eventFamilies[${index}].patterns must not be empty.`);
    uniqueIds(patterns, `eventFamilies[${index}].patterns`);
    patterns.forEach((pattern, patternIndex) => validateDetector(pattern, `eventFamilies[${index}].patterns[${patternIndex}]`));
    validateSlugList(item.feelingSlugs, `eventFamilies[${index}].feelingSlugs`, 1, 8);
    validateSlugList(item.needSlugs, `eventFamilies[${index}].needSlugs`, 1, 8);
    requireString(item.explanation, `eventFamilies[${index}].explanation`);
    requireString(item.provenance, `eventFamilies[${index}].provenance`);
  });
}

function compileCatalogLexicon(legacyCatalog, editorialCatalog) {
  const legacy = requireObject(legacyCatalog, 'legacy catalog');
  const editorial = requireObject(editorialCatalog, 'editorial catalog');
  const feelings = requireArray(legacy.feelings, 'legacy catalog feelings').map((feeling, index) => {
    const item = requireObject(feeling, `legacy catalog feelings[${index}]`);
    return {
      slug: requireSlug(item.slug, `legacy catalog feelings[${index}].slug`),
      title: requireString(item.title, `legacy catalog feelings[${index}].title`),
      needSatisfaction: item.needSatisfaction,
    };
  });
  const referenceSlugs = (references, label) => requireArray(references ?? [], label).map((reference, index) => {
    const item = requireObject(reference, `${label}[${index}]`);
    return requireSlug(item.slug, `${label}[${index}].slug`);
  });

  const editorialNeeds = Object.entries(requireObject(editorial.needs, 'editorial catalog needs'))
    .filter(([, need]) => {
      const item = requireObject(need, 'editorial Need');
      return typeof item.title === 'string'
        && Number.isInteger(item.catalogOrder)
        && Array.isArray(item.feelings)
        && Array.isArray(item.fauxFeelings);
    });
  const editorialNeedSlugs = new Set(editorialNeeds.map(([slug]) => slug));
  const remainingLegacyNeeds = requireArray(legacy.needs, 'legacy catalog needs')
    .filter((need) => !editorialNeedSlugs.has(need.slug));
  const totalNeedCount = remainingLegacyNeeds.length + editorialNeeds.length;
  const editorialByOrder = new Map();
  editorialNeeds.forEach(([slug, rawNeed]) => {
    const need = requireObject(rawNeed, `editorial Need ${slug}`);
    requireSlug(slug, `editorial Need ${slug} slug`);
    if (need.catalogOrder < 0 || need.catalogOrder >= totalNeedCount || editorialByOrder.has(need.catalogOrder)) {
      fail(`editorial Need ${slug} has an invalid or duplicate catalogOrder.`);
    }
    editorialByOrder.set(need.catalogOrder, { slug, need });
  });

  let legacyNeedIndex = 0;
  const needs = Array.from({ length: totalNeedCount }, (_, catalogOrder) => {
    const canonical = editorialByOrder.get(catalogOrder);
    if (canonical) {
      return {
        slug: canonical.slug,
        title: requireString(canonical.need.title, `editorial Need ${canonical.slug}.title`),
        category: typeof canonical.need.category === 'string' ? canonical.need.category : '',
        feelingSlugs: referenceSlugs(canonical.need.feelings, `editorial Need ${canonical.slug}.feelings`),
        fauxFeelingSlugs: referenceSlugs(canonical.need.fauxFeelings, `editorial Need ${canonical.slug}.fauxFeelings`),
      };
    }
    const rawNeed = remainingLegacyNeeds[legacyNeedIndex];
    if (!rawNeed) fail(`no Need is available for catalogOrder ${catalogOrder}.`);
    legacyNeedIndex += 1;
    const need = requireObject(rawNeed, `legacy Need at order ${catalogOrder}`);
    return {
      slug: requireSlug(need.slug, `legacy Need at order ${catalogOrder}.slug`),
      title: requireString(need.title, `legacy Need at order ${catalogOrder}.title`),
      category: typeof need.category === 'string' ? need.category : '',
      feelingSlugs: referenceSlugs(need.feelings, `legacy Need at order ${catalogOrder}.feelings`),
      fauxFeelingSlugs: referenceSlugs(need.fauxFeelings, `legacy Need at order ${catalogOrder}.fauxFeelings`),
    };
  });
  if (legacyNeedIndex !== remainingLegacyNeeds.length) fail('not all legacy Needs were placed in the catalog lexicon.');

  const fauxFeelings = requireArray(legacy.fauxFeelings, 'legacy catalog faux feelings').map((fauxFeeling, index) => {
    const item = requireObject(fauxFeeling, `legacy catalog faux feelings[${index}]`);
    const slug = requireSlug(item.slug, `legacy catalog faux feelings[${index}].slug`);
    return {
      slug,
      title: requireString(item.title, `legacy catalog faux feelings[${index}].title`),
      feelingSlugs: referenceSlugs(item.feelings, `legacy catalog faux feelings[${index}].feelings`),
      needSlugs: needs.filter((need) => need.fauxFeelingSlugs.includes(slug)).map((need) => need.slug),
    };
  });

  return { feelings, needs, fauxFeelings };
}

function validateCatalogLexicon(catalog, source) {
  const feelingSlugs = new Set(catalog.feelings.map((item) => item.slug));
  const needSlugs = new Set(catalog.needs.map((item) => item.slug));
  const fauxFeelingSlugs = new Set(catalog.fauxFeelings.map((item) => item.slug));
  if (feelingSlugs.size !== catalog.feelings.length) fail('catalog lexicon contains duplicate Feeling slugs.');
  if (needSlugs.size !== catalog.needs.length) fail('catalog lexicon contains duplicate Need slugs.');
  if (fauxFeelingSlugs.size !== catalog.fauxFeelings.length) fail('catalog lexicon contains duplicate Faux Feeling slugs.');
  catalog.feelings.forEach((feeling) => {
    if (!['met', 'unmet', 'both'].includes(feeling.needSatisfaction)) fail(`Feeling ${feeling.slug} has invalid needSatisfaction.`);
  });
  catalog.needs.forEach((need) => {
    need.feelingSlugs.forEach((slug) => {
      if (!feelingSlugs.has(slug)) fail(`Need ${need.slug} references unknown Feeling ${slug}.`);
    });
    need.fauxFeelingSlugs.forEach((slug) => {
      if (!fauxFeelingSlugs.has(slug)) fail(`Need ${need.slug} references unknown Faux Feeling ${slug}.`);
    });
  });
  catalog.fauxFeelings.forEach((fauxFeeling) => {
    fauxFeeling.feelingSlugs.forEach((slug) => {
      if (!feelingSlugs.has(slug)) fail(`Faux Feeling ${fauxFeeling.slug} references unknown Feeling ${slug}.`);
    });
    fauxFeeling.needSlugs.forEach((slug) => {
      if (!needSlugs.has(slug)) fail(`Faux Feeling ${fauxFeeling.slug} references unknown Need ${slug}.`);
    });
  });
  source.expressions.forEach((expression) => {
    expression.feelingSlugs.forEach((slug) => {
      if (!feelingSlugs.has(slug)) fail(`Expression ${expression.id} references unknown Feeling ${slug}.`);
    });
    expression.needSlugs.forEach((slug) => {
      if (!needSlugs.has(slug)) fail(`Expression ${expression.id} references unknown Need ${slug}.`);
    });
  });
  source.eventFamilies.forEach((family) => {
    family.feelingSlugs.forEach((slug) => {
      if (!feelingSlugs.has(slug)) fail(`Event family ${family.id} references unknown Feeling ${slug}.`);
    });
    family.needSlugs.forEach((slug) => {
      if (!needSlugs.has(slug)) fail(`Event family ${family.id} references unknown Need ${slug}.`);
    });
  });
  source.lexicalBridges.forEach((bridge) => {
    const slugs = bridge.entityType === 'feeling'
      ? feelingSlugs
      : bridge.entityType === 'need'
        ? needSlugs
        : fauxFeelingSlugs;
    if (!slugs.has(bridge.slug)) fail(`Lexical bridge ${bridge.id} references unknown ${bridge.entityType} ${bridge.slug}.`);
  });
}

function gitBlobChecksum(content) {
  const bytes = Buffer.from(content, 'utf8');
  return createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');
}

function generatedSource(source, checksum, catalogChecksum) {
  return `/* This file is generated by scripts/compile-observation-inference.mjs. */

import source from '../observationInference/source.json';
import { fauxFeelings, feelings, needs } from '../catalog';

type Detector = {
  id: string;
  pattern: string;
  flags: string;
};

type ObservationInferenceSource = {
  schemaVersion: number;
  modelVersion: string;
  provenance: {
    repository: string;
    branch: string;
    commit: string;
    importedAt: string;
    cueRows: number;
  };
  slots: Array<{
    id: 'time' | 'context' | 'sensory' | 'measure';
    label: string;
    noun: string;
    question: string;
    summary: string;
    examples: string[];
    detectors: Detector[];
  }>;
  expressions: Array<Detector & {
    tier: 'direct' | 'related' | 'broad';
    feelingSlugs: string[];
    needSlugs: string[];
    cueIds: string[];
    examples: string[];
    provenance: string;
  }>;
  eventFamilies: Array<{
    id: string;
    label: string;
    tier: 'related' | 'broad';
    lexiconRuleId: string | null;
    lexiconExcludeTerms: string[];
    patterns: Detector[];
    feelingSlugs: string[];
    needSlugs: string[];
    explanation: string;
    provenance: string;
  }>;
  lexicalBridges: Array<{
    id: string;
    entityType: 'feeling' | 'need' | 'fauxFeeling';
    slug: string;
    terms: string[];
    provenance: string;
  }>;
  surfaceTerms: Array<{
    id: string;
    label: string;
    terms: string[];
  }>;
  guidanceRules: Array<{
    id: string;
    label: string;
    explanation: string;
    terms: string[];
    patterns: Detector[];
    provenance: string;
  }>;
};

const validatedSource = source as unknown as ObservationInferenceSource;
const catalog = {
  feelings: feelings.map((feeling) => ({
    slug: feeling.slug,
    title: feeling.title,
    needSatisfaction: feeling.needSatisfaction,
  })),
  needs: needs.map((need) => ({
    slug: need.slug,
    title: need.title,
    category: need.category ?? '',
    feelingSlugs: need.feelings.map((feeling) => feeling.slug),
    fauxFeelingSlugs: need.fauxFeelings.map((feeling) => feeling.slug),
  })),
  fauxFeelings: fauxFeelings.map((feeling) => ({
    slug: feeling.slug,
    title: feeling.title,
    feelingSlugs: feeling.feelings.map((entry) => entry.slug),
    needSlugs: feeling.needs.map((entry) => entry.slug),
  })),
};

export const observationInferenceIndex = {
  schemaVersion: validatedSource.schemaVersion,
  modelVersion: validatedSource.modelVersion,
  sourceChecksum: '${checksum}',
  catalogChecksum: '${catalogChecksum}',
  provenance: validatedSource.provenance,
  catalog,
  slots: validatedSource.slots,
  expressions: validatedSource.expressions,
  eventFamilies: validatedSource.eventFamilies,
  lexicalBridges: validatedSource.lexicalBridges,
  surfaceTerms: validatedSource.surfaceTerms,
  guidanceRules: validatedSource.guidanceRules,
} as const;
`;
}

const rawSource = await readFile(sourcePath, 'utf8');
const parsedSource = JSON.parse(rawSource);
validateSource(parsedSource);
const checksum = gitBlobChecksum(rawSource);
const [rawLegacyCatalog, rawEditorialCatalog] = await Promise.all([
  readFile(legacyCatalogPath, 'utf8'),
  readFile(editorialCatalogPath, 'utf8'),
]);
const catalog = compileCatalogLexicon(JSON.parse(rawLegacyCatalog), JSON.parse(rawEditorialCatalog));
validateCatalogLexicon(catalog, parsedSource);
const catalogChecksum = createHash('sha256')
  .update(JSON.stringify(catalog))
  .digest('hex');
const expected = generatedSource(parsedSource, checksum, catalogChecksum);
const mode = process.argv.includes('--write') ? 'write' : 'check';

if (mode === 'write') {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, expected);
  console.log(`Generated ${outputPath} from ${parsedSource.expressions.length} expressions and ${parsedSource.eventFamilies.length} event families (${checksum.slice(0, 12)}).`);
} else {
  let current = '';
  try {
    current = await readFile(outputPath, 'utf8');
  } catch {
    fail('generated output is missing; run pnpm generate:observation-inference.');
  }
  if (current !== expected) fail('generated output is stale; run pnpm generate:observation-inference.');
  console.log(`Verified Observation inference source (${checksum.slice(0, 12)}).`);
}
