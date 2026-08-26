import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import {
  loadSharedFeedResources,
  readSharedFeedResources,
  readSharedFeedUpdatedAt,
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
import {
  hideSharedStrategy,
  loadHiddenSharedStrategies,
  restoreSharedStrategy,
} from './sharedStrategyModeration';
import {
  normalizeSharedStrategyNeeds,
  sharedStrategyAuthorName,
  sharedStrategyClientKey,
  sharedStrategyContributorLocation,
  sharedStrategyOwnerDid,
} from './sharedStrategyModel';
import styles from './FeedPage.module.css';

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
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
  const [reviewHidden, setReviewHidden] = useState(false);
  const [feed, setFeed] = useState(() => initialFeed('public', 'recent'));
  const [loading, setLoading] = useState(() => !readSharedFeedResources('public', 'recent'));
  const [feedUpdatedAt, setFeedUpdatedAt] = useState(() => readSharedFeedUpdatedAt('public', 'recent'));
  const [statusOverride, setStatusOverride] = useState('');
  const [savedIds, setSavedIds] = useState(() => new Set(readInventory().flatMap((item) => [
    item.strategySlug,
    item.personal ? item.id : '',
  ]).filter(Boolean).map((value) => value.toLocaleLowerCase())));

  useEffect(() => {
    let cancelled = false;
    setStatusOverride('');

    if (reviewHidden) {
      if (!session?.admin) {
        setReviewHidden(false);
        return () => { cancelled = true; };
      }
      setLoading(true);
      void loadHiddenSharedStrategies().then((strategies) => {
        if (cancelled) return;
        setFeed({ strategies, error: '' });
        setLoading(false);
      }).catch((error: unknown) => {
        if (cancelled) return;
        setFeed({ strategies: [], error: error instanceof Error ? error.message : 'Unable to load hidden community strategies.' });
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    const cached = readSharedFeedResources(scope, 'recent');
    if (cached) {
      setFeed(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    void loadSharedFeedResources(scope, 'recent').then((next) => {
      if (cancelled) return;
      setFeed(next);
      setFeedUpdatedAt(readSharedFeedUpdatedAt(scope, 'recent'));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [reviewHidden, scope, session?.admin]);

  useEffect(() => {
    if (!session && scope === 'follows') setScope('public');
    if (!session?.admin && reviewHidden) setReviewHidden(false);
  }, [reviewHidden, scope, session]);

  async function save(strategy: SharedFeedStrategy) {
    const strategyId = String(strategy.id);
    const current = readInventory();
    const clientKey = sharedStrategyClientKey(strategy);
    const isOwned = Boolean(session && clientKey && sharedStrategyOwnerDid(strategy) === session.did);
    const hasOwnedEntry = isOwned && current.some((entry) => entry.personal && entry.id === clientKey);
    if (inventoryHasStrategy(current, strategyId) || hasOwnedEntry) {
      setStatusOverride('This shared strategy is already saved in your inventory.');
      return;
    }
    if (isOwned) {
      setStatusOverride('This strategy belongs to your profile. Load your profile from Menu → Account & data before editing it.');
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
      const next = await loadSharedFeedResources(scope, 'recent', true);
      setFeed(next);
      setStatusOverride(`“${title}” is hidden from community discovery.`);
    } catch (error) {
      setStatusOverride(error instanceof Error ? error.message : 'Unable to hide this strategy from the community.');
    }
  }

  async function restore(strategy: SharedFeedStrategy) {
    const title = strategy.title || 'this strategy';
    setStatusOverride(`Restoring “${title}”…`);
    try {
      await restoreSharedStrategy(strategy.id);
      const strategies = await loadHiddenSharedStrategies();
      setFeed({ strategies, error: '' });
      setStatusOverride(`“${title}” is available to the community again according to its sharing setting.`);
    } catch (error) {
      setStatusOverride(error instanceof Error ? error.message : 'Unable to restore this strategy to the community.');
    }
  }

  async function refreshFeed() {
    setLoading(true);
    setStatusOverride('Refreshing shared strategies…');
    const next = await loadSharedFeedResources(scope, 'recent', true);
    setFeed(next);
    setFeedUpdatedAt(readSharedFeedUpdatedAt(scope, 'recent'));
    setLoading(false);
    setStatusOverride(next.error || `Shared strategies refreshed at ${formatTime(new Date().toISOString())}.`);
  }

  const displayedStrategies = useMemo(() => {
    if (sort !== 'popular') return feed.strategies;
    return [...feed.strategies].sort((left, right) => {
      const popularity = (right.addCount ?? 0) - (left.addCount ?? 0);
      if (popularity) return popularity;
      const recency = Date.parse(right.updatedAt ?? right.createdAt ?? '')
        - Date.parse(left.updatedAt ?? left.createdAt ?? '');
      if (Number.isFinite(recency) && recency) return recency;
      return String(right.id).localeCompare(String(left.id));
    });
  }, [feed.strategies, sort]);

  const emptyMessage = reviewHidden
    ? 'No strategies are currently hidden by moderation.'
    : 'No shared strategies found for this view yet.';
  const status = statusOverride
    || (loading
      ? 'Loading…'
      : feed.error || (!feed.strategies.length
        ? emptyMessage
        : !reviewHidden && feedUpdatedAt ? `Last refreshed at ${formatTime(feedUpdatedAt)}.` : ''));

  return (
    <div className={styles.page}>
      <header className={styles.header}><h1>Shared strategies</h1></header>

      <section className={styles.controls} aria-label="Shared strategy filters">
        {!reviewHidden ? (
          <div className={styles.controlRow}>
            <label><span>Show</span><select value={scope} onChange={(event) => setScope(event.target.value)}><option value="follows" disabled={!session}>From people you follow</option><option value="public">All public strategies</option></select></label>
            <label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Most recent</option><option value="popular">Most added</option></select></label>
            <button className={styles.refreshButton} type="button" disabled={loading} onClick={() => void refreshFeed()}>Refresh shared strategies</button>
          </div>
        ) : <p className={styles.adminReviewLabel}>Admin review · hidden from community</p>}
        {session?.admin ? (
          <button className={styles.adminReviewButton} type="button" onClick={() => setReviewHidden((current) => !current)}>
            {reviewHidden ? 'Back to community feed' : 'Review hidden strategies'}
          </button>
        ) : null}
        {status ? <p className={styles.status} role="status">{status}</p> : null}
        {!reviewHidden ? <p className={styles.authHint}>{session ? `Following feed available${session.handle ? ` for @${session.handle.replace(/^@/, '')}` : ''}.` : 'Following requires Bluesky sign-in in Menu → Account & data.'}</p> : null}
      </section>

      <section className={styles.feed} aria-label={reviewHidden ? 'Hidden community strategies' : 'Shared strategies'}>
        {displayedStrategies.map((strategy) => {
          const author = strategy.author ?? {};
          const authorLabel = sharedStrategyAuthorName(strategy) || 'Unknown author';
          const contributorLocation = sharedStrategyContributorLocation(strategy);
          const contributorLabel = [authorLabel, contributorLocation].filter(Boolean).join(' • ');
          const handle = author.handle ? `@${author.handle}` : '';
          const timestamp = formatDate(strategy.createdAt);
          const strategyNeeds = normalizeSharedStrategyNeeds(strategy);
          const clientKey = sharedStrategyClientKey(strategy);
          const isOwner = Boolean(session && clientKey && sharedStrategyOwnerDid(strategy) === session.did);
          const isSaved = savedIds.has(String(strategy.id).toLocaleLowerCase())
            || Boolean(isOwner && savedIds.has(clientKey.toLocaleLowerCase()));
          return (
            <article className={styles.card} key={strategy.id}>
              <header><h3>{strategy.title || 'Untitled strategy'}</h3><p>{`by ${contributorLabel}${handle && authorLabel !== author.handle ? ` (${handle})` : ''}${timestamp ? ` · ${timestamp}` : ''}`}</p></header>
              <div className={styles.body}><p>{strategy.body || ''}</p></div>
              <footer>
                <span>{reviewHidden ? 'Hidden' : visibility(strategy.visibility)}</span>
                {strategyNeeds.length ? <details><summary>Needs supported</summary><ul>{strategyNeeds.map((need) => <li key={need}>{need}</li>)}</ul></details> : null}
                {isOwner ? (
                  <Link className={styles.editLink} to={`/inventory?edit=${encodeURIComponent(clientKey)}`}>
                    Edit
                  </Link>
                ) : null}
                {session?.admin ? (
                  <details className={styles.adminMenu}>
                    <summary aria-label={`Admin actions for ${strategy.title || 'strategy'}`}>⋯</summary>
                    <div className={styles.adminMenuPopover}>
                      <button type="button" onClick={() => void (reviewHidden ? restore(strategy) : hide(strategy))}>
                        {reviewHidden ? 'Restore to community' : 'Hide from community'}
                      </button>
                    </div>
                  </details>
                ) : null}
                {!reviewHidden ? <button type="button" disabled={isSaved} onClick={() => save(strategy)}>{isSaved ? 'Saved to inventory' : 'Save to inventory'}</button> : null}
              </footer>
            </article>
          );
        })}
      </section>
    </div>
  );
}
