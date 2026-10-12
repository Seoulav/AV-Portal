import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { beforeW013AProduct } from './w013-a-history.mjs';
import { beforeW013ARaw } from './w013-a-history.mjs';
import { beforeW013A2Product } from './w013-a2-history.mjs';
import { beforeW013A2Raw } from './w013-a2-history.mjs';
import { rewindW013B2Product, rewindW013B2Raw } from './w013-b2-history.mjs';
import { beforeW13001Product, beforeW13001Raw } from './w13001-powersoft-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w013-product-history.json', import.meta.url), 'utf8'));
export const w013Slugs = new Set(Object.keys(fixture));
const hash = value => createHash('sha256').update(value).digest('hex');

// Rewind each approved W-013 batch in reverse order; the final whole-product SHA catches other edits.
export function beforeW013Product(current, slug) {
  current = beforeW13001Product(current, slug);
  current = beforeW013A2Product(current, slug);
  current = rewindW013B2Product(current, slug);
  current = beforeW013AProduct(current, slug);
  if (!w013Slugs.has(slug)) return current;
  const { prior, approved } = fixture[slug];
  if (hash(JSON.stringify(current.io)) !== approved.ioSha) throw new Error(`${slug}: unexpected W-013 I/O change`);
  const result = structuredClone(current);
  result.io = structuredClone(prior.io);
  return result;
}

export function beforeW013Raw(raw, slug) {
  let result = beforeW013A2Raw(beforeW13001Raw(raw, slug), slug);
  result = rewindW013B2Raw(result, slug);
  result = beforeW013ARaw(result, slug);
  if (w013Slugs.has(slug)) {
    const current = JSON.parse(result);
    const { prior, approved } = fixture[slug];
    if (hash(JSON.stringify(current.io)) !== approved.ioSha) throw new Error(`${slug}: unexpected W-013 I/O change`);
    current.io = structuredClone(prior.io);
    result = JSON.stringify(current, null, 2) + '\n';
  }
  return result;
}

export const w013PriorProductSha = slug => fixture[slug]?.approved.productShaBefore;
