import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile, rename, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_PDF_BYTES = 50 * 1024 * 1024;
const active = new Set(['FOUND', 'VERIFIED', 'READY']);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function collectCandidates(rows) {
  const seen = new Set();
  const candidates = [];
  for (const row of rows) for (const document of row.documents ?? []) {
    if (!active.has(document.status) || !document.url || seen.has(document.url)) continue;
    try {
      const url = new URL(document.url);
      if (url.protocol !== 'https:' || url.username || url.password) continue;
    } catch { continue; }
    seen.add(document.url);
    candidates.push({ url: document.url, slug: row.slug, type: document.type });
  }
  return candidates;
}

function pdfFileName({ url, slug, type }) {
  const safeSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'document';
  const safeType = String(type ?? 'document').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'document';
  return `${safeSlug}-${safeType}-${digest(url).slice(0, 12)}.pdf`;
}

async function goodExisting(entry, dir) {
  if (!entry?.file || !/^[a-z0-9-]+\.pdf$/.test(entry.file)) return null;
  try { return (await stat(join(dir, entry.file))).isFile() ? entry : null; }
  catch { return null; }
}

export async function mirrorCandidate(candidate, { dir, fetcher = fetch, existing, now = () => new Date().toISOString(), timeoutMs = 20000 } = {}) {
  const previous = await goodExisting(existing, dir);
  let response;
  try {
    response = await fetcher(candidate.url, {
      headers: { accept: 'application/pdf,*/*;q=0.5', 'user-agent': 'Mozilla/5.0 AV-Portal-PDF-Mirror' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) return { entry: previous, reason: 'error', detail: `HTTP ${response.status}` };
    const length = Number(response.headers.get('content-length'));
    if (length > MAX_PDF_BYTES) return { entry: previous, reason: 'oversize', detail: `${length} bytes` };
    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > MAX_PDF_BYTES) return { entry: previous, reason: 'oversize', detail: `>${MAX_PDF_BYTES} bytes` };
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks, bytes);
    if (body.subarray(0, 5).toString('ascii') !== '%PDF-') return { entry: previous, reason: 'webpage', detail: response.headers.get('content-type') || 'not PDF' };
    const sha256 = digest(body);
    if (previous?.sha256 === sha256 && previous.bytes === bytes) return { entry: previous, reason: null };
    const file = previous?.file || pdfFileName(candidate);
    await mkdir(dir, { recursive: true });
    const temporary = join(dir, `${file}.part-${process.pid}-${Math.random().toString(16).slice(2)}`);
    await writeFile(temporary, body);
    await rename(temporary, join(dir, file));
    const entry = { url: candidate.url, file, sha256, bytes, fetchedAt: now(), sourceHost: new URL(candidate.url).hostname };
    return { entry, reason: null };
  } catch (error) {
    return { entry: previous, reason: 'error', detail: String(error?.message ?? error) };
  } finally { response?.body?.cancel?.().catch(() => {}); }
}

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

export async function runMirror({ root = fileURLToPath(new URL('../', import.meta.url)), fetcher = fetch, concurrency = 10 } = {}) {
  const detailDir = join(root, 'beta/site/detail/data');
  const docsDir = join(root, 'beta/site/docs');
  const manifestFile = join(docsDir, 'manifest.json');
  const old = await readJson(manifestFile, { mirrors: [], uploads: [] });
  const oldByUrl = new Map(old.mirrors.map(item => [item.url, item]));
  const rows = await Promise.all((await readdir(detailDir)).filter(file => file.endsWith('.json')).map(async file => ({
    slug: basename(file, '.json'), ...JSON.parse(await readFile(join(detailDir, file), 'utf8'))
  })));
  const candidates = collectCandidates(rows);
  const catalog = await readJson(join(root, 'beta/site/catalog.json'), []);
  const uploads = [];
  for (const item of catalog) {
    if (!item.slug) continue;
    for (const [kind, url] of [['manual', item.manual_link], ...((item.reference_link ?? []).map(link => ['reference', link]))]) {
      if (typeof url !== 'string' || !/^\.\/manuals\/[a-z0-9-]+\.pdf$/.test(url)) continue;
      uploads.push({ slug: item.slug, file: url.slice(2), kind, title: kind === 'manual' ? '사용자 업로드 매뉴얼' : '사용자 업로드 참고자료' });
    }
  }
  const results = new Array(candidates.length);
  let next = 0, finished = 0;
  async function worker() {
    while (next < candidates.length) {
      const i = next++;
      results[i] = await mirrorCandidate(candidates[i], { dir: docsDir, fetcher, existing: oldByUrl.get(candidates[i].url) });
      finished++;
      if (finished % 20 === 0 || finished === candidates.length) console.log(`PDF checked ${finished}/${candidates.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));
  const mirrors = results.map(result => result.entry).filter(Boolean);
  const exclusions = candidates.flatMap((item, i) => results[i].reason ? [{ url: item.url, reason: results[i].reason, detail: results[i].detail ?? '', retained: Boolean(results[i].entry) }] : []);
  const knownUrls = new Set(candidates.map(item => item.url));
  for (const oldEntry of old.mirrors) if (!knownUrls.has(oldEntry.url) && await goodExisting(oldEntry, docsDir)) mirrors.push(oldEntry);
  mirrors.sort((a, b) => a.url.localeCompare(b.url));
  uploads.sort((a, b) => a.slug.localeCompare(b.slug) || a.file.localeCompare(b.file));
  await mkdir(docsDir, { recursive: true });
  await writeFile(manifestFile, JSON.stringify({ mirrors, uploads }, null, 2) + '\n');
  const report = { checked: candidates.length, copied: mirrors.length, bytes: mirrors.reduce((sum, item) => sum + item.bytes, 0), exclusions };
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()) {
  const report = await runMirror();
  const out = fileURLToPath(new URL('../Work/기록/W-20260929-007-mirror-report.json', import.meta.url));
  await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checked: report.checked, copied: report.copied, bytes: report.bytes, exclusions: report.exclusions.length }));
}
