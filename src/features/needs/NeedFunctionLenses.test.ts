import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('Need function lens rendering contract', () => {
  it('renders from lens data without Need-specific routing', () => {
    const detailPage = readFileSync(resolve('src/features/needs/NeedDetailPage.tsx'), 'utf8');
    const lensComponent = readFileSync(resolve('src/features/needs/NeedFunctionLenses.tsx'), 'utf8');

    expect(detailPage).toContain('<NeedFunctionLenses lenses={need.evidence?.lenses ?? []} />');
    expect(lensComponent).toContain('This need can involve');
    expect(lensComponent).toContain('lenses.map');
    expect(lensComponent).not.toContain("need.slug === 'understanding'");
    expect(lensComponent).not.toContain('understanding');
  });

  it('keeps both lenses visible rather than putting them behind tabs', () => {
    const lensComponent = readFileSync(resolve('src/features/needs/NeedFunctionLenses.tsx'), 'utf8');

    expect(lensComponent).toContain('className={styles.grid}');
    expect(lensComponent).not.toMatch(/role=["']tab/);
    expect(lensComponent).not.toMatch(/aria-selected/);
  });

  it('reuses canonical Need-page evidence chrome instead of defining a second disclosure language', () => {
    const lensComponent = readFileSync(resolve('src/features/needs/NeedFunctionLenses.tsx'), 'utf8');
    const lensStyles = readFileSync(resolve('src/features/needs/NeedFunctionLenses.module.css'), 'utf8');

    expect(lensComponent).toContain("import evidenceStyles from './NeedDetailPage.module.css'");
    for (const className of [
      'sectionTitle',
      'details',
      'detailsToggle',
      'rewrite',
      'sources',
      'citationRow',
      'citationList',
      'citationNumber',
      'citationBody',
    ]) {
      expect(lensComponent).toContain(`evidenceStyles.${className}`);
    }

    expect(lensStyles).not.toMatch(/\.toggle\s*\{/);
    expect(lensStyles).not.toMatch(/\.citationRow\s*\{/);
    expect(lensStyles).not.toMatch(/\.citationNumber\s*\{/);
    expect(lensStyles).not.toMatch(/\.citationBody\s*\{/);
  });
});
