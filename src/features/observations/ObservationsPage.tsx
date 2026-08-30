import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { useDialogFocus } from '../../app/useDialogFocus';
import { InlineMagnet } from '../../components/magnets/InlineMagnet';
import { feelingMagnetItem, needMagnetItem } from '../../components/magnets/catalogMagnetItems';
import observationGuide from '../../data/observationGuide.json';
import { analyzeObservation, suggestionBasisSummary } from '../../domain/observationInference';
import type { ObservationDraft } from '../../persistence/workflowDrafts';
import {
  clearObservationDraft,
  readObservationDraft,
  writeObservationDraft,
} from '../../persistence/workflowDrafts';
import { AnnotatedObservationEditor } from './AnnotatedObservationEditor';
import styles from './ObservationsPage.module.css';

const EXAMPLE = "Last Thursday, two days after my partner and I had agreed to have dinner together at home at 7 p.m., I arrived back at the apartment at 6:50 p.m. and started setting the table. At 7:15 p.m. my partner was not home yet, and at 7:20 p.m. I saw a message on my phone sent at 6:55 p.m. that said, 'I decided to stay late at work and will eat here tonight.'";

type GuideBlock =
  | { type: 'list'; style: 'ordered' | 'unordered'; items: string[] }
  | { type: 'callout'; html: string }
  | { type: 'paragraph'; text: string }
  | { type: 'examples'; items: Array<{ evaluation: string; observation: string; why: string }> };
type GuideSection = { id: string; eyebrow?: string; title: string; description?: string; defaultOpen?: boolean; content: GuideBlock[] };
type GuideData = {
  intro?: { eyebrow?: string; title?: string; paragraphs?: string[] };
  mobile?: { sections?: GuideSection[] };
};

const slotDefinitions = [
  { id: 'time', label: 'When?', missing: 'Add a time' },
  { id: 'context', label: 'Where or with whom?', missing: 'Add context' },
  { id: 'sensory', label: 'What did you see or hear?', missing: 'Add a detail' },
  { id: 'measure', label: 'Number or exact words', missing: 'Optional' },
] as const;

const recipe = [
  ['When did it happen?', 'Add a day, date, or general time so the moment is easier to place.', 'Yesterday at 3 p.m. · On Monday around noon'],
  ['Where were you, and who was involved?', 'Name the place or people if that helps someone picture the moment.', 'In the conference room with Alex · With my kids in the kitchen'],
  ['What did you see or hear?', 'Describe a visible action or the words you heard. Your own feelings can stay in the text too.', 'I saw him close the laptop. · I heard “Please wrap this up.”'],
  ['What can be counted or quoted?', 'A number, duration, or exact quote can make the moment easier to revisit.', 'They called three times. · She said “I’ll handle it tomorrow.”'],
] as const;

const guide = observationGuide as unknown as GuideData;

function GuideContent({ blocks }: { blocks: GuideBlock[] }) {
  return blocks.map((block, blockIndex) => {
    if (block.type === 'list') {
      const List = block.style === 'ordered' ? 'ol' : 'ul';
      return <List key={blockIndex}>{block.items.map((item, itemIndex) => <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />)}</List>;
    }
    if (block.type === 'callout') return <aside key={blockIndex} className={styles.guideCallout} dangerouslySetInnerHTML={{ __html: block.html }} />;
    if (block.type === 'paragraph') return <p key={blockIndex} dangerouslySetInnerHTML={{ __html: block.text }} />;
    return <div key={blockIndex} className={styles.guideExamples}>{block.items.map((item, itemIndex) => <article key={itemIndex}><p><strong>Broad wording:</strong> <span dangerouslySetInnerHTML={{ __html: item.evaluation }} /></p><p><strong>More concrete:</strong> <span dangerouslySetInnerHTML={{ __html: item.observation }} /></p><p dangerouslySetInnerHTML={{ __html: item.why }} /></article>)}</div>;
  });
}

function ObservationRecipe({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <>
      <p>These prompts can help separate what happened from what you think it meant. You can keep both; the prompts simply help you add concrete details.</p>
      <ol>{recipe.map(([title, body, exampleText]) => <li key={title}><strong>{title}</strong><p>{body}</p><small>Try: {exampleText}</small></li>)}</ol>
      <p>For more examples and sources, open the <a href="#observation-guide" onClick={(event) => { event.preventDefault(); onOpenGuide(); }}>observation guide</a> below.</p>
    </>
  );
}

