import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Undo only approved W-005 Port Map changes for older whole-product hashes.
// All other fields of the current product remain visible to those assertions.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-prior-maps.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW12005Product(current, slug) {
  const record = fixture[slug];
  if (!record) return current;
  const actual = hash(current.portMap);
  if (actual === hash(record.prior)) return current;
  if (actual !== record.approvedSha256) throw new Error(`${slug}: unexpected W-005 Port Map change`);
  const result = structuredClone(current);
  result.portMap = structuredClone(record.prior);
  return result;
}

export function beforeW12005Raw(raw, slug) {
  if (!fixture[slug]) return raw;
  return JSON.stringify(beforeW12005Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeW12005Path(path, current) {
  const match = path.match(/^beta\/site\/detail\/data\/([^/]+)\.json$/);
  return match ? beforeW12005Product(current, match[1]) : current;
}
