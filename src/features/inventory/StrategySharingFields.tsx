import { useEffect, useRef, useState } from 'react';

import type { InventoryVisibility } from './inventoryRepository';
import { readInventory } from './inventoryRepository';
import {
  downloadStrategyForNat,
  personalStrategiesEmailHref,
} from './personalStrategiesExport';
import styles from './StrategySharingFields.module.css';

type StrategySharingFieldsProps = {
  signedIn: boolean;
};

function PrivacyIcon({ visibility }: { visibility: InventoryVisibility }) {
  if (visibility === 'public') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M4.5 9h15M4.5 15h15M12 4c2 2.1 3 4.8 3 8s-1 5.9-3 8M12 4c-2 2.1-3 4.8-3 8s1 5.9 3 8" />
      </svg>
    );
  }

  if (visibility === 'followers') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="9" r="3" />
        <path d="M3.8 18c.8-2.9 2.5-4.3 5.2-4.3s4.4 1.4 5.2 4.3" />
        <path d="M15 7.3a2.7 2.7 0 0 1 0 5.4M16.2 14.1c2 .5 3.2 1.8 3.8 3.9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function StrategySharingFields({ signedIn }: StrategySharingFieldsProps) {
  const [visibility, setVisibility] = useState<InventoryVisibility>('private');
  const [emailReady, setEmailReady] = useState(false);
  const visibilityRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!signedIn && visibility === 'followers') setVisibility('private');
  }, [signedIn, visibility]);

  useEffect(() => {
    const form = visibilityRef.current?.form;
    if (!form) return undefined;

    const handleFormData = () => {
      // `formdata` fires after this submission has captured the selected privacy.
      queueMicrotask(() => setVisibility('private'));
    };

    form.addEventListener('formdata', handleFormData);
    return () => form.removeEventListener('formdata', handleFormData);
  }, []);

  const shareCurrentStrategyWithNat = () => {
    const form = visibilityRef.current?.form;
    const saveButton = form?.querySelector<HTMLButtonElement>('button[name="save-target"][value="device"]');
    if (!form || !saveButton) return;

    setEmailReady(false);
    const existingIds = new Set(readInventory().map((strategy) => strategy.id));

    // Use the composer's real save path so required fields, duplicate handling,
    // persistence, and the selected Privacy state all remain canonical.
    saveButton.click();

    const savedStrategy = readInventory().find((strategy) => strategy.personal && !existingIds.has(strategy.id));
    if (!savedStrategy) return;

    const result = downloadStrategyForNat(savedStrategy);
    if (result.downloaded) setEmailReady(true);
  };

  return (
    <div className={styles.sharingRow}>
      <label className={styles.privacyRow}>
        <span className={styles.icon}><PrivacyIcon visibility={visibility} /></span>
        <span className={styles.label}>Privacy</span>
        <select
          ref={visibilityRef}
          name="strategy-visibility"
          value={visibility}
          aria-label="Strategy privacy"
          onChange={(event) => {
            setEmailReady(false);
            setVisibility(event.target.value as InventoryVisibility);
          }}
        >
          <option value="private">Private</option>
          <option value="followers" disabled={!signedIn}>Followers</option>
          <option value="public">Public</option>
        </select>
        <input type="hidden" name="share-with-nat" value="yes" disabled={visibility !== 'public'} />
      </label>

      <details className={styles.actionMenu}>
        <summary aria-label="More strategy actions" title="More strategy actions">
          <span aria-hidden="true">•••</span>
        </summary>
        <div className={styles.actionMenuPanel}>
          <button type="button" onClick={shareCurrentStrategyWithNat}>Share this strategy with Nat…</button>
          {emailReady ? <a href={personalStrategiesEmailHref()}>Start email to Nat</a> : null}
        </div>
      </details>
    </div>
  );
}
