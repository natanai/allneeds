import { assetPath, feelings, needs } from '../data/catalog';
import { warmAppResources } from './appResources';

const coreImages = [
  'icons/door-observations.svg',
  'icons/door-feelings.svg',
  'icons/door-needs.svg',
  'icons/alexithymia-8bit.svg',
  ...feelings.map((feeling) => `icons/feelings/${feeling.slug}.svg`),
  ...needs.map((need) => `icons/needs/${need.slug}.svg`),
];

function preloadImage(path: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
    image.src = assetPath(path);
  });
}

export async function preloadAppAssets() {
  await Promise.all([
    warmAppResources(),
    ...coreImages.map(preloadImage),
  ]);
}
