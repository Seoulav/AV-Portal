import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-006-prior-fields.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// Restore only W-006's approved gallery and map changes. All other current
// fields continue into older whole-product assertions.
export function beforeW20261016_006Product(current, slug) {
  if (slug !== 'u-bridge-3') return current;
  for (const field of ['images', 'portMap']) {
    if (sha(current[field]) !== fixture.approved[field]) throw new Error(`u-bridge-3: unexpected W-006 ${field} change`);
  }
  const result = structuredClone(current);
  for (const field of ['images', 'portMap']) result[field] = structuredClone(fixture.prior[field]);
  return result;
}

export function beforeW20261016_006Raw(raw, slug) {
  if (slug !== 'u-bridge-3') return raw;
  return JSON.stringify(beforeW20261016_006Product(JSON.parse(raw), slug), null, 2) + '\n';
}
