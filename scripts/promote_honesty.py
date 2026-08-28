from pathlib import Path

ICON = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20.2S3.6 15.1 3.6 9.3A4.65 4.65 0 0 1 12 6.5a4.65 4.65 0 0 1 8.4 2.8c0 .7-.13 1.38-.37 2.04"/>
  <path d="M14.9 10.2h4.5M15.5 12.8h5M14.9 15.4h4.5"/>
</svg>
'''

ART = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round">
  <path d="M0 33h18c7 0 10-2 13-8" stroke-width="3.2" opacity=".42"/>
  <path d="M31 25c4 0 7-4 10-8l4-5c2-3 5-4 9-4" stroke-width="2" opacity=".17"/>
  <path d="m53 5 6 6M59 5l-6 6" stroke-width="1.8" opacity=".17"/>
  <path d="M31 25c5 0 9-1 13-1h9" stroke-width="4" opacity=".56"/>
  <path d="m49 20 5 4-5 4" stroke-width="2.2" opacity=".56"/>
</svg>
'''

HONESTY_CSS = '''
/* Approved Need identity: Honesty · Heart to Honesty.
   The heart-and-voice glyph stays primary while a corrected route resolves
   before the label so Honesty itself reads as the destination. */
.boardWrapper :global([data-magnet-id='needs-honesty']) {
  --magnet-icon: url('/icons/needs/honesty.svg');
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--quiet) 82%, var(--selection) 18%),
    color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%)
  );
}

.boardWrapper :global([data-magnet-id='needs-honesty'])::before {
  position: relative;
  z-index: 2;
  background: color-mix(in srgb, var(--primary) 72%, var(--text) 28%);
}

.boardWrapper :global([data-magnet-id='needs-honesty'])::after {
  content: '';
  position: absolute;
  z-index: 0;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    110deg,
    color-mix(in srgb, var(--primary) 72%, var(--text) 28%),
    color-mix(in srgb, var(--action) 62%, var(--text) 38%)
  );
  opacity: 0.29;
  mask: url('/icons/needs/art/honesty-corrected-destination.svg') left center / 100% 100% no-repeat;
  -webkit-mask: url('/icons/needs/art/honesty-corrected-destination.svg') left center / 100% 100% no-repeat;
  pointer-events: none;
}

'''

Path('public/icons/needs/honesty.svg').write_text(ICON, encoding='utf-8')
Path('public/icons/needs/art/honesty-corrected-destination.svg').write_text(ART, encoding='utf-8')

css_path = Path('src/features/needs/NeedsPage.module.css')
css = css_path.read_text(encoding='utf-8')
assert "[data-magnet-id='needs-honesty']" not in css
marker = '.empty {'
assert marker in css
css_path.write_text(css.replace(marker, HONESTY_CSS + marker, 1), encoding='utf-8')

identity_test = Path('src/features/needs/NeedMagnetIdentity.test.ts')
text = identity_test.read_text(encoding='utf-8')
anchor = "  it('uses only functional Customizer roles in approved Need identity CSS', () => {"
assert anchor in text
honesty_identity_test = '''  it('ships Honesty with the approved Heart to Honesty identity', () => {
    expect(needsCss).toContain("[data-magnet-id='needs-honesty']");
    expect(needsCss).toContain("url('/icons/needs/honesty.svg')");
    expect(needsCss).toContain("url('/icons/needs/art/honesty-corrected-destination.svg')");
    expect(needsCss).toContain('color-mix(in srgb, var(--quiet) 82%, var(--selection) 18%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--primary) 72%, var(--text) 28%)');
    expect(needsCss).toContain('color-mix(in srgb, var(--action) 62%, var(--text) 38%)');
    expect(needsCss).toContain('opacity: 0.29;');
  });

'''
identity_test.write_text(text.replace(anchor, honesty_identity_test + anchor, 1), encoding='utf-8')

