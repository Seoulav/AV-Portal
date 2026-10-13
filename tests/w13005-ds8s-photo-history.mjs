import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const { fields } = JSON.parse(readFileSync(new URL('./fixtures/w13005-ds8s-photo-history.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// This inverse checks each approved field before restoring only that field.
// Every other current product field still reaches the older historical hashes.
export function beforeW13005PhotoProduct(current, slug) {
  if (slug !== 'ds-8s') return current;
  const result = structuredClone(current);
  for (const [field, { prior, approved }] of Object.entries(fields)) {
    if (digest(current[field]) !== approved) throw new Error(`ds-8s: unexpected photo ${field} change`);
    if (prior === null && field === 'keyFacts') delete result[field];
    else result[field] = structuredClone(prior);
  }
  return result;
}

export function beforeW13005PhotoRaw(raw, slug) {
  if (slug !== 'ds-8s') return raw;
  return JSON.stringify(beforeW13005PhotoProduct(JSON.parse(raw), slug), null, 2) + '\n';
}
