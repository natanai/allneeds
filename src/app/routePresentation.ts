import { fauxFeelingsBySlug, feelingsBySlug, needsBySlug } from '../data/catalog';

export type RoutePresentation = {
  label: string;
  documentTitle: string;
};

const exactRouteLabels: Record<string, string> = {
  '/': 'Home',
  '/feelings': 'Feelings',
  '/feelings/body-cues': 'Body cues',
  '/feelings/emotions-wheel': 'Emotions wheel',
  '/needs': 'Needs',
  '/faux-feelings': 'Faux feelings',
  '/observations': 'Observations',
  '/inventory': 'Inventory',
  '/inventory/journal': 'Journal history',
  '/feed': 'Shared strategies',
  '/alexithymia-support': 'Feeling word support',
};

const segmentLabels: Record<string, string> = {
  feelings: 'Feelings',
  needs: 'Needs',
  'faux-feelings': 'Faux feelings',
  observations: 'Observations',
  inventory: 'Inventory',
  journal: 'Journal',
  'body-cues': 'Body cues',
  'alexithymia-support': 'Feeling word support',
  'emotions-wheel': 'Emotions wheel',
  feed: 'Shared strategies',
};

function normalizedPathname(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return `/${pathname.split('/').filter(Boolean).join('/')}`;
}

export function titleFromSegment(segment: string) {
  return segmentLabels[segment]
    ?? feelingsBySlug.get(segment)?.title
    ?? needsBySlug.get(segment)?.title
    ?? fauxFeelingsBySlug.get(segment)?.title
    ?? segment
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
}

function labelForRoute(pathname: string, search: string) {
  if (pathname === '/inventory/journal'
    && new URLSearchParams(search).get('compose') === 'new') {
    return 'New journal entry';
  }

  const exact = exactRouteLabels[pathname];
  if (exact) return exact;

  const [, family, slug, ...extra] = pathname.split('/');
  if (!slug || extra.length) return 'Page not found';

  if (family === 'feelings') {
    const feeling = feelingsBySlug.get(slug);
    return feeling ? `Feeling: ${feeling.title}` : 'Feeling not found';
  }
  if (family === 'needs') {
    const need = needsBySlug.get(slug);
    return need ? `Need for ${need.title.toLocaleLowerCase()}` : 'Need not found';
  }
  if (family === 'faux-feelings') {
    const fauxFeeling = fauxFeelingsBySlug.get(slug);
    return fauxFeeling ? `Faux feeling: ${fauxFeeling.title}` : 'Faux feeling not found';
  }

  return 'Page not found';
}

export function routePresentation(pathname: string, search = ''): RoutePresentation {
  const label = labelForRoute(normalizedPathname(pathname), search);
  return {
    label,
    documentTitle: label === 'Home' ? 'allneeds.app' : `${label} • allneeds.app`,
  };
}
