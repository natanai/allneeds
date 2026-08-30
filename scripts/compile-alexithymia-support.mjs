import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const authoredPath = resolve('src/data/alexithymiaSupport.json');
const generatedPath = resolve('src/data/generated/alexithymiaSupport.json');
const legacyCatalogPath = resolve('src/data/generated/legacyData.json');
const bodyRegionsPath = resolve('src/data/body-regions.json');
const dimensions = ['pleasantness', 'energy', 'power', 'expectedness'];

function fail(message) {
  throw new Error(`Alexithymia Support data: ${message}`);
}

function asObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object.`);
  return value;
}

function normalize(value, minimum, maximum) {
  return Number(((value - minimum) / (maximum - minimum)).toFixed(6));
}

export function compileAlexithymiaSupport(authored, legacyCatalog, bodyRegions) {
  asObject(authored, 'root');
  if (authored.version !== 1) fail(`unsupported authored version ${String(authored.version)}.`);
  const sources = asObject(authored.sources, 'sources');
  const normalization = asObject(authored.shapeNormalization, 'shapeNormalization');
  const candidates = Array.isArray(authored.candidates) ? authored.candidates : fail('candidates must be an array.');
  if (candidates.length !== 24) fail(`expected 24 candidates, found ${candidates.length}.`);

  const feelingSlugs = new Set((legacyCatalog.feelings ?? []).map((feeling) => feeling.slug));
  const feelingTitles = new Set((legacyCatalog.feelings ?? []).map((feeling) => feeling.title.toLocaleLowerCase()));
  const bodyKeys = new Set((bodyRegions ?? []).flatMap((region) => (region.options ?? [])
    .flatMap((option) => Object.keys(option.emotions ?? {}))));
  const keys = new Set();
  const displays = new Set();

  const compiledCandidates = candidates.map((candidate, index) => {
    asObject(candidate, `candidate ${index}`);
    const { key, display, role, bodyProfileKey, catalogSlug, definition, definitionSource } = candidate;
    if (typeof key !== 'string' || !key) fail(`candidate ${index} has no key.`);
    if (keys.has(key)) fail(`duplicate candidate key ${key}.`);
    keys.add(key);
    if (key === 'love-caring') fail('love-caring is a Need and cannot be an emotion candidate.');
    if (typeof display !== 'string' || !display.trim()) fail(`${key} has no display term.`);
    const displayKey = display.toLocaleLowerCase();
    if (displays.has(displayKey)) fail(`duplicate display term ${display}.`);
    displays.add(displayKey);
    if (role !== 'feeling' && role !== 'working') fail(`${key} has invalid role ${String(role)}.`);
    if (bodyProfileKey !== key || !bodyKeys.has(bodyProfileKey)) fail(`${key} has no canonical body profile.`);

    if (role === 'feeling') {
      if (typeof catalogSlug !== 'string' || !feelingSlugs.has(catalogSlug)) {
        fail(`${key} must declare an exact canonical Feeling bridge.`);
      }
      if (definitionSource !== 'catalog') fail(`${key} must use its canonical Feeling summary.`);
    } else {
      if (catalogSlug !== undefined) fail(`${key} is a working term and cannot have a fallback Feeling route.`);
      if (feelingTitles.has(displayKey)) fail(`${key} duplicates an official Feeling but is marked working.`);
      if (typeof definition !== 'string' || !definition.trim()) fail(`${key} needs a working-term definition.`);
      if (typeof definitionSource !== 'string' || !definitionSource.startsWith('https://')) {
        fail(`${key} needs a direct human-reachable definition source.`);
      }
    }

    let shape = null;
    if (candidate.shape !== undefined) {
      const authoredShape = asObject(candidate.shape, `${key}.shape`);
      if (!sources[authoredShape.source]) fail(`${key} references unknown shape source ${String(authoredShape.source)}.`);
      if (typeof authoredShape.termForm !== 'string' || !authoredShape.termForm.trim()) fail(`${key} has no reviewed term form.`);
      if (authoredShape.partOfSpeech !== 'noun' && authoredShape.partOfSpeech !== 'adjective') {
        fail(`${key} has invalid reviewed part of speech.`);
      }
      const raw = asObject(authoredShape.raw, `${key}.shape.raw`);
      const coordinates = {};
      dimensions.forEach((dimension) => {
        const scale = asObject(normalization[dimension], `shapeNormalization.${dimension}`);
        const rawValue = raw[dimension];
        if (!Number.isFinite(rawValue)) fail(`${key} is missing ${dimension}.`);
        if (!Number.isFinite(scale.rawMin) || !Number.isFinite(scale.rawMax) || scale.rawMin >= scale.rawMax) {
          fail(`${dimension} has an invalid normalization range.`);
        }
        if (rawValue < scale.rawMin || rawValue > scale.rawMax) {
          fail(`${key}.${dimension} lies outside the fixed source range.`);
        }
        coordinates[dimension] = normalize(rawValue, scale.rawMin, scale.rawMax);
      });
      shape = {
        source: authoredShape.source,
        termForm: authoredShape.termForm,
        partOfSpeech: authoredShape.partOfSpeech,
        raw,
        coordinates,
      };
    }

    return {
      key,
      display: display.trim(),
      role,
      bodyProfileKey,
      catalogSlug: role === 'feeling' ? catalogSlug : null,
      route: role === 'feeling' ? `/feelings/${catalogSlug}` : null,
      definition: role === 'working' ? definition.trim() : null,
      definitionSource,
      coverage: { body: true, shape: Boolean(shape) },
      shape,
    };
  });

  const bodyCandidateKeys = [...bodyKeys].filter((key) => key !== 'love-caring').sort();
  const compiledKeys = [...keys].sort();
  if (JSON.stringify(bodyCandidateKeys) !== JSON.stringify(compiledKeys)) {
    fail('candidate keys must exactly match the authored body-profile universe excluding love-caring.');
  }

  return {
    version: 1,
    sources,
    shapeNormalization: normalization,
    candidates: compiledCandidates,
  };
}

const authored = JSON.parse(readFileSync(authoredPath, 'utf8'));
const legacyCatalog = JSON.parse(readFileSync(legacyCatalogPath, 'utf8'));
const bodyRegions = JSON.parse(readFileSync(bodyRegionsPath, 'utf8'));
const output = `${JSON.stringify(compileAlexithymiaSupport(authored, legacyCatalog, bodyRegions), null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(generatedPath, 'utf8');
  if (current !== output) fail('generated runtime data is stale; run pnpm compile:alexithymia.');
} else {
  writeFileSync(generatedPath, output);
}
