import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { loadObservationResources, readObservationResources } from '../../app/appResources';
import { useDialogFocus } from '../../app/useDialogFocus';
import { feelingsBySlug, needsBySlug } from '../../data/catalog';
import {
  clearObservationDraft,
  readObservationDraft,
  writeObservationDraft,
} from '../../persistence/workflowDrafts';
import type { ObservationDraft } from '../../persistence/workflowDrafts';
import styles from './ObservationsPage.module.css';

const EXAMPLE = "Last Thursday, two days after my partner and I had agreed to have dinner together at home at 7 p.m., I arrived back at the apartment at 6:50 p.m. and started setting the table. At 7:15 p.m. my partner was not home yet, and at 7:20 p.m. I saw a message on my phone sent at 6:55 p.m. that said, 'I decided to stay late at work and will eat here tonight.'";

type FormulaSlot = { satisfied: boolean };
type FormulaResult = { slots: Record<string, FormulaSlot>; satisfiedCount: number; totalSlots: number };
type SuggestionResult = {
  feelings: string[];
  needs: string[];
  why: string[];
  totalHits: number;
  overflow: number;
  exactCount: number;
  nearbyCount: number;
};
type FallbackResult = { feelingSlugs?: string[]; needSlugs?: string[] } | null;
type GuideSection = { id: string; eyebrow?: string; title: string; description?: string; content: string };
type GuideData = {
  intro?: { eyebrow?: string; title?: string; paragraphs?: string[] };
  mobile?: { sections?: GuideSection[] };
};
type ObservationTools = {
  evaluate: (text: string) => FormulaResult;
  suggest: (text: string, library: unknown, maxEach?: number, options?: object) => Omit<SuggestionResult, 'exactCount' | 'nearbyCount'>;
  fallback: (text: string, cues: unknown, options?: object) => FallbackResult;
  cueLibrary: unknown;
};

const emptyFormula: FormulaResult = {
  slots: { time: { satisfied: false }, context: { satisfied: false }, sensory: { satisfied: false }, measure: { satisfied: false } },
  satisfiedCount: 0,
  totalSlots: 4,
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
  if (topic === 'matching') return <><p>Matching scans your observation for concrete cues and then opens feelings and needs that may be worth exploring.</p><p>Exact matches come from recognized cue patterns. Nearby matches are fallback options when the wording is close but not exact.</p></>;
  return <><p>Start with what a camera or microphone could capture: the time, place, and words or actions you saw/heard.</p><p>Save feelings, needs, motives, and interpretations for the next step.</p></>;
}

function suggestionsFor(text: string, tools: ObservationTools): SuggestionResult {
  const direct = tools.suggest(text, tools.cueLibrary, 4, { maxNeeds: 4, maxFeelings: 4 });
  const exactCount = Math.min(Math.max(direct.totalHits || 0, 0), 4);
  if (exactCount > 0) return { ...direct, exactCount, nearbyCount: 0 };

  const cues = (tools.cueLibrary as { cues?: unknown })?.cues ?? tools.cueLibrary;
  const nearby = tools.fallback(text, cues, { needLimit: 4, feelingLimit: 4 });
  if (!nearby?.needSlugs?.length) return { ...direct, exactCount: 0, nearbyCount: 0 };
  return {
    ...direct,
    needs: nearby.needSlugs.slice(0, 4),
    feelings: nearby.feelingSlugs?.slice(0, 4) ?? [],
    why: ['No exact cue match was found, so these are the nearest language matches.'],
    exactCount: 0,
    nearbyCount: 1,
  };
}

