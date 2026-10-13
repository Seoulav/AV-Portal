import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w13007-videowall-history.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
export const w13007Slugs = new Set(Object.keys(fixture));

// Older whole-product assertions see current products with only W-007's
// approved gallery and map fields restored. All other fields pass through.
export function beforeW13007Product(current, slug) {
  const record = fixture[slug];
  if (!record) return current;
  const fields = ['images', 'imageStatuses', 'portMap'];
  if (fields.every(field => digest(current[field]) === digest(record.prior[field]))) return current;
  const result = structuredClone(current);
  for (const field of fields) {
    if (digest(current[field]) !== record.approved[field]) throw new Error(`${slug}: unexpected W-007 ${field} change`);
    if (record.prior[field] === null) delete result[field];
    else result[field] = structuredClone(record.prior[field]);
  }
  return result;
}

export function beforeW13007Raw(raw, slug) {
  if (!w13007Slugs.has(slug)) return raw;
  return JSON.stringify(beforeW13007Product(JSON.parse(raw), slug), null, 2) + '\n';
}