function infoCopy(topic: string) {
  if (topic === 'slots') return <><p>Quick Check shows which concrete details the app noticed. It is a writing aid, not a score.</p><ul><li><strong>When?</strong> Add a time or event, such as “yesterday” or “after lunch.”</li><li><strong>Where or with whom?</strong> Name the setting or people if they matter.</li><li><strong>What did you see or hear?</strong> Add a visible action or the words you heard.</li><li><strong>Number or exact words</strong> is optional, but a count, duration, or quote can make the moment clearer.</li></ul></>;
  if (topic === 'matching') return <><p>This page searches a fixed local vocabulary built from the site's Feelings, Needs, Faux Feelings, and authored Observation relationships. Your text is not sent anywhere.</p><p>Words you name directly and specific event matches rank highest. Broader keyword relationships can also bring possible Needs into view, and the selected Needs are used to find Feeling words for the Met or Unmet view.</p><p>If the wording does not strongly match the index, the page still offers broader catalog starting points. These are words to consider, not conclusions about what you feel or need.</p></>;
  return <><p>An observation is a description of what happened: what someone could see, hear, quote, or count.</p><p>You can write in your own words. Quick Check only suggests details that may help another person picture the same moment. It does not decide whether your interpretation is true.</p></>;
}

function entityRoute(entityType: 'feeling' | 'need' | 'fauxFeeling', slug: string) {
  if (entityType === 'feeling') return `/feelings/${slug}`;
  if (entityType === 'need') return `/needs/${slug}`;
  return `/faux-feelings/${slug}`;
}

function entityTypeLabel(entityType: 'feeling' | 'need' | 'fauxFeeling') {
  if (entityType === 'feeling') return 'Feeling';
  if (entityType === 'need') return 'Need';
  return 'Faux Feeling';
}

