import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, KeyboardEvent, PointerEvent } from 'react';
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
  const deckGestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    horizontal: boolean;
  } | null>(null);
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

  const resetDeckGesture = (event?: PointerEvent<HTMLDivElement>) => {
    const gesture = deckGestureRef.current;
    if (gesture && event?.currentTarget.hasPointerCapture(gesture.pointerId)) {
      event.currentTarget.releasePointerCapture(gesture.pointerId);
    }
    deckGestureRef.current = null;
  };

  const handleDeckPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (showAll || orderedStrategies.length < 2 || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button, a, input, textarea, select, label')) {
      return;
    }

    deckGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      horizontal: false,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the pointer has already ended; the gesture simply stays inert.
    }
  };

  const handleDeckPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = deckGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const horizontalDistance = Math.abs(dx);
    const verticalDistance = Math.abs(dy);

    if (!gesture.horizontal) {
      if (verticalDistance > horizontalDistance + 6 && verticalDistance > 12) {
        resetDeckGesture(event);
        return;
      }
      if (horizontalDistance <= verticalDistance + 6 || horizontalDistance <= 12) {
        return;
      }
      gesture.horizontal = true;
    }

    event.preventDefault();
  };

  const handleDeckPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = deckGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const dx = event.clientX - gesture.startX;
    if (gesture.horizontal && Math.abs(dx) > 40) {
      move(dx > 0 ? -1 : 1);
      event.preventDefault();
    }
    resetDeckGesture(event);
  };

  const handleDeckKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (showAll || orderedStrategies.length < 2) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
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
              <summary className={styles.detailsToggle}>Details<span className="visually-hidden"> about the evidence</span></summary>
              <div className={styles.rewrite}>
                {need.evidence.narrative.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={`${need.slug}-evidence-${index}`}>{paragraph}</p>
                ))}
              </div>
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
            <div
              className={`${styles.deck} ${showAll ? styles.list : ''}`}
              data-strategy-deck
              tabIndex={0}
              aria-label="Strategy card deck"
              onKeyDown={handleDeckKeyDown}
              onPointerDown={handleDeckPointerDown}
              onPointerMove={handleDeckPointerMove}
              onPointerUp={handleDeckPointerUp}
              onPointerCancel={resetDeckGesture}
            >
              <div className={styles.stack}>
                {orderedStrategies.map((strategy, index) => {
                  const nextIndex = (activeIndex + 1) % orderedStrategies.length;
                  const previousIndex = (activeIndex - 1 + orderedStrategies.length) % orderedStrategies.length;
                  const position = index === activeIndex ? 'active'
                    : index === nextIndex ? 'next'
                      : index === previousIndex ? 'prev' : 'hidden';
                  const saved = inventoryHasStrategy(inventory, strategy.slug);
                  const contributor = contributorLabel(strategy);
                  return (
                    <article key={strategy.slug} className={styles.strategyCard} data-position={position}>
                      <h3>{strategy.title}</h3>
                      <div className={styles.cardBody}>
                        <p>{strategy.summary}</p>
                        {strategy.provenance === 'user' && contributor ? <p className={styles.meta}>{contributor}</p> : null}
                        {strategy.provenance === 'system' && strategy.evidence ? (
                          <p className={`${styles.meta} ${styles.evidenceMeta}`}>
                            <a
                              href={strategy.evidence.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              title={strategy.evidence.description}
                            >
                              Evidence
                            </a>
                          </p>
                        ) : null}
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
