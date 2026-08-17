import type { Feeling } from '../../domain/models';

export const FEELINGS_SOURCE = {
  repository: 'natanai/nvc-app',
  ref: 'backend',
  commit: 'fbf26ce9b7ef2b5b966c3191c4334389274e184f',
  path: 'data/Feelings.csv',
} as const;

type FeelingIndexEntry = Pick<Feeling, 'slug' | 'title' | 'needSatisfaction'>;

const unmet = [
  ['Hurt', 'hurt'], ['Terrified', 'terrified'], ['Bewildered', 'bewildered'], ['Sad', 'sad'],
  ['Frightened', 'frightened'], ['Lonely', 'lonely'], ['Angry', 'angry'], ['Frustrated', 'frustrated'],
  ['Scared', 'scared'], ['Upset', 'upset'], ['Tense', 'tense'], ['Distressed', 'distressed'],
  ['Disappointment', 'disappointment'], ['Enraged', 'enraged'], ['Confused', 'confused'], ['Antagonistic', 'antagonistic'],
  ['Hostile', 'hostile'], ['Thwarted', 'thwarted'], ['Anxious', 'anxious'], ['Resentful', 'resentful'],
  ['In pain', 'in-pain'], ['Embarrassed', 'embarrassed'], ['Overwhelmed', 'overwhelmed'], ['Irritated', 'irritated'],
  ['Anxiety', 'anxiety'], ['Afraid', 'afraid'], ['Powerless', 'powerless'], ['Impotent', 'impotent'],
  ['Helpless', 'helpless'], ['Tired', 'tired'], ['Defiant', 'defiant'], ['Fear', 'fear'],
  ['Desperation', 'desperation'], ['Alarmed', 'alarmed'], ['Agitated', 'agitated'], ['Jealous', 'jealous'],
] as const;

const met = [
  ['Calm', 'calm'], ['Inspired', 'inspired'], ['Proud', 'proud'], ['Hopeful', 'hopeful'],
  ['Contented', 'contented'], ['Peaceful', 'peaceful'], ['Relieved', 'relieved'], ['Relaxed', 'relaxed'],
  ['Joyful', 'joyful'], ['Playful', 'playful'], ['Excited', 'excited'], ['Energized', 'energized'],
] as const;

export const feelingsIndex: FeelingIndexEntry[] = [
  ...unmet.map(([title, slug]) => ({ title, slug, needSatisfaction: 'unmet' as const })),
  ...met.map(([title, slug]) => ({ title, slug, needSatisfaction: 'met' as const })),
];