export function ObservationsPage() {
  const navigate = useNavigate();
  const [initialDraft] = useState(readObservationDraft);
  const [text, setText] = useState(initialDraft?.text ?? '');
  const [showSuggestions, setShowSuggestions] = useState(initialDraft?.showSuggestions ?? false);
  const [showExample, setShowExample] = useState(initialDraft?.showExample ?? false);
  const [feelingsMode, setFeelingsMode] = useState<'unmet' | 'met'>(initialDraft?.feelingsMode ?? 'unmet');
  const [helpTopic, setHelpTopic] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const helpDialogRef = useDialogFocus<HTMLElement>({
    open: Boolean(helpTopic),
    onClose: () => setHelpTopic(null),
  });
  const guideRef = useRef<HTMLDetailsElement>(null);
  const draftRef = useRef<ObservationDraft>({ text, feelingsMode, showSuggestions, showExample });
  draftRef.current = { text, feelingsMode, showSuggestions, showExample };

  const analysis = useMemo(() => analyzeObservation(text, feelingsMode), [feelingsMode, text]);
  const canLoad = Boolean(text.trim());
  const resultsOpen = showSuggestions && canLoad;
  const hasSuggestions = analysis.suggestions.feelings.length > 0 || analysis.suggestions.needs.length > 0;
  const concreteSlotCount = slotDefinitions.filter((slot) => analysis.slots[slot.id].satisfied).length;
  const hasConcreteObservation = concreteSlotCount >= 3
    && (analysis.slots.sensory.satisfied || analysis.slots.measure.satisfied);
  const detectedEntities = useMemo(() => {
    const unique = new Map<string, (typeof analysis.entities)[number]>();
    analysis.entities.forEach((entity) => unique.set(`${entity.entityType}:${entity.slug}`, entity));
    return [...unique.values()];
  }, [analysis.entities]);
  const evidenceText = useMemo(() => {
    const annotationById = new Map(analysis.annotations.map((annotation) => [annotation.id, annotation]));
    const selected = [...analysis.suggestions.needs, ...analysis.suggestions.feelings]
      .flatMap((suggestion) => suggestion.evidence)
      .filter((evidence) => evidence.kind !== 'eventFamily')
      .map((evidence) => annotationById.get(evidence.annotationId)?.text.trim())
      .filter((entry): entry is string => Boolean(entry));
    return [...new Set(selected)].slice(0, 4);
  }, [analysis.annotations, analysis.suggestions]);
  const eventEvidence = useMemo(() => {
    const selectedFamilyIds = new Set(
      [...analysis.suggestions.needs, ...analysis.suggestions.feelings]
        .flatMap((suggestion) => suggestion.evidence)
        .filter((evidence) => evidence.kind === 'eventFamily')
        .map((evidence) => evidence.evidenceId),
    );
    const unique = new Map<string, { id: string; explanation: string }>();
    analysis.annotations.forEach((annotation) => annotation.evidence.forEach((evidence) => {
      if (evidence.kind === 'eventFamily' && selectedFamilyIds.has(evidence.familyId)) {
        unique.set(evidence.familyId, { id: evidence.familyId, explanation: evidence.explanation });
      }
    }));
    return [...unique.values()];
  }, [analysis.annotations, analysis.suggestions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { writeObservationDraft(draftRef.current); } catch { /* The editor remains usable without persistence. */ }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [feelingsMode, showExample, showSuggestions, text]);

  useEffect(() => {
    const flush = () => {
      try { writeObservationDraft(draftRef.current); } catch { /* Restricted storage contexts remain usable. */ }
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, []);

  const clear = () => {
    draftRef.current = { text: '', feelingsMode: 'unmet', showSuggestions: false, showExample: false };
    try { clearObservationDraft(); } catch { /* The cleared editor still remains cleared in memory. */ }
    setText('');
    setFeelingsMode('unmet');
    setShowSuggestions(false);
    setShowExample(false);
  };

  const focusEditorAtEnd = () => {
    const editor = document.getElementById('observation-text');
    if (!(editor instanceof HTMLElement)) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const reviseObservation = () => {
    setShowSuggestions(false);
    focusEditorAtEnd();
  };

  const updateText = (nextText: string) => {
    setText(nextText);
    if (showSuggestions) setShowSuggestions(false);
  };

  const convertToJournal = () => {
    window.sessionStorage.setItem('allneeds.v2.journal.observationDraft', text.trim());
    draftRef.current = { ...draftRef.current, text: '' };
    try { clearObservationDraft(); } catch { /* The handoff remains available in session storage. */ }
    navigate('/inventory/journal?from=observation');
  };

  const openGuide = () => {
    setGuideOpen(true);
    window.requestAnimationFrame(() => guideRef.current?.scrollIntoView({ block: 'start' }));
  };

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Observations</h1>
          <p>Write what happened in your own words. This page can point out concrete details and offer Feelings and Needs you may want to consider.</p>
        </div>
        <button type="button" className={styles.infoButton} onClick={() => setHelpTopic('basics')} aria-label="Observation basics">i</button>
      </header>

      <section className={styles.editor} aria-label="Observation editor">
        <div className={styles.editorCard}>
          <div className={styles.editorGrid}>
            <div className={styles.field} data-testid="observation-workspace-main">
              <span id="observation-text-label" className={styles.editorLabel}>What did you notice?</span>
              <AnnotatedObservationEditor
                id="observation-text"
                labelledBy="observation-text-label"
                value={text}
                analysis={analysis}
                onChange={updateText}
                placeholder={<><span>• When did it happen?</span><span>• Where were you, and who was there?</span><span>• What did you see or hear?</span><span>• Can you add a number or exact quote?</span></>}
              />

              <section className={styles.suggestions} aria-live="polite" data-mode={resultsOpen ? 'results' : 'editing'} data-testid={resultsOpen ? 'observation-results-surface' : undefined}>
                {!resultsOpen ? (
                  <div className={styles.actionRow}>
                    <button type="button" disabled={!canLoad} onClick={() => setShowSuggestions(true)} aria-label="Explore possible feelings and needs">Explore</button>
                    <button type="button" className={styles.clearUtility} onClick={clear} aria-label="Clear observation">Clear</button>
                  </div>
                ) : (
                  <>
                    {hasSuggestions ? (
                      <>
                        <header className={styles.resultsHeader}>
                          <div><h2 aria-label="Feelings and Needs to explore">Feelings &amp; Needs</h2><p>Possibilities to consider — you decide what fits.</p></div>
                          <div className={styles.resultActions}><button type="button" className={styles.reviseAction} onClick={reviseObservation} aria-label="Revise observation">Revise</button><button type="button" className={styles.clearText} onClick={clear} aria-label="Clear observation">Clear</button></div>
                        </header>

                        <div className={styles.resultPanels}>
                          <section className={styles.resultPanel} data-testid="observation-needs">
                            <h3>Needs that may be alive in you</h3>
                            {analysis.suggestions.needs.length ? <div className={styles.magnetResults}>{analysis.suggestions.needs.map((need) => <InlineMagnet key={need.slug} item={needMagnetItem(need)} />)}</div> : <p>No specific Need suggestions from this wording yet.</p>}
                          </section>
                          <section className={styles.resultPanel} data-testid="observation-feelings">
                            <h3>Possible Feelings</h3>
                            {analysis.suggestions.feelings.length ? <div className={styles.magnetResults}>{analysis.suggestions.feelings.map((feeling) => <InlineMagnet key={feeling.slug} item={feelingMagnetItem(feeling)} />)}</div> : <p>No specific Feeling suggestions from this wording yet.</p>}
                            <div className={styles.modeControl}>
                              <p className={styles.modePrompt}>If these Needs are</p>
                              <div className={styles.modeToggle} role="radiogroup" aria-label="Need status">
                                <button type="button" role="radio" aria-checked={feelingsMode === 'unmet'} onClick={() => setFeelingsMode('unmet')}>Unmet</button>
                                <button type="button" role="radio" aria-checked={feelingsMode === 'met'} onClick={() => setFeelingsMode('met')}>Met</button>
                              </div>
                              <p className={styles.modeHelp}>Changes Feeling possibilities only.</p>
                            </div>
                          </section>
                        </div>
                        <details className={styles.why}>
                          <summary><span><strong>Why these?</strong><small>How these were chosen</small></span><span aria-hidden="true">›</span></summary>
                          <div className={styles.basis}>
                            <div><p>{suggestionBasisSummary(analysis.suggestions)}</p><button type="button" className={`${styles.infoButton} ${styles.subtle}`} onClick={() => setHelpTopic('matching')} aria-label="How matching works">i</button></div>
                            {eventEvidence.slice(0, 2).map((entry) => <p key={entry.id}>{entry.explanation}</p>)}
                            {evidenceText.length ? <p>Text that contributed: {evidenceText.map((entry) => `“${entry}”`).join(', ')}.</p> : null}
                          </div>
                        </details>
                      </>
                    ) : (
                      <section className={styles.noResults} data-testid="observation-no-suggestions">
                        {hasConcreteObservation ? <><h2>No specific Feeling or Need matches yet</h2><p>Your observation already includes useful concrete details. I couldn't connect its wording with specific Feeling or Need possibilities yet.</p></> : <><h2>Not enough information yet</h2><p>I couldn't connect this wording with specific Feelings or Needs yet. Add a little more about what happened, who was involved, or what was said.</p></>}
                        <div className={styles.noResultActions}><button type="button" className={styles.reviseAction} onClick={reviseObservation}>Add more detail</button><button type="button" className={styles.clearText} onClick={clear} aria-label="Clear observation">Clear</button></div>
                      </section>
                    )}

                    <p className={styles.browse}><Link to="/feelings">Browse Feelings</Link><span aria-hidden="true">•</span><Link to="/needs">Browse Needs</Link></p>
                  </>
                )}
              </section>

              {detectedEntities.length ? (
                <details className={styles.detectedLanguage}>
                  <summary><span><strong>Recognized words</strong><small>{detectedEntities.length} {detectedEntities.length === 1 ? 'word' : 'words'}</small></span><span aria-hidden="true">›</span></summary>
                  <div>
                    <div className={styles.detectedLinks}>{detectedEntities.map((entity) => <Link key={`${entity.entityType}:${entity.slug}`} to={entityRoute(entity.entityType, entity.slug)}><span>{entity.text}</span><small>{entityTypeLabel(entity.entityType)} · {entity.title}</small></Link>)}</div>
                    {detectedEntities.some((entity) => entity.entityType === 'fauxFeeling') ? <p className={styles.termHelp}>A Faux Feeling may combine an emotion with an interpretation of what happened. The label does not mean the event was unreal.</p> : null}
                  </div>
                </details>
              ) : null}
            </div>

            <aside className={styles.supportRail} aria-label="Observation writing support">
              <section className={styles.quickCheck} data-testid="observation-quick-check-surface">
                <div className={styles.slotHeader}>
                  <span>Quick Check</span>
                  <button type="button" className={`${styles.infoButton} ${styles.subtle}`} onClick={() => setHelpTopic('slots')} aria-label="How the observation checklist works">i</button>
                </div>
                <div className={styles.slots} role="list" aria-label="Observation slots">
                  {slotDefinitions.map((slot) => {
                    const satisfied = analysis.slots[slot.id].satisfied;
                    return (
                      <div key={slot.id} className={styles.slot} data-complete={satisfied} role="listitem">
                        <span aria-hidden="true" /><strong>{slot.label}</strong>
                        <small>{satisfied ? 'Found' : slot.missing}</small>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className={styles.example}>
                <button type="button" onClick={() => setShowExample((current) => !current)} aria-expanded={showExample}><span><strong>{showExample ? 'Hide example sentence' : 'Show an example sentence'}</strong><small>Writing example</small></span><span aria-hidden="true">›</span></button>
                {showExample ? <div><p>“{EXAMPLE}”</p><button type="button" onClick={() => updateText(EXAMPLE)}>Insert this example</button></div> : null}
              </div>

              <details className={styles.recipeDisclosure}>
                <summary><span><strong>Observation recipe</strong><small>Step-by-step prompts</small></span><span aria-hidden="true">›</span></summary>
                <div className={styles.recipe} aria-label="Observation recipe"><ObservationRecipe onOpenGuide={openGuide} /></div>
              </details>
            </aside>
          </div>

          <footer className={styles.footer}>
            <span className="visually-hidden" aria-live="polite">{resultsOpen ? hasSuggestions ? 'Possibilities loaded and updating.' : 'No specific Feeling or Need matches are available from this wording yet.' : canLoad ? 'Ready to explore feelings and needs.' : 'Enter an observation to explore feelings and needs.'}</span>
            {resultsOpen ? <section className={styles.journalHandoff} aria-labelledby="journal-handoff-title">
              <span><small>Continue your reflection</small><strong id="journal-handoff-title">Bring this observation into Journal</strong><span>Journal will open with your observation already filled in.</span></span>
              <button type="button" onClick={convertToJournal}>Open in Journal</button>
            </section> : null}
          </footer>
        </div>
      </section>

      <section className={styles.overview}>
        <details><summary><span><strong>Why add concrete details?</strong><small>What this writing step can do</small></span><span aria-hidden="true">›</span></summary><div><p>Concrete details can make a specific moment easier to remember, explain, or discuss. They do not prove someone’s intent, and they do not replace your feelings or interpretation.</p><div><span>Time</span><span>Place or people</span><span>What you saw or heard</span><span>Number or exact words (optional)</span></div></div></details>
      </section>

      <details ref={guideRef} id="observation-guide" className={styles.guide} open={guideOpen} onToggle={(event) => setGuideOpen(event.currentTarget.open)}>
        <summary><span><small>Examples and sources</small><strong>Observation guide</strong></span><span aria-hidden="true">›</span></summary>
        {guideOpen ? <div className={styles.guideCard} onClick={(event) => {
          const target = event.target as Element;
          const link = target.closest<HTMLAnchorElement>('a[href^="#observation-guide-ref-"]');
          if (!link) return;
          const reference = document.querySelector<HTMLElement>(link.getAttribute('href') ?? '');
          if (!reference) return;
          event.preventDefault();
          reference.closest('details')?.setAttribute('open', '');
          window.requestAnimationFrame(() => reference.scrollIntoView({ block: 'center' }));
        }}>
          {guide.intro ? <header><small>{guide.intro.eyebrow}</small><h2>{guide.intro.title}</h2>{guide.intro.paragraphs?.map((paragraph, index) => <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />)}</header> : null}
          <div className={styles.guideSections}>{guide.mobile?.sections?.map((section) => <details key={section.id}><summary><span><small>{section.eyebrow}</small><strong>{section.title}</strong><span>{section.description}</span></span></summary><div><GuideContent blocks={section.content} /></div></details>)}</div>
        </div> : null}
      </details>

      {helpTopic ? (
        <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpTopic(null); }}>
          <section ref={helpDialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="observation-help-title" tabIndex={-1}>
            <header><h2 id="observation-help-title">Observation help</h2><button type="button" onClick={() => setHelpTopic(null)} aria-label="Close observation help" data-dialog-initial-focus>×</button></header>
            <div className={styles.dialogBody} data-observation-dialog-body>{infoCopy(helpTopic)}</div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
