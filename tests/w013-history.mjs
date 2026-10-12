import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW013AProduct, beforeW013ARaw } from './w013-a-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w013-product-history.json', import.meta.url), 'utf8'));
export const w013Slugs = new Set(Object.keys(fixture));
const hash = value => createHash('sha256').update(value).digest('hex');

// Restore only the approved W-013 I/O field; the prior whole-product SHA catches any other edits.
export function beforeW013Product(current, slug) {
  current = beforeW013AProduct(current, slug);
  if (!w013Slugs.has(slug)) return current;
  const { prior, approved } = fixture[slug];
  if (hash(JSON.stringify(current.io)) !== approved.ioSha) throw new Error(`${slug}: unexpected W-013 I/O change`);
  const result = structuredClone(current);
  result.io = structuredClone(prior.io);
  return result;
}

export function beforeW013Raw(raw, slug) {
  raw = beforeW013ARaw(raw, slug);
  if (!w013Slugs.has(slug)) return raw;
  return JSON.stringify(beforeW013Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export const w013PriorProductSha = slug => fixture[slug]?.approved.productShaBefore;
