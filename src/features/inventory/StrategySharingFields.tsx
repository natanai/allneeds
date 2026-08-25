import { useEffect, useRef } from 'react';

import styles from './StrategySharingFields.module.css';

type StrategySharingFieldsProps = {
  signedIn: boolean;
  firstName: string;
  location: string;
  onFirstNameChange: (value: string) => void;
  onLocationChange: (value: string) => void;
};

export function StrategySharingFields({
  signedIn,
  firstName,
  location,
  onFirstNameChange,
  onLocationChange,
}: StrategySharingFieldsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const shareWithNatRef = useRef<HTMLInputElement>(null);
  const visibilityRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const form = shareWithNatRef.current?.form;
    if (!form) return undefined;

    const handleFormData = () => {
      // `formdata` fires after the current FormData entry list has been built.
      // Reset only the per-submission privacy controls after capture; parent
      // draft state clears the optional attribution fields after a save.
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
      <summary aria-label="More strategy options" title="More strategy options">
        <span aria-hidden="true">•••</span>
      </summary>
      <fieldset className={styles.panel}>
        <legend>More strategy options</legend>

        <label className={styles.settingRow}>
          <span>First name</span>
          <input
            className={styles.compactInput}
            name="name"
            type="text"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            aria-label="First name, optional"
          />
        </label>

        <label className={styles.settingRow}>
          <span>Location</span>
          <input
            className={styles.compactInput}
            name="location"
            type="text"
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            aria-label="Location, optional"
          />
        </label>

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
