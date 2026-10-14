/** Keep punctuation, non-Latin text, and emoji distinct; normalize only spelling case. */
export function customTermId(label: string) {
  const spelling = label.trim().normalize('NFC').toLowerCase();
  return `working:v2:${Array.from(spelling, (character) => character.codePointAt(0)!.toString(16)).join('.')}`;
}

/** Read-boundary migration only. New identities must never use this lossy spelling. */
export function legacyCustomTermId(label: string) {
  return `working:${label.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}
