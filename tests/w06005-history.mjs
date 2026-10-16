import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW20261016_015B4Product } from './w20261016-015-b4-history.mjs';

const approved = JSON.parse(readFileSync(new URL('../Work/기록/W-20261006-005-approved-maps.json', import.meta.url)));
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// Older whole-product checks should see only the approved W-005 addition undone.
// All current fields except portMap pass through unchanged.
export function beforeW06005Product(current, slug) {
  current = beforeW20261016_015B4Product(current,slug,{allowHistorical:true});
  if (!(slug in approved)) return current;
  if (hash(current.portMap) !== approved[slug].mapSha) throw new Error(`${slug}: unexpected W-005 portMap change`);
  const result = structuredClone(current);
  delete result.portMap;
  return result;
}

export function beforeW06005Raw(raw, slug) {
  if (!(slug in approved)) return raw;
  return JSON.stringify(beforeW06005Product(JSON.parse(raw), slug), null, 2) + '\n';
}