export function ObservationsPage() {
  const navigate = useNavigate();
  const initialResources = readObservationResources();
  const [initialDraft] = useState(readObservationDraft);
  const initialText = initialDraft?.text ?? '';
  const initialTools: ObservationTools | null = initialResources ? {
    evaluate: initialResources.evaluate as ObservationTools['evaluate'],
    suggest: initialResources.suggest as ObservationTools['suggest'],
    fallback: initialResources.fallback as ObservationTools['fallback'],
    cueLibrary: initialResources.cueLibrary,
  } : null;
  const [text, setText] = useState(initialText);
  const [tools, setTools] = useState<ObservationTools | null>(() => initialResources ? {
    evaluate: initialResources.evaluate as ObservationTools['evaluate'],
    suggest: initialResources.suggest as ObservationTools['suggest'],
    fallback: initialResources.fallback as ObservationTools['fallback'],
    cueLibrary: initialResources.cueLibrary,
  } : null);
  const [formula, setFormula] = useState<FormulaResult>(
    () => initialTools?.evaluate(initialText) ?? emptyFormula,
  );
  const [suggestions, setSuggestions] = useState<SuggestionResult | null>(() => (
    initialTools && initialText.trim()
      ? suggestionsFor(initialText, initialTools)
      : null
  ));
  const [showSuggestions, setShowSuggestions] = useState(initialDraft?.showSuggestions ?? false);
  const [showExample, setShowExample] = useState(initialDraft?.showExample ?? false);
  const [feelingsMode, setFeelingsMode] = useState<'unmet' | 'met'>(initialDraft?.feelingsMode ?? 'unmet');
  const [helpTopic, setHelpTopic] = useState<string | null>(null);
  const helpDialogRef = useDialogFocus<HTMLElement>({
    open: Boolean(helpTopic),
    onClose: () => setHelpTopic(null),
  });
  const [guide, setGuide] = useState<GuideData | null>(() => initialResources?.guide as GuideData | undefined ?? null);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideRef = useRef<HTMLDetailsElement>(null);
  const draftRef = useRef<ObservationDraft>({
    text,
    feelingsMode,
    showSuggestions,
    showExample,
  });
  draftRef.current = { text, feelingsMode, showSuggestions, showExample };

  useEffect(() => {
    let cancelled = false;
    if (tools && guide) return undefined;
    void loadObservationResources().then((resources) => {
      if (!cancelled) {
        setTools({
          evaluate: resources.evaluate as ObservationTools['evaluate'],
          suggest: resources.suggest as ObservationTools['suggest'],
          fallback: resources.fallback as ObservationTools['fallback'],
          cueLibrary: resources.cueLibrary,
        });
        setGuide(resources.guide as GuideData);
      }
    }).catch(() => {
      // The editor still provides the observation checklist if optional matching assets fail.
    });
    return () => { cancelled = true; };
  }, [guide, tools]);

  useEffect(() => {
    if (!tools) return;
    const timer = window.setTimeout(() => {
      setFormula(tools.evaluate(text));
      setSuggestions(text.trim() ? suggestionsFor(text, tools) : null);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [text, tools]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { writeObservationDraft(draftRef.current); } catch { /* The editor remains usable without persistence. */ }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [draftRef, feelingsMode, showExample, showSuggestions, text]);

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
  }, [draftRef]);

  const shownNeeds = useMemo(
    () => suggestions?.needs.map((slug) => needsBySlug.get(slug)).filter(Boolean) ?? [],
    [suggestions],
  );
  const suggestedFeelingSlugs = useMemo(() => {
    if (feelingsMode === 'unmet') return suggestions?.feelings ?? [];
    const candidates = shownNeeds.flatMap((need) => need?.feelings ?? [])
      .map((feeling) => feeling.slug)
      .filter((slug) => feelingsBySlug.get(slug)?.needSatisfaction !== 'unmet');
    return [...new Set(candidates)].slice(0, 4);
  }, [feelingsMode, shownNeeds, suggestions]);
  const shownFeelings = suggestedFeelingSlugs.map((slug) => feelingsBySlug.get(slug)).filter(Boolean);
  const canLoad = Boolean(text.trim() && tools);

  const clear = () => {
    draftRef.current = { text: '', feelingsMode: 'unmet', showSuggestions: false, showExample: false };
    try { clearObservationDraft(); } catch { /* The cleared editor still remains cleared in memory. */ }
    setText('');
    setFormula(emptyFormula);
    setSuggestions(null);
    setShowSuggestions(false);
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
              <label htmlFor="observation-text">What did you notice?</label>
              <div className={styles.inputWrapper}>
                {!text ? (
                  <div className={styles.formula} aria-hidden="true">
                    <span>• When ⟨time anchor⟩</span><span>• Where/with whom ⟨setting or people⟩</span>
                    <span>• I saw/heard ⟨camera-ready action⟩</span><span>• Counted/quoted ⟨number or exact words⟩</span>
                  </div>
                ) : null}
                <textarea id="observation-text" rows={7} value={text} onChange={(event) => {
                  setText(event.target.value);
                  setShowSuggestions(false);
                }} />
              </div>

              <section className={styles.suggestions} aria-live="polite" data-mode={showSuggestions ? 'results' : 'editing'}>
                <header>
                  {showSuggestions ? <div><h2>Possible feelings &amp; needs to explore</h2><p>{text}</p></div> : <span />}
                  <div className={styles.actionRow}>
                    {!showSuggestions ? <button type="button" disabled={!canLoad} onClick={() => setShowSuggestions(true)} aria-label="Load possible feelings and needs matches">Load matches</button> : null}
                    <button type="button" className={styles.ghost} onClick={clear}>Clear</button>
                  </div>
                </header>
                {showSuggestions ? <>
                  <div className={styles.resultPanels}>
                    <div>
                      <div className={styles.modeToggle} role="radiogroup" aria-label="Need status">
                        <button type="button" role="radio" aria-checked={feelingsMode === 'unmet'} onClick={() => setFeelingsMode('unmet')}>Unmet</button>
                        <button type="button" role="radio" aria-checked={feelingsMode === 'met'} onClick={() => setFeelingsMode('met')}>Met</button>
                      </div>
                      <section className={styles.resultPanel}><h3>Needs that may be alive in you</h3><div className={styles.chips}>{shownNeeds.map((need) => need ? <Link key={need.slug} to={`/needs/${need.slug}`}>{need.title}</Link> : null)}</div>{!shownNeeds.length ? <p>We didn’t find a direct match yet. Try adding concrete actions or exact words.</p> : null}</section>
                    </div>
                    <section className={styles.resultPanel}><h3>Possible feelings</h3><div className={styles.chips}>{shownFeelings.map((feeling) => feeling ? <Link key={feeling.slug} to={`/feelings/${feeling.slug}`}>{feeling.title}</Link> : null)}</div>{!shownFeelings.length ? <p>No feeling matches surfaced for this wording yet.</p> : null}</section>
                  </div>
                  <details className={styles.why}>
                    <summary><span><strong>Why these matches?</strong><small>Match rationale &amp; counts</small></span><span aria-hidden="true">›</span></summary>
                    <div>
                      <div className={styles.matchSummary} aria-live="polite">
                        <div><p>{suggestions?.exactCount ? 'Matches ready.' : suggestions?.nearbyCount ? 'Showing the nearest match we could find.' : 'No matches yet.'}</p><button type="button" className={`${styles.infoButton} ${styles.subtle}`} onClick={() => setHelpTopic('matching')} aria-label="How matching works">i</button></div>
                        <div aria-label="Match counts"><span>{suggestions?.exactCount ?? 0} exact</span><span>{suggestions?.nearbyCount ?? 0} nearby</span></div>
                      </div>
                      {suggestions?.why.length ? <p>{suggestions.why.join(', ')}</p> : null}
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
                  const satisfied = formula.slots[slot.id]?.satisfied ?? false;
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
                {showExample ? <div><p>“{EXAMPLE}”</p><button type="button" onClick={() => setText(EXAMPLE)}>Insert this example</button></div> : null}
              </div>
            </div>

            <details className={styles.recipeDisclosure}>
              <summary><span><strong>Observation recipe</strong><small>Step-by-step prompts</small></span><span aria-hidden="true">›</span></summary>
              <div className={styles.recipe} aria-label="Observation recipe"><ObservationRecipe onOpenGuide={openGuide} /></div>
            </details>
          </div>
          <footer className={styles.footer}>
            <span className="visually-hidden" aria-live="polite">{showSuggestions ? 'Matches loaded.' : canLoad ? 'Ready to load matches.' : 'Ready for matches.'}</span>
            {showSuggestions ? <section className={styles.journalHandoff} aria-labelledby="journal-handoff-title">
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
          {guide?.intro ? <header><small>{guide.intro.eyebrow}</small><h2>{guide.intro.title}</h2>{guide.intro.paragraphs?.map((paragraph, index) => <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />)}</header> : <p>Loading guide…</p>}
          <div className={styles.guideSections}>{guide?.mobile?.sections?.map((section) => <details key={section.id}><summary><span><small>{section.eyebrow}</small><strong>{section.title}</strong><span>{section.description}</span></span></summary><div dangerouslySetInnerHTML={{ __html: section.content }} /></details>)}</div>
        </div> : null}
      </details>

      {helpTopic ? (
        <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpTopic(null); }}>
          <section ref={helpDialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="observation-help-title" tabIndex={-1}>
            <header><h2 id="observation-help-title">Observation help</h2><button type="button" onClick={() => setHelpTopic(null)} aria-label="Close observation help" data-dialog-initial-focus>×</button></header>
            <div>{infoCopy(helpTopic)}</div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
