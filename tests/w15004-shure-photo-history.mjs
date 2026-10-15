import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w15004-shure-photo-history.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');

export function beforeW15004Product(current, slug) {
  const record = fixture.products[slug];
  if (!record) return current;
  const actual = hash(JSON.stringify(current.images));
  const prior = hash(JSON.stringify(record.priorImages));
  if (actual === prior) return current;
  if (actual !== record.approvedSha256) throw new Error(slug + ': unexpected W-15004 image metadata');
  const result = structuredClone(current);
  result.images = structuredClone(record.priorImages);
  return result;
}

export function beforeW15004Raw(raw, slug) {
  if (!fixture.products[slug]) return raw;
  const current = JSON.parse(raw);
  const prior = beforeW15004Product(current, slug);
  return prior === current ? raw : JSON.stringify(prior, null, 2) + '\n';
}

export function beforeW15004ImageSha(actual, file) {
  const record = fixture.images[file];
  if (!record || actual === record.priorSha256) return actual;
  if (actual !== record.approvedSha256) throw new Error(file + ': unexpected W-15004 image bytes');
  return record.priorSha256;
}