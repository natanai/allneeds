import type { FormEventHandler } from 'react';

import { NeedCatalogPicker } from '../../components/forms/NeedCatalogPicker';
import type { NeedStrategyDraft } from '../../persistence/workflowDrafts';
import { StrategySharingFields } from './StrategySharingFields';
import styles from './StrategyForm.module.css';

type StrategyFormProps = {
  id: string;
  needsLabelId: string;
  titleInputId?: string;
  draft: NeedStrategyDraft;
  signedIn: boolean;
  onDraftChange: (draft: NeedStrategyDraft) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function StrategyForm({
  id,
  needsLabelId,
  titleInputId,
  draft,
  signedIn,
  onDraftChange,
  onSubmit,
}: StrategyFormProps) {
  const update = <Key extends keyof NeedStrategyDraft>(key: Key, value: NeedStrategyDraft[Key]) => {
    onDraftChange({ ...draft, [key]: value });
  };

  return (
    <form id={id} className={styles.form} onSubmit={onSubmit}>
      <label className={styles.formField}>
        <span>Strategy name</span>
        <span className={styles.inputCard}>
          <input id={titleInputId} name="title" type="text" value={draft.title} onChange={(event) => update('title', event.target.value)} required />
        </span>
      </label>
      <label className={styles.formField}>
        <span>How do you put it into practice?</span>
        <span className={styles.inputCard}>
          <textarea name="description" rows={4} value={draft.description} onChange={(event) => update('description', event.target.value)} required />
        </span>
      </label>
      <div className={`${styles.formField} ${styles.needsFormField}`}>
        <span id={needsLabelId}>Needs</span>
        <span className={styles.inputCard}>
          <NeedCatalogPicker labelId={needsLabelId} selectedNeeds={draft.selectedNeeds} onChange={(value) => update('selectedNeeds', value)} />
        </span>
      </div>
      <div className={styles.formRow}>
        <label className={styles.formField}>
          <span>First name (optional)</span>
          <span className={styles.inputCard}><input name="name" type="text" value={draft.firstName} onChange={(event) => update('firstName', event.target.value)} /></span>
        </label>
        <label className={styles.formField}>
          <span>Location (optional)</span>
          <span className={styles.inputCard}><input name="location" type="text" value={draft.location} onChange={(event) => update('location', event.target.value)} /></span>
        </label>
      </div>
      <StrategySharingFields signedIn={signedIn} />
      <div className={styles.formActions}>
        <button type="submit" name="save-target" value="device" className={`${styles.appAction} ${styles.primaryAction} ${styles.deviceAction}`}>Save to device</button>
        <button type="submit" name="save-target" value="profile" className={`${styles.appAction} ${styles.secondaryAction} ${styles.profileAction}`} disabled={!signedIn}>Save to profile</button>
      </div>
    </form>
  );
}
