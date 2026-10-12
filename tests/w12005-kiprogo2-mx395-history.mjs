import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Restore only this follow-up's approved map and image metadata. Older whole-
// product assertions still see the current model, I/O, specifications, etc.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-005-kiprogo2-prior-map.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeKiprogo2Mx395Product(current, slug) {
  let result = current;
  if (slug === 'ki-pro-go2') {
    if (hash(result.portMap) !== hash(fixture.prior)) {
      if (hash(result.portMap) !== fixture.approvedSha256) throw new Error('unexpected Ki Pro GO2 regrouping');
      result = structuredClone(result);
      result.portMap = structuredClone(fixture.prior);
    }
  }
  if (slug === 'mx395') {
    if (hash(result.images) !== hash(fixture.mx395.priorImages)) {
      if (hash(result.images) !== fixture.mx395.approvedSha256) throw new Error('unexpected MX395 image metadata');
      result = structuredClone(result);
      result.images = structuredClone(fixture.mx395.priorImages);
    }
  }
  // Current JSON remains the input. Restore only the approved urgent-bundle
  // fields; every other field still reaches the historical assertions.
  for (const [field, record] of Object.entries(fixture.extraProducts?.[slug] ?? {})) {
    if (hash(result[field]) === hash(record.previous)) continue;
    if (hash(result[field]) !== record.approvedSha256) throw new Error(`${slug}: unexpected ${field} change`);
    if (result === current) result = structuredClone(result);
    result[field] = structuredClone(record.previous);
  }
  return result;
}

export function beforeKiprogo2Mx395Raw(raw, slug) {
  if (slug !== 'ki-pro-go2' && slug !== 'mx395' && !fixture.extraProducts?.[slug]) return raw;
  return JSON.stringify(beforeKiprogo2Mx395Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeKiprogo2Mx395ImageSha(actualSha, file) {
  if (file === 'mx392c-front.webp') {
    if (actualSha === fixture.mx392Photo.priorImageSha256) return actualSha;
    if (actualSha !== fixture.mx392Photo.approvedImageSha256) throw new Error('unexpected MX392/C image bytes');
    return fixture.mx392Photo.priorImageSha256;
  }
  if (file !== 'mx395-front.webp') return actualSha;
  if (actualSha === fixture.mx395.priorImageSha256) return actualSha;
  if (actualSha !== fixture.mx395.approvedImageSha256) throw new Error('unexpected MX395 image bytes');
  return fixture.mx395.priorImageSha256;
}
