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

async function updateDocument(path, transform) {
  const absolute = join(root, path);
  const original = await readFile(absolute, 'utf8');
  const next = transform(original);
  if (next === original) return;
  await writeFile(absolute, next);
  changed.push(path);
}

await updateDocument('AGENTS.md', (source) => {
  if (source.includes('The canonical editable theme vocabulary is functional')) return source;
  const anchor = '- **Intentional UI color roles are Customizer-owned.** Do not introduce a standalone themed surface, accent, text, outline, or similar feature color that the Customizer cannot change. Reuse an existing theme token, derive from Customizer-owned tokens with `color-mix()`/opacity, or add a new `ThemeValues` role and wire it through the Customizer, presets, saved-theme prepaint, and regression coverage before consuming it. Fixed black/white is reserved for accessibility contrast, masks, asset/data visualization, or safe pre-CSS fallback—not independent themed surfaces or accents.\n';
  const addition = '- **The canonical editable theme vocabulary is functional, not hue-named:** `primary`, `quiet`, `text`, `secondary`, `action`, `positive`, `attention`, `selection`, and `outline`, exposed as matching CSS custom properties. Do not add runtime aliases such as hue names for these roles. Historical hue-keyed theme fields may appear only at the persisted-data migration/read boundary so existing saved themes continue to load. New saves, presets, component props, tests, and CSS must use the functional role names.\n';
  if (!source.includes(anchor)) throw new Error('AGENTS theme anchor not found');
  return source.replace(anchor, anchor + addition);
});

await updateDocument('docs/design-language.md', (source) => {
  let next = source;
  if (!next.includes('## Functional theme roles')) {
    const anchor = '- Use Customizer-owned theme tokens and derived `color-mix()` values rather than introducing independent hard-coded theme colors.\n\n## Magnet physics';
    const section = `- Use Customizer-owned theme tokens and derived \`color-mix()\` values rather than introducing independent hard-coded theme colors.\n\n## Functional theme roles\n\n**Accepted 2026-08-25.** The Customizer palette is defined by what each color does, not by the hue shipped in the default preset.\n\n- The canonical editable roles are \`Primary\`, \`Quiet\`, \`Text\`, \`Secondary\`, \`Action\`, \`Positive\`, \`Attention\`, \`Selection\`, and \`Outline\`. Runtime code uses the corresponding \`--primary\`, \`--quiet\`, \`--text\`, \`--secondary\`, \`--action\`, \`--positive\`, \`--attention\`, \`--selection\`, and \`--outline\` custom properties.\n- Default colors are only defaults. A role must keep the same semantic job when a preset or user customization changes its hue completely.\n- Do not introduce hue-named runtime aliases for these roles. Older saved themes may still contain the former hue-keyed fields, but those names belong only in the persisted-theme migration/read boundary and must never be emitted by new saves.\n- Presets, Customizer state, magnet tone props/classes, feature CSS, startup prepaint, and regression tests all use the functional role vocabulary.\n- The Design Lab main and actual-size previews inherit the live Customizer palette and roundness from the page. The lab must not maintain duplicate live palette or roundness controls. Fixed preset-comparison swatches may render independent preset snapshots because their purpose is explicit side-by-side comparison.\n- The semantic-vocabulary regression test is permanent and should fail if a removed hue-named CSS token or magnet tone is reintroduced into runtime source.\n\n## Magnet physics`;
    if (!next.includes(anchor)) throw new Error('design-language theme anchor not found');
    next = next.replace(anchor, section);
  }
  if (!next.includes('- Theme internals now use functional Customizer roles')) {
    const logAnchor = '### 2026-08-25\n\n';
    const logEntry = '- Theme internals now use functional Customizer roles site-wide instead of hue-named runtime tokens. Legacy hue-keyed saved themes are migrated only at the read/prepaint boundary, and the Design Lab inherits the live Customizer palette and roundness rather than maintaining duplicate controls.\n';
    if (!next.includes(logAnchor)) throw new Error('design-language decision-log anchor not found');
    next = next.replace(logAnchor, logAnchor + logEntry);
  }
  return next;
});

await updateDocument('src/features/designLab/AGENTS.md', (source) => {
  let next = source;
  next = next.replace(
    '- Import `themePresets` and `themeCssValues` from the Customizer. Never maintain a second list of preset colors or roundness values here.',
    '- Import `themePresets` and `themeCssValues` from the Customizer for fixed comparison swatches. The main and actual-size lab previews inherit the live page Customizer theme and roundness directly. Never maintain duplicate live palette or roundness controls here.',
  );
  next = next.replace(
    '- Every full-face proposal must remain visibly distinct in every real `themePresets` swatch, including low-chroma/near-monochrome presets such as Refrigerator. Do not hard-code a fallback color; derive at least one artwork stop from a contrast-bearing Customizer role such as `--plum`, `--ink`, or `--outline` (directly or through `color-mix()`).',
    '- Every full-face proposal must remain visibly distinct in every real `themePresets` swatch, including low-chroma/near-monochrome presets such as Refrigerator. Do not hard-code a fallback color; derive at least one artwork stop from a contrast-bearing Customizer role such as `--primary`, `--text`, or `--outline` (directly or through `color-mix()`).',
  );
  next = next.replace(
    '- Always sweep the full 0–200% roundness control while reviewing candidates. The Design Lab uses the same production radius tokens, so a roundness failure should be fixed at the shared token/Customizer source rather than patched only in the lab.',
    '- Always sweep the full 0–200% roundness range through the real Customizer while reviewing candidates. The Design Lab uses the same production radius tokens, so a roundness failure should be fixed at the shared token/Customizer source rather than patched only in the lab.',
  );
  return next;
});

console.log(`Migrated ${changed.length} source/documentation files.`);
changed.forEach((path) => console.log(`- ${path}`));
