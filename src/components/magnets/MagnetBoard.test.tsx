import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MagnetBoard } from './MagnetBoard';

describe('content magnet selection cues', () => {
  it('renders compound controls beside a real drag-handle button without nesting native controls', () => {
    const html = renderToStaticMarkup(<MagnetBoard
      items={[{ id: 'feeling', label: 'Anxiety', kind: 'feeling', selected: true,
        actions: <><button type="button">Options</button><button type="button">Dismiss</button></>,
        controls: <input type="range" aria-label="Anxiety intensity" defaultValue={4} /> }]}
      playMode onPlayModeChange={() => undefined} storageKey="test-controls"
    />);
    expect(html).toContain('role="group" aria-label="Anxiety controls"');
    expect(html).toContain('data-magnet-handle="true"');
    expect(html).toContain('aria-label="Anxiety intensity"');
    for (const button of html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)) expect(button[0]).not.toMatch(/<input|<button.*<button/s);
  });
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
