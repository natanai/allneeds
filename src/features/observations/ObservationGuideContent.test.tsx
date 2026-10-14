import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import observationGuide from '../../data/observationGuide.json';
import { GuideContent, GuideText } from './ObservationsPage';

describe('Observation guide citation rendering', () => {
  it('renders single and grouped citations as separately named reference links', () => {
    const html = renderToStaticMarkup(<GuideText text="Methods.[1] Training.[5,6]" />);
    for (const index of [0, 4, 5]) {
      const source = observationGuide.sources[index]!;
      expect(html).toContain(`href="#observation-guide-source-${source.id}"`);
      expect(html).toContain(`aria-label="Reference ${index + 1}: ${source.authors.replace(/&/g, '&amp;')}"`);
    }
    expect(html.match(/href=/g)).toHaveLength(3);
    expect(html).toContain('Methods.');
    expect(html).toContain('Training.');
  });

  it('renders every canonical topic through the same content renderer', () => {
    for (const section of observationGuide.sections) {
      const blocks = section.content as Parameters<typeof GuideContent>[0]['blocks'];
      const html = renderToStaticMarkup(<GuideContent blocks={blocks} />);
      const expectedReferences = section.content.flatMap((block) => 'text' in block && typeof block.text === 'string'
        ? [...block.text.matchAll(/\[(\d+(?:,\d+)*)\]/g)].flatMap((match) => match[1]!.split(','))
        : []);
      expect(html.match(/href="#observation-guide-source-/g) ?? []).toHaveLength(expectedReferences.length);
      expect(html).not.toContain('Research method.</strong>');
      expect(html).not.toContain('<details');
    }
  });

  it('fails on an unmapped citation instead of silently dropping research', () => {
    expect(() => renderToStaticMarkup(<GuideText text="Unknown source.[19]" />))
      .toThrow('Unknown Observation guide reference: 19');
  });

  it('renders plain text safely without interpreting authored strings as HTML', () => {
    const html = renderToStaticMarkup(<GuideContent blocks={[{ type: 'paragraph', text: '<script>alert(1)</script>' }]} />);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('keeps both approved example columns without unapproved interpretation notes', () => {
    const html = renderToStaticMarkup(<GuideContent blocks={[{
      type: 'examples', items: [{ evaluation: 'Starting account', observation: 'Event detail' }],
    }]} />);
    expect(html).toContain('Starting wording:</strong> Starting account');
    expect(html).toContain('Added event detail:</strong> Event detail');
    expect(html.match(/<p>/g)).toHaveLength(2);
  });
});
