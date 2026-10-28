export const checkInSteps = [
  { label: 'What happened', note: 'Name the present moment' },
  { label: 'Clues', note: 'Notice what is available' },
  { label: 'Words', note: 'Compare possibilities' },
  { label: 'Needs', note: 'Choose what matters' },
  { label: 'Your words', note: 'Review and build your sentence' },
] as const;

export const CHECK_IN_STAGE_COUNT = checkInSteps.length;
