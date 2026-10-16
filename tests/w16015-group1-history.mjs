import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Reverse only approved W-015 group 1 Port Map geometry. Other current
// product fields pass through to the old whole-product assertions.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-015-group1-prior-portmaps.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
export const w16015Group1Slugs = new Set(Object.keys(fixture));

export function beforeW16015Product(current, slug) {
  const record = fixture[slug];
  if (!record) return current;
  if (record.deferred) {
    if (hash(current.portMap) !== hash(record.prior)) throw Error(`${slug}: deferred W-015 map drift`);
    return current;
  }
  if (hash(current.portMap) === hash(record.prior)) return current;
  if (hash(current.portMap) !== record.approved) throw Error(`${slug}: unexpected W-015 portMap change`);
  const result = structuredClone(current);
  result.portMap = structuredClone(record.prior);
  return result;
}

export function beforeW16015Raw(raw, slug) {
  const current = JSON.parse(raw);
  const old = beforeW16015Product(current, slug);
  return old === current ? raw : JSON.stringify(old, null, 2) + '\n';
}
