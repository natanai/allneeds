import { assetPath } from '../../data/catalog';
import type { MagnetBoardItem } from './MagnetBoard';

type CatalogMagnetEntity = {
  slug: string;
  title: string;
};

export function needMagnetItem(entity: CatalogMagnetEntity): MagnetBoardItem {
  return {
    id: `needs-${entity.slug}`,
    label: entity.title,
    to: `/needs/${entity.slug}`,
    kind: 'need',
    tone: 'selection',
    iconUrl: assetPath(`icons/needs/${entity.slug}.svg`),
  };
}

export function feelingMagnetItem(entity: CatalogMagnetEntity): MagnetBoardItem {
  return {
    id: `feelings-${entity.slug}`,
    label: entity.title,
    to: `/feelings/${entity.slug}`,
    kind: 'feeling',
    tone: 'selection',
    iconUrl: assetPath(`icons/feelings/${entity.slug}.svg`),
  };
}
