import { createHash } from 'node:crypto';
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const UPLOAD_DIR = join(ROOT, 'data/user-strategy-uploads');
const PUBLISHED_PATH = join(ROOT, 'data/user-submitted-strategies.json');
const LEGACY_CATALOG_PATH = join(ROOT, 'src/data/generated/legacyData.json');

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeForKey(value) {
  return text(value).toLocaleLowerCase().replace(/\s+/g, ' ');
}

function collectSlugs(value, target = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSlugs(entry, target));
  } else if (typeof value === 'string') {
    const slug = value.trim().toLocaleLowerCase();
    if (slug) target.push(slug);
  } else if (value && typeof value === 'object' && typeof value.slug === 'string') {
    const slug = value.slug.trim().toLocaleLowerCase();
    if (slug) target.push(slug);
  }
  return target;
}

function uniqueSlugs(...values) {
  return [...new Set(values.flatMap((value) => collectSlugs(value)))].sort();
}

export function strategyKey(strategy) {
  return JSON.stringify([
    normalizeForKey(strategy.title),
    normalizeForKey(strategy.summary ?? strategy.description),
    uniqueSlugs(strategy.needSlugs, strategy.needs, strategy.needSlug, strategy.sourceNeedPage),
  ]);
}

function slugify(value) {
  return normalizeForKey(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'strategy';
}

function deterministicSlug(strategy, usedSlugs) {
  const key = strategyKey(strategy);
  const digest = createHash('sha256').update(key).digest('hex');
  const base = `user-${slugify(strategy.title)}`;
  for (const length of [8, 12, 16, 24, 32]) {
    const candidate = `${base}-${digest.slice(0, length)}`;
    if (!usedSlugs.has(candidate)) return candidate;
  }
  throw new Error(`Unable to create a unique slug for “${strategy.title}”.`);
}

export function normalizeSubmittedStrategy(value, validNeedSlugs, submittedAt) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Each personal strategy must be a JSON object.');
  }

  const title = text(value.title);
  const summary = text(value.description) || text(value.summary);
  const needSlugs = uniqueSlugs(value.needSlugs, value.needs, value.needSlug, value.sourceNeedPage);
  if (!title) throw new Error('A submitted strategy is missing its title.');
  if (!summary) throw new Error(`“${title}” is missing its description.`);
  if (!needSlugs.length) throw new Error(`“${title}” is not connected to any needs.`);

  const unknownNeeds = needSlugs.filter((slug) => !validNeedSlugs.has(slug));
  if (unknownNeeds.length) {
    throw new Error(`“${title}” references unknown need slug(s): ${unknownNeeds.join(', ')}.`);
  }

  const rawContributor = value.contributor && typeof value.contributor === 'object'
    ? value.contributor
    : {};
  const name = text(rawContributor.name) || text(value.firstName);
  const location = text(rawContributor.location) || text(value.location);
  const contributor = name || location
    ? { ...(name ? { name } : {}), ...(location ? { location } : {}) }
    : undefined;

  return {
    title,
    summary,
    needSlugs,
    submittedAt,
    ...(contributor ? { contributor } : {}),
  };
}

function entriesFromPayload(payload, fileName) {
  if (Array.isArray(payload)) return { exportedAt: '', entries: payload };
  if (!payload || typeof payload !== 'object') {
    throw new Error(`${fileName} is not an allneeds strategy export.`);
  }
  if (!Array.isArray(payload.personalStrategies)) {
    throw new Error(`${fileName} does not contain a personalStrategies array.`);
  }
  return { exportedAt: text(payload.exportedAt), entries: payload.personalStrategies };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function importUserSubmittedStrategies({ now = () => new Date().toISOString() } = {}) {
  const [legacyCatalog, publishedCatalog, directoryEntries] = await Promise.all([
    readJson(LEGACY_CATALOG_PATH),
    readJson(PUBLISHED_PATH),
    readdir(UPLOAD_DIR, { withFileTypes: true }),
  ]);

  const files = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.toLocaleLowerCase().endsWith('.json'))
    .map((entry) => entry.name)
    .sort();

  if (!files.length) {
    console.log('No user-submitted strategy JSON files found.');
    return { added: 0, duplicates: 0, files: 0 };
  }

  if (!Array.isArray(legacyCatalog.needs) || !Array.isArray(legacyCatalog.strategies)) {
    throw new Error('Legacy catalog is missing needs or strategies.');
  }
  if (!publishedCatalog || publishedCatalog.version !== 1 || !Array.isArray(publishedCatalog.strategies)) {
    throw new Error('data/user-submitted-strategies.json has an unsupported shape.');
  }

  const validNeedSlugs = new Set(legacyCatalog.needs.map((need) => text(need.slug)).filter(Boolean));
  const existingKeys = new Set([
    ...legacyCatalog.strategies.map(strategyKey),
    ...publishedCatalog.strategies.map(strategyKey),
  ]);
  const usedSlugs = new Set([
    ...legacyCatalog.strategies.map((strategy) => text(strategy.slug)).filter(Boolean),
    ...publishedCatalog.strategies.map((strategy) => text(strategy.slug)).filter(Boolean),
  ]);

  const validatedFiles = [];
  for (const fileName of files) {
    const payload = await readJson(join(UPLOAD_DIR, fileName));
    const { exportedAt, entries } = entriesFromPayload(payload, fileName);
    if (!entries.length) throw new Error(`${fileName} contains no personal strategies.`);
    const submittedAt = exportedAt || now();
    const strategies = entries.map((entry) => normalizeSubmittedStrategy(entry, validNeedSlugs, submittedAt));
    validatedFiles.push({ fileName, strategies });
  }

  const nextStrategies = [...publishedCatalog.strategies];
  let added = 0;
  let duplicates = 0;

  for (const file of validatedFiles) {
    for (const strategy of file.strategies) {
      const key = strategyKey(strategy);
      if (existingKeys.has(key)) {
        duplicates += 1;
        continue;
      }
      const slug = deterministicSlug(strategy, usedSlugs);
      usedSlugs.add(slug);
      existingKeys.add(key);
      nextStrategies.push({ slug, ...strategy });
      added += 1;
    }
  }

  if (added) {
    await writeFile(PUBLISHED_PATH, `${JSON.stringify({ version: 1, strategies: nextStrategies }, null, 2)}\n`, 'utf8');
  }

  for (const { fileName } of validatedFiles) {
    await unlink(join(UPLOAD_DIR, fileName));
  }

  console.log(`Processed ${files.length} file(s): added ${added}, skipped ${duplicates} duplicate strategy entr${duplicates === 1 ? 'y' : 'ies'}.`);
  return { added, duplicates, files: files.length };
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (invokedPath === import.meta.url) {
  importUserSubmittedStrategies().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
