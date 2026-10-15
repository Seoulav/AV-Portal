import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW12003Product } from './w12003-kiprogo2-history.mjs';
import { beforeMx392Ulxd4qFollowupProduct, beforeMx392Ulxd4qFollowupRaw } from './mx392-ulxd4q-followup-history.mjs';
import { beforeW20261015_005Product } from './w20261015-005-history.mjs';

// Restore only Port Map coordinates for assertions pinned to the pre-W-001 data.
const records = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-001-prior-coords.json', import.meta.url), 'utf8'));
const fields = ['x1', 'x2', 'y', 'y1', 'y2', 'x'];
const coordinates = product => (product.portMap?.items ?? []).map(item =>
  Object.fromEntries([['n', item.n], ...fields.filter(field => Object.hasOwn(item, field)).map(field => [field, item[field]])]));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW12001Product(current, slug) {
  current = beforeW20261015_005Product(current, slug);
  const record = records[slug];
  if (!record) return current;
  // MX392/ULXD4Q followup groups the ULXD4Q MIC/LINE switches. A direct call may still see
  // that current 13-marker map; callers that already restored it see 15.
  if(slug==='ulxd4q' && current.portMap?.items?.length===13)current=beforeMx392Ulxd4qFollowupProduct(current,slug);
  // W-003 later condenses this one map; restore its approved 24-marker
  // predecessor before checking the independent W-001 coordinate history.
  if (slug === 'ki-pro-go2' && current.portMap?.items?.length === 11) current = beforeW12003Product(current, slug);
  const approved = coordinates(current);
  if (sha(approved) !== record.approved) throw new Error(`${slug}: unexpected W-001 coordinate change`);
  if (approved.length !== record.prior.items.length ||
      approved.some((item, index) => item.n !== record.prior.items[index].n)) {
    throw new Error(`${slug}: unexpected W-001 marker list change`);
  }
  const result = structuredClone(current);
  result.portMap.items.forEach((item, index) => {
    for (const field of fields) {
      if (Object.hasOwn(record.prior.items[index], field)) item[field] = record.prior.items[index][field];
      else delete item[field];
    }
  });
  return result;
}

export function beforeW12001Raw(raw, slug) {
  if(slug==='ulxd4q' && JSON.parse(raw).portMap?.items?.length===13)raw=beforeMx392Ulxd4qFollowupRaw(raw,slug);
  if (!records[slug]) return raw;
  return JSON.stringify(beforeW12001Product(JSON.parse(raw), slug), null, 2) + '\n';
}
