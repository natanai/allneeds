import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { useDialogFocus } from '../../app/useDialogFocus';
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
  { id: 'time', label: 'When?', missing: 'Missing' },
  { id: 'context', label: 'Where?', missing: 'Missing' },
  { id: 'sensory', label: 'What did you see/hear?', missing: 'Missing' },
  { id: 'measure', label: 'Measurement or quote (optional)', missing: 'Optional' },
] as const;

const recipe = [
  ['When did it happen?', 'Add a day, date, or timeframe so the moment is anchored in time.', 'Yesterday at 3 p.m.… · On Monday around noon…'],
  ['Where did it happen and who was involved?', 'Name the space or people so the scene is easy to picture.', 'In the conference room with Alex… · With my kids in the kitchen…'],
  ['What did you see or hear?', 'Use sensory verbs and direct quotes so the observation stays factual.', 'I saw him close the laptop. · I heard “Please wrap this up.”'],
  ['What can be counted or quoted?', 'Mention quantities or repeat the exact words to make it verifiable.', 'They called three times. · She said “I’ll handle it tomorrow.”'],
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
    return <div key={blockIndex} className={styles.guideExamples}>{block.items.map((item, itemIndex) => <article key={itemIndex}><p><strong>Evaluation:</strong> <span dangerouslySetInnerHTML={{ __html: item.evaluation }} /></p><p><strong>Observation:</strong> <span dangerouslySetInnerHTML={{ __html: item.observation }} /></p><p dangerouslySetInnerHTML={{ __html: item.why }} /></article>)}</div>;
  });
}

function ObservationRecipe({ onOpenGuide }: { onOpenGuide: () => void }) {
  return (
    <>
      <p>Use these prompts to keep your statement observational.</p>
      <ol>{recipe.map(([title, body, exampleText]) => <li key={title}><strong>{title}</strong><p>{body}</p><small>Try: {exampleText}</small></li>)}</ol>
      <p>Need a refresher? Visit the <a href="#observation-guide" onClick={(event) => { event.preventDefault(); onOpenGuide(); }}>full observation guide</a> below for principles, steps, and examples.</p>
    </>
  );
}

function infoCopy(topic: string) {
  if (topic === 'slots') return <><p>The checklist is a quick quality pass for your sentence.</p><ul><li><strong>When?</strong> Add a time or event anchor.</li><li><strong>Where?</strong> Name the setting.</li><li><strong>What did you see/hear?</strong> Use observable words or actions.</li><li><strong>Measurement or quote</strong> is optional, but counts and exact words can make a memory easier to revisit.</li></ul></>;
  if (topic === 'matching') return <><p>Matching looks for feeling and need words, related phrases, and broader context in your observation. It works on this device and does not send your text anywhere.</p><p>These are possibilities to explore, not a conclusion about what you feel or need. When the wording is unclear, we include a balanced set of starting points so you are never left with an empty result.</p></>;
  return <><p>Start with what a camera or microphone could capture: the time, place, and words or actions you saw or heard.</p><p>Save feelings, needs, motives, and interpretations for the next step.</p></>;
}

function entityRoute(entityType: 'feeling' | 'need' | 'fauxFeeling', slug: string) {
  if (entityType === 'feeling') return `/feelings/${slug}`;
  if (entityType === 'need') return `/needs/${slug}`;
  return `/faux-feelings/${slug}`;
}

