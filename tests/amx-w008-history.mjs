import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Restore only the W-008 image, image-status, and Port Map fields for older
// whole-product assertions. Every other current product field passes through.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261005-008-prior-fields.json', import.meta.url)));
export const amxW008Slugs = new Set(Object.keys(fixture));
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeAmxW008Product(current, slug) {
  if (!amxW008Slugs.has(slug)) return current;
  const { prior, approved } = fixture[slug];
  for (const field of ['images', 'imageStatuses', 'portMap']) {
    if (hash(current[field]) !== approved[field]) throw new Error(`${slug}: unexpected W-008 ${field} change`);
  }
  const result = structuredClone(current);
  result.images = structuredClone(prior.images);
  result.imageStatuses = structuredClone(prior.imageStatuses);
  if (prior.portMap === null) delete result.portMap;
  else result.portMap = structuredClone(prior.portMap);
  return result;
}

export function beforeAmxW008Raw(raw, slug) {
  if (!amxW008Slugs.has(slug)) return raw;
  return JSON.stringify(beforeAmxW008Product(JSON.parse(raw), slug), null, 2) + '\n';
}
