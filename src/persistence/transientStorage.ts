export function isTransientLocalStorageKey(key: string) {
  return key === 'allneeds:bsky-session-hint'
    || key.startsWith('allneeds:shared-feed:');
}
