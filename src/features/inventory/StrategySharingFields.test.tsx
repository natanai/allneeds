import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StrategySharingFields } from './StrategySharingFields';

describe('StrategySharingFields', () => {
  it('keeps Bluesky controls out of the primary signed-out composer', () => {
    const markup = renderToStaticMarkup(<StrategySharingFields signedIn={false} />);

    expect(markup).toContain('Private on this device');
    expect(markup).toContain('Export visibility');
    expect(markup).toContain('Share this strategy with Nat…');
    expect(markup).toContain('name="strategy-visibility"');
    expect(markup).toContain('value="private"');
    expect(markup).not.toContain('Bluesky sharing');
    expect(markup).not.toContain('Followers');
  });

  it('reveals Bluesky audience controls for an active session', () => {
    const markup = renderToStaticMarkup(<StrategySharingFields signedIn />);

    expect(markup).toContain('Bluesky sharing');
    expect(markup).toContain('Audience after profile sync');
    expect(markup).toContain('Followers');
    expect(markup).toContain('Public');
    expect(markup).toContain('Share this strategy with Nat…');
    expect(markup).not.toContain('Export visibility');
  });
});
