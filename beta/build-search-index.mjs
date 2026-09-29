import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { detailSearchEntry } from './site/shared/search-index.mjs';

const site = new URL('./site/', import.meta.url);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const normalizeNewlines = value => value.replaceAll('\r\n', '\n');

export const searchIndexBytesMatch = (stored, expected) => normalizeNewlines(stored) === normalizeNewlines(expected);

export function buildSearchIndex(catalog, details, catalogRaw = JSON.stringify(catalog), detailRaw = new Map()) {
  const items = catalog.filter(item => item.kind === 'equipment' && item.slug).map(item => {
    const detail = details.get(item.slug);
    if (!detail) throw new Error(`상세 JSON 없음: ${item.slug}`);
    return detailSearchEntry(item, detail);
  });
  const normalizedCatalog = normalizeNewlines(catalogRaw);
  const source = [normalizedCatalog, ...items.map(item => normalizeNewlines(detailRaw.get(item.slug) ?? JSON.stringify(details.get(item.slug))))].join('\0');
  return { schema: 'avportal.search-index.v1', catalogSha256: sha256(normalizedCatalog), sourceSha256: sha256(source), items };
}

export async function expectedSearchIndex() {
  const catalogRaw = await readFile(new URL('catalog.json', site), 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const details = new Map();
  const detailRaw = new Map();
  for (const item of catalog.filter(item => item.kind === 'equipment' && item.slug)) {
    const raw = await readFile(new URL(`detail/data/${item.slug}.json`, site), 'utf8');
    detailRaw.set(item.slug, raw);
    details.set(item.slug, JSON.parse(raw));
  }
  return JSON.stringify(buildSearchIndex(catalog, details, catalogRaw, detailRaw)) + '\n';
}

async function main() {
  const target = new URL('search-index.json', site);
  const expected = await expectedSearchIndex();
  if (process.argv.includes('--check')) {
    const stored = await readFile(target, 'utf8').catch(() => '');
    if (!searchIndexBytesMatch(stored, expected)) throw new Error('search-index.json이 현재 공개 데이터와 다릅니다. node beta/build-search-index.mjs를 실행하세요.');
    console.log(`search-index.json check OK (${Buffer.byteLength(expected)} bytes)`);
  } else {
    await writeFile(target, expected, 'utf8');
    console.log(`search-index.json written (${Buffer.byteLength(expected)} bytes)`);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main().catch(error => { console.error(error); process.exitCode = 1; });