function entityTypeLabel(entityType: 'feeling' | 'need' | 'fauxFeeling') {
  if (entityType === 'feeling') return 'Feeling';
  if (entityType === 'need') return 'Need';
  return 'Faux feeling';
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
  const detectedEntities = useMemo(() => {
    const unique = new Map<string, (typeof analysis.entities)[number]>();
    analysis.entities.forEach((entity) => unique.set(`${entity.entityType}:${entity.slug}`, entity));
    return [...unique.values()];
  }, [analysis.entities]);
  const detectedSurfaceTerms = useMemo(() => {
    const unique = new Map<string, (typeof analysis.surfaceTerms)[number]>();
    analysis.surfaceTerms.forEach((term) => unique.set(`${term.id}:${term.text.toLocaleLowerCase()}`, term));
    return [...unique.values()];
  }, [analysis.surfaceTerms]);
  const evidenceText = useMemo(() => {
    const annotationById = new Map(analysis.annotations.map((annotation) => [annotation.id, annotation]));
    const selected = [...analysis.suggestions.needs, ...analysis.suggestions.feelings]
      .flatMap((suggestion) => suggestion.evidence)
      .map((evidence) => annotationById.get(evidence.annotationId)?.text.trim())
      .filter((entry): entry is string => Boolean(entry));
    return [...new Set(selected)].slice(0, 4);
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

  const updateText = (nextText: string) => {
    setText(nextText);
    if (!nextText.trim()) setShowSuggestions(false);
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
        <h1>Observations</h1>
        <button type="button" className={styles.infoButton} onClick={() => setHelpTopic('basics')} aria-label="Observation basics">i</button>
      </header>

      <section className={styles.editor} aria-label="Observation editor">
        <div className={styles.editorCard}>
          <div className={styles.editorGrid}>
            <div className={styles.field}>
              <span id="observation-text-label" className={styles.editorLabel}>What did you notice?</span>
              <AnnotatedObservationEditor
                id="observation-text"
                labelledBy="observation-text-label"
                value={text}
                analysis={analysis}
                onChange={updateText}
                placeholder={<><span>• When ⟨time anchor⟩</span><span>• Where/with whom ⟨setting or people⟩</span><span>• I saw/heard ⟨camera-ready action⟩</span><span>• Counted/quoted ⟨number or exact words⟩</span></>}
              />

              {detectedEntities.length || detectedSurfaceTerms.length ? (
                <section className={styles.detectedLanguage} aria-labelledby="detected-language-title" aria-live="polite">
                  {detectedEntities.length ? <div><h2 id="detected-language-title">Words in your text</h2><div className={styles.detectedLinks}>{detectedEntities.map((entity) => <Link key={`${entity.entityType}:${entity.slug}`} to={entityRoute(entity.entityType, entity.slug)}><span>{entity.text}</span><small>{entityTypeLabel(entity.entityType)} · {entity.title}</small></Link>)}</div></div> : null}
                  {detectedSurfaceTerms.length ? <div className={styles.wording}><h2 id={detectedEntities.length ? undefined : 'detected-language-title'}>Your wording</h2><p>{detectedSurfaceTerms.map((term) => `“${term.text}”`).join(', ')} can be explored as written without treating it as a catalog match.</p></div> : null}
                </section>
              ) : null}

              <section className={styles.suggestions} aria-live="polite" data-mode={resultsOpen ? 'results' : 'editing'}>
                <header>
                  {resultsOpen ? <div><h2>Possible feelings &amp; needs to explore</h2><p>These suggestions update as you edit.</p></div> : <span />}
                  <div className={styles.actionRow}>
                    {!resultsOpen ? <button type="button" disabled={!canLoad} onClick={() => setShowSuggestions(true)} aria-label="Load possible feelings and needs">Explore feelings &amp; needs</button> : null}
                    <button type="button" className={styles.ghost} onClick={clear}>Clear</button>
                  </div>
                </header>
                {resultsOpen ? <>
                  <div className={styles.resultPanels}>
                    <div>
                      <div className={styles.modeToggle} role="radiogroup" aria-label="Need status">
                        <button type="button" role="radio" aria-checked={feelingsMode === 'unmet'} onClick={() => setFeelingsMode('unmet')}>Unmet</button>
                        <button type="button" role="radio" aria-checked={feelingsMode === 'met'} onClick={() => setFeelingsMode('met')}>Met</button>
                      </div>
                      <section className={styles.resultPanel} data-testid="observation-needs"><h3>Needs that may be alive in you</h3><div className={styles.chips}>{analysis.suggestions.needs.map((need) => <Link key={need.slug} to={`/needs/${need.slug}`}>{need.title}</Link>)}</div></section>
                    </div>
                    <section className={styles.resultPanel} data-testid="observation-feelings"><h3>Possible feelings</h3><div className={styles.chips}>{analysis.suggestions.feelings.map((feeling) => <Link key={feeling.slug} to={`/feelings/${feeling.slug}`}>{feeling.title}</Link>)}</div></section>
                  </div>
                  <details className={styles.why}>
                    <summary><span><strong>Why these possibilities?</strong><small>Language cues and starting points</small></span><span aria-hidden="true">›</span></summary>
                    <div className={styles.basis}>
                      <div><p>{suggestionBasisSummary(analysis.suggestions)}</p><button type="button" className={`${styles.infoButton} ${styles.subtle}`} onClick={() => setHelpTopic('matching')} aria-label="How matching works">i</button></div>
                      {evidenceText.length ? <p>Language considered: {evidenceText.map((entry) => `“${entry}”`).join(', ')}.</p> : null}
                    </div>
                  </details>
                  <p className={styles.browse}><Link to="/feelings">Browse all feelings</Link><span aria-hidden="true">•</span><Link to="/needs">Browse all needs</Link></p>
                </> : null}
              </section>

              <div className={styles.slotHeader}>
                <span>Quick check</span>
                <button type="button" className={`${styles.infoButton} ${styles.subtle}`} onClick={() => setHelpTopic('slots')} aria-label="How the observation checklist works">i</button>
              </div>
              <div className={styles.slots} role="list" aria-label="Observation slots">
                {slotDefinitions.map((slot) => {
                  const satisfied = analysis.slots[slot.id].satisfied;
                  return (
                    <div key={slot.id} className={styles.slot} data-complete={satisfied} role="listitem">
                      <span aria-hidden="true" /><strong>{slot.label}</strong>
                      <span className="visually-hidden">{satisfied ? 'Complete' : slot.missing}</span>
                    </div>
                  );
                })}
              </div>

              <div className={styles.example}>
                <button type="button" onClick={() => setShowExample((current) => !current)} aria-expanded={showExample}><span><strong>{showExample ? 'Hide example sentence' : 'Show an example sentence'}</strong><small>Writing example</small></span><span aria-hidden="true">›</span></button>
                {showExample ? <div><p>“{EXAMPLE}”</p><button type="button" onClick={() => updateText(EXAMPLE)}>Insert this example</button></div> : null}
              </div>
            </div>

            <details className={styles.recipeDisclosure}>
              <summary><span><strong>Observation recipe</strong><small>Step-by-step prompts</small></span><span aria-hidden="true">›</span></summary>
              <div className={styles.recipe} aria-label="Observation recipe"><ObservationRecipe onOpenGuide={openGuide} /></div>
            </details>
          </div>
          <footer className={styles.footer}>
            <span className="visually-hidden" aria-live="polite">{resultsOpen ? 'Possibilities loaded and updating.' : canLoad ? 'Ready to explore feelings and needs.' : 'Enter an observation to explore feelings and needs.'}</span>
            {resultsOpen ? <section className={styles.journalHandoff} aria-labelledby="journal-handoff-title">
              <span><small>Continue your reflection</small><strong id="journal-handoff-title">Bring this observation into Journal</strong><span>Journal will open with your observation already filled in.</span></span>
              <button type="button" onClick={convertToJournal}>Open in Journal</button>
            </section> : null}
          </footer>
        </div>
      </section>

      <section className={styles.overview}>
        <details><summary><span><strong>Why try this?</strong><small>Why observations help</small></span><span aria-hidden="true">›</span></summary><div><p>Using concrete, time-and-place descriptions of what you saw or heard can be easier to process than abstract labels. Putting what you notice into words is also linked with lower emotional activation and distress.</p><div><span>Time</span><span>Place</span><span>What you saw/heard</span><span>Measurement/quote (optional)</span></div></div></details>
      </section>

      <details ref={guideRef} id="observation-guide" className={styles.guide} open={guideOpen} onToggle={(event) => setGuideOpen(event.currentTarget.open)}>
        <summary><span><small>Detailed reference</small><strong>Full guide &amp; research</strong></span><span aria-hidden="true">›</span></summary>
        {guideOpen ? <div className={styles.guideCard}>
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
