import type { SharedFeedStrategy } from '../../app/appResources';

const BACKEND_API_URL = 'https://backend.allneeds.app/api';

async function moderate(strategyId: string | number, action: 'hide' | 'restore') {
  const response = await fetch(
    `${BACKEND_API_URL}/admin/strategies/${encodeURIComponent(String(strategyId))}/${action}`,
    { method: 'POST', credentials: 'include', cache: 'no-store' },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
    throw new Error(action === 'hide'
      ? 'Unable to hide this strategy from the community.'
      : 'Unable to restore this strategy to the community.');
  }
  return data;
}

export async function loadHiddenSharedStrategies() {
  const response = await fetch(`${BACKEND_API_URL}/admin/strategies?moderation=hidden`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== 'object' || (data as { status?: string }).status !== 'ok') {
    throw new Error('Unable to load hidden community strategies.');
  }
  const strategies = (data as { strategies?: unknown }).strategies;
  return Array.isArray(strategies) ? strategies as SharedFeedStrategy[] : [];
}

export function hideSharedStrategy(strategyId: string | number) {
  return moderate(strategyId, 'hide');
}

export function restoreSharedStrategy(strategyId: string | number) {
  return moderate(strategyId, 'restore');
}
