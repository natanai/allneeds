import type { NeedEvidenceLens } from '../../domain/models';
import evidenceStyles from './NeedDetailPage.module.css';
import styles from './NeedFunctionLenses.module.css';

type NeedFunctionLensesProps = {
  lenses: NeedEvidenceLens[];
};

export function NeedFunctionLenses({ lenses }: NeedFunctionLensesProps) {
  if (!lenses.length) return null;

  return (
    <section className={styles.section} aria-labelledby="need-function-lenses-heading">
      <h2 id="need-function-lenses-heading" className={evidenceStyles.sectionTitle}>This need can involve</h2>
      <div className={styles.grid}>
        {lenses.map((lens) => (
          <article className={styles.card} key={lens.id}>
            <header className={styles.cardHeader}>
              <h3 className={styles.title}>{lens.title}</h3>
              {lens.recognitionCue ? <p className={styles.cue}>{lens.recognitionCue}</p> : null}
            </header>
            <p className={styles.summary}>{lens.summary}</p>

            {lens.narrative ? (
              <details className={evidenceStyles.details}>
                <summary className={evidenceStyles.detailsToggle}>
                  Details<span className="visually-hidden"> about {lens.title}</span>
                </summary>
                <div className={evidenceStyles.rewrite}>
                  {lens.narrative.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={`${lens.id}-paragraph-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ) : null}

            {lens.sources.length ? (
              <div className={`${styles.sourceGroup} ${evidenceStyles.sources}`}>
                <div className={styles.sourceSummary}>
                  <h4 className={styles.sourceLabel}>Supporting sources</h4>
                  <div className={evidenceStyles.citationRow} aria-label={`Supporting sources for ${lens.title}`}>
                    {lens.sources.map((source, index) => (
                      <span key={`${lens.id}-${source.url}-${index}`}>
                        [<a href={source.url} target="_blank" rel="noreferrer noopener" title={source.description}>{index + 1}</a>]
                      </span>
                    ))}
                  </div>
                </div>
                <details className={evidenceStyles.details}>
                  <summary className={evidenceStyles.detailsToggle}>Citations</summary>
                  <ol className={evidenceStyles.citationList}>
                    {lens.sources.map((source, index) => (
                      <li key={`${lens.id}-${source.url}-full-${index}`}>
                        <span className={evidenceStyles.citationNumber}>{index + 1}</span>
                        <div className={evidenceStyles.citationBody}>
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
