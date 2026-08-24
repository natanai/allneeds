import { Link } from 'react-router';

import styles from './EmotionsWheelPage.module.css';

type WheelEntry = { label: string; to: string };
type WheelGroup = WheelEntry & {
  color: string;
  ring2: WheelEntry[];
  ring3: WheelEntry[];
};

const groups: WheelGroup[] = [
  {
    label: 'Joyful', to: '/feelings/joyful', color: '#b5df8c',
    ring2: [
      { label: 'Excited', to: '/feelings/excited' }, { label: 'Inspired', to: '/feelings/inspired' },
      { label: 'Calm', to: '/feelings/calm' }, { label: 'Hopeful', to: '/feelings/hopeful' },
    ],
    ring3: [
      { label: 'Thrilled', to: '/feelings/excited' }, { label: 'Eager', to: '/feelings/excited' },
      { label: 'Creative', to: '/feelings/inspired' }, { label: 'Moved', to: '/feelings/inspired' },
      { label: 'Relaxed', to: '/feelings/relaxed' }, { label: 'Peaceful', to: '/feelings/peaceful' },
      { label: 'Optimistic', to: '/feelings/hopeful' }, { label: 'Confident', to: '/feelings/proud' },
    ],
  },
  {
    label: 'Sad', to: '/feelings/sad', color: '#b7c1f0',
    ring2: [
      { label: 'Hurt', to: '/feelings/hurt' }, { label: 'Lonely', to: '/feelings/lonely' },
      { label: 'Powerless', to: '/feelings/powerless' }, { label: 'Disappointment', to: '/feelings/disappointment' },
    ],
    ring3: [
      { label: 'Wounded', to: '/feelings/hurt' }, { label: 'In pain', to: '/feelings/in-pain' },
      { label: 'Isolated', to: '/faux-feelings/isolated' }, { label: 'Unseen', to: '/faux-feelings/unseen' },
      { label: 'Helpless', to: '/feelings/helpless' }, { label: 'Hopeless', to: '/feelings/desperation' },
      { label: 'Blue', to: '/feelings/sad' }, { label: 'Regretful', to: '/feelings/disappointment' },
    ],
  },
  {
    label: 'Angry', to: '/feelings/angry', color: '#f4a4be',
    ring2: [
      { label: 'Frustrated', to: '/feelings/frustrated' }, { label: 'Upset', to: '/feelings/upset' },
      { label: 'Irritated', to: '/feelings/irritated' }, { label: 'Enraged', to: '/feelings/enraged' },
    ],
    ring3: [
      { label: 'Annoyed', to: '/feelings/frustrated' }, { label: 'Thwarted', to: '/feelings/thwarted' },
      { label: 'Distressed', to: '/feelings/distressed' }, { label: 'Resentful', to: '/feelings/resentful' },
      { label: 'Agitated', to: '/feelings/agitated' }, { label: 'Hostile', to: '/feelings/hostile' },
      { label: 'Mad', to: '/feelings/angry' }, { label: 'Antagonistic', to: '/feelings/antagonistic' },
    ],
  },
  {
    label: 'Scared', to: '/feelings/scared', color: '#f6c48f',
    ring2: [
      { label: 'Fear', to: '/feelings/fear' }, { label: 'Anxious', to: '/feelings/anxious' },
      { label: 'Frightened', to: '/feelings/frightened' }, { label: 'Terrified', to: '/feelings/terrified' },
    ],
    ring3: [
      { label: 'Alarmed', to: '/feelings/alarmed' }, { label: 'Worried', to: '/feelings/fear' },
      { label: 'Tense', to: '/feelings/tense' }, { label: 'Overwhelmed', to: '/feelings/overwhelmed' },
      { label: 'Uneasy', to: '/feelings/anxiety' }, { label: 'Unsafe', to: '/faux-feelings/threatened' },
      { label: 'Shaky', to: '/feelings/frightened' }, { label: 'Panic', to: '/feelings/terrified' },
    ],
  },
  {
    label: 'Confused', to: '/feelings/confused', color: '#92dad3',
    ring2: [
      { label: 'Bewildered', to: '/feelings/bewildered' }, { label: 'Embarrassed', to: '/feelings/embarrassed' },
      { label: 'Shocked', to: '/faux-feelings/threatened' }, { label: 'Misunderstood', to: '/faux-feelings/misunderstood' },
    ],
    ring3: [
      { label: 'Perplexed', to: '/feelings/bewildered' }, { label: 'Unsure', to: '/feelings/confused' },
      { label: 'Ashamed', to: '/feelings/embarrassed' }, { label: 'Self-conscious', to: '/feelings/embarrassed' },
      { label: 'Startled', to: '/faux-feelings/threatened' }, { label: 'Unsteady', to: '/feelings/overwhelmed' },
      { label: 'Overlooked', to: '/faux-feelings/unheard' }, { label: 'Dismissed', to: '/faux-feelings/discounted-diminished' },
    ],
  },
];

