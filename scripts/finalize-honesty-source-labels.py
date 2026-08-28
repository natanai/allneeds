from __future__ import annotations

from pathlib import Path

CATALOG_PATH = Path('src/data/editorialCatalog.json')
TEST_PATH = Path('src/data/honestyAudit.test.ts')

catalog_text = CATALOG_PATH.read_text(encoding='utf-8')
replacements = [
    (
        'Abeler, Nosenzo, and Raymond (2019), Preferences for Truth-Telling',
        'Abeler, J., Nosenzo, D., & Raymond, C. (2019). Preferences for Truth-Telling. Econometrica, 87(4), 1115–1153.',
    ),
    (
        'Henrich and Muthukrishna (2021), The Origins and Psychology of Human Cooperation',
        'Henrich, J., & Muthukrishna, M. (2021). The Origins and Psychology of Human Cooperation. Annual Review of Psychology, 72, 207–240.',
    ),
    (
        'Számadó et al. (2021), The language of cooperation: reputation and honest signalling',
        'Számadó, S., Balliet, D., Giardini, F., Power, E. A., & Takács, K. (2021). The language of cooperation: reputation and honest signalling. Philosophical Transactions of the Royal Society B, 376(1838), 20200286.',
    ),
    (
        'Bellucci and Park (2020), Honesty biases trustworthiness impressions',
        'Bellucci, G., & Park, S. Q. (2020). Honesty biases trustworthiness impressions. Journal of Experimental Psychology: General, 149(8), 1567–1586.',
    ),
    (
        'Cooper et al. (2023), Honest Behavior: Truth-Seeking, Belief-Speaking, and Fostering Understanding of the Truth in Others',
        'Cooper, B., Cohen, T. R., Huppert, E., Levine, E. E., & Fleeson, W. (2023). Honest Behavior: Truth-Seeking, Belief-Speaking, and Fostering Understanding of the Truth in Others. Academy of Management Annals, 17(2), 655–683.',
    ),
    (
        'Dougherty (2024), Honesty and the Truth: Against Subjectivism About Honesty',
        'Dougherty, M. (2024). Honesty and the Truth: Against Subjectivism About Honesty. The Journal of Value Inquiry.',
    ),
    (
        'Rogers et al. (2017), Artful paltering: The risks and rewards of using truthful statements to mislead others',
        'Rogers, T., Zeckhauser, R., Gino, F., Norton, M. I., & Schweitzer, M. E. (2017). Artful paltering: The risks and rewards of using truthful statements to mislead others. Journal of Personality and Social Psychology, 112(3), 456–473.',
    ),
]
for old, new in replacements:
    count = catalog_text.count(old)
    if count != 1:
        raise AssertionError(f'Expected one Honesty citation label {old!r}, found {count}')
    catalog_text = catalog_text.replace(old, new, 1)
CATALOG_PATH.write_text(catalog_text, encoding='utf-8')

test = TEST_PATH.read_text(encoding='utf-8')
old = """const approvedSourceUrls = [
  'https://onlinelibrary.wiley.com/doi/10.3982/ECTA14673',
  'https://www.annualreviews.org/content/journals/10.1146/annurev-psych-081920-042106',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC8487738/',
  'https://pubmed.ncbi.nlm.nih.gov/31916837/',
  'https://journals.aom.org/doi/abs/10.5465/annals.2021.0209',
  'https://link.springer.com/article/10.1007/s10790-024-09990-9',
  'https://pubmed.ncbi.nlm.nih.gov/27936834/',
];
"""
new = """const approvedSources = [
  {
    url: 'https://onlinelibrary.wiley.com/doi/10.3982/ECTA14673',
    description: 'Abeler, J., Nosenzo, D., & Raymond, C. (2019). Preferences for Truth-Telling. Econometrica, 87(4), 1115–1153.',
  },
  {
    url: 'https://www.annualreviews.org/content/journals/10.1146/annurev-psych-081920-042106',
    description: 'Henrich, J., & Muthukrishna, M. (2021). The Origins and Psychology of Human Cooperation. Annual Review of Psychology, 72, 207–240.',
  },
  {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8487738/',
    description: 'Számadó, S., Balliet, D., Giardini, F., Power, E. A., & Takács, K. (2021). The language of cooperation: reputation and honest signalling. Philosophical Transactions of the Royal Society B, 376(1838), 20200286.',
  },
  {
    url: 'https://pubmed.ncbi.nlm.nih.gov/31916837/',
    description: 'Bellucci, G., & Park, S. Q. (2020). Honesty biases trustworthiness impressions. Journal of Experimental Psychology: General, 149(8), 1567–1586.',
  },
  {
    url: 'https://journals.aom.org/doi/abs/10.5465/annals.2021.0209',
    description: 'Cooper, B., Cohen, T. R., Huppert, E., Levine, E. E., & Fleeson, W. (2023). Honest Behavior: Truth-Seeking, Belief-Speaking, and Fostering Understanding of the Truth in Others. Academy of Management Annals, 17(2), 655–683.',
  },
  {
    url: 'https://link.springer.com/article/10.1007/s10790-024-09990-9',
    description: 'Dougherty, M. (2024). Honesty and the Truth: Against Subjectivism About Honesty. The Journal of Value Inquiry.',
  },
  {
    url: 'https://pubmed.ncbi.nlm.nih.gov/27936834/',
    description: 'Rogers, T., Zeckhauser, R., Gino, F., Norton, M. I., & Schweitzer, M. E. (2017). Artful paltering: The risks and rewards of using truthful statements to mislead others. Journal of Personality and Social Psychology, 112(3), 456–473.',
  },
];
"""
if test.count(old) != 1:
    raise AssertionError('Expected approvedSourceUrls block exactly once')
test = test.replace(old, new, 1)
old_expect = "    expect(honesty?.evidence?.sources.map((source) => source.url)).toEqual(approvedSourceUrls);\n"
new_expect = """    expect(honesty?.evidence?.sources.map((source) => ({
      url: source.url,
      description: source.description,
    }))).toEqual(approvedSources);
"""
if test.count(old_expect) != 1:
    raise AssertionError('Expected source URL assertion exactly once')
test = test.replace(old_expect, new_expect, 1)
TEST_PATH.write_text(test, encoding='utf-8')

print('Honesty public citation labels updated to approved full citations without reformatting the catalog.')
