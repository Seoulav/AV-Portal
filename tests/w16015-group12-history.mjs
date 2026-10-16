import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Rewind only the nine approved Epson Port Map geometry changes. All other
// current product fields pass through to earlier whole-product assertions.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-015-group1-2-prior-portmaps.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
export const w16015Group12Slugs = new Set(Object.keys(fixture));

export function beforeW16015Group12Product(current, slug) {
  const record = fixture[slug];
  if (!record) return current;
  if (hash(current.portMap) === hash(record.prior)) return current;
  if (hash(current.portMap) !== record.approved) throw Error(`${slug}: unexpected W-015 group-1-2 portMap change`);
  const result = structuredClone(current);
  result.portMap = structuredClone(record.prior);
  return result;
}

export function beforeW16015Group12Raw(raw, slug) {
  if (!fixture[slug]) return raw;
  const current = JSON.parse(raw);
  const prior = beforeW16015Group12Product(current, slug);
  return prior === current ? raw : JSON.stringify(prior, null, 2) + String.fromCharCode(10);
}
