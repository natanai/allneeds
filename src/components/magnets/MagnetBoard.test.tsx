import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MagnetBoard } from './MagnetBoard';

describe('content magnet selection cues', () => {
  it('reserves a decorative check for both toggle states without changing their accessible names', () => {
    const html = renderToStaticMarkup(<MagnetBoard
      items={[
        { id: 'chosen', label: 'Safety', selected: true, ariaLabel: 'Safety, selected', onActivate: () => undefined },
        { id: 'available', label: 'Support', selected: false, onActivate: () => undefined },
        { id: 'suggestion', label: 'Possibility', tone: 'positive' },
      ]}
      playMode onPlayModeChange={() => undefined} storageKey="test-selections"
    />);
    expect(html).toContain('aria-label="Safety, selected" aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html.match(/aria-hidden="true" data-selected="(?:true|false)">✓/g)).toHaveLength(2);
    expect(html).toContain('data-selected="true">✓');
    expect(html).toContain('data-selected="false">✓');
    expect(html.match(/aria-pressed=/g)).toHaveLength(2);
  });

  it('does not add answer checks to the navigation board or infer selection from a color tone', () => {
    for (const variant of ['nav', 'content'] as const) {
      const html = renderToStaticMarkup(<MagnetBoard
        items={[{ id: 'active', label: 'Current', active: true, tone: 'positive' }]}
        variant={variant} playMode onPlayModeChange={() => undefined} storageKey="test-current"
      />);
      expect(html).toContain('aria-current="page"');
      expect(html).not.toContain('data-selected=');
      expect(html).not.toContain('aria-pressed=');
      expect(html).not.toContain('✓');
    }
  });
});
