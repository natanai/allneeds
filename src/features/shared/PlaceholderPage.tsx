import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <section className={styles.page} aria-labelledby="placeholder-title">
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="placeholder-title">{title}</h1>
      <p>{description}</p>
      <div className={styles.note} role="note">
        <strong>V2 foundation</strong>
        <span>This route is intentionally reserved before its feature is migrated.</span>
      </div>
    </section>
  );
}
