import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { loadBodyCueResources, readBodyCueResources } from '../../app/appResources';
import bodyRegionsRaw from '../../data/body-regions.json';
import { assetPath, needs } from '../../data/catalog';
import {
  clearAlexithymiaDraft,
  readAlexithymiaDraft,
  writeJournalDraft,
  writeAlexithymiaDraft,
} from '../../persistence/workflowDrafts';
import type { AlexithymiaDraft } from '../../persistence/workflowDrafts';
import { useWorkflowDraftPersistence } from '../../persistence/useWorkflowDraftPersistence';
import { categorizeCompass, inferZone, scoreSensations, type EmotionCandidate } from './alexithymiaMath';
import styles from './AlexithymiaSupportPage.module.css';

type BodyOption = { id: string; title: string; note: string; insight?: string; defaultIntensity?: number; emotions?: Record<string, number> };
type BodyRegion = { id: string; label: string; prompt: string; options: BodyOption[] };
type Quadrant = { label: string; description: string; emotions: string[]; care: string[] };
type Emotion = {
  name: string; definition: string; bodySignals: string[]; thoughts: string[]; contexts: string[];
  needs: string[]; regulation: string[]; communication: string;
};
type SupportData = { EMOTION_LIBRARY: Record<string, Emotion>; QUADRANT_SUGGESTIONS: Record<string, Quadrant> };

const regions = bodyRegionsRaw as unknown as BodyRegion[];
const rejectionKey = 'nvc_rejected_emotions';
const evidenceNoteKey = 'nvc_evidence_note_dismissed';

function emptyAlexithymiaDraft(): AlexithymiaDraft {
  return {
    phase: 0,
    openRegion: null,
    selectedCues: {},
    energy: 0,
    valence: 0,
    compassTouched: false,
    selectedEmotion: null,
    journalOpen: false,
    reflection: '',
    journalNeeds: [],
    intensity: 5,
  };
}

function readRejections() {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(rejectionKey) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, number> : {};
  } catch { return {}; }
}

function feelingSlug(name: string) {
  const key = name.toLocaleLowerCase();
  const direct: Record<string, string> = {
    anxiety: 'anxiety', fear: 'fear', anger: 'angry', overwhelm: 'overwhelmed', sadness: 'sad',
    stress: 'tense', frustration: 'frustrated', excitement: 'excited', calm: 'calm', relief: 'relieved',
    joyful: 'joyful', hope: 'hopeful', hopeful: 'hopeful', lonely: 'lonely', tired: 'tired', pride: 'proud',
    shame: 'embarrassed', uncertain: 'confused', determined: 'defiant', numb: 'powerless',
  };
  return direct[key] ?? key;
}

function breathingSequence(pattern: string) {
  if (pattern === 'physiological_sigh') return [{ label: 'Inhale', seconds: 2 }, { label: 'Sip in', seconds: 1 }, { label: 'Long exhale', seconds: 6 }];
  if (pattern === 'resonance_6bpm') return [{ label: 'Inhale', seconds: 5 }, { label: 'Exhale', seconds: 5 }];
  return [{ label: 'Inhale', seconds: 4 }, { label: 'Hold', seconds: 4 }, { label: 'Exhale', seconds: 6 }];
}

function EmotionButtons({ candidates, emotions, selected, onSelect, onReject }: {
  candidates: EmotionCandidate[]; emotions: Record<string, Emotion>; selected: string | null;
  onSelect: (key: string) => void; onReject: (key: string) => void;
}) {
  if (!candidates.length) return <p className={styles.note}>No clear matches yet. That is okay—try the emotion compass or pick any word to explore.</p>;
  return <ul className={styles.suggestionList}>{candidates.slice(0, 8).map(({ key, confidence }) => <li key={key}><div className={styles.emotionTag}><button type="button" aria-pressed={selected === key} onClick={() => onSelect(key)}>{emotions[key]?.name ?? key}<span>{Math.round(confidence * 100)}%</span></button><button type="button" aria-label={`Reject ${emotions[key]?.name ?? key}`} onClick={() => onReject(key)}>Not it</button></div></li>)}</ul>;
}

