import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { needMagnetItem } from '../../components/magnets/catalogMagnetItems';

const faceCss = readFileSync(
  new URL('../../components/magnets/MagnetFaces.css', import.meta.url),
  'utf8',
);

describe('approved Need magnet identities', () => {
  it('promotes Safety · Layered Cover with the umbrella icon', () => {
    const icon = readFileSync(new URL('../../../public/icons/needs/safety.svg', import.meta.url), 'utf8');
    const art = readFileSync(
      new URL('../../../public/icons/needs/art/safety-layered-cover.svg', import.meta.url),
      'utf8',
    );
    const item = needMagnetItem({ slug: 'safety', title: 'Safety' });

    expect(faceCss).toContain("[data-magnet-id='needs-safety']");
    expect(item.iconUrl).toContain('icons/needs/safety.svg');
    expect(faceCss).toContain("url('/icons/needs/art/safety-layered-cover.svg')");
    expect(icon).toContain('M3 11.5C4.2 7.2 7.4 4.5 12 4.5');
    expect(art).toContain('viewBox="0 0 220 64"');
  });

  it('promotes Understanding · Converging Map with both lens icons and full-face artwork', () => {
    const routeIcon = readFileSync(
      new URL('../../../public/icons/needs/understanding.svg', import.meta.url),
      'utf8',
    );
    const perspectiveIcon = readFileSync(
      new URL('../../../public/icons/needs/understanding-perspective.svg', import.meta.url),
      'utf8',
    );
    const art = readFileSync(
      new URL('../../../public/icons/needs/art/understanding-converging-map.svg', import.meta.url),
      'utf8',
    );
    const item = needMagnetItem({ slug: 'understanding', title: 'Understanding' });

    expect(faceCss).toContain("[data-magnet-id='needs-understanding']");
    expect(item.iconUrl).toContain('icons/needs/understanding.svg');
    expect(faceCss).toContain("url('/icons/needs/understanding-perspective.svg')");
    expect(faceCss).toContain("url('/icons/needs/art/understanding-converging-map.svg')");
    expect(routeIcon).toContain('M5 15.5c1.8-3.8 4-5.4 6.5-4.8');
    expect(perspectiveIcon).toContain('M9.8 12.1 12 14l2.2-1.9');
    expect(art).toContain('viewBox="0 0 160 48"');
    expect(art).toContain('<circle cx="80" cy="24" r="5"/>');
  });

  it('promotes Clarity · Pulse with Focus and Compass lens icons', () => {
    const focusIcon = readFileSync(
      new URL('../../../public/icons/needs/clarity.svg', import.meta.url),
      'utf8',
    );
    const compassIcon = readFileSync(
      new URL('../../../public/icons/needs/clarity-compass.svg', import.meta.url),
      'utf8',
    );
    const art = readFileSync(
      new URL('../../../public/icons/needs/art/clarity-pulse.svg', import.meta.url),
      'utf8',
    );
    const item = needMagnetItem({ slug: 'clarity', title: 'Clarity' });

    expect(faceCss).toContain("[data-magnet-id='needs-clarity']");
    expect(item.iconUrl).toContain('icons/needs/clarity.svg');
    expect(faceCss).toContain("url('/icons/needs/clarity-compass.svg')");
    expect(faceCss).toContain("url('/icons/needs/art/clarity-pulse.svg')");
    expect(focusIcon).toContain('M8 4H5a1 1 0 0 0-1 1v3');
    expect(compassIcon).toContain('M14.9 9.1 13.3 13.3 9.1 14.9');
    expect(art).toContain('viewBox="0 0 160 48"');
    expect(art).toContain('<circle cx="80" cy="24" r="3.2" fill="black"/>');
  });

  it('promotes Honesty · Heart to Honesty with its unique heart-and-voice icon and corrected destination art', () => {
    const icon = readFileSync(new URL('../../../public/icons/needs/honesty.svg', import.meta.url), 'utf8');
    const art = readFileSync(
      new URL('../../../public/icons/needs/art/honesty-corrected-destination.svg', import.meta.url),
      'utf8',
    );
    const item = needMagnetItem({ slug: 'honesty', title: 'Honesty' });

    expect(faceCss).toContain("[data-magnet-id='needs-honesty']");
    expect(item.iconUrl).toContain('icons/needs/honesty.svg');
    expect(faceCss).toContain("url('/icons/needs/art/honesty-corrected-destination.svg')");
    expect(icon).toContain('M12 20.2S3.6 15.1');
    expect(icon).toContain('M14.9 10.2h4.5');
    expect(art).toContain('viewBox="0 0 160 48"');
    expect(art).toContain('m49 20 5 4-5 4');
  });
});
