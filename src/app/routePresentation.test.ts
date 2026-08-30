import { describe, expect, it } from 'vitest';

import { fauxFeelings, feelings } from '../data/catalog';
import { routePresentation, titleFromSegment } from './routePresentation';

describe('route presentation', () => {
  it('keeps the home title concise', () => {
    expect(routePresentation('/')).toEqual({
      label: 'Home',
      documentTitle: 'allneeds.app',
    });
  });

  it('names every primary tool route', () => {
    expect(routePresentation('/observations').documentTitle).toBe('Observations • allneeds.app');
    expect(routePresentation('/feelings/body-cues').label).toBe('Body cues');
    expect(routePresentation('/feed').label).toBe('Shared strategies');
    expect(routePresentation('/alexithymia-support').label).toBe('Feeling word support');
  });

  it('distinguishes the journal composer from history', () => {
    expect(routePresentation('/inventory/journal').label).toBe('Journal history');
    expect(routePresentation('/inventory/journal', '?compose=new').documentTitle)
      .toBe('New journal entry • allneeds.app');
  });

  it('uses catalog labels for detail routes and explicit not-found titles', () => {
    const feeling = feelings[0]!;
    const fauxFeeling = fauxFeelings[0]!;
    expect(routePresentation('/needs/autonomy').documentTitle)
      .toBe('Need for autonomy • allneeds.app');
    expect(routePresentation(`/feelings/${feeling.slug}`).label).toBe(`Feeling: ${feeling.title}`);
    expect(routePresentation(`/faux-feelings/${fauxFeeling.slug}`).label)
      .toBe(`Faux feeling: ${fauxFeeling.title}`);
    expect(routePresentation('/needs/not-a-real-need').label).toBe('Need not found');
    expect(routePresentation('/missing/route').label).toBe('Page not found');
  });

  it('shares catalog-aware segment labels with breadcrumbs', () => {
    expect(titleFromSegment('body-cues')).toBe('Body cues');
    expect(titleFromSegment('autonomy')).toBe('Autonomy');
  });
});
