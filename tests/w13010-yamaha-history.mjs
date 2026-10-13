import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w13010-yamaha-history.json', import.meta.url), 'utf8'));
const w12005Prior = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-prior-maps.json', import.meta.url), 'utf8'));
// DM7's W-001 coordinate inverse is also reached when an older test composes
// its historical helpers twice. This is the exact map hash after that inverse.
const olderDm7MapSha256 = 'f598889fe009a31f44130e7b07970bd4f48d96766fa67483751d21164a5bc44b';
const digest = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// Keep current products in every historical assertion. Only fields approved
// for W-010 are restored; any other current mutation remains visible.
export function beforeW13010Product(current, slug) {
  const record = fixture[slug];
  if (!record) return current;
  const fields = Object.keys(record.prior);
  if (fields.every(field => digest(current[field]) === digest(record.prior[field]))) return current;
  // Older inverses may call this helper again after restoring W-005's
  // explicitly recorded map. Accept only that exact historical map, while
  // requiring all other W-010 fields to have already been restored.
  if ([digest(w12005Prior[slug]?.prior), ...(slug === 'dm7' ? [olderDm7MapSha256] : [])].includes(digest(current.portMap)) &&
      fields.filter(field => field !== 'portMap').every(field => digest(current[field]) === digest(record.prior[field]))) return current;
  const result = structuredClone(current);
  for (const field of fields) {
    if (digest(current[field]) === digest(record.prior[field])) continue;
    if (digest(current[field]) !== record.approved[field])
      throw new Error(`${slug}: unexpected W-010 ${field} change (${digest(current[field])})`);
    if (record.prior[field] === null) delete result[field];
    else result[field] = structuredClone(record.prior[field]);
  }
  return result;
}

export function beforeW13010Raw(raw, slug) {
  if (!fixture[slug]) return raw;
  return JSON.stringify(beforeW13010Product(JSON.parse(raw), slug), null, 2) + '\n';
}

const approvedUploads = [
  { slug: 'dm3', file: 'manuals/yamaha-dm3-data-sheet-en.pdf', kind: 'reference', title: 'Yamaha DM3 사양서 · Dante 지원(사용자 제공)' },
  { slug: 'dm3', file: 'manuals/yamaha-dm3-standard-data-sheet-en.pdf', kind: 'reference', title: 'Yamaha DM3 Standard(DM3S) 사양서 · Dante 미지원(사용자 제공)' },
];
const names = new Set(approvedUploads.map(entry => entry.file));
export function withoutW13010Uploads(uploads) {
  const found = uploads.filter(entry => names.has(entry.file));
  if (found.length === 0) return uploads;
  if (found.length !== approvedUploads.length || found.some((entry, index) => digest(entry) !== digest(approvedUploads[index])))
    throw new Error('dm3: unexpected W-010 uploaded data sheet change');
  return uploads.filter(entry => !names.has(entry.file));
}

export const w13010Fixture = fixture;
