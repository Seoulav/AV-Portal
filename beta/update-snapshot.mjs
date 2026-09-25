// 공개 산출물의 고정값(해시·건수)을 다시 계산해 beta/public-snapshot.json에 쓴다.
// 공개 데이터를 의도적으로 바꾼 뒤에만 실행하고, 결과 차이를 PR에서 확인한다.
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { stripDerivedCatalogFields } from '../prototype/group1/group1-data.mjs';

const site = new URL('./site/', import.meta.url);
export const snapshotPath = new URL('./public-snapshot.json', import.meta.url);
export const hashText = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex').toUpperCase();

export async function computeSnapshot() {
  const raw = await readFile(new URL('catalog.json', site), 'utf8');
  const catalog = JSON.parse(raw);
  const detailDir = new URL('detail/data/', site);
  const details = {};
  for (const name of (await readdir(detailDir)).sort()) {
    const slug = name.replace(/\.json$/, '');
    const content = await readFile(new URL(name, detailDir), 'utf8');
    const product = JSON.parse(content);
    details[slug] = {
      sha256: hashText(content),
      features: product.features.length,
      specifications: product.specifications.length,
      io: product.io.length
    };
  }
  return {
    note: '공개 산출물 고정값. beta/update-snapshot.mjs로 다시 만든다.',
    catalog: {
      count: catalog.length,
      sha256: hashText(raw),
      baselineCount: 25,
      baselineSha256: hashText(JSON.stringify(catalog.slice(0, 25).map(stripDerivedCatalogFields)))
    },
    details
  };
}

export async function readSnapshot() {
  return JSON.parse(await readFile(snapshotPath, 'utf8'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const snapshot = await computeSnapshot();
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  process.stdout.write(`public-snapshot.json 갱신: 카탈로그 ${snapshot.catalog.count}건, 상세 ${Object.keys(snapshot.details).length}건\n`);
}
