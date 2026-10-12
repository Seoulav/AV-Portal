import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Restore only the approved AVer photo, I/O, and map fields for older whole-
// product hashes. Every other field comes from the live published product.
const fixture = JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-009-prior-fields.json', import.meta.url), 'utf8'));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeAverW12009Product(current, slug) {
  const fields = fixture[slug];
  if (!fields) return current;
  const result = structuredClone(current);
  for (const [field, { prior, approvedSha256 }] of Object.entries(fields)) {
    const actual = sha(result[field]);
    if (actual === sha(prior)) continue;
    if (actual !== approvedSha256) throw new Error(`${slug}: unexpected W-009 ${field} change`);
    if (prior === null) delete result[field];
    else result[field] = structuredClone(prior);
  }
  return result;
}

export function beforeAverW12009Raw(raw, slug) {
  if (!fixture[slug]) return raw;
  return JSON.stringify(beforeAverW12009Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export function beforeAverW12009Catalog(items) {
  return items.map(item => {
    if (item.slug !== 'tr315') return item;
    if (item.card_image === 'tr315-perspective.webp') return item;
    if (item.card_image !== 'tr315-front.webp') throw new Error('tr315: unexpected W-009 catalog image change');
    return { ...item, card_image: 'tr315-perspective.webp' };
  });
}

const imageReplacements = {
  'tr315-perspective.webp': { prior: '9e65a5a8f2cf0fe7addcb2cb1f5d7eb67a7932c250ea3645bdfbd7658ab3bf0f', approved: null },
  'tr335-front.webp': { prior: 'd9eced02c1b112836e7c8ebbae093898c4482b733fe69102425f38972fa40b7d', approved: 'e74911a067469d48c6f8b2700330eb67e2e3bc6d1ca7fe511a3bbfb0950762b3' },
  'tr335-rear.webp': { prior: '09f837882cbd4aa32db1b053c5d3fb9ac52fcd2b7c0b4681fcb0b51905568411', approved: '215043bb1f1c7dcfe01932cb39e1112af8febf7cf96f4c4bbaab73912857e49f' },
};

export function verifyAverW12009ReplacedImage(file, historicalHash) {
  const record = imageReplacements[file];
  if (!record) return false;
  if (record.prior !== historicalHash) throw new Error(`${file}: unexpected historical image hash`);
  const path = new URL(`../beta/site/detail/images/${file}`, import.meta.url);
  if (record.approved === null) {
    if (existsSync(path)) throw new Error(`${file}: replaced image was not removed`);
  } else {
    const current = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (current !== record.approved) throw new Error(`${file}: unexpected replacement image bytes`);
  }
  return true;
}
