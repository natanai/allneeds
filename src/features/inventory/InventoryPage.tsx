import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';

import { NeedCatalogPicker } from '../../components/forms/NeedCatalogPicker';
import { needs, needsBySlug } from '../../data/catalog';
import { readInventoryDraft, writeInventoryDraft } from '../../persistence/workflowDrafts';
import type { InventoryDraft } from '../../persistence/workflowDrafts';
import { useWorkflowDraftPersistence } from '../../persistence/useWorkflowDraftPersistence';
import { saveCurrentBrowserToProfile, useBlueskySession } from '../account/blueskyAccount';
import {
  createPersonalInventoryEntry,
  isDuplicateStrategy,
  readInventory,
  writeInventory,
} from './inventoryRepository';
import type { InventoryStrategy } from './inventoryRepository';
import {
  downloadStrategyForNat,
  personalStrategiesEmailHref,
  PERSONAL_STRATEGIES_EMAIL_ADDRESS,
} from './personalStrategiesExport';
import { StrategySharingFields } from './StrategySharingFields';
import styles from './InventoryPage.module.css';
import popoverStyles from './NeedStrategyPopover.module.css';

type CoverageFilter = 'all' | 'missing' | 'covered';
type InventoryView = 'needs' | 'strategies';
type Feedback = { kind: 'success' | 'warning' | 'error'; message: string } | null;

const inventoryNeeds = [...needs].sort((left, right) => left.title.localeCompare(right.title));

const EMPTY_ADD_DRAFT: InventoryDraft['add'] = {
  title: '', description: '', selectedNeeds: [], firstName: '', location: '',
};

function emptyInventoryDraft(): InventoryDraft {
  return {
    coverageFilter: 'all',
    expandedNeed: null,
    add: { ...EMPTY_ADD_DRAFT, selectedNeeds: [] },
    edit: null,
  };
}

