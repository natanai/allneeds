import type { InventoryStrategy } from '../inventory/inventoryRepository';

export type ProfilePublishableStrategy = {
  clientKey: string;
  title: string;
  body: string;
  needIds: string[];
  firstName: string;
  location: string;
  visibility: 'followers' | 'public';
};

export function profilePublishableStrategies(inventory: InventoryStrategy[]): ProfilePublishableStrategy[] {
  return inventory
    .filter((entry) => entry.personal && (entry.visibility === 'public' || entry.visibility === 'followers'))
    .map((entry) => ({
      clientKey: entry.id,
      title: entry.title,
      body: entry.description,
      needIds: entry.needSlugs,
      firstName: entry.firstName ?? entry.contributor?.name ?? '',
      location: entry.location ?? entry.contributor?.location ?? '',
      visibility: entry.visibility as 'followers' | 'public',
    }));
}
