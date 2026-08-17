import { Link } from 'react-router';

import styles from './HomePage.module.css';

const doorways = [
  {
    to: '/observations',
    title: 'Observations',
    detail: 'Start with what happened.',
    tone: 'observations',
  },
  {
    to: '/feelings',
    title: 'Feelings',
    detail: 'Find language for what is here.',
    tone: 'feelings',
  },
  {
    to: '/needs',
    title: 'Needs',
    detail: 'Notice what matters underneath.',
    tone: 'needs',
  },
] as const;

export function HomePage() {
  return (
    <section className={styles.page} aria-labelledby="home-title">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>A calmer way in</p>
        <h1 id="home-title">Choose a doorway.</h1>
        <p>
          Notice what happened, find language for what you feel, or explore the human needs that may be asking for attention.
        </p>
      </div>

      <div className={styles.doorGrid} aria-label="Starting points">
        {doorways.map((doorway) => (
          <Link
            key={doorway.to}
            to={doorway.to}
            className={`${styles.doorCard} ${styles[doorway.tone]}`}
          >
            <span className={styles.doorShape} aria-hidden="true">
              <span className={styles.doorKnob} />
            </span>
            <span className={styles.doorTitle}>{doorway.title}</span>
            <span className={styles.doorDetail}>{doorway.detail}</span>
          </Link>
        ))}
      </div>

      <aside className={styles.support} aria-labelledby="support-title">
        <div>
          <p className={styles.eyebrow}>Not sure where to begin?</p>
          <h2 id="support-title">You do not have to name a feeling first.</h2>
          <p>Alexithymia support will offer a slower route through body cues, energy, and possible words.</p>
        </div>
        <Link className={styles.supportLink} to="/alexithymia-support">
          Open guided support
        </Link>
      </aside>
    </section>
  );
}
