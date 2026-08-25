import { useEffect, useState } from 'react';

import {
  loadSharedFeedResources,
  readSharedFeedResources,
} from '../../app/appResources';
import type { SharedFeedStrategy } from '../../app/appResources';
import { notifySharedStrategyAdded, useBlueskySession } from '../account/blueskyAccount';
import {
  createSharedInventoryEntry,
  inventoryHasStrategy,
  readInventory,
  writeInventory,
  type InventoryVisibility,
} from '../inventory/inventoryRepository';
import { hideSharedStrategy } from './sharedStrategyModeration';
import {
  normalizeSharedStrategyNeeds,
  sharedStrategyAuthorName,
} from './sharedStrategyModel';
import styles from './FeedPage.module.css';

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function visibility(value?: InventoryVisibility) {
  if (value === 'public') return 'Public';
  if (value === 'followers') return 'Followers only';
  return 'Private';
}

function initialFeed(scope: string, sort: string) {
  return readSharedFeedResources(scope, sort) ?? {
    strategies: [],
    error: '',
  };
}

export function FeedPage() {
  const session = useBlueskySession();
  const [scope, setScope] = useState('public');
  const [sort, setSort] = useState('recent');
  const [feed, setFeed] = useState(() => initialFeed('public', 'recent'));
  const [loading, setLoading] = useState(() => !readSharedFeedResources('public', 'recent'));
  const [statusOverride, setStatusOverride] = useState('');
  const [savedIds, setSavedIds] = useState(() => new Set(readInventory().map((item) => item.strategySlug).filter(Boolean)));

  useEffect(() => {
    let cancelled = false;
    const cached = readSharedFeedResources(scope, sort);
    if (cached) {
      setFeed(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setStatusOverride('');
    void loadSharedFeedResources(scope, sort).then((next) => {
      if (cancelled) return;
      setFeed(next);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [scope, sort]);

  useEffect(() => {
    if (!session && scope === 'follows') setScope('public');
  }, [scope, session]);

  async function save(strategy: SharedFeedStrategy) {
    const strategyId = String(strategy.id);
    const current = readInventory();
    if (inventoryHasStrategy(current, strategyId)) {
      setStatusOverride('This shared strategy is already saved in your inventory.');
      return;
    }
    const authorName = sharedStrategyAuthorName(strategy);
    const entry = createSharedInventoryEntry({
      id: strategyId,
      title: strategy.title || 'Untitled strategy',
      description: strategy.body || '',
      needSlugs: normalizeSharedStrategyNeeds(strategy),
      visibility: strategy.visibility,
      contributor: authorName ? { name: authorName } : undefined,
    });
    writeInventory([...current, entry]);
    setSavedIds((values) => new Set(values).add(strategyId.toLocaleLowerCase()));
    setStatusOverride('Saved to your inventory.');
    if (!session) return;
    try { await notifySharedStrategyAdded(strategyId); }
    catch { setStatusOverride('Saved to your inventory. Shared add count could not be updated.'); }
  }

  async function hide(strategy: SharedFeedStrategy) {
    const title = strategy.title || 'this strategy';
    if (!window.confirm(`Hide “${title}” from community discovery? The author keeps their strategy and sharing setting.`)) return;
    setStatusOverride(`Hiding “${title}”…`);
    try {
      await hideSharedStrategy(strategy.id);
      const next = await loadSharedFeedResources(scope, sort, true);
      setFeed(next);
      setStatusOverride(`“${title}” is hidden from community discovery.`);
    } catch (error) {
      setStatusOverride(error instanceof Error ? error.message : 'Unable to hide this strategy from the community.');
    }
  }

  const status = statusOverride
    || (loading ? 'Loading…' : feed.error || (!feed.strategies.length ? 'No shared strategies found for this view yet.' : ''));

  return (
    <div className={styles.page}>
      <header className={styles.header}><h1>Shared strategies</h1></header>

      <section className={styles.controls} aria-label="Shared strategy filters">
        <div className={styles.controlRow}>
          <label><span>Show</span><select value={scope} onChange={(event) => setScope(event.target.value)}><option value="follows" disabled={!session}>From people you follow</option><option value="public">All public strategies</option></select></label>
          <label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Most recent</option><option value="popular">Most added</option></select></label>
        </div>
        {status ? <p className={styles.status} role="status">{status}</p> : null}
        <p className={styles.authHint}>{session ? `Following feed available${session.handle ? ` for @${session.handle.replace(/^@/, '')}` : ''}.` : 'Following requires Bluesky sign-in in Menu → Account & data.'}</p>
      </section>

      <section className={styles.feed} aria-label="Shared strategies">
        {feed.strategies.map((strategy) => {
          const author = strategy.author ?? {};
          const authorLabel = sharedStrategyAuthorName(strategy) || 'Unknown author';
          const handle = author.handle ? `@${author.handle}` : '';
          const timestamp = formatDate(strategy.createdAt);
          const strategyNeeds = normalizeSharedStrategyNeeds(strategy);
          const isSaved = savedIds.has(String(strategy.id).toLocaleLowerCase());
          return (
            <article className={styles.card} key={strategy.id}>
              <header><h3>{strategy.title || 'Untitled strategy'}</h3><p>{`by ${authorLabel}${handle && authorLabel !== author.handle ? ` (${handle})` : ''}${timestamp ? ` · ${timestamp}` : ''}`}</p></header>
              <div className={styles.body}><p>{strategy.body || ''}</p></div>
              <footer>
                <span>{visibility(strategy.visibility)}</span>
                {strategyNeeds.length ? <details><summary>Needs supported</summary><ul>{strategyNeeds.map((need) => <li key={need}>{need}</li>)}</ul></details> : null}
                {session?.admin ? (
                  <details className={styles.adminMenu}>
                    <summary aria-label={`Admin actions for ${strategy.title || 'strategy'}`}>⋯</summary>
                    <div className={styles.adminMenuPopover}>
                      <button type="button" onClick={() => void hide(strategy)}>Hide from community</button>
                    </div>
                  </details>
                ) : null}
                <button type="button" disabled={isSaved} onClick={() => save(strategy)}>{isSaved ? 'Saved to inventory' : 'Save to inventory'}</button>
              </footer>
            </article>
          );
        })}
      </section>
    </div>
  );
}
