import type { InventoryStrategy } from '../inventory/inventoryRepository';

export type ProfilePublishableStrategy = {
  title: string;
  body: string;
  needIds: string[];
  visibility: 'followers' | 'public';
};

export function profilePublishableStrategies(inventory: InventoryStrategy[]): ProfilePublishableStrategy[] {
  return inventory
    .filter((entry) => entry.personal && (entry.visibility === 'public' || entry.visibility === 'followers'))
    .map((entry) => ({
      title: entry.title,
      body: entry.description,
      needIds: entry.needSlugs,
      visibility: entry.visibility as 'followers' | 'public',
    }));
}
