import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Link, useParams } from 'react-router';

import { NeedCatalogPicker } from '../../components/forms/NeedCatalogPicker';
import { assetPath, needsBySlug, strategiesBySlug } from '../../data/catalog';
import type { Strategy } from '../../domain/models';
import {
  clearNeedStrategyDraft,
  readNeedStrategyDraft,
  writeNeedStrategyDraft,
} from '../../persistence/workflowDrafts';
import type { NeedStrategyDraft } from '../../persistence/workflowDrafts';
import { useWorkflowDraftPersistence } from '../../persistence/useWorkflowDraftPersistence';
import { saveCurrentBrowserToProfile, useBlueskySession } from '../account/blueskyAccount';
import {
  createCatalogInventoryEntry,
  createPersonalInventoryEntry,
  inventoryHasStrategy,
  isDuplicateStrategy,
  readInventory,
  writeInventory,
} from '../inventory/inventoryRepository';
import type { InventoryStrategy } from '../inventory/inventoryRepository';
import styles from './NeedDetailPage.module.css';

type Feedback = { kind: 'success' | 'warning' | 'error'; message: string } | null;

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other]!, copy[index]!];
  }
  return copy;
}

function contributorLabel(strategy: Strategy) {
  return [strategy.contributor?.name, strategy.contributor?.location].filter(Boolean).join(' • ');
}

function emptyNeedStrategyDraft(needSlug: string): NeedStrategyDraft {
  return {
    title: '',
    description: '',
    selectedNeeds: needSlug ? [needSlug] : [],
    firstName: '',
    location: '',
  };
}

