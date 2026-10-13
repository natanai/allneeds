export function isTransientLocalStorageKey(key: string) {
  return key === 'allneeds:profile-backup-status-v1'
    || key === 'allneeds:bsky-session-hint'
    || key === 'allneeds:home-screen-sign-in-v1'
    || key === 'allneeds:profile-recovery-v1'
    || key === 'nvc_rejected_emotions'
    || key.startsWith('allneeds:shared-feed:');
}
