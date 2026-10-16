import {beforeCrownW16015Product} from './crown-w16015-history.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW12003Product } from './w12003-kiprogo2-history.mjs';
import { beforeMx392Ulxd4qFollowupProduct, beforeMx392Ulxd4qFollowupRaw } from './mx392-ulxd4q-followup-history.mjs';
import { beforeW20261015_005Product } from './w20261015-005-history.mjs';
import { beforeW20261016_015B4Product, beforeW20261016_015B4Raw } from './w20261016-015-b4-history.mjs';

// Restore only Port Map coordinates for assertions pinned to the pre-W-001 data.
const records = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-001-prior-coords.json', import.meta.url), 'utf8'));
const fields = ['x1', 'x2', 'y', 'y1', 'y2', 'x'];
const coordinates = product => (product.portMap?.items ?? []).map(item =>
  Object.fromEntries([['n', item.n], ...fields.filter(field => Object.hasOwn(item, field)).map(field => [field, item[field]])]));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW12001Product(current, slug, { allowHistorical = false } = {}) {
  // Preserve object identity when this history has no record for the product.
  if (!records[slug]) return current;
  current = beforeW20261016_015B4Product(current, slug, { allowHistorical: true });
  // W-026 may call this again after the exact recorded W-001 predecessor was restored.
  const previous = records[slug].prior.items.map(item => Object.fromEntries([['n', item.n], ...fields.filter(field => Object.hasOwn(item, field)).map(field => [field, item[field]])]));
  if (sha(coordinates(current)) === sha(previous)) return current;
  // These eight DCi maps are already rewound by W-005 before this older audit.
  if (!/^dci-[24]-(300|600)n?$/.test(slug) && slug !== 'dci-4-600da') current = beforeCrownW16015Product(current, slug);
  current = beforeW20261015_005Product(current, slug);
  const record = records[slug];
  // MX392/ULXD4Q followup groups the ULXD4Q MIC/LINE switches. A direct call may still see
  // that current 13-marker map; callers that already restored it see 15.
  if(slug==='ulxd4q' && current.portMap?.items?.length===13)current=beforeMx392Ulxd4qFollowupProduct(current,slug);
  // W-003 later condenses this one map; restore its approved 24-marker
  // predecessor before checking the independent W-001 coordinate history.
  if (slug === 'ki-pro-go2' && current.portMap?.items?.length === 11) current = beforeW12003Product(current, slug);
  const approved = coordinates(current);
  if (sha(approved) === sha(previous)) return current;
  if (sha(approved) !== record.approved) {
    if (allowHistorical) return current;
    throw new Error(`${slug}: unexpected W-001 coordinate change`);
  }
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

export function beforeW12001Raw(raw, slug, options = {}) {
  // No W-001 record means the raw file is outside this inverse's scope.
  if (!records[slug]) return raw;
  raw = beforeW20261016_015B4Raw(raw, slug, { allowHistorical: true });
  if(slug==='ulxd4q' && JSON.parse(raw).portMap?.items?.length===13)raw=beforeMx392Ulxd4qFollowupRaw(raw,slug);
  return JSON.stringify(beforeW12001Product(JSON.parse(raw), slug, options), null, 2) + '\n';
}