const size = 860;
const center = size / 2;
const radii = { innerStart: 56, ring1End: 175, ring2End: 285, ring3End: 395 };

function point(radius: number, angle: number) {
  return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
}

function ringPath(innerRadius: number, outerRadius: number, start: number, end: number) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const p1 = point(outerRadius, start);
  const p2 = point(outerRadius, end);
  const p3 = point(innerRadius, end);
  const p4 = point(innerRadius, start);
  return `M ${p1.x} ${p1.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
}

function textTransform(radius: number, start: number, end: number) {
  const middle = (start + end) / 2;
  const p = point(radius, middle);
  const degrees = (middle * 180) / Math.PI;
  const spin = degrees > 90 && degrees < 270 ? degrees + 180 : degrees;
  return `translate(${p.x} ${p.y}) rotate(${spin})`;
}

function Slice({ entry, color, start, end, inner, outer }: {
  entry: WheelEntry;
  color: string;
  start: number;
  end: number;
  inner: number;
  outer: number;
}) {
  return (
    <Link className={styles.sliceLink} to={entry.to} aria-label={entry.label}>
      <path className={styles.slicePath} d={ringPath(inner, outer, start, end)} fill={color} />
      <text className={styles.label} transform={textTransform((inner + outer) / 2, start, end)}>{entry.label}</text>
    </Link>
  );
}

export function EmotionsWheelPage() {
  const groupAngle = (Math.PI * 2) / groups.length;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Interactive<br />{' '}emotions wheel</h1>
        <p>Each wheel segment is clickable and opens an existing feelings or faux feelings page.</p>
      </header>

      <section className={styles.shell} aria-label="Emotion and feeling wheel">
        <div className={styles.wheel}>
          <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Interactive emotion and feeling wheel">
            {groups.map((group, groupIndex) => {
              const groupStart = -Math.PI / 2 + groupIndex * groupAngle;
              const groupEnd = groupStart + groupAngle;
              return (
                <g key={group.label}>
                  <Slice entry={group} color={group.color} start={groupStart} end={groupEnd} inner={radii.innerStart} outer={radii.ring1End} />
                  {group.ring2.map((entry, index) => {
                    const slice = groupAngle / group.ring2.length;
                    const start = groupStart + slice * index;
                    return <Slice key={entry.label} entry={entry} color={group.color} start={start} end={start + slice} inner={radii.ring1End} outer={radii.ring2End} />;
                  })}
                  {group.ring3.map((entry, index) => {
                    const slice = groupAngle / group.ring3.length;
                    const start = groupStart + slice * index;
                    return <Slice key={entry.label} entry={entry} color={group.color} start={start} end={start + slice} inner={radii.ring2End} outer={radii.ring3End} />;
                  })}
                </g>
              );
            })}
            <circle className={styles.center} cx={center} cy={center} r={radii.innerStart - 1} />
            <text className={styles.centerText} x={center} y={center + 5}>Feelings</text>
          </svg>
        </div>
        <p className={styles.help}>Tip: the outer ring includes a few synonyms that route to existing supported pages.</p>
      </section>
    </div>
  );
}
