import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Rewind only the seven approved W-008 image/status/Port Map edits for old
// whole-catalog assertions. All unrelated current fields remain visible.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261005-008-prior-fields.json', import.meta.url)));
export const w008Slugs = new Set(Object.keys(fixture));
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeW008Product(current, slug) {
  if (!w008Slugs.has(slug)) return current;
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

export function beforeW008Raw(raw, slug) {
  if (!w008Slugs.has(slug)) return raw;
  return JSON.stringify(beforeW008Product(JSON.parse(raw), slug), null, 2) + '\n';
}
