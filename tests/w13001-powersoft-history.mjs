import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW013A3Product } from './w013-a3-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w13001-powersoft-history.json', import.meta.url), 'utf8'));
const b2Fixture = JSON.parse(readFileSync(new URL('./fixtures/w013-b2-product-history.json', import.meta.url), 'utf8'));
const imageFixture = JSON.parse(readFileSync(new URL('./fixtures/w13001-powersoft-image-history.json', import.meta.url), 'utf8'));
export const w13001Slugs = new Set(Object.keys(fixture));
const digest = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// Historical assertions receive the current product. Only the fields approved
// for W-20261013-001 are restored, and those fields must match this work's
// reviewed result. Other fields remain current and reach the older assertions.
export function beforeW13001Product(current, slug) {
  const fields = fixture[slug];
  if (!fields) return current;
  current = beforeW013A3Product(current, slug);
  const result = structuredClone(current);
  for (const [field, { prior, approved }] of Object.entries(fields)) {
    if (digest(current[field]) === digest(prior)) continue;
    // Some historical assertions invoke the older B2 inverse first.
    if (field === 'io' && b2Fixture[slug] && digest(current.io) === digest(b2Fixture[slug].priorIo)) continue;
    if (digest(current[field]) !== approved) throw new Error(`${slug}: unexpected W-001 ${field} change`);
    if (prior === null && field === 'portMap') delete result[field];
    else result[field] = structuredClone(prior);
  }
  return result;
}

export function beforeW13001Raw(raw, slug) {
  if (!w13001Slugs.has(slug)) return raw;
  return JSON.stringify(beforeW13001Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeW13001ImageSha(currentSha, file) {
  const record = imageFixture[file];
  if (!record) return currentSha;
  if (currentSha !== record.approved) throw new Error(`${file}: unexpected W-001 image change`);
  return record.prior;
}
