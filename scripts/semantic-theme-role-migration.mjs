import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const roots = ['src'];
const allowed = new Set(['.css', '.ts', '.tsx']);
const excluded = new Set([
  'src/features/customizer/customizerSettings.ts',
]);

const replacements = [
  ['--color-ink-soft', '--color-secondary'],
  ['--color-lavender', '--color-quiet'],
  ['--color-plum', '--color-primary'],
  ['--color-ink', '--color-text'],
  ['--color-rose', '--color-action'],
  ['--color-mint', '--color-positive'],
  ['--color-gold', '--color-attention'],
  ['--color-sky', '--color-selection'],
  ['--color-peach', '--color-action'],
  ['var(--ink-soft)', 'var(--secondary)'],
  ['var(--lavender)', 'var(--quiet)'],
  ['var(--plum)', 'var(--primary)'],
  ['var(--ink)', 'var(--text)'],
  ['var(--rose)', 'var(--action)'],
  ['var(--mint)', 'var(--positive)'],
  ['var(--gold)', 'var(--attention)'],
  ['var(--sky)', 'var(--selection)'],
  ['var(--peach)', 'var(--action)'],
  ["tone: 'rose'", "tone: 'action'"],
  ["tone: 'mint'", "tone: 'positive'"],
  ["tone: 'gold'", "tone: 'attention'"],
  ["tone: 'sky'", "tone: 'selection'"],
  ["tone: 'lavender'", "tone: 'quiet'"],
  ["tone: 'peach'", "tone: 'action'"],
];

async function filesUnder(directory) {
  const absolute = join(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (allowed.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const files = (await Promise.all(roots.map(filesUnder))).flat();
const changed = [];
for (const path of files) {
  if (excluded.has(path)) continue;
  const absolute = join(root, path);
  const original = await readFile(absolute, 'utf8');
  let next = original;
  for (const [from, to] of replacements) next = next.split(from).join(to);

  if (path === 'src/components/magnets/MagnetBoard.tsx') {
    next = next
      .replace(
        "export type MagnetTone = 'rose' | 'mint' | 'gold' | 'sky' | 'lavender' | 'peach';",
        "export type MagnetTone = 'action' | 'positive' | 'attention' | 'selection' | 'quiet' | 'primary';",
      )
      .replace("styles[item.tone ?? 'lavender']", "styles[item.tone ?? 'quiet']");
  }

  if (path === 'src/components/magnets/MagnetBoard.module.css') {
    next = next
      .replace('.rose { background: var(--action); }', '.action { background: var(--action); }')
      .replace('.mint { background: var(--positive); }', '.positive { background: var(--positive); }')
      .replace('.gold { background: var(--attention); }', '.attention { background: var(--attention); }')
      .replace('.sky { background: var(--selection); }', '.selection { background: var(--selection); }')
      .replace('.lavender { background: color-mix(in srgb, var(--quiet) 65%, var(--surface-raised) 35%); }', '.quiet { background: color-mix(in srgb, var(--quiet) 65%, var(--surface-raised) 35%); }')
      .replace('.peach { background: var(--action); }\n', '')
      .replaceAll('.nav .rose', '.nav .action')
      .replaceAll('.nav .mint', '.nav .positive')
      .replaceAll('.nav .gold', '.nav .attention')
      .replaceAll('.nav .peach', '.nav .action');
  }

  if (next !== original) {
    await writeFile(absolute, next);
    changed.push(relative(root, absolute));
  }
}

console.log(`Migrated ${changed.length} source files.`);
changed.forEach((path) => console.log(`- ${path}`));
