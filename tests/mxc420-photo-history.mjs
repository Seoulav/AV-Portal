import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Restore only this fix's approved MXC420/C image metadata and bytes for older
// whole-product and image-baseline assertions. Every other current field stays
// observable to those assertions.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/mxc420-photo-prior-images.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeMxc420PhotoProduct(current, slug) {
  if (slug !== 'mxc420-c') return current;
  if (hash(current.images) === hash(fixture.priorImages)) return current;
  if (hash(current.images) !== fixture.approvedSha256) throw new Error('unexpected MXC420/C image metadata');
  const result = structuredClone(current);
  result.images = structuredClone(fixture.priorImages);
  return result;
}

export function beforeMxc420PhotoRaw(raw, slug) {
  if (slug !== 'mxc420-c') return raw;
  return JSON.stringify(beforeMxc420PhotoProduct(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeMxc420PhotoImageSha(actualSha, file) {
  if (file !== 'mxc420c-front.webp') return actualSha;
  if (actualSha === fixture.priorImageSha256) return actualSha;
  if (actualSha !== fixture.approvedImageSha256) throw new Error('unexpected MXC420/C image bytes');
  return fixture.priorImageSha256;
}
