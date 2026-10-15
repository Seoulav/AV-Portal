import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261015-011-prior-coords.json', import.meta.url), 'utf8'));
const slugs = new Set(Object.keys(fixture));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const coordinates = map => map?.items?.map(({ n, x1, x2, y, y1, y2 }) => ({ n, ...(x1 !== undefined ? { x1 } : {}), ...(x2 !== undefined ? { x2 } : {}), ...(y !== undefined ? { y } : {}), ...(y1 !== undefined ? { y1 } : {}), ...(y2 !== undefined ? { y2 } : {}) })) ?? [];
const metadata = map => map ? { image: map.image, measuredImage: map.measuredImage, crop: map.crop ?? null, items: map.items.map(({ n, label, desc, side }) => ({ n, label, desc, side })) } : null;

export function beforeW20261015_011Product(current, slug) {
  if (!slugs.has(slug)) return current;
  const approved = fixture[slug].approved;
  if (!current.portMap || hash(coordinates(current.portMap)) !== approved.coordinates || hash(metadata(current.portMap)) !== approved.metadata) {
    throw new Error(slug + ': unexpected W-011 Port Map change');
  }
  const result = structuredClone(current);
  delete result.portMap;
  return result;
}

// Preserve every pre-W-011 byte except the newly appended final portMap field.
export function beforeW20261015_011Raw(raw, slug) {
  if (!slugs.has(slug)) return raw;
  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const reverted = beforeW20261015_011Product(JSON.parse(raw), slug);
  const marker = ',' + newline + '  "portMap": ';
  const index = raw.lastIndexOf(marker);
  if (index < 0 || !raw.endsWith(newline + '}' + newline)) throw new Error(slug + ': W-011 Port Map is not the final product field');
  const restored = raw.slice(0, index) + newline + '}' + newline;
  if (JSON.stringify(JSON.parse(restored)) !== JSON.stringify(reverted)) throw new Error(slug + ': W-011 raw inverse mismatch');
  return restored;
}
