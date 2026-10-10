import { Link } from 'react-router';

import { assetPath } from '../../data/catalog';
import styles from './HomePage.module.css';

const doorways = [
  { to: '/observations', label: 'Observations', tone: 'observations', icon: 'icons/door-observations.svg' },
  { to: '/feelings', label: 'Feelings', tone: 'feelings', icon: 'icons/door-feelings.svg' },
  { to: '/needs', label: 'Needs', tone: 'needs', icon: 'icons/door-needs.svg' },
] as const;

export function HomePage() {
  return (
    <section className={styles.page} aria-labelledby="doorways-title">
      <h1 id="doorways-title" className="visually-hidden">Choose a doorway</h1>
      <p className={styles.prompt}>Collect strategies for all your needs. Start with any door.</p>

      <div className={styles.doorGrid}>
        {doorways.map((doorway) => (
          <div key={doorway.to} className={`${styles.doorCard} ${styles[doorway.tone]}`}>
            <Link className={styles.doorLink} to={doorway.to}>
              <span className={styles.door} aria-hidden="true">
                <img className={styles.icon} src={assetPath(doorway.icon)} alt="" />
              </span>
              <span className={styles.label}>{doorway.label}</span>
            </Link>
            {doorway.tone === 'feelings' ? (
              <Link className={styles.support} to="/alexithymia-support">Feeling word support</Link>
            ) : null}
          </div>
        ))}
      </div>

      <p className={styles.mobileSupport}>
        <Link to="/alexithymia-support">Feeling word support</Link>
      </p>
    </section>
  );
}
