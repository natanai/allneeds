import type { NeedEvidenceLens } from '../../domain/models';
import styles from './NeedFunctionLenses.module.css';

type NeedFunctionLensesProps = {
  lenses: NeedEvidenceLens[];
};

export function NeedFunctionLenses({ lenses }: NeedFunctionLensesProps) {
  if (!lenses.length) return null;

  return (
    <section className={styles.section} aria-labelledby="need-function-lenses-heading">
      <h2 id="need-function-lenses-heading" className={styles.heading}>This need can involve</h2>
      <div className={styles.grid}>
        {lenses.map((lens) => (
          <article className={styles.card} key={lens.id}>
            <header className={styles.cardHeader}>
              <h3 className={styles.title}>{lens.title}</h3>
              {lens.recognitionCue ? <p className={styles.cue}>{lens.recognitionCue}</p> : null}
            </header>
            <p className={styles.summary}>{lens.summary}</p>

            {lens.narrative ? (
              <details className={styles.details}>
                <summary className={styles.toggle}>
                  Details<span className="visually-hidden"> about {lens.title}</span>
                </summary>
                <div className={styles.narrative}>
                  {lens.narrative.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={`${lens.id}-paragraph-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ) : null}

            {lens.sources.length ? (
              <div className={styles.sources}>
                <div className={styles.sourceSummary}>
                  <span className={styles.sourceLabel}>Supporting sources</span>
                  <div className={styles.citationRow} aria-label={`Supporting sources for ${lens.title}`}>
                    {lens.sources.map((source, index) => (
                      <span key={`${lens.id}-${source.url}-${index}`}>
                        [<a href={source.url} target="_blank" rel="noreferrer noopener" title={source.description}>{index + 1}</a>]
                      </span>
                    ))}
                  </div>
                </div>
                <details className={styles.details}>
                  <summary className={styles.toggle}>Citations</summary>
                  <ol className={styles.citationList}>
                    {lens.sources.map((source, index) => (
                      <li key={`${lens.id}-${source.url}-full-${index}`}>
                        <span className={styles.citationNumber}>{index + 1}</span>
                        <div className={styles.citationBody}>
                          {source.description ? <span>{source.description}</span> : null}
                          <a href={source.url} target="_blank" rel="noreferrer noopener">{source.url}</a>
                        </div>
                      </li>
                    ))}
                  </ol>
                </details>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
