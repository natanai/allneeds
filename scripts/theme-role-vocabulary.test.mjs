import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const sourceExtensions = new Set(['.css', '.ts', '.tsx']);

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const runtimeFiles = [
  join(root, 'index.html'),
  ...walk(join(root, 'src')).filter((path) => sourceExtensions.has(extname(path))),
];

const forbidden = [
  {
    label: 'legacy CSS custom property',
    pattern: /--(?:plum|lavender|ink(?:-soft)?|rose|mint|gold|sky|peach|color-(?:plum|lavender|ink(?:-soft)?|rose|mint|gold|sky|peach))\b/g,
  },
  {
    label: 'legacy magnet tone',
    pattern: /\btone\s*:\s*['"](?:rose|mint|gold|sky|lavender|peach)['"]/g,
  },
  {
    label: 'legacy magnet style class',
    pattern: /styles\.(?:rose|mint|gold|sky|lavender|peach)\b/g,
  },
];

describe('semantic theme vocabulary', () => {
  it('keeps runtime CSS and theme consumers on functional role names', () => {
    const violations = [];
    for (const path of runtimeFiles) {
      const source = readFileSync(path, 'utf8');
      for (const rule of forbidden) {
        const matches = [...source.matchAll(rule.pattern)];
        for (const match of matches) {
          const line = source.slice(0, match.index).split('\n').length;
          violations.push(`${relative(root, path)}:${line} ${rule.label}: ${match[0]}`);
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
