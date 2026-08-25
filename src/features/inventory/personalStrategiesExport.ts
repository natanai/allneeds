import type { InventoryStrategy } from './inventoryRepository';

export const PERSONAL_STRATEGIES_EMAIL_ADDRESS = 'ahiccup@gmail.com';
export const PERSONAL_STRATEGIES_EMAIL_SUBJECT = 'Strategies for allneeds.app!';
export const PERSONAL_STRATEGIES_EMAIL_BODY =
  'Hi Nat,\n\nI just exported my personal strategies from allneeds.app and attached the file for you.\n\nWith care,';

export type PersonalStrategiesExport = {
  version: 1;
  exportedAt: string;
  personalStrategies: InventoryStrategy[];
};

export function buildPersonalStrategiesExport(
  inventory: InventoryStrategy[],
  exportedAt = new Date().toISOString(),
): PersonalStrategiesExport {
  return {
    version: 1,
    exportedAt,
    personalStrategies: inventory.filter((strategy) => strategy.personal && strategy.visibility === 'public'),
  };
}

export function buildSingleStrategyExport(
  strategy: InventoryStrategy,
  exportedAt = new Date().toISOString(),
): PersonalStrategiesExport {
  return {
    version: 1,
    exportedAt,
    personalStrategies: strategy.personal ? [strategy] : [],
  };
}

export function personalStrategiesEmailHref() {
  const query = new URLSearchParams({
    subject: PERSONAL_STRATEGIES_EMAIL_SUBJECT,
    body: PERSONAL_STRATEGIES_EMAIL_BODY,
  });
  return `mailto:${PERSONAL_STRATEGIES_EMAIL_ADDRESS}?${query.toString()}`;
}

function downloadExport(payload: PersonalStrategiesExport, filename: string) {
  if (!payload.personalStrategies.length) return { downloaded: false as const, count: 0 };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return { downloaded: true as const, count: payload.personalStrategies.length };
}

export function downloadPersonalStrategiesExport(inventory: InventoryStrategy[]) {
  const payload = buildPersonalStrategiesExport(inventory);
  return downloadExport(
    payload,
    `allneeds-personal-strategies-${payload.exportedAt.replace(/:/g, '-')}.json`,
  );
}

export function downloadStrategyForNat(strategy: InventoryStrategy) {
  const payload = buildSingleStrategyExport(strategy);
  const safeTitle = strategy.title
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'strategy';
  return downloadExport(
    payload,
    `allneeds-strategy-${safeTitle}-${payload.exportedAt.replace(/:/g, '-')}.json`,
  );
}
