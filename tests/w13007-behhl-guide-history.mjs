import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w13007-behhl-guide-history.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeW13007BehhlGuideCatalog(catalog) {
  return catalog.map(item => {
    if (item.slug !== 'lh65behhlbfxkr') return item;
    if (item.card_image === undefined) return item;
    if (item.card_image !== 'lh65behhlbfxkr-diagram.webp') throw new Error('unexpected W-007 BEHHL card image change');
    const previous = { ...item };
    delete previous.card_image;
    return previous;
  });
}

// Undo only session C's BEHX-H guide Diagram and map for older product hashes.
export function beforeW13007BehhlGuideProduct(current, slug) {
  const record = fixture[slug];
  if (!record) return current;
  let result = current;
  for (const [field, { previous, approvedSha256 }] of Object.entries(record)) {
    const actual = sha(result[field]);
    if (actual === sha(previous)) continue;
    if (actual !== approvedSha256) throw new Error(`${slug}: unexpected W-007 BEHHL ${field} change`);
    if (result === current) result = structuredClone(current);
    if (previous === null) delete result[field];
    else result[field] = structuredClone(previous);
  }
  return result;
}

export function beforeW13007BehhlGuideRaw(raw, slug) {
  if (!fixture[slug]) return raw;
  const current = JSON.parse(raw);
  const previous = beforeW13007BehhlGuideProduct(current, slug);
  if (slug !== 'lh43behhlbfxkr') return JSON.stringify(previous, null, 2) + '\n';
  // The original 43-inch record has compact hand-formatted rows. Remove only
  // the three additions so old byte hashes still observe every other field.
  const image = current.images.find(entry => entry.role === 'Diagram');
  const picture = JSON.stringify(image, null, 2).split('\n').map(line => `    ${line}`).join('\n');
  const addedImage = `\n    },\n${picture}\n  ],\n  "imageStatuses":`;
  const oldImage = '\n    }\n  ],\n  "imageStatuses":';
  if (!raw.includes(addedImage)) throw new Error(`${slug}: unexpected W-007 BEHHL raw image change`);
  raw = raw.replace(addedImage, oldImage);
  const status = current.imageStatuses.find(entry => entry.role === 'Diagram');
  const priorStatus = fixture[slug].imageStatuses.previous.find(entry => entry.role === 'Diagram');
  const addedStatus = `    { "role": "Diagram", "status": "${status.status}", "sourceUrl": "${status.sourceUrl}" }`;
  const oldStatus = `    { "role": "Diagram", "status": "${priorStatus.status}", "sourceUrl": "${priorStatus.sourceUrl}" }`;
  if (!raw.includes(addedStatus)) throw new Error(`${slug}: unexpected W-007 BEHHL raw status change`);
  raw = raw.replace(addedStatus, oldStatus);
  const map = JSON.stringify(current.portMap, null, 2).split('\n').map((line, index) => index ? `  ${line}` : line).join('\n');
  const addedMap = `,\n  "portMap": ${map}\n}\n`;
  if (!raw.endsWith(addedMap)) throw new Error(`${slug}: unexpected W-007 BEHHL raw map change`);
  raw = raw.slice(0, -addedMap.length) + '\n}\n';
  if (JSON.stringify(JSON.parse(raw)) !== JSON.stringify(previous)) throw new Error(`${slug}: unexpected W-007 BEHHL raw inverse`);
  return raw;
}