export function InventoryPage() {
  const session = useBlueskySession();
  const [initialDraft] = useState(() => readInventoryDraft() ?? emptyInventoryDraft());
  const [inventory, setInventory] = useState<InventoryStrategy[]>(readInventory);
  const [view, setView] = useState<InventoryView>('needs');
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>(
    initialDraft.coverageFilter === 'hidden' ? 'all' : initialDraft.coverageFilter,
  );
  const [expandedNeed, setExpandedNeed] = useState<string | null>(initialDraft.expandedNeed);
  const [strategyNeedFilter, setStrategyNeedFilter] = useState<string | null>(null);
  const [strategySearch, setStrategySearch] = useState('');
  const [addDraft, setAddDraft] = useState<InventoryDraft['add']>(initialDraft.add);
  const [editDraft, setEditDraft] = useState<InventoryDraft['edit']>(initialDraft.edit);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [shareEmailReadyFor, setShareEmailReadyFor] = useState<string | null>(null);
  const addFormShellRef = useRef<HTMLDetailsElement>(null);
  const openNeedRef = useRef<HTMLElement | null>(null);
  const workflowDraft = useMemo<InventoryDraft>(() => ({
    coverageFilter, expandedNeed, add: addDraft, edit: editDraft,
  }), [addDraft, coverageFilter, editDraft, expandedNeed]);
  const workflowDraftRef = useWorkflowDraftPersistence(workflowDraft, writeInventoryDraft);

  const coverage = useMemo(() => {
    const covered = new Set(inventory.flatMap((item) => item.needSlugs));
    return inventoryNeeds.map((need) => ({ need, covered: covered.has(need.slug) }));
  }, [inventory]);
  const visibleCoverage = coverage.filter((entry) => {
    if (coverageFilter === 'covered') return entry.covered;
    if (coverageFilter === 'missing') return !entry.covered;
    return true;
  });
  const supportedCount = coverage.filter((entry) => entry.covered).length;
  const visibleStrategies = useMemo(() => {
    const needFiltered = strategyNeedFilter
      ? inventory.filter((entry) => entry.needSlugs.includes(strategyNeedFilter))
      : inventory;
    const query = strategySearch.trim().toLocaleLowerCase();
    if (!query) return needFiltered;
    return needFiltered.filter((entry) => [
      entry.title,
      entry.description,
      ...entry.needSlugs.map((slug) => needsBySlug.get(slug)?.title ?? slug),
    ].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [inventory, strategyNeedFilter, strategySearch]);
  const selectedStrategyNeed = strategyNeedFilter ? needsBySlug.get(strategyNeedFilter) : undefined;

  useEffect(() => {
    if (!expandedNeed) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || openNeedRef.current?.contains(event.target)) return;
      setExpandedNeed(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const needSlug = expandedNeed;
      setExpandedNeed(null);
      window.requestAnimationFrame(() => {
        document.getElementById(`inventory-need-${needSlug}`)?.focus();
      });
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedNeed]);

  const commit = (items: InventoryStrategy[], message: string) => {
    setInventory(writeInventory(items));
    setFeedback({ kind: 'success', message });
  };

  const openStrategiesForNeed = (needSlug: string, entryId?: string) => {
    setStrategyNeedFilter(needSlug);
    setStrategySearch('');
    setExpandedNeed(null);
    setView('strategies');
    window.requestAnimationFrame(() => {
      const target = entryId
        ? document.getElementById(`inventory-strategy-${entryId}`)
        : document.getElementById('strategies-list');
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (entryId) target?.focus({ preventScroll: true });
    });
  };

  const openAddForm = (needSlug?: string) => {
    setExpandedNeed(null);
    if (needSlug) setAddDraft((current) => ({ ...current, selectedNeeds: [needSlug] }));
    if (addFormShellRef.current) addFormShellRef.current.open = true;
    window.requestAnimationFrame(() => {
      document.getElementById('inventory-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('inventory-title')?.focus({ preventScroll: true });
    });
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const saveToProfile = submitter?.value === 'profile';
    const title = addDraft.title.trim();
    const description = addDraft.description.trim();
    const needSlugs = addDraft.selectedNeeds.filter(Boolean);
    if (!title || !description || !needSlugs.length) {
      setFeedback({ kind: 'error', message: 'Add a strategy name, description, and at least one need.' });
      return;
    }
    if (isDuplicateStrategy(inventory, title, needSlugs)
      && !window.confirm('You already saved a strategy with this title for one of the selected needs. Save another copy?')) {
      setFeedback({ kind: 'warning', message: 'Skipped saving duplicate strategy.' });
      return;
    }
    const primaryNeed = needsBySlug.get(needSlugs[0] ?? '');
    const formData = new FormData(event.currentTarget);
    const requestedVisibility = formData.get('strategy-visibility');
    const visibility = requestedVisibility === 'followers' || requestedVisibility === 'public'
      ? requestedVisibility
      : 'private';
    const entry = createPersonalInventoryEntry({
      title,
      description,
      needSlugs,
      needTitle: primaryNeed?.title ?? 'Need',
      firstName: addDraft.firstName,
      location: addDraft.location,
      visibility,
    });
    commit([...inventory, entry], `Saved “${title}” to this device${saveToProfile ? ' and preparing profile sync' : ''}.`);
    if (saveToProfile) {
      try {
        const result = await saveCurrentBrowserToProfile();
        setFeedback({ kind: 'success', message: `Saved “${title}” to your profile and device.${result.strategiesSynced ? '' : ' Shared strategy sync needs another try.'}` });
      } catch {
        setFeedback({ kind: 'warning', message: `Saved “${title}” to this device, but profile sync did not finish.` });
      }
    }
    const emptyAdd = { ...EMPTY_ADD_DRAFT, selectedNeeds: [] };
    workflowDraftRef.current = { ...workflowDraftRef.current, add: emptyAdd };
    setAddDraft(emptyAdd);
    setStrategyNeedFilter(null);
    setView('strategies');
  };

  const updateEntry = (event: FormEvent<HTMLFormElement>, entry: InventoryStrategy) => {
    event.preventDefault();
    const title = editDraft?.id === entry.id ? editDraft.title.trim() : '';
    const description = editDraft?.id === entry.id ? editDraft.description.trim() : '';
    if (!title) return;
    commit(inventory.map((item) => item.id === entry.id ? { ...item, title, description } : item), `Updated “${title}”.`);
    workflowDraftRef.current = { ...workflowDraftRef.current, edit: null };
    setEditDraft(null);
  };

  const shareOneWithNat = (entry: InventoryStrategy) => {
    if (!entry.personal) return;
    const result = downloadStrategyForNat(entry);
    if (!result.downloaded) {
      setFeedback({ kind: 'error', message: 'That strategy could not be exported.' });
      return;
    }
    setShareEmailReadyFor(entry.id);
    setFeedback({
      kind: 'success',
      message: `Exported “${entry.title}”. Attach the downloaded file to an email to ${PERSONAL_STRATEGIES_EMAIL_ADDRESS}.`,
    });
  };

  const removeEntry = (entry: InventoryStrategy) => {
    if (!window.confirm(`Remove “${entry.title}” from this device?`)) return;
    commit(inventory.filter((item) => item.id !== entry.id), `Removed “${entry.title}”.`);
    if (editDraft?.id === entry.id) {
      workflowDraftRef.current = { ...workflowDraftRef.current, edit: null };
      setEditDraft(null);
    }
    setShareEmailReadyFor((current) => current === entry.id ? null : current);
  };

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingCopy}>
          <h1>Strategy inventory</h1>
          <p>Build a personal library of strategies that help you care for your needs. Browse by need or review everything you have saved.</p>
        </div>
        <button type="button" className={styles.addAction} onClick={() => openAddForm()}>
          <span aria-hidden="true">+</span> Add strategy
        </button>
      </header>

      {feedback ? <p className={`${styles.feedback} ${styles[feedback.kind]}`} role="status">{feedback.message}</p> : null}

      <section className={styles.overview} aria-label="Strategy inventory views">
        <div className={styles.viewSwitch} role="tablist" aria-label="Inventory view">
          <button
            id="inventory-view-needs"
            type="button"
            role="tab"
            aria-selected={view === 'needs'}
            aria-controls="inventory-needs-panel"
            onClick={() => {
              setExpandedNeed(null);
              setView('needs');
            }}
          >Needs</button>
          <button
            id="inventory-view-strategies"
            type="button"
            role="tab"
            aria-selected={view === 'strategies'}
            aria-controls="inventory-strategies-panel"
            onClick={() => {
              setExpandedNeed(null);
              setStrategyNeedFilter(null);
              setView('strategies');
            }}
          >Strategies{inventory.length ? <span>{inventory.length}</span> : null}</button>
        </div>

        {view === 'needs' ? (
          <section id="inventory-needs-panel" className={styles.viewPanel} role="tabpanel" aria-labelledby="inventory-view-needs">
            <header className={styles.panelHeader}>
              <div><h2>Needs</h2><p>Tap a need to see the strategies you have saved for it.</p></div>
              <p className={styles.countStatus}>{supportedCount} supported · {inventoryNeeds.length - supportedCount} without strategies</p>
            </header>
            <div className={styles.filters} role="group" aria-label="Filter needs">
              {([['all', 'All'], ['missing', 'Needs care'], ['covered', 'Supported']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  data-filter={value}
                  aria-pressed={coverageFilter === value}
                  onClick={() => {
                    setExpandedNeed(null);
                    setCoverageFilter(value);
                  }}
                >{label}</button>
              ))}
            </div>
            <div className={`${styles.coverageList} ${popoverStyles.coverageList}`}>
              {visibleCoverage.map(({ need, covered }) => {
                const matching = inventory.filter((item) => item.needSlugs.includes(need.slug));
                const expanded = expandedNeed === need.slug;
                const popoverId = `inventory-need-popover-${need.slug}`;
                return (
                  <article
                    key={need.slug}
                    ref={expanded ? openNeedRef : undefined}
                    className={`${styles.needRow} ${popoverStyles.needRow}`}
                    data-covered={covered}
                    data-popover-open={expanded || undefined}
                  >
                    <button
                      id={`inventory-need-${need.slug}`}
                      type="button"
                      className={styles.needFocus}
                      aria-expanded={expanded}
                      aria-controls={expanded ? popoverId : undefined}
                      aria-label={`${need.title}, ${matching.length ? `${matching.length} saved ${matching.length === 1 ? 'strategy' : 'strategies'}` : 'no saved strategies'}. ${expanded ? 'Close' : 'Open'} strategies.`}
                      onClick={() => setExpandedNeed(expanded ? null : need.slug)}
                    >
                      <span className={styles.needStatus} aria-hidden="true" />
                      <span className={styles.needText}>
                        <span className={styles.needLabel}>{need.title}</span>
                        <small>{matching.length ? `${matching.length} saved` : 'No strategies'}</small>
                      </span>
                      <span className={styles.chevron} aria-hidden="true">›</span>
                    </button>
                    {expanded ? (
                      <div id={popoverId} className={`${styles.needDetail} ${popoverStyles.popover}`} role="region" aria-label={`${need.title} strategies`}>
                        <div className={popoverStyles.popoverHeader}>
                          <Link className={popoverStyles.needLink} to={`/needs/${need.slug}`} onClick={() => setExpandedNeed(null)}>
                            <span>{need.title}</span>
                            <small>Open need details</small>
                          </Link>
                          <button type="button" className={popoverStyles.closeButton} aria-label={`Close ${need.title} strategies`} onClick={() => setExpandedNeed(null)}>×</button>
                        </div>
                        {matching.length ? (
                          <>
                            <p className={popoverStyles.detailPrompt}>Open a strategy to see its full description and controls.</p>
                            <div className={popoverStyles.strategyShortcuts}>
                              {matching.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  aria-label={`Open ${item.title} in Strategies`}
                                  onClick={() => openStrategiesForNeed(need.slug, item.id)}
                                >
                                  <span>{item.title}</span><span aria-hidden="true">›</span>
                                </button>
                              ))}
                            </div>
                            <button type="button" className={popoverStyles.viewStrategies} onClick={() => openStrategiesForNeed(need.slug)}>
                              View all {matching.length} in Strategies
                            </button>
                          </>
                        ) : (
                          <p>Add something that reliably helps you care for {need.title.toLocaleLowerCase()}.</p>
                        )}
                        <button type="button" className={styles.detailAdd} onClick={() => openAddForm(need.slug)}>Add a strategy</button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section id="inventory-strategies-panel" className={styles.viewPanel} role="tabpanel" aria-labelledby="inventory-view-strategies">
            <header className={styles.panelHeader}>
              <div><h2>My strategies</h2><p>Everything you have saved, regardless of which needs it supports.</p></div>
              <p className={styles.countStatus}>{selectedStrategyNeed || strategySearch.trim() ? `${visibleStrategies.length} of ${inventory.length} saved` : `${inventory.length} saved`}</p>
            </header>
            <label className={styles.search}>
              <span aria-hidden="true">⌕</span><span className="visually-hidden">Search saved strategies</span>
              <input type="search" placeholder="Search your strategies" autoComplete="off" value={strategySearch} onChange={(event) => setStrategySearch(event.target.value)} />
            </label>
            {selectedStrategyNeed ? (
              <div className={popoverStyles.strategyContext}>
                <span>Showing strategies for <strong>{selectedStrategyNeed.title}</strong></span>
                <button type="button" onClick={() => setStrategyNeedFilter(null)}>Show all</button>
              </div>
            ) : null}
            <div className={styles.savedList} id="strategies-list">
              {!inventory.length ? <p className={styles.empty}>Nothing saved yet. Add a personal strategy or save one from a need page.</p> : null}
              {inventory.length > 0 && !visibleStrategies.length ? (
                <p className={styles.empty}>
                  {selectedStrategyNeed
                    ? strategySearch.trim()
                      ? `No ${selectedStrategyNeed.title} strategies match “${strategySearch}”.`
                      : `No strategies are saved for ${selectedStrategyNeed.title}.`
                    : `No strategies match “${strategySearch}”.`}
                </p>
              ) : null}
              {visibleStrategies.map((entry) => (
                <article key={entry.id} id={`inventory-strategy-${entry.id}`} tabIndex={-1} className={`${styles.savedCard} ${popoverStyles.savedCard}`}>
                  {editDraft?.id === entry.id ? (
                    <form onSubmit={(event) => updateEntry(event, entry)}>
                      <label>Strategy name<input value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} required /></label>
                      <label>Description<textarea value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} rows={4} /></label>
                      <div><button type="submit">Save changes</button><button type="button" onClick={() => setEditDraft(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <div className={styles.cardHeading}>
                        <h3>{entry.title}</h3>
                        <details className={styles.cardMenu}>
                          <summary aria-label={`More actions for ${entry.title}`}><span aria-hidden="true">•••</span></summary>
                          <div className={styles.cardMenuPanel}>
                            {entry.personal ? (
                              <>
                                <button type="button" onClick={() => shareOneWithNat(entry)}>Share this strategy with Nat…</button>
                                {shareEmailReadyFor === entry.id ? <a href={personalStrategiesEmailHref()}>Start email to Nat</a> : null}
                              </>
                            ) : null}
                            <button type="button" onClick={() => setEditDraft({ id: entry.id, title: entry.title, description: entry.description })}>Edit</button>
                            <button type="button" className={styles.destructiveMenuItem} onClick={() => removeEntry(entry)}>Remove</button>
                          </div>
                        </details>
                      </div>
                      <p>{entry.description}</p>
                      <div className={styles.tags}>{entry.needSlugs.map((slug) => <Link key={slug} to={`/needs/${slug}`}>{needsBySlug.get(slug)?.title ?? slug}</Link>)}</div>
                      <div className={styles.cardMeta}>
                        <small>{entry.personal ? 'Personal strategy' : 'Saved strategy'} · Stored on this device</small>
                        {entry.personal ? (
                          <span className={styles.shareStatus} data-shareable={entry.visibility === 'public' || undefined}>
                            {entry.visibility === 'public' ? 'Public' : entry.visibility === 'followers' ? 'Followers' : 'Private'}
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      <details ref={addFormShellRef} className={styles.formShell} id="inventory-form-shell">
        <summary><span>Add a personal strategy</span><span aria-hidden="true">+</span></summary>
        <div className={styles.formBody}>
          <form id="inventory-form" className={styles.formCard} onSubmit={handleAdd}>
            <label className={styles.formField}>
              <span>Strategy name</span>
              <span className={styles.inputCard}><input id="inventory-title" name="title" type="text" value={addDraft.title} onChange={(event) => setAddDraft({ ...addDraft, title: event.target.value })} required /></span>
            </label>
            <label className={styles.formField}>
              <span>How do you put it into practice?</span>
              <span className={styles.inputCard}><textarea name="description" rows={4} value={addDraft.description} onChange={(event) => setAddDraft({ ...addDraft, description: event.target.value })} required /></span>
            </label>
            <div className={`${styles.formField} ${styles.needsFormField}`}>
              <span id="inventory-needs-label">Needs</span>
              <span className={styles.inputCard}>
                <NeedCatalogPicker
                  labelId="inventory-needs-label"
                  selectedNeeds={addDraft.selectedNeeds}
                  onChange={(selectedNeeds) => setAddDraft({ ...addDraft, selectedNeeds })}
                />
              </span>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formField}><span>First name (optional)</span><span className={styles.inputCard}><input name="name" type="text" value={addDraft.firstName} onChange={(event) => setAddDraft({ ...addDraft, firstName: event.target.value })} /></span></label>
              <label className={styles.formField}><span>Location (optional)</span><span className={styles.inputCard}><input name="location" type="text" value={addDraft.location} onChange={(event) => setAddDraft({ ...addDraft, location: event.target.value })} /></span></label>
            </div>
            <StrategySharingFields signedIn={Boolean(session)} />
            <div className={styles.formActions}>
              <button type="submit" name="save-target" value="device" className={`${styles.appAction} ${styles.primaryAction} ${styles.deviceAction}`}>Save to device</button>
              <button type="submit" name="save-target" value="profile" className={`${styles.appAction} ${styles.secondaryAction} ${styles.profileAction}`} disabled={!session}>Save to profile</button>
            </div>
          </form>
          <p className={styles.formNote}>Backup, restore, and account sync are in Menu → Account &amp; data.</p>
        </div>
      </details>
    </article>
  );
}