asset_test = Path('src/features/needs/needMagnetIdentityAssets.test.ts')
text = asset_test.read_text(encoding='utf-8')
insert_at = text.rfind('\n});')
assert insert_at != -1
honesty_asset_test = '''

  it('promotes Honesty · Heart to Honesty with its unique heart-and-voice icon and corrected destination art', () => {
    const css = readFileSync(new URL('./NeedsPage.module.css', import.meta.url), 'utf8');
    const icon = readFileSync(new URL('../../../public/icons/needs/honesty.svg', import.meta.url), 'utf8');
    const art = readFileSync(
      new URL('../../../public/icons/needs/art/honesty-corrected-destination.svg', import.meta.url),
      'utf8',
    );

    expect(css).toContain("[data-magnet-id='needs-honesty']");
    expect(css).toContain("url('/icons/needs/honesty.svg')");
    expect(css).toContain("url('/icons/needs/art/honesty-corrected-destination.svg')");
    expect(icon).toContain('M12 20.2S3.6 15.1');
    expect(icon).toContain('M14.9 10.2h4.5');
    expect(art).toContain('viewBox="0 0 160 48"');
    expect(art).toContain('m49 20 5 4-5 4');
  });
'''
asset_test.write_text(text[:insert_at] + honesty_asset_test + text[insert_at:], encoding='utf-8')

candidates = Path('src/features/designLab/needMagnetAuditCandidates.ts')
text = candidates.read_text(encoding='utf-8')
start = text.index('export const needMagnetAuditCandidates')
prefix = text[:start]
candidates.write_text(
    prefix + 'export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [];\n',
    encoding='utf-8',
)

Path('src/features/designLab/needMagnetAuditCandidates.test.ts').write_text(
    """import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('removes approved Honesty candidates from the active review surface', () => {
    expect(needMagnetAuditCandidates).toEqual([]);
  });
});
""",
    encoding='utf-8',
)

for path in Path('public/design-lab/need-magnets').glob('honesty-*.svg'):
    path.unlink()

design = Path('docs/design-language.md')
text = design.read_text(encoding='utf-8')
marker = '\n## Magnet physics'
assert marker in text
assert 'Honesty · Heart to Honesty (H1) is approved' not in text
bullet = "\n- **Honesty · Heart to Honesty (H1) is approved.** It uses one Honesty-specific heart-and-voice icon, with a corrected-path field behind it. A faint abandoned route ends before the label area while the stronger route resolves toward the `Honesty` label, making the Need itself read as the destination rather than something being crossed through. The face blends `Quiet`/`Selection` into `Selection`/`Quiet`; the icon derives from `Primary`/`Text`; and the corrected-path art fades from `Primary`/`Text` toward `Action`/`Text`. Canonical production references are `src/features/needs/NeedsPage.module.css`, `public/icons/needs/honesty.svg`, and `public/icons/needs/art/honesty-corrected-destination.svg`.\n"
design.write_text(text.replace(marker, bullet + marker, 1), encoding='utf-8')

audit = Path('docs/honesty-content-audit.md')
text = audit.read_text(encoding='utf-8')
old_status = '> Status: content approved and implemented 2026-08-27. Honesty is not fully audited until its redesigned magnet is separately approved and live.'
new_status = '> Status: content and magnet approved, implemented, and live 2026-08-27. Honesty is fully audited.'
assert old_status in text
text = text.replace(old_status, new_status, 1)
old_visual = "## Visual audit\n\nContent approval does not approve the Honesty magnet. Honesty remains pending visual review in `/design-lab/need-magnets`; it becomes fully audited only after an approved redesigned magnet is live.\n"
new_visual = """## Visual audit

Approved and promoted: **H1 · Heart to Honesty**.

The production magnet uses one Honesty-specific heart-and-voice icon with a corrected-path full-face field. A faint abandoned route ends before the label area, while the stronger corrected route resolves toward the `Honesty` label so the Need itself reads as the destination rather than something being struck through.

Production assets:
- `public/icons/needs/honesty.svg`
- `public/icons/needs/art/honesty-corrected-destination.svg`

Honesty is now fully audited.
"""
assert old_visual in text
audit.write_text(text.replace(old_visual, new_visual, 1), encoding='utf-8')
