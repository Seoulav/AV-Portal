import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Historical assertions see the old Colorlight photo fields only. The current
// object supplies every other field, so unrelated changes remain detectable.
const records = JSON.parse(readFileSync(new URL('../Work/기록/W-20261006-002-prior-fields.json', import.meta.url), 'utf8'));
export const w06002NewSlugs = new Set(['aquilon-rs3', 'aquilon-rs4', 'aquilon-rs5', 'aquilon-rs6', 'aquilon-rsalpha']);
export const isW06002Name = name => w06002NewSlugs.has(String(name ?? '').replace(/\.json$/, ''));
export const beforeW06002Catalog = catalog => catalog.filter(item => !w06002NewSlugs.has(item.slug));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeW06002Product(current, slug) {
  const record = records[slug];
  if (!record) return current;
  for (const field of ['images', 'imageStatuses']) {
    if (sha(current[field]) !== record.approved[field]) throw new Error(`${slug}: unexpected W-002 ${field} change`);
  }
  return { ...structuredClone(current), images: structuredClone(record.prior.images), imageStatuses: structuredClone(record.prior.imageStatuses) };
}

export function beforeW06002Raw(raw, slug) {
  if (!records[slug]) return raw;
  return JSON.stringify(beforeW06002Product(JSON.parse(raw), slug), null, 2) + '\n';
}
