import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RTCOM_PUBLIC_BASE, validateRtcomIndex } from './site/shared/rtcom-adapter.mjs';

export const RTCOM_INDEX_URL = `${RTCOM_PUBLIC_BASE}data/products/index.json`;
const defaultDestination = fileURLToPath(new URL('./site/rtcom/', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const safeFilename = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && !value.includes('..');
const posix = value => value.split(sep).join('/');
const exists = async path => { try { await access(path); return true; } catch { return false; } };

async function fetchBytes(url, label, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response?.ok) throw new Error(`${label} 다운로드 실패: ${response?.status ?? '응답 없음'}`);
  return Buffer.from(await response.arrayBuffer());
}

function parseJson(bytes, label) {
  try { return JSON.parse(bytes.toString('utf8')); }
  catch (error) { throw new Error(`${label} JSON 파싱 실패: ${error.message}`); }
}

function fileRecord(bytes) {
  return { sha256: sha256(bytes), bytes: bytes.length };
}

async function writeCandidateFile(root, relative, bytes, records) {
  const target = join(root, ...relative.split('/'));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
  records[relative] = fileRecord(bytes);
}

function sortedObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

async function buildCandidate({ root, indexUrl, sourceRoot, fetchImpl, existingSlugs }) {
  const records = {};
  const indexBytes = await fetchBytes(indexUrl, 'RTCOM index', fetchImpl);
  const index = parseJson(indexBytes, 'RTCOM index');
  const validated = validateRtcomIndex(index, { existingSlugs });
  await writeCandidateFile(root, 'raw/index.json', indexBytes, records);

  const imageFiles = new Set();
  for (const product of validated.products) {
    const detailRelative = index.detailPath.replace('{id}', product.id);
    const detailUrl = new URL(detailRelative, sourceRoot).href;
    const detailBytes = await fetchBytes(detailUrl, `RTCOM detail ${product.id}`, fetchImpl);
    const detail = parseJson(detailBytes, `RTCOM detail ${product.id}`);
    if (detail.id !== product.id || detail.manufacturer !== 'RTCOM') throw new Error(`RTCOM detail 식별 불일치: ${product.id}`);
    if (product.cardImage) imageFiles.add(product.cardImage);
    for (const image of detail.images ?? []) imageFiles.add(image.file);
    await writeCandidateFile(root, `raw/products/${product.id}.json`, detailBytes, records);
  }

  for (const file of [...imageFiles].sort()) {
    if (!safeFilename(file)) throw new Error(`RTCOM 이미지 파일명 형식 오류: ${file ?? ''}`);
    const imageRelative = index.imagePath.replace('{file}', file);
    const bytes = await fetchBytes(new URL(imageRelative, sourceRoot).href, `RTCOM image ${file}`, fetchImpl);
    if (!bytes.length) throw new Error(`RTCOM image ${file} 내용이 비어 있습니다.`);
    await writeCandidateFile(root, `images/${file}`, bytes, records);
  }

  const manifest = {
    schema: 'avportal.rtcom-sync.v1',
    source: {
      indexUrl,
      sourceRoot,
      schema: index.schema,
      sourceProductCount: validated.sourceCount,
      publishedProductCount: validated.products.length,
      index: fileRecord(indexBytes)
    },
    excluded: validated.excluded.map(product => ({ id: product.id, model: product.model })),
    products: validated.products.map(product => product.id),
    files: sortedObject(records)
  };
  await writeFile(join(root, 'SYNC.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export async function verifyRtcomSnapshot(root = defaultDestination, { existingSlugs = [] } = {}) {
  const manifest = parseJson(await readFile(join(root, 'SYNC.json')), 'RTCOM SYNC');
  if (manifest.schema !== 'avportal.rtcom-sync.v1') throw new Error('RTCOM SYNC schema가 올바르지 않습니다.');
  const indexBytes = await readFile(join(root, 'raw', 'index.json'));
  assertRecord(indexBytes, manifest.source.index, 'raw/index.json');
  const index = parseJson(indexBytes, 'RTCOM index');
  const validated = validateRtcomIndex(index, { existingSlugs });
  if (manifest.source.sourceProductCount !== validated.sourceCount || manifest.source.publishedProductCount !== validated.products.length) throw new Error('RTCOM 제품 수 매니페스트 불일치');
  if (JSON.stringify(manifest.products) !== JSON.stringify(validated.products.map(product => product.id))) throw new Error('RTCOM 제품 목록 매니페스트 불일치');
  for (const [relative, expected] of Object.entries(manifest.files ?? {})) {
    const bytes = await readFile(join(root, ...relative.split('/')));
    assertRecord(bytes, expected, relative);
  }
  for (const product of validated.products) {
    if (!manifest.files[`raw/products/${product.id}.json`]) throw new Error(`RTCOM 상세 매니페스트 누락: ${product.id}`);
    const detail = parseJson(await readFile(join(root, 'raw', 'products', `${product.id}.json`)), `RTCOM detail ${product.id}`);
    if (detail.id !== product.id || detail.manufacturer !== 'RTCOM') throw new Error(`RTCOM detail 식별 불일치: ${product.id}`);
    const images = new Set([product.cardImage, ...(detail.images ?? []).map(image => image.file)].filter(Boolean));
    for (const file of images) if (!manifest.files[`images/${file}`]) throw new Error(`RTCOM 이미지 매니페스트 누락: ${file}`);
  }
  return { manifest, index, products: validated.products, excluded: validated.excluded };
}

function assertRecord(bytes, expected, label) {
  if (!expected || expected.bytes !== bytes.length || expected.sha256 !== sha256(bytes)) throw new Error(`RTCOM 파일 SHA/바이트 불일치: ${label}`);
}

async function manifestsEqual(leftRoot, rightRoot) {
  try {
    const [left, right] = await Promise.all([readFile(join(leftRoot, 'SYNC.json')), readFile(join(rightRoot, 'SYNC.json'))]);
    return left.equals(right);
  } catch { return false; }
}

async function promoteCandidate(candidate, destination, moveImpl) {
  const backup = `${destination}.backup-${randomUUID()}`;
  const hadLive = await exists(destination);
  let backedUp = false;
  try {
    if (hadLive) { await moveImpl(destination, backup); backedUp = true; }
    await moveImpl(candidate, destination);
    if (backedUp) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (backedUp) {
      if (await exists(destination)) await rm(destination, { recursive: true, force: true });
      await moveImpl(backup, destination);
    }
    throw error;
  } finally {
    if (await exists(candidate)) await rm(candidate, { recursive: true, force: true });
    if (await exists(backup)) await rm(backup, { recursive: true, force: true });
  }
}

export async function syncRtcom({
  destination = defaultDestination,
  indexUrl = RTCOM_INDEX_URL,
  sourceRoot = RTCOM_PUBLIC_BASE,
  fetchImpl = fetch,
  existingSlugs = [],
  moveImpl = rename
} = {}) {
  const absoluteDestination = resolve(destination);
  const parent = dirname(absoluteDestination);
  await mkdir(parent, { recursive: true });
  const candidate = await mkdtemp(join(parent, '.rtcom-candidate-'));
  try {
    const manifest = await buildCandidate({ root: candidate, indexUrl, sourceRoot, fetchImpl, existingSlugs });
    await verifyRtcomSnapshot(candidate, { existingSlugs });
    if (await manifestsEqual(candidate, absoluteDestination)) {
      await verifyRtcomSnapshot(absoluteDestination, { existingSlugs });
      await rm(candidate, { recursive: true, force: true });
      return { changed: false, sourceCount: manifest.source.sourceProductCount, publishedCount: manifest.source.publishedProductCount, excluded: manifest.excluded, failures: 0 };
    }
    await promoteCandidate(candidate, absoluteDestination, moveImpl);
    return { changed: true, sourceCount: manifest.source.sourceProductCount, publishedCount: manifest.source.publishedProductCount, excluded: manifest.excluded, failures: 0 };
  } catch (error) {
    if (await exists(candidate)) await rm(candidate, { recursive: true, force: true });
    throw error;
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const result = check ? await verifyRtcomSnapshot(defaultDestination) : await syncRtcom();
  if (check) console.log(`RTCOM snapshot check OK (${result.manifest.source.publishedProductCount} published / ${result.manifest.source.sourceProductCount} source)`);
  else console.log(JSON.stringify(result));
}
