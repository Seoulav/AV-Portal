import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Rewind only the approved W-005 gallery and Port Map fields. All other
// current product fields remain visible to older whole-product assertions.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-005-prior-fields.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeW20261016_005Product(current, slug) {
  if (slug !== 'u-bridge-3') return current;
  for (const field of ['images', 'imageStatuses', 'portMap']) {
    if (sha(current[field]) !== fixture.approved[field]) throw new Error(`u-bridge-3: unexpected W-005 ${field} change`);
  }
  const result = structuredClone(current);
  for (const field of ['images', 'imageStatuses', 'portMap']) result[field] = structuredClone(fixture.prior[field]);
  return result;
}

export function beforeW20261016_005Raw(raw, slug) {
  if (slug !== 'u-bridge-3') return raw;
  return JSON.stringify(beforeW20261016_005Product(JSON.parse(raw), slug), null, 2) + '\n';
}
