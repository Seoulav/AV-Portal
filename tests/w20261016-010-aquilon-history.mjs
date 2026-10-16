import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-010-aquilon-prior-fields.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW010AquilonProduct(current, slug) {
  const record = fixture.products[slug];
  if (!record) return current;
  let result = current;
  for (const [field, prior] of Object.entries(record.fields)) {
    const exists = Object.hasOwn(result, field);
    if (exists === prior.previousExists && (!exists || hash(result[field]) === hash(prior.previous))) continue;
    if (exists !== prior.approvedExists || hash(result[field]) !== prior.approvedSha256) throw new Error(`${slug}: unexpected ${field} change`);
    if (result === current) result = structuredClone(result);
    if (prior.previousExists) result[field] = structuredClone(prior.previous);
    else delete result[field];
  }
  return result;
}

export function beforeW010AquilonRaw(raw, slug) {
  if (!fixture.products[slug]) return raw;
  return JSON.stringify(beforeW010AquilonProduct(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeW010AquilonUploads(uploads) {
  return uploads.filter(entry => !(entry.file === 'manuals/analog-way-aquilon-brochure-april-2026.pdf' && fixture.products[entry.slug]));
}

export const isW010AquilonBrochure = file => file === 'analog-way-aquilon-brochure-april-2026.pdf';
