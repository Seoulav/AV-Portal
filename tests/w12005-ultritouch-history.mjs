import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const record = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-ultritouch-prior.json', import.meta.url), 'utf8'));
const fields = ['images', 'imageStatuses', 'portMap'];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Restore only the approved follow-up fields for historical whole-product checks.
// All other current fields pass through to the original assertions.
export function beforeUltritouchFollowupProduct(current, slug) {
  if (slug !== record.slug) return current;
  const currentHashes = fields.map(field => hash(current[field]));
  const priorHashes = fields.map(field => hash(record.prior[field]));
  if (currentHashes.every((value, index) => value === priorHashes[index])) return current;
  if (!currentHashes.every((value, index) => value === record.approvedSha256[fields[index]])) {
    throw new Error(`${slug}: unexpected Ultritouch follow-up field change`);
  }
  const restored = structuredClone(current);
  for (const field of fields) restored[field] = structuredClone(record.prior[field]);
  return restored;
}

export function beforeUltritouchFollowupRaw(raw, slug) {
  if (slug !== record.slug) return raw;
  return JSON.stringify(beforeUltritouchFollowupProduct(JSON.parse(raw), slug), null, 2) + '\n';
}

// A single approved image replacement is checked against its current bytes
// before returning the old digest to historical asset assertions.
export function beforeUltritouchFollowupImageSha(actualSha, file) {
  if (file !== 'ultritouch-2-hr-rear.webp') return actualSha;
  if (actualSha === record.priorImageSha256) return actualSha;
  if (actualSha !== record.approvedImageSha256) throw new Error(`${file}: unexpected image bytes`);
  return record.priorImageSha256;
}
