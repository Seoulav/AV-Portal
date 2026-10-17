import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW011VideoLayerProduct } from './w20261016-011-video-layer-history.mjs';
import { beforeW20261017_002Product } from './w20261017-002-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261016-010-aquilon-prior-fields.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW010AquilonProduct(current, slug, { w002Undone = false } = {}) {
  if (!w002Undone) current = beforeW20261017_002Product(current, slug);
  current = beforeW011VideoLayerProduct(current, slug);
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

export function beforeW010AquilonRaw(raw, slug, options = {}) {
  const current = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  const next = beforeW010AquilonProduct(current, slug, options);
  return next === current ? raw : JSON.stringify(next, null, 2) + '\n';
}

export function beforeW010AquilonUploads(uploads) {
  return uploads.filter(entry => !(entry.file === 'manuals/analog-way-aquilon-brochure-april-2026.pdf' && fixture.products[entry.slug]));
}

export const isW010AquilonBrochure = file => file === 'analog-way-aquilon-brochure-april-2026.pdf';
