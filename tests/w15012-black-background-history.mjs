import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Reverse only W-012 image metadata and image-status source URLs for historical
// whole-product assertions. All other current fields remain visible to them.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/w15012-black-background-history.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');

export function beforeW15012Product(current, slug) {
  const record = fixture.products[slug];
  if (!record) return current;
  const imageSha = sha(JSON.stringify(current.images));
  const statusSha = sha(JSON.stringify(current.imageStatuses));
  const priorImageSha = sha(JSON.stringify(record.priorImages));
  const priorStatusSha = sha(JSON.stringify(record.priorImageStatuses));
  if (imageSha === priorImageSha && statusSha === priorStatusSha) return current;
  if (imageSha !== record.approvedImagesSha256 || statusSha !== record.approvedImageStatusesSha256) {
    throw new Error(`${slug}: unexpected W-012 image metadata or statuses`);
  }
  const result = structuredClone(current);
  result.images = structuredClone(record.priorImages);
  result.imageStatuses = structuredClone(record.priorImageStatuses);
  return result;
}

export function beforeW15012Raw(raw, slug) {
  if (!fixture.products[slug]) return raw;
  const current = JSON.parse(raw);
  const prior = beforeW15012Product(current, slug);
  return prior === current ? raw : JSON.stringify(prior, null, 2) + '\n';
}

export function beforeW15012ImageSha(actual, file) {
  const record = fixture.images[file];
  if (!record || actual === record.priorSha256) return actual;
  if (actual !== record.approvedSha256) throw new Error(`${file}: unexpected W-012 image bytes`);
  return record.priorSha256;
}
