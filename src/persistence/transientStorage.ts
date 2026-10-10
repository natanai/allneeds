export function isTransientLocalStorageKey(key: string) {
  return key === 'allneeds:bsky-session-hint'
    || key === 'nvc_rejected_emotions'
    || key.startsWith('allneeds:shared-feed:');
}
