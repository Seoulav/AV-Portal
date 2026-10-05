import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Historical assertions retain their original hashes. Undo only the W-032
// document edits and new flows at those assertions, using the actual current
// product as input. Every other field must pass through to the old hash.
const approved = JSON.parse(readFileSync(new URL('./fixtures/w032-approved.json', import.meta.url), 'utf8'));
const mirrorFiles = new Set([
  'sony-brc-am7-helpguide-ko.pdf',
  'sony-srg-a40-a12-manual-ko.pdf',
  'sony-srg-x40uh-h40uh-manual-ko.pdf',
  'sony-rm-ip500-manual-ko.pdf'
]);

const hasOwn = (object, key) => Object.hasOwn(object, key);
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW032Product(product, slug) {
  const after = approved[slug];
  if (!after) return structuredClone(product);
  const before = JSON.parse(readFileSync(new URL(`./fixtures/w032-before/${slug}.json`, import.meta.url), 'utf8'));
  const prior = structuredClone(product);
  const added = after.addedDocumentSha256 ? 1 : 0;
  if (prior.documents.length !== after.documentsLength) {
    throw new Error(`${slug}: unexpected W-032 document count`);
  }
  if (added) {
    if (sha(prior.documents[0]) !== after.addedDocumentSha256) throw new Error(`${slug}: added document changed`);
    prior.documents.shift();
  }
  for (const { index, keys, sha256 } of after.changedDocuments) {
    const oldRow = before.documents[index];
    const currentRow = prior.documents[index];
    if (sha(keys.map(key => [key, hasOwn(currentRow, key), currentRow[key] ?? null])) !== sha256) {
      throw new Error(`${slug}: approved document ${index} fields changed`);
    }
    for (const key of keys) {
      if (hasOwn(oldRow, key)) currentRow[key] = oldRow[key];
      else delete currentRow[key];
    }
  }
  if (hasOwn(after, 'signalFlowSha256')) {
    if (sha(prior.signalFlow) !== after.signalFlowSha256) throw new Error(`${slug}: approved signalFlow changed`);
    if (hasOwn(before, 'signalFlow')) prior.signalFlow = before.signalFlow;
    else delete prior.signalFlow;
  }
  return prior;
}

export function beforeW032Raw(raw, slug) {
  if (!approved[slug]) return raw;
  return JSON.stringify(beforeW032Product(JSON.parse(raw), slug), null, 2) + (raw.endsWith('\n') ? '\n' : '');
}

export function beforeW032Mirrors(mirrors) {
  return mirrors.filter(entry => !mirrorFiles.has(entry.file));
}
