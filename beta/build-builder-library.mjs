// Builder 결선용 라이브러리 생성.
//   node beta/build-builder-library.mjs [--out <경로>] [--report]
// 결과는 저장소에 커밋하지 않는다. Pages 배포 때 beta/site/builder-library.json으로 만든다(B-20261006-02 D-a).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildBuilderLibrary, libraryReport, serializeLibrary } from './builder-library.mjs';
import { validateRtcomIndex } from './site/shared/rtcom-adapter.mjs';

const site = new URL('./site/', import.meta.url);
export const DEFAULT_OUT = new URL('./.generated/builder-library.json', import.meta.url);

export async function readLibraryInputs() {
  const catalogRaw = await readFile(new URL('catalog.json', site), 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const details = new Map();
  for (const item of catalog.filter(entry => entry.kind === 'equipment' && entry.slug)) {
    details.set(item.slug, await readFile(new URL(`detail/data/${item.slug}.json`, site), 'utf8'));
  }
  const rtcomIndexRaw = await readFile(new URL('rtcom/raw/index.json', site), 'utf8');
  // 검색 인덱스(build-search-index.mjs)와 같은 기준: 목록의 모든 slug와 겹치지 않아야 한다
  const { products } = validateRtcomIndex(JSON.parse(rtcomIndexRaw), { existingSlugs: catalog.map(entry => entry.slug).filter(Boolean) });
  const rtcomIds = products.map(product => product.id);
  const rtcomProducts = new Map();
  for (const id of rtcomIds) rtcomProducts.set(id, await readFile(new URL(`rtcom/raw/products/${id}.json`, site), 'utf8'));
  return { catalogRaw, details, rtcomIndexRaw, rtcomProducts, rtcomIds };
}

export async function expectedBuilderLibrary() {
  return buildBuilderLibrary(await readLibraryInputs());
}

function formatReport(report) {
  const pct = (part, whole) => `${((part / whole) * 100).toFixed(1)}%`;
  const lines = [
    `제품 ${report.products} · I/O 행 ${report.ioRows} · 단자 ${report.ports}`,
    `행: 단자 ${report.rows.port} (${pct(report.rows.port, report.ioRows)}) · 확인 필요 ${report.rows.review} · 무선 ${report.rows.wireless} · 미지원 ${report.rows.unsupported} · 슬롯 ${report.rows.slot} · 서비스 ${report.rows.service}`,
    `제품: 단자 있음 ${report.productsWithPorts} (모두 해결 ${report.productsAllResolved} · 일부 확인 필요 ${report.productsPartial}) · I/O 있으나 단자 0 ${report.productsNoPort} · I/O 없음 ${report.productsNoIo}`,
    `확인 필요 사유: ${Object.entries(report.reviewByReason).map(([reason, count]) => `${reason} ${count}`).join(' · ')}`,
    `제품 이슈: ${Object.entries(report.productIssues).map(([code, count]) => `${code} ${count}`).join(' · ') || '없음'}`,
    `확인 필요 제조사: ${Object.entries(report.reviewByBrand).map(([brand, count]) => `${brand} ${count}`).join(' · ')}`,
  ];
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  if (outIndex >= 0 && !args[outIndex + 1]) throw new Error('--out 다음에 파일 경로가 필요하다');
  const out = outIndex >= 0 ? resolve(args[outIndex + 1]) : fileURLToPath(DEFAULT_OUT);
  const library = await expectedBuilderLibrary();
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, serializeLibrary(library));
  console.log(`builder-library.json 생성: ${out}`);
  if (args.includes('--report')) console.log(formatReport(libraryReport(library)));
}
