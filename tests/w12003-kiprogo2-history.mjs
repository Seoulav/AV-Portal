import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Undo only W-003's one approved Port Map. Every other current product field
// remains visible to the older whole-product hash assertions.
const record = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-003-prior-map.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW12003Product(current, slug) {
  if (slug !== 'ki-pro-go2') return current;
  if (hash(current.portMap) !== record.approvedSha256) throw new Error(`${slug}: unexpected W-003 portMap`);
  const result = structuredClone(current);
  result.portMap = structuredClone(record.prior);
  return result;
}

export function beforeW12003Raw(raw, slug) {
  if (slug !== 'ki-pro-go2') return raw;
  return JSON.stringify(beforeW12003Product(JSON.parse(raw), slug), null, 2) + '\n';
}
