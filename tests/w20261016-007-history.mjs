import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('../Work/\uAE30\uB85D/W-20261016-007-prior-fields.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// Restore only W-007's approved bracket coordinates. The current product's
// other fields still flow into the W-006/W-005 historical assertions.
export function beforeW20261016_007Product(current, slug) {
  if (slug !== 'u-bridge-3') return current;
  if (sha(current.portMap) !== fixture.approved.portMap) throw new Error('u-bridge-3: unexpected W-007 portMap change');
  const result = structuredClone(current);
  result.portMap = structuredClone(fixture.prior.portMap);
  return result;
}

export function beforeW20261016_007Raw(raw, slug) {
  if (slug !== 'u-bridge-3') return raw;
  return JSON.stringify(beforeW20261016_007Product(JSON.parse(raw), slug), null, 2) + '\n';
}
