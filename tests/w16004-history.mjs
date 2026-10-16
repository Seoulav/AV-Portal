import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w16004-ultrix-history.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const brochureFile = 'manuals/ross-ultrix-family-brochure-ko.pdf';
const brochureTitle = 'Ross Video Ultrix 제품군 브로슈어(한국어 · 28쪽 · 사용자 제공)';
const slugs = new Set([
  'ultrix-ns-fr2', 'ultrix-hdx-io', 'ultriscape', 'ultrimix-mxr',
  'ultrimix-dante', 'ultrisync-18', 'ultripower', 'ultripower-ps',
  'ultritouch-2-hr',
]);

// Historical checks see today's object with only the W-004 specification/source
// changes reversed. Every other live field remains visible to those checks.
export function beforeW16004Product(current, slug) {
  const record = fixture.products[slug];
  if (!record) return current;
  const specSha = sha(current.specifications);
  const sourceSha = sha(current.sources);
  if (specSha === sha(record.priorSpecifications) && sourceSha === sha(record.priorSources)) return current;
  if (specSha !== record.approvedSpecificationsSha256 || sourceSha !== record.approvedSourcesSha256) {
    throw new Error(`${slug}: unexpected W-004 specifications or sources`);
  }
  const result = structuredClone(current);
  result.specifications = structuredClone(record.priorSpecifications);
  result.sources = structuredClone(record.priorSources);
  return result;
}

export function beforeW16004Raw(raw, slug) {
  const record = fixture.products[slug];
  if (!record) return raw;
  const current = JSON.parse(raw);
  const previous = beforeW16004Product(current, slug);
  if (previous === current) return raw;
  if (slug !== 'ultriscape') return JSON.stringify(previous, null, 2) + '\n';

  // Ultriscape's existing compact formatting is retained byte-for-byte. Only
  // the two inserted specification lines and the B source are removed.
  let restored = raw;
  for (const name of ['라이선스당 활성 멀티뷰어 헤드 수', '30RU 최대 멀티뷰어 헤드 수']) {
    const row = current.specifications.find(item => item.name === name);
    const line = `    ${JSON.stringify(row)},\n`;
    if (restored.split(line).length !== 2) throw new Error(`ultriscape: missing W-004 ${name} line`);
    restored = restored.replace(line, '');
  }
  const source = current.sources.find(item => item.code === 'B');
  const addition = `,\n    ${JSON.stringify(source)}`;
  if (restored.split(addition).length !== 2) throw new Error('ultriscape: missing W-004 B source');
  restored = restored.replace(addition, '');
  if (JSON.stringify(JSON.parse(restored)) !== JSON.stringify(previous)) throw new Error('ultriscape: inverse drift');
  return restored;
}

export function beforeW16004Uploads(uploads) {
  const added = uploads.filter(item => item.file === brochureFile);
  if (added.length === 0) return uploads;
  if (added.length !== slugs.size || new Set(added.map(item => item.slug)).size !== slugs.size) {
    throw new Error('unexpected W-004 upload count or membership');
  }
  for (const item of added) {
    if (!slugs.has(item.slug) || item.title !== brochureTitle || item.kind !== 'reference' || item.locked === true) {
      throw new Error(`unexpected W-004 upload for ${item.slug}`);
    }
  }
  return uploads.filter(item => item.file !== brochureFile);
}