export function AlexithymiaSupportPage() {
  const navigate = useNavigate();
  const [initialDraft] = useState(() => readAlexithymiaDraft() ?? emptyAlexithymiaDraft());
  const [phase, setPhase] = useState(initialDraft.phase);
  const [supportData, setSupportData] = useState<SupportData | null>(
    () => readBodyCueResources()?.supportData as unknown as SupportData ?? null,
  );
  const [openRegion, setOpenRegion] = useState<string | null>(initialDraft.openRegion);
  const [selectedCues, setSelectedCues] = useState<Record<string, number>>(initialDraft.selectedCues);
  const [bodyCandidates, setBodyCandidates] = useState<EmotionCandidate[]>([]);
  const [bodyMessage, setBodyMessage] = useState('Body-based matches will appear here after you choose sensations.');
  const [energy, setEnergy] = useState(initialDraft.energy);
  const [valence, setValence] = useState(initialDraft.valence);
  const [compassTouched, setCompassTouched] = useState(initialDraft.compassTouched);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(initialDraft.selectedEmotion);
  const [rejections, setRejections] = useState<Record<string, number>>(readRejections);
  const [breathing, setBreathing] = useState<{ pattern: string; elapsed: number; phase: number; remaining: number } | null>(null);
  const [intensity] = useState(initialDraft.intensity);
  const [communicationStatus, setCommunicationStatus] = useState('');
  const [evidenceNoteVisible, setEvidenceNoteVisible] = useState(() => {
    try { return window.localStorage.getItem(evidenceNoteKey) !== '1'; } catch { return true; }
  });
  const compassRef = useRef<HTMLDivElement>(null);
  const workflowDraft = useMemo<AlexithymiaDraft>(() => ({
    phase,
    openRegion,
    selectedCues,
    energy,
    valence,
    compassTouched,
    selectedEmotion,
    journalOpen: false,
    reflection: '',
    journalNeeds: [],
    intensity,
  }), [compassTouched, energy, intensity, openRegion, phase, selectedCues, selectedEmotion, valence]);
  const workflowDraftRef = useWorkflowDraftPersistence(workflowDraft, writeAlexithymiaDraft);

  useEffect(() => {
    if (supportData) return;
    let active = true;
    void loadBodyCueResources().then((resources) => {
      if (active) setSupportData(resources.supportData as unknown as SupportData);
    });
    return () => { active = false; };
  }, [supportData]);

  useEffect(() => {
    if (!breathing) return;
    const timer = window.setInterval(() => {
      setBreathing((current) => {
        if (!current) return null;
        if (current.elapsed >= 29) { setPhase((value) => Math.max(value, 2)); return null; }
        const sequence = breathingSequence(current.pattern);
        if (current.remaining > 1) return { ...current, elapsed: current.elapsed + 1, remaining: current.remaining - 1 };
        const next = (current.phase + 1) % sequence.length;
        return { ...current, elapsed: current.elapsed + 1, phase: next, remaining: sequence[next]?.seconds ?? 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breathing?.pattern]);

  const selected = useMemo(() => regions.flatMap((region) => region.options
    .filter((option) => selectedCues[option.id] !== undefined)
    .map((option) => ({ option: { ...option, regionLabel: region.label }, intensity: selectedCues[option.id] ?? 5 }))), [selectedCues]);
  const inferredZone = useMemo(() => inferZone(selected), [selected]);
  const energyInfo = categorizeCompass(energy, 'energy');
  const valenceInfo = categorizeCompass(valence, 'valence');
  const compassKey = `${energyInfo.key}-${valenceInfo.key}`;
  const quadrant = supportData?.QUADRANT_SUGGESTIONS[compassTouched ? compassKey : (inferredZone ?? '')];
  const compassCandidates = useMemo(() => {
    if (!supportData || !compassTouched) return [];
    const info = supportData.QUADRANT_SUGGESTIONS[compassKey];
    if (!info) return [];
    return info.emotions.map((key, index) => ({ key, score: 1 / (index + 1) / (1 + (rejections[key] ?? 0)), confidence: 0 }))
      .sort((a, b) => b.score - a.score).map((entry, _, values) => ({ ...entry, confidence: entry.score / (values[0]?.score || 1) }));
  }, [compassKey, compassTouched, rejections, supportData]);
  const emotion = selectedEmotion ? supportData?.EMOTION_LIBRARY[selectedEmotion] : null;
  const activeCueCount = Object.keys(selectedCues).length;

  useEffect(() => {
    if (phase < 4) return;
    const results = scoreSensations(selected, rejections);
    setBodyCandidates(results);
    if (!selected.length) {
      setBodyMessage('Try choosing a region and setting how strong the sensation feels. If nothing stands out, move on to the emotion compass.');
      return;
    }
    const notes = regions.flatMap((region) => region.options
      .filter((option) => selectedCues[option.id] !== undefined)
      .map((option) => `• ${region.label}: ${option.title} (${selectedCues[option.id]}/10). ${option.insight ?? ''}`));
    const zoneLine = inferredZone && supportData?.QUADRANT_SUGGESTIONS[inferredZone]
      ? `• Affective zone estimate: ${supportData.QUADRANT_SUGGESTIONS[inferredZone].label}.`
      : '• Affective zone estimate: not clear yet (that’s okay).';
    setBodyMessage(`${notes.join(' ')} ${zoneLine} Use these as invitations, not rules.`);
  }, [inferredZone, phase, rejections, selected, selectedCues, supportData]);

  function startBreathing(pattern = 'slow_446') {
    const sequence = breathingSequence(pattern);
    setBreathing({ pattern, elapsed: 0, phase: 0, remaining: sequence[0]?.seconds ?? 1 });
  }

  function submitSensations() {
    const results = scoreSensations(selected, rejections);
    setBodyCandidates(results);
    if (!selected.length) setBodyMessage('Try choosing a region and setting how strong the sensation feels. If nothing stands out, move on to the emotion compass.');
    else {
      const notes = regions.flatMap((region) => region.options.filter((option) => selectedCues[option.id] !== undefined).map((option) => `• ${region.label}: ${option.title} (${selectedCues[option.id]}/10). ${option.insight ?? ''}`));
      const zoneLine = inferredZone && supportData?.QUADRANT_SUGGESTIONS[inferredZone] ? `• Affective zone estimate: ${supportData.QUADRANT_SUGGESTIONS[inferredZone].label}.` : '• Affective zone estimate: not clear yet (that’s okay).';
      setBodyMessage(`${notes.join(' ')} ${zoneLine} Use these as invitations, not rules.`);
    }
    setPhase(3);
  }

  function rejectEmotion(key: string) {
    const next = { ...rejections, [key]: (rejections[key] ?? 0) + 1 };
    setRejections(next); window.localStorage.setItem(rejectionKey, JSON.stringify(next));
    setBodyCandidates(scoreSensations(selected, next));
    if (selectedEmotion === key) setSelectedEmotion(null);
  }

  function chooseEmotion(key: string) {
    setSelectedEmotion(key); setCommunicationStatus('');
  }

  function moveCompass(event: ReactPointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(box.width, box.height) / 2;
    let nextValence = (event.clientX - (box.left + box.width / 2)) / radius;
    let nextEnergy = ((box.top + box.height / 2) - event.clientY) / radius;
    const magnitude = Math.hypot(nextEnergy, nextValence);
    if (magnitude > 1) { nextEnergy /= magnitude; nextValence /= magnitude; }
    setEnergy(nextEnergy); setValence(nextValence); setCompassTouched(true);
  }

  function openJournal() {
    const feeling = emotion?.name ?? '';
    writeJournalDraft({
      notes: '',
      emotion: feeling,
      intensity,
      feelings: feeling ? [{ feeling, intensity }] : [],
      selectedNeeds: [],
      tags: 'alexithymia-check-in',
      editingId: null,
    });
    void navigate('/inventory/journal?compose=new');
  }

  function resetCheckIn() {
    const empty = emptyAlexithymiaDraft();
    workflowDraftRef.current = empty;
    clearAlexithymiaDraft();
    setPhase(0);
    setOpenRegion(null);
    setSelectedCues({});
    setBodyCandidates([]);
    setBodyMessage('Body-based matches will appear here after you choose sensations.');
    setEnergy(0);
    setValence(0);
    setCompassTouched(false);
    setSelectedEmotion(null);
    setBreathing(null);
    setCommunicationStatus('');
  }

  const activeZone = compassTouched ? compassKey : inferredZone;
  const breathPattern = quadrant && activeZone?.startsWith('high-unpleasant') ? 'physiological_sigh' : activeZone?.startsWith('high-') ? 'resonance_6bpm' : 'slow_446';
  const breathLabel = breathPattern === 'physiological_sigh' ? 'Physiological sigh' : breathPattern === 'resonance_6bpm' ? 'Resonance breath (6 bpm)' : '4-4-6 breath';
  const template = emotion ? `I feel ${emotion.name.toLocaleLowerCase()} because I need ${(emotion.needs[0] ?? 'support').toLocaleLowerCase()}.` : '';

  return (
    <div className={styles.page}>
      <header className={styles.header}><h1>Alexithymia Support</h1><p>Alexithymia can make it difficult to identify, distinguish, or describe emotions. This step-by-step check-in uses body sensations and affect dimensions to help you consider possible feeling labels and decide what may be useful next.</p><p className={styles.mini}><a href={assetPath('docs/body-scan-sourcing-review.md')} target="_blank" rel="noreferrer">Methods &amp; References</a></p></header>

      <section className={styles.flow} aria-labelledby="support-flow-title"><h2 id="support-flow-title" className="visually-hidden">Guided support flow</h2>
        {evidenceNoteVisible ? <div className={styles.evidenceNote}><p>Suggestions are hypotheses based on affect science, not diagnoses. Use “Why these?” to review sources and limitations.</p><button type="button" onClick={() => { setEvidenceNoteVisible(false); try { window.localStorage.setItem(evidenceNoteKey, '1'); } catch { /* Dismissal still applies for this visit. */ } }}>Got it</button></div> : null}

        {phase === 0 ? <article className={styles.step}><h3>Start with what you can observe</h3><p>There is no single correct response. Use any sensations you notice as observations, and skip or revise a step if it does not fit your experience.</p><button className={styles.primary} type="button" onClick={() => setPhase(1)}>Begin <span aria-hidden="true">→</span></button></article> : null}

        {phase === 1 ? <article className={styles.step}><h3>Optional pause: paced breathing</h3><p>If activation feels high, you can try a brief paced-breathing exercise before continuing. Skip it if breathing exercises are not useful for you.</p><div className={styles.breathing}><p>{breathing ? `${breathLabel}: ${breathingSequence(breathing.pattern)[breathing.phase]?.label} • ${breathing.remaining}s` : 'Press start to try a 30-second guided breath.'}</p><div className={`${styles.breathVisual} ${breathing ? styles.breathActive : ''}`} aria-hidden="true" /><div><button className={styles.primary} type="button" onClick={() => startBreathing()} aria-label="Start breathing"><span aria-hidden="true">▶</span> Start</button><button className={styles.ghost} type="button" onClick={() => { setBreathing(null); setPhase(2); }} aria-label="Skip breathing and continue to the body check-in">Skip <span aria-hidden="true">→</span></button></div></div></article> : null}

        {phase === 2 ? <article className={styles.step}><h3>Step 1: What does your body notice?</h3><p>Notice any body sensations that stand out. Open a region to see examples, choose any that fit, then rate their intensity from 0–10.</p><p className={styles.note}>Tap any region below in any order.</p><fieldset className={styles.regions}><legend>Explore sensations by region</legend>{regions.map((region) => { const chosen = region.options.filter((option) => selectedCues[option.id] !== undefined); const open = openRegion === region.id; return <section className={`${styles.region} ${open ? styles.regionOpen : ''}`} key={region.id}><header><div><h4>{region.label}</h4><p>{chosen.length ? `Noticing: ${chosen.slice(0,3).map((option) => `${option.title} (${selectedCues[option.id]}/10)`).join(', ')}.` : 'We can check in here whenever you’re ready.'}</p></div><button className={styles.ghost} type="button" aria-expanded={open} onClick={() => setOpenRegion(open ? null : region.id)}>{chosen.length && !open ? 'Completed' : 'Check in'}</button></header>{open ? <div className={styles.regionDetails}><p>{region.prompt}</p><p>Tap the sensation that fits. A 0–10 slider will appear after you choose.</p><div className={styles.options}>{region.options.map((option) => { const checked = selectedCues[option.id] !== undefined; return <div className={`${styles.option} ${checked ? styles.optionSelected : ''}`} key={option.id}><button type="button" aria-pressed={checked} aria-label={`${region.label}: ${option.title}`} onClick={() => setSelectedCues((current) => { const next = {...current}; if (checked) delete next[option.id]; else next[option.id] = option.defaultIntensity ?? 5; return next; })}><strong>{option.title}</strong><span>{option.note}</span></button>{checked ? <label>Intensity (0–10) <output>{selectedCues[option.id]}</output><input type="range" min="0" max="10" step="1" value={selectedCues[option.id]} aria-label={`${option.title} intensity (0 to 10)`} onChange={(event) => setSelectedCues((current) => ({...current,[option.id]:Number(event.target.value)}))} /><span className={styles.scale}><span>0</span><span>10</span></span></label> : null}</div>; })}</div><button className={styles.ghost} type="button" onClick={() => setOpenRegion(null)}>Done with this area</button></div> : null}</section>; })}</fieldset><div className={styles.actions}><button className={styles.primary} type="button" onClick={submitSensations}>Continue <span aria-hidden="true">→</span></button><button className={styles.ghost} type="button" aria-label="Clear body choices" title="Clear body choices" onClick={() => {setSelectedCues({});setBodyCandidates([]);}}>↺</button></div></article> : null}

        {phase === 3 ? <article className={styles.step}><h3>Step 2: Emotion compass</h3><p>Use the compass to estimate current activation (energy) and pleasantness. These two dimensions provide another way to generate possible emotion matches.</p><div className={styles.compassPanel}><div ref={compassRef} className={styles.compass} role="application" tabIndex={0} aria-label="Emotion compass" aria-valuetext={`Energy: ${energyInfo.label} · Pleasantness: ${valenceInfo.label}`} onPointerDown={moveCompass} onPointerMove={(event) => { if (event.buttons === 1) moveCompass(event); }} onKeyDown={(event) => { const step=0.1; if(event.key==='ArrowUp')setEnergy((v)=>Math.min(1,v+step)); else if(event.key==='ArrowDown')setEnergy((v)=>Math.max(-1,v-step)); else if(event.key==='ArrowRight')setValence((v)=>Math.min(1,v+step)); else if(event.key==='ArrowLeft')setValence((v)=>Math.max(-1,v-step)); else return; event.preventDefault(); setCompassTouched(true);}}><span className={styles.compassTop}>High energy</span><span className={styles.compassBottom}>Low energy</span><span className={styles.compassLeft}>Unpleasant</span><span className={styles.compassRight}>Pleasant</span><span className={styles.compassHandle} style={{left:`${(valence+1)*50}%`,top:`${(1-(energy+1)/2)*100}%`}} /></div><div className={styles.readout}><div><span>Energy</span><strong>{energyInfo.label}</strong></div><div><span>Pleasantness</span><strong>{valenceInfo.label}</strong></div></div><div className={styles.compassSliders}><label>Energy<input type="range" min="-1" max="1" step="0.1" value={energy} onChange={(event)=>{setEnergy(Number(event.target.value));setCompassTouched(true);}} /></label><label>Pleasantness<input type="range" min="-1" max="1" step="0.1" value={valence} onChange={(event)=>{setValence(Number(event.target.value));setCompassTouched(true);}} /></label></div></div><div className={styles.stepNav}><button className={styles.ghost} type="button" onClick={() => setPhase(2)}><span aria-hidden="true">←</span> Back</button><button className={styles.ghost} type="button" onClick={() => setPhase(4)}>Not sure</button><button className={styles.primary} type="button" onClick={() => setPhase(4)}>Continue <span aria-hidden="true">→</span></button></div></article> : null}

        {phase === 4 ? <article className={styles.step}><h3>Step 3: Explore an emotion</h3><p>Review the candidates from the body check-in and emotion compass. Select one to compare its definition, possible body cues, common contexts, and related needs. <a className={styles.jumpLink} href="#compass-suggestions">Jump to emotion candidates</a>.</p><section className={styles.suggestions}><header><h4>Body-based matches</h4><details><summary>Why these?</summary><p>Selected sensations are weighted by their intensity and source associations. These are hypotheses, not diagnoses.</p></details></header><p className={styles.note}>{bodyMessage}</p><EmotionButtons candidates={bodyCandidates} emotions={supportData?.EMOTION_LIBRARY ?? {}} selected={selectedEmotion} onSelect={chooseEmotion} onReject={rejectEmotion} /></section><section id="compass-suggestions" className={styles.suggestions}><header><h4>Emotion compass matches</h4><details><summary>Why these?</summary><p>The compass uses the source model’s energy and pleasantness zones to suggest nearby feeling words.</p></details></header><p className={styles.note}>{compassTouched && supportData?.QUADRANT_SUGGESTIONS[compassKey] ? `${supportData.QUADRANT_SUGGESTIONS[compassKey].label}: ${supportData.QUADRANT_SUGGESTIONS[compassKey].description}` : 'Pick one energy and one pleasantness option to see compass matches.'}</p><EmotionButtons candidates={compassCandidates} emotions={supportData?.EMOTION_LIBRARY ?? {}} selected={selectedEmotion} onSelect={chooseEmotion} onReject={rejectEmotion} /></section>{emotion ? <section className={styles.emotionDetail}><h3>{emotion.name}</h3><p>{emotion.definition}</p>{([['Common body cues',emotion.bodySignals],['Typical thoughts',emotion.thoughts],['When it often appears',emotion.contexts]] as const).map(([title,items])=><div key={title}><h4>{title}</h4><ul>{items.map((item)=><li key={item}>{item}</li>)}</ul></div>)}<div><h4>Possible needs this feeling can point to (hypotheses)</h4><ul>{emotion.needs.map((need)=><li key={need}><Link to={`/needs/${needs.find((item)=>item.title.toLocaleLowerCase()===need.toLocaleLowerCase())?.slug ?? feelingSlug(need)}`}>{need}</Link></li>)}</ul></div><div><h4>Care ideas to experiment with</h4><ul>{emotion.regulation.map((item)=><li key={item}>{item}</li>)}</ul></div><p className={styles.note}>Everyone feels emotions uniquely. Use these clues as invitations, not rules.</p></section> : <p className={styles.note}>Select an emotion above to load its details.</p>}<div className={styles.stepNav}><button className={styles.ghost} type="button" onClick={() => setPhase(3)}><span aria-hidden="true">←</span> Back</button><button className={styles.primary} type="button" disabled={!emotion} onClick={() => setPhase(5)}>Continue <span aria-hidden="true">→</span></button></div></article> : null}

        {phase === 5 && emotion ? <article className={styles.step}><h3>Step 4: Reflect and journal</h3><p>Open the same Journal used throughout allneeds.app when you want to record what you noticed. Entries saved here appear in the same Journal history as entries made elsewhere.</p><button className={styles.primary} type="button" onClick={openJournal}>Journal</button><div className={styles.stepNav}><button className={styles.ghost} type="button" onClick={() => setPhase(4)}><span aria-hidden="true">←</span> Back</button><button className={styles.primary} type="button" onClick={() => setPhase(6)}>Continue <span aria-hidden="true">→</span></button></div></article> : null}

        {phase === 6 && emotion ? <article className={styles.step}><h3>Step 5: Consider regulation options</h3><div className={styles.care}><h4>Support for {emotion.name}</h4><h4>Options to consider</h4><ul>{emotion.regulation.map((item)=><li key={item}>{item}</li>)}</ul>{quadrant?.care?.length ? <><h4>Options for {quadrant.label.toLocaleLowerCase()}</h4><ul>{quadrant.care.map((item)=><li key={item}>{item}</li>)}</ul></> : null}<div className={styles.matchedBreath}><h4>Matched breathing option</h4><p>{breathPattern==='physiological_sigh'?'Use a physiological sigh (double inhale, long exhale) to release high unpleasant activation.':breathPattern==='resonance_6bpm'?'Resonance breathing (5s in, 5s out) steadies high energy while staying grounded.':'Try a steady 4-4-6 breath to invite calm and soften the edges.'}</p><button className={styles.ghost} type="button" onClick={()=>startBreathing(breathPattern)}>Start {breathLabel}</button></div><p className={styles.note}>These are options, not prescriptions. Stop or choose something else if an option does not fit.</p></div><div className={styles.stepNav}><button className={styles.ghost} type="button" onClick={() => setPhase(5)}><span aria-hidden="true">←</span> Back</button><button className={styles.primary} type="button" onClick={() => setPhase(7)}>Continue <span aria-hidden="true">→</span></button></div></article> : null}

        {phase === 7 && emotion ? <article className={styles.step}><h3>Step 6: Put it into words</h3><p>If useful, use the suggested sentence as a starting point and edit it to match what you mean. You can also leave the feeling uncertain and revise it later.</p><div className={styles.communication}><p>{template}</p><div><button className={styles.primary} type="button" onClick={async()=>{try{await navigator.clipboard.writeText(template);setCommunicationStatus('Sentence copied.');}catch{setCommunicationStatus('Copy was unavailable. Select the sentence to copy it.');}}}>Copy sentence</button><button className={styles.ghost} type="button" onClick={()=>{if('speechSynthesis' in window){window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(template));setCommunicationStatus('Reading the sentence aloud.');}}}>Read it aloud</button></div><p className={styles.note} role="status">{communicationStatus}</p></div><div className={styles.stepNav}><button className={styles.ghost} type="button" onClick={() => setPhase(6)}><span aria-hidden="true">←</span> Back</button><button className={styles.primary} type="button" onClick={() => setPhase(8)}>Finish <span aria-hidden="true">✓</span></button></div></article> : null}

        {phase === 8 ? <article className={styles.step}><h3>Review and repeat as useful</h3><p>Emotion identification can become easier with repeated observation and comparison. Return to the flow when it is useful, and revise earlier labels as new information becomes available.</p><div className={styles.stepNav}><button className={styles.ghost} type="button" onClick={() => setPhase(7)}><span aria-hidden="true">←</span> Back</button><button className={styles.primary} type="button" onClick={resetCheckIn}>Start over</button></div></article> : null}
      </section>
    </div>
  );
}
