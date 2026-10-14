// Rewind only the 28 W-013 A3 evidence-backed quantity changes. All other
// current fields continue through older whole-product assertions unchanged.
import { readFileSync } from 'node:fs';

const w001 = JSON.parse(readFileSync(new URL('./fixtures/w13001-powersoft-history.json', import.meta.url), 'utf8'));
const b2 = JSON.parse(readFileSync(new URL('./fixtures/w013-b2-product-history.json', import.meta.url), 'utf8'));
const w013 = JSON.parse(readFileSync(new URL('./fixtures/w013-product-history.json', import.meta.url), 'utf8'));
const dueQuattro = ['duecanali-804', 'duecanali-1604', 'quattrocanali-1204', 'quattrocanali-2404', 'quattrocanali-4804'];
const approved = new Map();
for (const family of dueQuattro) {
  approved.set(`${family}-dsp`, [[4, '1', ''], [5, '1', '']]);
  approved.set(`${family}-dspd`, [[5, '1', ''], [6, '1', '']]);
}
for (const model of ['322', '324', '602', '604']) {
  for (const variant of ['a', 'ad']) {
    const id = `mezzo-${model}-${variant}`;
    const index = { '322-a': 6, '322-ad': 6, '324-a': 5, '324-ad': 7,
      '602-a': 6, '602-ad': 8, '604-a': 5, '604-ad': 7 }[`${model}-${variant}`];
    approved.set(id, [[index, ['322', '602'].includes(model) ? '2' : '4', '']]);
  }
}
export const w013A3Slugs = new Set(approved.keys());

export function beforeW013A3Product(current, slug) {
  if (!approved.has(slug)) return current;
  // Older assertions can invoke this inverse after W-001 or W-013 has already
  // restored its exact I/O fixture. Accept only those reviewed prior arrays.
  const knownPrior = [w001[slug]?.io?.prior, b2[slug]?.priorIo, w013[slug]?.prior?.io];
  if (knownPrior.some(io => io && JSON.stringify(current.io) === JSON.stringify(io))) return current;
  // Earlier inverses may have already restored individual rows. Check each
  // approved row independently while passing every other current field through.
  const rows = approved.get(slug);
  const result = structuredClone(current);
  for (const [index, expected, prior] of rows) {
    const row = result.io[index];
    if (!row || ![expected, prior].includes(row.quantity)) throw new Error(`${slug}: unexpected W-013 A3 io[${index}] quantity`);
    row.quantity = prior;
  }
  return result;
}

export function beforeW013A3Raw(raw, slug) {
  return approved.has(slug) ? JSON.stringify(beforeW013A3Product(JSON.parse(raw), slug), null, 2) + '\n' : raw;
}

export function beforeW013A3Path(path, value) {
  const slug = path.split('/').at(-1)?.replace(/\.json$/, '');
  return typeof value === 'string' ? beforeW013A3Raw(value, slug) : beforeW013A3Product(value, slug);
}
