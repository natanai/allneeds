import styles from './StrategySharingFields.module.css';

type StrategySharingFieldsProps = {
  signedIn: boolean;
};

export function StrategySharingFields({ signedIn }: StrategySharingFieldsProps) {
  return (
    <fieldset className={styles.group}>
      <legend>Sharing &amp; privacy</legend>

      <label className={styles.settingRow}>
        <span className={styles.settingCopy}>
          <strong>Share with Nat</strong>
          <small>
            Off is private. Turn this on to include the strategy when you choose “Share your strategies with Nat.” Nothing is sent or published automatically.
          </small>
        </span>
        <span className={styles.switch}>
          <input type="checkbox" name="share-with-nat" value="yes" aria-label="Include this strategy in exports to Nat" />
          <span className={styles.track} aria-hidden="true"><span /></span>
        </span>
      </label>

      <label className={`${styles.settingRow} ${!signedIn ? styles.unavailable : ''}`}>
        <span className={styles.settingCopy}>
          <strong>Bluesky visibility</strong>
          <small>{signedIn ? 'Controls who can see it if you save and sync it to your profile.' : 'Sign in with Bluesky to share a strategy through your profile.'}</small>
        </span>
        <select name="strategy-visibility" defaultValue="private" disabled={!signedIn} aria-label="Bluesky strategy visibility">
          <option value="private">Private</option>
          <option value="followers">Followers</option>
          <option value="public">Public</option>
        </select>
      </label>
    </fieldset>
  );
}
