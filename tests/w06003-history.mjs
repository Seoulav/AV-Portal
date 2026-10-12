import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261006-003-prior-lan.json', import.meta.url), 'utf8'));
const hash = row => createHash('sha256').update(JSON.stringify(row)).digest('hex');

// Undo only the approved LAN row for older whole-product assertions. All other
// current rows and fields pass through, so an unrelated regression stays visible.
export function beforeW06003Product(current, slug) {
  const record = fixture[slug];
  if (!record) return current;
  const indices = current.io.flatMap((row, index) => row.connector === 'LAN RJ-45' ? [index] : []);
  if (indices.length !== 1 || hash(current.io[indices[0]]) !== record.approvedHash) {
    throw new Error(`${slug}: unexpected W-003 LAN row change`);
  }
  const result = structuredClone(current);
  result.io[indices[0]] = structuredClone(record.prior);
  return result;
}

export function beforeW06003Raw(raw, slug) {
  if (!fixture[slug]) return raw;
  return JSON.stringify(beforeW06003Product(JSON.parse(raw), slug), null, 2) + '\n';
}
