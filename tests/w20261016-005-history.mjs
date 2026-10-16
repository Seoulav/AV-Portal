import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW20261016_006Product } from './w20261016-006-history.mjs';

// W-006's approved gallery/map spacing is first restored to the W-005
// published state. Then restore only W-005's three approved fields.
// Every other current product field remains visible to older assertions.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-005-prior-fields.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeW20261016_005Product(current, slug) {
  if (slug !== 'u-bridge-3') return current;
  const priorW006 = beforeW20261016_006Product(current, slug);
  for (const field of ['images', 'imageStatuses', 'portMap']) {
    if (sha(priorW006[field]) !== fixture.approved[field]) throw new Error(`u-bridge-3: unexpected W-005 ${field} change`);
  }
  const result = structuredClone(priorW006);
  for (const field of ['images', 'imageStatuses', 'portMap']) result[field] = structuredClone(fixture.prior[field]);
  return result;
}

export function beforeW20261016_005Raw(raw, slug) {
  if (slug !== 'u-bridge-3') return raw;
  return JSON.stringify(beforeW20261016_005Product(JSON.parse(raw), slug), null, 2) + '\n';
}
