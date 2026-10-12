import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w013-b2-product-history.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const w013B2Slugs = new Set(Object.keys(fixture));

// Restore only the B2-approved I/O changes. The strict entrypoint also proves the whole product has no unrelated edits.
function restoreB2Io(current, slug, strict) {
  if (!w013B2Slugs.has(slug)) return current;
  const { priorIo, approved } = fixture[slug];
  if (hash(current.io) !== approved.ioSha) throw new Error(`${slug}: unexpected W-013 B2 I/O change`);
  if (strict && hash(current) !== approved.productShaAfter) throw new Error(`${slug}: unexpected non-I/O W-013 B2 change`);
  const result = structuredClone(current);
  result.io = structuredClone(priorIo);
  if (strict && hash(result) !== approved.productShaBefore) throw new Error(`${slug}: B2 rewind did not restore prior product SHA`);
  return result;
}

export const beforeW013B2Product = (current, slug) => restoreB2Io(current, slug, true);
export const rewindW013B2Product = (current, slug) => restoreB2Io(current, slug, false);
