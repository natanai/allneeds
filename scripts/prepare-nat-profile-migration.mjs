import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDirectory = resolve(repositoryRoot, 'backend');
const catalogPath = resolve(repositoryRoot, 'src/data/generated/legacyData.json');
const mappingPath = resolve(repositoryRoot, 'src/data/natProfileStrategyMigration.json');
const wranglerPath = resolve(backendDirectory, 'node_modules/wrangler/bin/wrangler.js');

const PROFILE_KEY = 'allneeds_export_v1';
const INVENTORY_KEY = 'allneeds.v2.inventory';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function strings(value) {
  const values = Array.isArray(value) ? value.flat(2) : [value];
  return [...new Set(values
    .map((entry) => typeof entry === 'string' ? entry.trim().toLocaleLowerCase() : '')
    .filter(Boolean))];
}

function profileVisibility(value) {
  return value === 'followers' || value === 'public' ? value : 'private';
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function contentHash(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function selectMappedCatalogStrategies(catalog, mapping) {
  const attributed = catalog.strategies.filter((strategy) => (
    (strategy.contributor?.name ?? strategy.contributorName) === mapping.contributor.name
    && (strategy.contributor?.location ?? strategy.contributorLocation) === mapping.contributor.location
  ));
  assert(attributed.length === 40, `Expected exactly 40 Nat, Missouri catalog strategies; found ${attributed.length}.`);

  const attributedBySlug = new Map(attributed.map((strategy) => [strategy.slug, strategy]));
  const mappedSlugs = mapping.strategies.map((entry) => entry.slug);
  const mappedKeys = mapping.strategies.map((entry) => entry.clientKey);
  assert(new Set(mappedSlugs).size === mappedSlugs.length, 'Migration strategy slugs must be unique.');
  assert(new Set(mappedKeys).size === mappedKeys.length, 'Migration client keys must be unique.');
  assert(mappedSlugs.length === attributed.length, 'Migration mapping must contain all 40 attributed strategies.');
  mappedSlugs.forEach((slug) => assert(attributedBySlug.has(slug), `Mapped strategy ${slug} is not attributed to Nat, Missouri.`));
  attributed.forEach((strategy) => assert(mappedSlugs.includes(strategy.slug), `Missing migration mapping for ${strategy.slug}.`));

  return mapping.strategies.map((entry) => ({ ...entry, catalog: attributedBySlug.get(entry.slug) }));
}

function migratedInventoryEntry(existing, strategy, clientKey, needTitleBySlug, contributor, migratedAt) {
  const catalogNeedSlugs = strings((strategy.needs ?? []).map((need) => need.slug));
  const existingNeedSlugs = strings(existing?.needSlugs ?? []);
  const needSlugs = existingNeedSlugs.length ? existingNeedSlugs : catalogNeedSlugs;
  assert(needSlugs.length > 0, `Migrated strategy ${strategy.slug} must support at least one Need.`);
  const wasAlreadyPersonal = existing?.personal === true;
  const visibility = wasAlreadyPersonal ? profileVisibility(existing.visibility) : 'public';
  const firstNeedSlug = needSlugs[0];
  const firstName = existing?.firstName?.trim() || existing?.contributor?.name?.trim() || contributor.name;
  const location = existing?.location?.trim() || existing?.contributor?.location?.trim() || contributor.location;

  return {
    ...(existing ?? {}),
    id: clientKey,
    title: existing?.title?.trim() || strategy.title,
    description: typeof existing?.description === 'string'
      ? existing.description
      : strategy.summary || strategy.description || '',
    need: existing?.need?.trim() || needTitleBySlug.get(firstNeedSlug) || firstNeedSlug,
    needSlug: firstNeedSlug,
    needSlugs,
    tags: needSlugs,
    personal: true,
    shareWithNat: visibility === 'public',
    sourceNeedPage: '',
    strategySlug: '',
    createdAt: existing?.createdAt || migratedAt,
    visibility,
    contributor: { name: firstName, location },
    firstName,
    location,
  };
}

export function mergeNatStrategiesIntoSnapshot(snapshot, catalog, mapping, migratedAt) {
  assert(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot), 'Profile snapshot must be an object.');
  assert(Array.isArray(snapshot.inventory), 'Profile snapshot must contain an inventory array.');
  assert(snapshot.localStorage && typeof snapshot.localStorage === 'object' && !Array.isArray(snapshot.localStorage), 'Profile snapshot must contain localStorage.');

  const inventoryEnvelope = JSON.parse(snapshot.localStorage[INVENTORY_KEY] ?? 'null');
  assert(inventoryEnvelope?.schemaVersion === 1, 'Profile inventory envelope must use schema version 1.');
  assert(Array.isArray(inventoryEnvelope?.data?.items), 'Profile inventory envelope must contain items.');
  assert(JSON.stringify(inventoryEnvelope.data.items) === JSON.stringify(snapshot.inventory), 'Snapshot inventory and localStorage inventory must match before migration.');

  const mapped = selectMappedCatalogStrategies(catalog, mapping);
  const needTitleBySlug = new Map(catalog.needs.map((need) => [need.slug, need.title]));
  const nextInventory = snapshot.inventory.map((entry) => ({ ...entry }));
  const promoted = [];
  const added = [];

  for (const { slug, clientKey, catalog: strategy } of mapped) {
    const existingIndex = nextInventory.findIndex((entry) => entry?.id === clientKey || entry?.strategySlug === slug);
    const existing = existingIndex >= 0 ? nextInventory[existingIndex] : null;
    if (existing && existing.id !== clientKey) {
      throw new Error(`Saved strategy ${slug} uses ${existing.id}; mapping expects ${clientKey}.`);
    }
    const migrated = migratedInventoryEntry(
      existing,
      strategy,
      clientKey,
      needTitleBySlug,
      mapping.contributor,
      migratedAt,
    );
    if (existingIndex >= 0) {
      nextInventory[existingIndex] = migrated;
      promoted.push({ slug, clientKey });
    } else {
      nextInventory.push(migrated);
      added.push({ slug, clientKey });
    }
  }

  assert(new Set(nextInventory.map((entry) => entry.id)).size === nextInventory.length, 'Merged inventory IDs must remain unique.');
  const nextEnvelope = {
    ...inventoryEnvelope,
    savedAt: migratedAt,
    data: { ...inventoryEnvelope.data, items: nextInventory },
  };
  const nextSnapshot = {
    ...snapshot,
    exportedAt: migratedAt,
    inventory: nextInventory,
    migrations: {
      ...(snapshot.migrations ?? {}),
      natProfileOwnershipV1: { appliedAt: migratedAt, strategyCount: mapped.length, ready: true },
    },
    localStorage: {
      ...snapshot.localStorage,
      [INVENTORY_KEY]: JSON.stringify(nextEnvelope),
    },
  };

  return { nextSnapshot, migrated: mapped.map(({ slug, clientKey }) => ({ slug, clientKey })), promoted, added };
}

export function buildMigrationSql({ nextSnapshot, migratedEntries, did, sourceUpdatedAt, inventoryBefore }) {
  const marker = nextSnapshot.migrations?.natProfileOwnershipV1;
  assert(marker?.strategyCount === 40 && marker.ready === true && typeof marker.appliedAt === 'string', 'Merged snapshot must contain the ready Nat ownership migration marker.');
  assert(typeof sourceUpdatedAt === 'string' && sourceUpdatedAt, 'Migration requires the source profile updated_at value.');
  assert(Number.isInteger(inventoryBefore), 'Migration requires the source inventory count.');
  const pendingMarker = { ...marker, ready: false };
  const nextInventory = JSON.stringify(nextSnapshot.inventory);
  const nextInventoryEnvelope = nextSnapshot.localStorage?.[INVENTORY_KEY];
  assert(typeof nextInventoryEnvelope === 'string', 'Merged snapshot must contain the serialized inventory envelope.');
  const markerMatch = `json_extract(value, '$.migrations.natProfileOwnershipV1.appliedAt') = ${sqlString(marker.appliedAt)} AND json_extract(value, '$.migrations.natProfileOwnershipV1.strategyCount') = 40`;
  const profileGuard = `EXISTS (SELECT 1 FROM user_settings WHERE did = ${sqlString(did)} AND key = ${sqlString(PROFILE_KEY)} AND ${markerMatch} AND json_extract(value, '$.migrations.natProfileOwnershipV1.ready') = 1)`;
  const lines = [
    '-- Generated by scripts/prepare-nat-profile-migration.mjs.',
    '-- The two profile phases are optimistic; strategy writes run only after both finish.',
    `UPDATE user_settings`,
    `SET value = json_set(value,`,
    `      '$.exportedAt', ${sqlString(marker.appliedAt)},`,
    `      '$.inventory', json(${sqlString(nextInventory)}),`,
    `      '$.migrations.natProfileOwnershipV1', json(${sqlString(JSON.stringify(pendingMarker))})`,
    `    ),`,
    `    updated_at = CURRENT_TIMESTAMP`,
    `WHERE did = ${sqlString(did)}`,
    `  AND key = ${sqlString(PROFILE_KEY)}`,
    `  AND updated_at = ${sqlString(sourceUpdatedAt)}`,
    `  AND json_array_length(json_extract(value, '$.inventory')) = ${inventoryBefore};`,
    `UPDATE user_settings`,
    `SET value = json_set(value,`,
    `      '$.localStorage."${INVENTORY_KEY}"', ${sqlString(nextInventoryEnvelope)},`,
    `      '$.migrations.natProfileOwnershipV1.ready', json('true')`,
    `    ),`,
    `    updated_at = CURRENT_TIMESTAMP`,
    `WHERE did = ${sqlString(did)}`,
    `  AND key = ${sqlString(PROFILE_KEY)}`,
    `  AND ${markerMatch}`,
    `  AND json_extract(value, '$.migrations.natProfileOwnershipV1.ready') = 0;`,
    '',
  ];

  for (const entry of migratedEntries) {
    const needIds = JSON.stringify(entry.needSlugs);
    lines.push(
      `INSERT OR IGNORE INTO strategies`,
      `  (author_did, client_key, title, body, need_ids, created_at, visibility, add_count, updated_at, moderation_status)`,
      `SELECT ${sqlString(did)}, ${sqlString(entry.id)}, ${sqlString(entry.title)}, ${sqlString(entry.description)}, ${sqlString(needIds)}, ${sqlString(entry.createdAt)}, ${sqlString(entry.visibility)}, 0, CURRENT_TIMESTAMP, 'visible'`,
      `WHERE ${profileGuard};`,
      `UPDATE strategies`,
      `SET title = ${sqlString(entry.title)},`,
      `    body = ${sqlString(entry.description)},`,
      `    need_ids = ${sqlString(needIds)},`,
      `    visibility = ${sqlString(entry.visibility)},`,
      `    moderation_status = 'visible',`,
      `    updated_at = CURRENT_TIMESTAMP`,
      `WHERE author_did = ${sqlString(did)} AND client_key = ${sqlString(entry.id)} AND ${profileGuard};`,
      `DELETE FROM strategy_needs`,
      `WHERE strategy_id = (SELECT id FROM strategies WHERE author_did = ${sqlString(did)} AND client_key = ${sqlString(entry.id)})`,
      `  AND ${profileGuard};`,
    );
    for (const needSlug of entry.needSlugs) {
      lines.push(
        `INSERT OR IGNORE INTO strategy_needs (strategy_id, need_id)`,
        `SELECT id, ${sqlString(needSlug)} FROM strategies`,
        `WHERE author_did = ${sqlString(did)} AND client_key = ${sqlString(entry.id)} AND ${profileGuard};`,
      );
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function queryLiveSnapshot(databaseName, did) {
  const query = `SELECT value, updated_at FROM user_settings WHERE did = ${sqlString(did)} AND key = ${sqlString(PROFILE_KEY)} LIMIT 1;`;
  const result = spawnSync(process.execPath, [
    wranglerPath,
    'd1',
    'execute',
    databaseName,
    '--remote',
    '--json',
    '--command',
    query,
  ], {
    cwd: backendDirectory,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Unable to read the profile snapshot.');
  const response = JSON.parse(result.stdout);
  const row = response?.[0]?.results?.[0];
  assert(typeof row?.value === 'string', `No ${PROFILE_KEY} profile snapshot exists for ${did}.`);
  return { snapshot: JSON.parse(row.value), updatedAt: row.updated_at };
}

function outputPaths(migratedAt) {
  const stamp = migratedAt.replaceAll(':', '').replaceAll('-', '').replace(/\.\d{3}Z$/, 'Z');
  const directory = resolve(backendDirectory, '.wrangler/backups');
  return {
    sql: resolve(directory, `nat-profile-migration-${stamp}.sql`),
    report: resolve(directory, `nat-profile-migration-${stamp}.json`),
  };
}

export function prepareLiveMigration(databaseName = 'allneeds-db', migratedAt = new Date().toISOString()) {
  const catalog = readJson(catalogPath);
  const mapping = readJson(mappingPath);
  const { snapshot, updatedAt } = queryLiveSnapshot(databaseName, mapping.did);
  const originalValue = JSON.stringify(snapshot);
  const merged = mergeNatStrategiesIntoSnapshot(snapshot, catalog, mapping, migratedAt);
  const migratedInventoryById = new Map(merged.nextSnapshot.inventory.map((entry) => [entry.id, entry]));
  const migratedEntries = merged.migrated.map(({ clientKey }) => migratedInventoryById.get(clientKey));
  assert(migratedEntries.every(Boolean), 'Every mapped strategy must exist in the merged inventory.');

  const sql = buildMigrationSql({
    nextSnapshot: merged.nextSnapshot,
    migratedEntries,
    did: mapping.did,
    sourceUpdatedAt: updatedAt,
    inventoryBefore: snapshot.inventory.length,
  });
  const paths = outputPaths(migratedAt);
  mkdirSync(dirname(paths.sql), { recursive: true });
  writeFileSync(paths.sql, sql, 'utf8');
  const report = {
    databaseName,
    did: mapping.did,
    preparedAt: migratedAt,
    sourceSnapshotUpdatedAt: updatedAt,
    sourceSnapshotSha256: contentHash(originalValue),
    mergedSnapshotSha256: contentHash(JSON.stringify(merged.nextSnapshot)),
    inventoryBefore: snapshot.inventory.length,
    inventoryAfter: merged.nextSnapshot.inventory.length,
    promoted: merged.promoted,
    added: merged.added,
    migratedStrategyCount: merged.migrated.length,
    migratedNeedLinkCount: migratedEntries.reduce((count, entry) => count + entry.needSlugs.length, 0),
    rollbackBookmark: '000000d7-00000000-000050d2-8dd9dc0a7157b89b5dad34bdb3cbe3be',
    backup: 'backend/.wrangler/backups/allneeds-db-before-nat-profile-migration-2026-08-25.sql',
    sqlFile: paths.sql,
  };
  writeFileSync(paths.report, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { paths, report };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const databaseName = process.argv[2] || 'allneeds-db';
  const { paths, report } = prepareLiveMigration(databaseName);
  console.log(JSON.stringify({
    status: 'prepared',
    sqlFile: paths.sql,
    reportFile: paths.report,
    inventoryBefore: report.inventoryBefore,
    inventoryAfter: report.inventoryAfter,
    promoted: report.promoted.length,
    added: report.added.length,
    migratedStrategyCount: report.migratedStrategyCount,
    migratedNeedLinkCount: report.migratedNeedLinkCount,
  }, null, 2));
}
