import { readFileSync } from 'node:fs';

// The NX rear USB label changed after W-001. Historical assertions restore
// these two text fields while keeping every other current product field.
const records = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-001-prior-identity.json', import.meta.url), 'utf8'));

export function beforeW12001IdentityProduct(current, slug) {
  const record = records[slug];
  if (!record) return current;
  const markers = current.portMap?.items?.filter(item => item.n === 8) ?? [];
  if (markers.length !== 1 || markers[0].label !== record.approved.label ||
      markers[0].desc !== record.approved.desc) {
    throw new Error(`${slug}: unexpected W-001 identity change`);
  }
  const result = structuredClone(current);
  const marker = result.portMap.items.find(item => item.n === 8);
  marker.label = record.prior.label;
  marker.desc = record.prior.desc;
  return result;
}

export function beforeW12001IdentityRaw(raw, slug) {
  if (!records[slug]) return raw;
  return JSON.stringify(beforeW12001IdentityProduct(JSON.parse(raw), slug), null, 2) + '\n';
}
