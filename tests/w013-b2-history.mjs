import {beforeCrownW16015Product,beforeCrownW16015Raw} from './crown-w16015-history.mjs';
import { readFileSync } from 'node:fs';
import { beforeW15004Product, beforeW15004Raw } from './w15004-shure-photo-history.mjs';
import { createHash } from 'node:crypto';
import { beforeW20261016_015B4Product, beforeW20261016_015B4Raw } from './w20261016-015-b4-history.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w013-b2-product-history.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const w013B2Slugs = new Set(Object.keys(fixture));

// Restore only the B2-approved I/O changes. The strict entrypoint also proves the whole product has no unrelated edits.
function restoreB2Io(current, slug, strict) {
  if (!w013B2Slugs.has(slug)) return current;
  if (strict) current = beforeCrownW16015Product(current, slug);
  const { priorIo, approved } = fixture[slug];
  const currentHash = hash(current.io);
  const priorHash = hash(priorIo);
  if (currentHash === priorHash && !strict) return current;
  if (currentHash !== approved.ioSha) throw new Error(`${slug}: unexpected W-013 B2 I/O change`);
  if (strict && hash(current) !== approved.productShaAfter) throw new Error(`${slug}: unexpected non-I/O W-013 B2 change`);
  const result = structuredClone(current);
  result.io = structuredClone(priorIo);
  if (strict && hash(result) !== approved.productShaBefore) throw new Error(`${slug}: B2 rewind did not restore prior product SHA`);
  return result;
}

export const beforeW013B2Product = (current, slug) => {
  current = beforeW20261016_015B4Product(current, slug, {allowHistorical:true});
  return restoreB2Io(w013B2Slugs.has(slug) ? beforeW15004Product(current, slug) : current, slug, true);
};
export const rewindW013B2Product = (current, slug) => restoreB2Io(beforeW20261016_015B4Product(current, slug, {allowHistorical:true}), slug, false);

function matchingClose(text, open, left, right) {
  let depth = 0, quoted = false, escaped = false;
  for (let index = open; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === left) depth++;
    else if (char === right && --depth === 0) return index;
  }
  throw new Error('unterminated JSON structure');
}

export function rewindW013B2Raw(raw, slug) {
  if (!w013B2Slugs.has(slug)) return raw;
  raw = beforeCrownW16015Raw(raw, slug);
  raw = beforeW20261016_015B4Raw(raw, slug, {allowHistorical:true});
  raw = beforeW15004Raw(raw, slug);
  const current = JSON.parse(raw);
  const { priorIo, priorIoRaw, approved } = fixture[slug];
  if (hash(current.io) === hash(priorIo)) return raw;
  if (hash(current.io) !== approved.ioSha) throw new Error(`${slug}: unexpected W-013 B2 I/O change`);
  if (hash(current) !== approved.productShaAfter) throw new Error(`${slug}: unexpected non-I/O W-013 B2 change`);
  const ioKey = /"io"\s*:\s*\[/g;
  const match = ioKey.exec(raw);
  if (!match) throw new Error(`${slug}: missing raw I/O array`);
  const openArray = raw.indexOf('[', match.index);
  const closeArray = matchingClose(raw, openArray, '[', ']');
  const propertyStart = raw.indexOf('"io"', match.index);
  return raw.slice(0, propertyStart) + priorIoRaw.trimStart() + raw.slice(closeArray + 1);
}
