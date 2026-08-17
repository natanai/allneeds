import { Link } from 'react-router';

import styles from './HomePage.module.css';

export function HomePage() {
  const base = import.meta.env.BASE_URL;

  return (
    <main className={styles.page} role="main">
      <section className={styles.homeDoorways} aria-labelledby="doorways-title">
        <h1 id="doorways-title" className="visually-hidden">Choose a doorway</h1>
        <p className={styles.prompt}>Collect strategies for all your needs. Start with any door.</p>

        <div className={styles.doorGrid}>
          <div className={`${styles.doorCard} ${styles.observations}`}>
            <Link className={styles.doorLink} to="/observations">
              <span className={styles.door} aria-hidden="true">
                <img className={styles.doorIcon} src={`${base}icons/door-observations.svg`} alt="" />
              </span>
              <span className={styles.label}>Observations</span>
            </Link>
          </div>

          <div className={`${styles.doorCard} ${styles.feelings}`}>
            <Link className={styles.doorLink} to="/feelings">
              <span className={styles.door} aria-hidden="true">
                <img className={styles.doorIcon} src={`${base}icons/door-feelings.svg`} alt="" />
              </span>
              <span className={styles.label}>Feelings</span>
            </Link>
            <Link className={styles.support} to="/alexithymia-support">Alexithymia support</Link>
          </div>

          <div className={`${styles.doorCard} ${styles.needs}`}>
            <Link className={styles.doorLink} to="/needs">
              <span className={styles.door} aria-hidden="true">
                <img className={styles.doorIcon} src={`${base}icons/door-needs.svg`} alt="" />
              </span>
              <span className={styles.label}>Needs</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
