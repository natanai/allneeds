/** Build-time owner for reviewed Feeling entities. No legacy summary fallback. */
export function compileFeelingCatalog(records) {
  if (!records || typeof records !== 'object' || Array.isArray(records)) {
    throw new Error('The canonical Feeling catalog must be an object.');
  }
  const entries = Object.entries(records).sort(([, a], [, b]) => a.catalogOrder - b.catalogOrder);
  if (!entries.length) throw new Error('The canonical Feeling catalog is empty.');
  return entries.map(([slug, entry], order) => {
    const references = (value) => Array.isArray(value) && value.every((ref) =>
      typeof ref.slug === 'string' && typeof ref.title === 'string');
    if (entry.catalogOrder !== order || typeof entry.title !== 'string' || !entry.title.trim()
      || typeof entry.summary !== 'string' || !entry.summary.trim()
      || !['met', 'unmet', 'both'].includes(entry.needSatisfaction)
      || !Array.isArray(entry.bodySignals) || !entry.bodySignals.every((text) => typeof text === 'string')
      || !references(entry.needs) || !references(entry.fauxFeelings)
      || !Array.isArray(entry.sources) || !entry.sources.length
      || !entry.sources.every((source) => typeof source.description === 'string' && /^https:\/\//.test(source.url))) {
      throw new Error(`Canonical Feeling ${slug} has incomplete ownership or invalid catalogOrder.`);
    }
    return {
      slug,
      title: entry.title,
      summary: entry.summary,
      needSatisfaction: entry.needSatisfaction,
      bodySignals: entry.bodySignals,
      needs: entry.needs,
      fauxFeelings: entry.fauxFeelings,
      sources: entry.sources,
      ...(entry.poem ? { poem: entry.poem } : {}),
    };
  });
}
