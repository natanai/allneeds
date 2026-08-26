import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  buildMigrationSql,
  mergeNatStrategiesIntoSnapshot,
  selectMappedCatalogStrategies,
} from './prepare-nat-profile-migration.mjs';

const catalog = JSON.parse(readFileSync(resolve('src/data/generated/legacyData.json'), 'utf8'));
const mapping = JSON.parse(readFileSync(resolve('src/data/natProfileStrategyMigration.json'), 'utf8'));
const migratedAt = '2026-08-25T23:00:00.000Z';

function inventoryEnvelope(items) {
  return JSON.stringify({ schemaVersion: 1, savedAt: '2026-08-25T22:00:00.000Z', data: { items } });
}

function fixtureSnapshot() {
  const items = [
    {
      id: 'inv-mt1h15e3-jpxysy',
      title: 'Snuggle a pet',
      description: 'Keep this edited description.',
      need: 'Love/Caring',
      needSlug: 'love-caring',
      needSlugs: ['love-caring', 'safety'],
      tags: ['love-caring', 'safety'],
      personal: false,
      shareWithNat: false,
      sourceNeedPage: 'safety',
      strategySlug: 'snuggle-a-pet',
      createdAt: '2026-08-20T12:02:51.147Z',
      visibility: 'private',
      contributor: { name: 'Nat', location: 'Missouri' },
      firstName: 'Nat',
      location: 'Missouri',
    },
    {
      id: 'saved-system-copy',
      title: 'Shake for 30 seconds',
      description: 'Leave this unrelated strategy alone.',
      need: 'Freedom',
      needSlug: 'freedom',
      needSlugs: ['freedom'],
      tags: ['freedom'],
      personal: false,
      shareWithNat: false,
      sourceNeedPage: 'freedom',
      strategySlug: 'shake-for-30-seconds',
      createdAt: '2026-02-12T04:37:17.097Z',
      visibility: 'private',
    },
  ];
  return {
    version: 1,
    exportedAt: '2026-08-25T22:00:00.000Z',
    inventory: items,
    journalEntries: [{ id: 'private-journal-entry', notes: 'preserve exactly' }],
    localStorage: {
      'allneeds.v2.inventory': inventoryEnvelope(items),
      unrelated: 'preserve exactly',
    },
  };
}

describe('Nat profile strategy migration', () => {
  it('maps exactly the 40 Nat, Missouri legacy strategies to unique stable keys', () => {
    const selected = selectMappedCatalogStrategies(catalog, mapping);
    expect(selected).toHaveLength(40);
    expect(new Set(selected.map((entry) => entry.clientKey)).size).toBe(40);
  });

  it('promotes saved authored copies, adds missing strategies, and preserves unrelated profile data', () => {
    const source = fixtureSnapshot();
    const { nextSnapshot, promoted, added, migrated } = mergeNatStrategiesIntoSnapshot(
      source,
      catalog,
      mapping,
      migratedAt,
    );

    expect(promoted).toEqual([{ slug: 'snuggle-a-pet', clientKey: 'inv-mt1h15e3-jpxysy' }]);
    expect(added).toHaveLength(39);
    expect(migrated).toHaveLength(40);
    expect(nextSnapshot.inventory).toHaveLength(41);
    expect(nextSnapshot.journalEntries).toEqual(source.journalEntries);
    expect(nextSnapshot.localStorage.unrelated).toBe('preserve exactly');

    const promotedStrategy = nextSnapshot.inventory.find((entry) => entry.id === 'inv-mt1h15e3-jpxysy');
    expect(promotedStrategy).toMatchObject({
      description: 'Keep this edited description.',
      needSlugs: ['love-caring', 'safety'],
      personal: true,
      visibility: 'public',
      shareWithNat: true,
      strategySlug: '',
      sourceNeedPage: '',
      createdAt: '2026-08-20T12:02:51.147Z',
    });
    expect(nextSnapshot.inventory.find((entry) => entry.id === 'saved-system-copy'))
      .toEqual(source.inventory[1]);

    const stored = JSON.parse(nextSnapshot.localStorage['allneeds.v2.inventory']);
    expect(stored.savedAt).toBe(migratedAt);
    expect(stored.data.items).toEqual(nextSnapshot.inventory);
  });

  it('guards every D1 strategy write behind the exact merged snapshot', () => {
    const source = fixtureSnapshot();
    const merged = mergeNatStrategiesIntoSnapshot(source, catalog, mapping, migratedAt);
    const inventoryById = new Map(merged.nextSnapshot.inventory.map((entry) => [entry.id, entry]));
    const migratedEntries = merged.migrated.map((entry) => inventoryById.get(entry.clientKey));
    const sql = buildMigrationSql({
      nextSnapshot: merged.nextSnapshot,
      migratedEntries,
      did: mapping.did,
      sourceUpdatedAt: '2026-08-25 22:00:00',
      inventoryBefore: source.inventory.length,
    });

    expect(sql.match(/INSERT OR IGNORE INTO strategies/g)).toHaveLength(40);
    expect(sql.match(/EXISTS \(SELECT 1 FROM user_settings/g)?.length).toBeGreaterThan(40);
    expect(sql).toContain("AND updated_at = '2026-08-25 22:00:00'");
    expect(sql).toContain("json_extract(value, '$.migrations.natProfileOwnershipV1.appliedAt')");
    expect(sql).toContain("json_extract(value, '$.migrations.natProfileOwnershipV1.ready') = 1");
    expect(sql).not.toContain('private-journal-entry');
  });
});
