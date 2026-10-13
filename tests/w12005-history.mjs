import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeUltritouchFollowupProduct, beforeUltritouchFollowupRaw } from './w12005-ultritouch-history.mjs';
import { beforeKiprogo2Mx395Product, beforeKiprogo2Mx395Raw } from './w12005-kiprogo2-mx395-history.mjs';
import { beforeW12006Product, beforeW12006Raw } from './w12006-history.mjs';
import { beforeW13008Product, beforeW13008Raw } from './w13008-surgex-history.mjs';

// Undo only approved W-005 Port Map changes for older whole-product hashes.
// All other fields of the current product remain visible to those assertions.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-prior-maps.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW12005Product(current, slug) {
  current = beforeW13008Product(current, slug);
  current = beforeW12006Product(current, slug);
  current = beforeKiprogo2Mx395Product(current, slug);
  current = beforeUltritouchFollowupProduct(current, slug);
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
  raw = beforeW13008Raw(raw, slug);
  raw = beforeW12006Raw(raw, slug);
  raw = beforeKiprogo2Mx395Raw(raw, slug);
  raw = beforeUltritouchFollowupRaw(raw, slug);
  if (!fixture[slug]) return raw;
  return JSON.stringify(beforeW12005Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeW12005Path(path, current) {
  const match = path.match(/^beta\/site\/detail\/data\/([^/]+)\.json$/);
  return match ? beforeW12005Product(current, match[1]) : current;
}
