import { useEffect, useRef } from 'react';

import styles from './StrategySharingFields.module.css';

type StrategySharingFieldsProps = {
  signedIn: boolean;
};

export function StrategySharingFields({ signedIn }: StrategySharingFieldsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const shareWithNatRef = useRef<HTMLInputElement>(null);
  const visibilityRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const form = shareWithNatRef.current?.form;
    if (!form) return undefined;

    const handleFormData = () => {
      // `formdata` fires after the current FormData entry list has been built.
      // Reset the controls only after this submission has captured its values.
      queueMicrotask(() => {
        if (shareWithNatRef.current) shareWithNatRef.current.checked = false;
        if (visibilityRef.current) visibilityRef.current.value = 'private';
        if (detailsRef.current) detailsRef.current.open = false;
      });
    };

    form.addEventListener('formdata', handleFormData);
    return () => form.removeEventListener('formdata', handleFormData);
  }, []);

  return (
    <details ref={detailsRef} className={styles.menu}>
      <summary aria-label="Sharing and privacy options" title="Sharing and privacy">
        <span aria-hidden="true">•••</span>
      </summary>
      <fieldset className={styles.panel}>
        <legend>Sharing &amp; privacy</legend>

        <label className={styles.settingRow}>
          <span>Share with Nat</span>
          <span className={styles.switch}>
            <input ref={shareWithNatRef} type="checkbox" name="share-with-nat" value="yes" aria-label="Include this strategy in exports to Nat" />
            <span className={styles.track} aria-hidden="true"><span /></span>
          </span>
        </label>

        <label className={`${styles.settingRow} ${!signedIn ? styles.unavailable : ''}`}>
          <span>Bluesky</span>
          <select ref={visibilityRef} name="strategy-visibility" defaultValue="private" disabled={!signedIn} aria-label="Bluesky strategy visibility">
            <option value="private">Private</option>
            <option value="followers">Followers</option>
            <option value="public">Public</option>
          </select>
        </label>
      </fieldset>
    </details>
  );
}
