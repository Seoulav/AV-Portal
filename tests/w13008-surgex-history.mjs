import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w13008-surgex-history.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const slug = 'sx-1216-rti';

// Older whole-product assertions see the current, unapproved fields. Only
// reviewed SurgeX data and the marker layout are restored to their prior form.
export function beforeW13008Product(current, productSlug) {
  if (productSlug !== slug) return current;
  const result = structuredClone(current);
  for (const [field, { prior, approved }] of Object.entries(fixture.fields)) {
    const actual = digest(current[field]);
    if (actual === digest(prior)) continue;
    if (actual !== approved) throw new Error(`${slug}: unexpected W-008 ${field} change`);
    result[field] = structuredClone(prior);
  }
  return result;
}

export function beforeW13008Raw(raw, productSlug) {
  if (productSlug !== slug) return raw;
  return JSON.stringify(beforeW13008Product(JSON.parse(raw), productSlug), null, 2) + '\n';
}

const brochure = {
  slug,
  file: 'manuals/surgex-brochure-ko.pdf',
  kind: 'reference',
  title: 'SurgeX 브로슈어(국문 · 사용자 제공)',
};

export function withoutW13008Uploads(uploads) {
  const matches = uploads.filter(entry => entry.file === brochure.file);
  if (matches.length !== 1 || digest(matches[0]) !== digest(brochure))
    throw new Error('sx-1216-rti: unexpected SurgeX brochure upload');
  return uploads.filter(entry => entry.file !== brochure.file);
}

export const isW13008Manual = name => name === 'surgex-brochure-ko.pdf';