export function NeedDetailPage() {
  const session = useBlueskySession();
  const { slug = '' } = useParams();
  const need = needsBySlug.get(slug);
  const canonicalStrategies = useMemo(
    () => need?.strategies
      .map((reference) => strategiesBySlug.get(reference.slug))
      .filter((strategy): strategy is Strategy => Boolean(strategy)) ?? [],
    [need],
  );
  const [strategyOrder, setStrategyOrder] = useState<string[]>(() => canonicalStrategies.map((item) => item.slug));
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [inventory, setInventory] = useState<InventoryStrategy[]>(readInventory);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [formFeedback, setFormFeedback] = useState<Feedback>(null);
  const [formDraft, setFormDraft] = useState<NeedStrategyDraft>(
    () => readNeedStrategyDraft(slug) ?? emptyNeedStrategyDraft(slug),
  );
  const writeCurrentDraft = useCallback(
    (draft: NeedStrategyDraft) => writeNeedStrategyDraft(slug, draft),
    [slug],
  );
  const formDraftRef = useWorkflowDraftPersistence(formDraft, writeCurrentDraft);

  useEffect(() => {
    setStrategyOrder(canonicalStrategies.map((strategy) => strategy.slug));
    setActiveIndex(0);
    setShowAll(false);
    setFeedback(null);
    setFormFeedback(null);
  }, [canonicalStrategies]);

  useEffect(() => {
    const restored = readNeedStrategyDraft(slug) ?? emptyNeedStrategyDraft(slug);
    formDraftRef.current = restored;
    setFormDraft(restored);
  }, [formDraftRef, slug]);

  if (!need) {
    return (
      <section className={styles.notFound}>
        <h1>Need not found</h1>
        <p>That need is not in the current catalog.</p>
        <Link to="/needs">Return to needs</Link>
      </section>
    );
  }

  const orderedStrategies = strategyOrder
    .map((strategySlug) => strategiesBySlug.get(strategySlug))
    .filter((strategy): strategy is Strategy => Boolean(strategy));

  const persistEntry = (entry: InventoryStrategy, duplicateMessage: string, successMessage: string) => {
    if (isDuplicateStrategy(inventory, entry.title, entry.needSlugs)
      && !window.confirm(duplicateMessage)) {
      setFeedback({ kind: 'warning', message: 'Skipped saving duplicate strategy.' });
      return false;
    }
    const next = writeInventory([...inventory, entry]);
    setInventory(next);
    setFeedback({ kind: 'success', message: successMessage });
    return true;
  };

  const saveCatalogStrategy = async (strategy: Strategy, saveToProfile = false) => {
    const entry = createCatalogInventoryEntry({
      strategy,
      needSlug: need.slug,
      needTitle: `Need for ${need.title}`,
    });
    const saved = persistEntry(
      entry,
      'You already saved a strategy with this title for this need. Save another copy?',
      `Saved “${strategy.title}” to your device for ${need.title}${saveToProfile ? ' and preparing profile sync' : ''}.`,
    );
    if (!saved || !saveToProfile) return;
    try {
      const result = await saveCurrentBrowserToProfile();
      setFeedback({ kind: 'success', message: `Saved “${strategy.title}” to your profile and device.${result.strategiesSynced ? '' : ' Shared strategy sync needs another try.'}` });
    } catch {
      setFeedback({ kind: 'warning', message: `Saved “${strategy.title}” to this device, but profile sync did not finish.` });
    }
  };

  const handlePersonalStrategy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const saveToProfile = submitter?.value === 'profile';
    const title = formDraft.title.trim();
    const description = formDraft.description.trim();
    const selectedNeedSlugs = formDraft.selectedNeeds.filter(Boolean);
    if (!title || !description || !selectedNeedSlugs.length) {
      setFormFeedback({
        kind: 'error',
        message: 'Please share a strategy name, description, and at least one need before saving.',
      });
      return;
    }
    const primaryNeed = needsBySlug.get(selectedNeedSlugs[0] ?? '') ?? need;
    const requestedVisibility = new FormData(event.currentTarget).get('strategy-visibility');
    const visibility = session && (requestedVisibility === 'followers' || requestedVisibility === 'public')
      ? requestedVisibility
      : 'private';
    const entry = createPersonalInventoryEntry({
      title,
      description,
      needSlugs: selectedNeedSlugs,
      needTitle: primaryNeed.title,
      firstName: formDraft.firstName,
      location: formDraft.location,
      visibility,
    });
    if (isDuplicateStrategy(inventory, entry.title, entry.needSlugs)
      && !window.confirm('You already saved a strategy with this title for one of the selected needs. Save another copy?')) {
      setFormFeedback({ kind: 'warning', message: 'Skipped saving duplicate strategy.' });
      return;
    }
    const next = writeInventory([...inventory, entry]);
    setInventory(next);
    setFormFeedback({ kind: 'success', message: `Saved “${title}” to your device${saveToProfile ? ' and preparing profile sync' : ''}.` });
    if (saveToProfile) {
      try {
        const result = await saveCurrentBrowserToProfile();
        setFormFeedback({ kind: 'success', message: `Saved “${title}” to your profile and device.${result.strategiesSynced ? '' : ' Shared strategy sync needs another try.'}` });
      } catch {
        setFormFeedback({ kind: 'warning', message: `Saved “${title}” to this device, but profile sync did not finish.` });
      }
    }
    const empty = emptyNeedStrategyDraft(need.slug);
    formDraftRef.current = empty;
    clearNeedStrategyDraft(need.slug);
    setFormDraft(empty);
  };

  const move = (offset: number) => {
    if (!orderedStrategies.length) return;
    setActiveIndex((current) => (current + offset + orderedStrategies.length) % orderedStrategies.length);
  };

  const iconStyle = {
    '--need-icon': `url("${assetPath(`icons/needs/${need.slug}.svg`)}")`,
  } as CSSProperties;

  return (
    <article className={styles.page} aria-labelledby="need-title">
      <header className={styles.pageHeader}>
        <h1 id="need-title" className={styles.pageTitle}>
          <span className={styles.titleIcon} style={iconStyle} aria-hidden="true" />
          <span>Need for {need.title}</span>
        </h1>
      </header>

      {need.evidence && (need.evidence.claimSummary || need.evidence.narrative || need.evidence.sources.length) ? (
        <section className={styles.evidence} aria-labelledby="need-evidence-heading">
          <h2 id="need-evidence-heading" className={styles.sectionTitle}>Evidence</h2>
          {need.evidence.claimSummary ? <p className={styles.claim}>{need.evidence.claimSummary}</p> : null}
          {need.evidence.narrative ? (
            <details className={styles.details}>
              <summary className={styles.detailsToggle}>Details<span className="visually-hidden"> about the rewritten claim</span></summary>
              <div className={styles.rewrite}><p>{need.evidence.narrative}</p></div>
            </details>
          ) : null}
          {need.evidence.sources.length ? (
            <div className={styles.sources}>
              <h3>Supporting sources</h3>
              <div className={styles.citationRow} aria-label="Supporting sources">
                {need.evidence.sources.map((source, index) => (
                  <span key={`${source.url}-${index}`}>[<a href={source.url} target="_blank" rel="noreferrer noopener" title={source.description}>{index + 1}</a>]</span>
                ))}
              </div>
              <details className={styles.details}>
                <summary className={styles.detailsToggle}>Citations</summary>
                <ol className={styles.citationList}>
                  {need.evidence.sources.map((source, index) => (
                    <li key={`${source.url}-full-${index}`}>
                      <span className={styles.citationNumber}>{index + 1}</span>
                      <div className={styles.citationBody}>
                        {source.description ? <span>{source.description}</span> : null}
                        <a href={source.url} target="_blank" rel="noreferrer noopener">{source.url}</a>
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className={styles.quickActions}>
        <a href="#suggestion-form"><span aria-hidden="true">+</span><span>Add personal strategy</span></a>
      </div>

      <section className={styles.strategySection} aria-labelledby="strategy-heading">
        <div className={styles.strategySectionHeader}>
          <h2 id="strategy-heading" className={styles.sectionTitle}>Strategies</h2>
          {orderedStrategies.length ? (
            <div className={styles.deckHeader} aria-label="Strategy browsing controls">
              <button type="button" aria-label="Shuffle strategy cards" onClick={() => {
                setStrategyOrder((current) => shuffled(current));
                setActiveIndex(0);
              }}>Shuffle</button>
              <button type="button" aria-pressed={showAll} onClick={() => setShowAll((current) => !current)}>
                {showAll ? 'View one at a time' : 'View all'}
              </button>
            </div>
          ) : null}
        </div>

        {orderedStrategies.length ? (
          <>
            <div className={`${styles.deck} ${showAll ? styles.list : ''}`} tabIndex={0}>
              <div className={styles.stack}>
                {orderedStrategies.map((strategy, index) => {
                  const nextIndex = (activeIndex + 1) % orderedStrategies.length;
                  const previousIndex = (activeIndex - 1 + orderedStrategies.length) % orderedStrategies.length;
                  const position = index === activeIndex ? 'active'
                    : index === nextIndex ? 'next'
                      : index === previousIndex ? 'prev' : 'hidden';
                  const saved = inventoryHasStrategy(inventory, strategy.slug);
                  return (
                    <article key={strategy.slug} className={styles.strategyCard} data-position={position}>
                      <h3>{strategy.title}</h3>
                      <div className={styles.cardBody}>
                        <p>{strategy.summary}</p>
                        {contributorLabel(strategy) ? <p className={styles.meta}>{contributorLabel(strategy)}</p> : null}
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={`${styles.appAction} ${styles.primaryAction} ${styles.deviceAction} ${saved ? styles.saved : ''}`}
                          aria-pressed={saved}
                          aria-label={saved ? 'Saved to device' : 'Save to device'}
                          onClick={() => void saveCatalogStrategy(strategy)}
                        >
                          Device
                        </button>
                        <button type="button" className={`${styles.appAction} ${styles.secondaryAction} ${styles.profileAction}`} aria-label="Save to profile" disabled={!session} onClick={() => void saveCatalogStrategy(strategy, true)}>Profile</button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className={styles.deckControls}>
                <button type="button" onClick={() => move(-1)} aria-label="Previous strategy">←</button>
                <span>{activeIndex + 1} of {orderedStrategies.length}</span>
                <button type="button" onClick={() => move(1)} aria-label="Next strategy">→</button>
              </div>
            </div>
          </>
        ) : <p>No shared strategies have been added for this need yet.</p>}

        {feedback ? <p className={`${styles.feedback} ${styles[feedback.kind]}`} role="status">{feedback.message}</p> : null}
      </section>

      <section className={styles.suggestion} aria-labelledby="suggestion-heading">
        <h2 id="suggestion-heading" className={styles.sectionTitle}>Add a strategy</h2>
        <div className={styles.formCard}>
          <form id="suggestion-form" className={styles.form} onSubmit={handlePersonalStrategy}>
            <label className={styles.formField}>
              <span>Strategy name</span>
              <span className={styles.inputCard}><input name="title" type="text" value={formDraft.title} onChange={(event) => setFormDraft({ ...formDraft, title: event.target.value })} required /></span>
            </label>
            <label className={styles.formField}>
              <span>How do you put it into practice?</span>
              <span className={styles.inputCard}><textarea name="description" rows={4} value={formDraft.description} onChange={(event) => setFormDraft({ ...formDraft, description: event.target.value })} required /></span>
            </label>
            <div className={`${styles.formField} ${styles.needsFormField}`}>
              <span id="need-strategy-needs-label">Needs</span>
              <span className={styles.inputCard}>
                <NeedCatalogPicker
                  labelId="need-strategy-needs-label"
                  selectedNeeds={formDraft.selectedNeeds}
                  onChange={(selectedNeeds) => setFormDraft({ ...formDraft, selectedNeeds })}
                />
              </span>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formField}>
                <span>First name (optional)</span>
                <span className={styles.inputCard}><input name="name" type="text" value={formDraft.firstName} onChange={(event) => setFormDraft({ ...formDraft, firstName: event.target.value })} /></span>
              </label>
              <label className={styles.formField}>
                <span>Location (optional)</span>
                <span className={styles.inputCard}><input name="location" type="text" value={formDraft.location} onChange={(event) => setFormDraft({ ...formDraft, location: event.target.value })} /></span>
              </label>
            </div>
            <label className={styles.formField}>
              <span>Visibility</span>
              <span className={styles.visibilityHint}>Choose who can see this strategy when you export or share it. {session ? 'Followers/Public can be shared when you save to your profile.' : 'Sign in with Bluesky to enable Followers/Public. While signed out, strategies stay only on this browser.'}</span>
              <span className={styles.inputCard}>
                <select name="strategy-visibility" defaultValue="private">
                  <option value="private">Private (only on this browser)</option>
                  <option value="followers" disabled={!session}>Followers (Bluesky followers when synced)</option>
                  <option value="public" disabled={!session}>Public</option>
                </select>
              </span>
            </label>
            <div className={styles.formActions}>
              <button type="submit" name="save-target" value="device" className={`${styles.appAction} ${styles.primaryAction} ${styles.deviceAction}`}>Device</button>
              <button type="submit" name="save-target" value="profile" className={`${styles.appAction} ${styles.secondaryAction} ${styles.profileAction}`} disabled={!session}>Profile</button>
            </div>
          </form>
        </div>
        {formFeedback ? <p className={`${styles.feedback} ${styles[formFeedback.kind]}`} role="status">{formFeedback.message}</p> : null}
      </section>
    </article>
  );
}
