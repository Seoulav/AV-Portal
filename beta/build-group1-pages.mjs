import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGroup1 } from '../prototype/group1/serve.mjs';
import { parseGroup1Package, buildPreviewCatalog, stripDerivedCatalogFields } from '../prototype/group1/group1-data.mjs';
import { projectPublicDetail } from './group1-public.mjs';
import { applyPublishedImages, cardImages } from './group1-images.mjs';
import { detailAssetPairs, transformDetailAsset } from './detail-asset-transforms.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = join(root, 'beta/site');
const options = {
  'brc-am7': {
    summary: '한국 공식 제품 페이지와 사용 안내·사양을 확인했습니다. 줌 용어, 일부 기능 조건과 자료 게시 권한은 검토 중입니다.',
    series: 'BRC', seriesNote: '모델 접두어이며 별도 판매 시리즈 명칭은 미확인입니다.',
    issues: [
      { code: 'C1', status: 'CONFLICTED', title: '확장 줌 용어·배율', detail: '공식 자료 간 용어가 다릅니다. 광학 20배만 확정 사양으로 표시합니다.' },
      { code: 'R1', status: 'REVIEW REQUIRED', title: '이미지·문서 게시 권한', detail: '사진·PDF·CAD의 재게시 또는 핫링크 권한은 확인되지 않았습니다.' },
      { code: 'R2', status: 'REVIEW REQUIRED', title: '기능·펌웨어 조건', detail: '일부 스트리밍과 자동 프레이밍 기능의 설정·펌웨어 조건을 확인해야 합니다.' },
      { code: 'R3', status: 'REVIEW REQUIRED', title: '기술문서·CAD', detail: 'free-d 기술문서와 CAD 자료의 개정·적용 범위가 검토 중입니다.' }
    ]
  },
  dm7: {
    summary: '공식 제품 페이지와 매뉴얼을 확인했습니다. 이미지 역할, Technical Data Sheet의 분류·개정과 자료 사용 권한은 검토 중입니다.',
    issues: [
      { code: 'R1', status: 'REVIEW REQUIRED', title: '이미지 역할·권한', detail: 'Main·Front·Perspective 방향과 이미지 재사용 권한을 확인해야 합니다.' },
      { code: 'R2', status: 'REVIEW REQUIRED', title: '문서 분류·개정', detail: '시방서와 Technical Data Sheet의 공개 URL·개정 및 Quick Documents 분류가 검토 중입니다.' }
    ]
  },
  'ki-pro-go2': {
    summary: '공식 제품 페이지와 Manual v5.0r1을 확인했습니다. 이미지 방향·해상도와 게시 권한은 검토 중입니다.',
    issues: [
      { code: 'R1', status: 'REVIEW REQUIRED', title: '제품 이미지', detail: 'Main·Front·Rear·Perspective 역할, 해상도와 재사용 권한이 확인되지 않았습니다.' },
      { code: 'R2', status: 'REVIEW REQUIRED', title: 'Quick Start Guide', detail: '추가 문서의 적용 범위와 본문 확인이 필요합니다.' },
      { code: 'M1', status: 'MISSING', title: '한국어 공식 문서', detail: '현재 확보된 자료에서 한국어 공식 문서는 확인되지 않았습니다.' }
    ]
  },
  'pt-mz17k': {
    summary: '공식 시리즈 자료에서 PT-MZ17K 모델과 일부 사양을 확인했습니다. 지역·렌즈 접미어, 물리 I/O와 이미지 상태는 검토 중입니다.',
    issues: [
      { code: 'R1', status: 'REVIEW REQUIRED', title: '모델·지역 표기', detail: '공식 제품 페이지의 L·지역 접미어가 기본 모델과 정확히 어떻게 대응하는지 확인해야 합니다.' },
      { code: 'R2', status: 'REVIEW REQUIRED', title: '물리 I/O·전원', detail: '영상·제어 커넥터 수량과 전원·크기·무게 값은 모델별 근거 확인이 필요합니다.' },
      { code: 'M1', status: 'MISSING', title: 'Rear 이미지', detail: '후면 제품 이미지는 확인되지 않았습니다.' },
      { code: 'R3', status: 'REVIEW REQUIRED', title: '이미지 권한', detail: '확인된 전면 이미지를 포함해 재게시 권한은 확인되지 않았습니다.' }
    ]
  },
  'rally-bar': {
    summary: '한국 공식 제품 페이지와 제품 사양을 확인했습니다. 이미지 역할, Mic Pod 수 표기와 지역·SKU 변형은 검토 중입니다.',
    issues: [
      { code: 'C1', status: 'CONFLICTED', title: '추가 Mic Pod 최대 수', detail: '공식 자료 간 최대 연결 수 표기가 달라 확정 수치를 표시하지 않습니다.' },
      { code: 'R1', status: 'REVIEW REQUIRED', title: '지역·SKU 변형', detail: 'No-Radio·색상·지역 품번을 기본 본체와 자동으로 합치지 않습니다.' },
      { code: 'R2', status: 'REVIEW REQUIRED', title: '이미지 역할·권한', detail: 'Front·Rear 등 방향과 이미지 재사용 권한이 확인되지 않았습니다.' }
    ]
  }
};
const normalizeSlug = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
// 로컬 패키지 파일명은 제품마다 구분자가 달라 slug를 정규화해 맞춘다.
async function packageFilenames(dir) {
  const found = new Map();
  for (const name of await readdir(dir)) {
    const match = /^(.+)_PRODUCT_DETAIL_DATA\.md$/i.exec(name);
    if (!match) continue;
    const key = normalizeSlug(match[1]);
    if (found.has(key)) throw new Error(`로컬 패키지 파일명이 중복됩니다: ${name}`);
    found.set(key, name);
  }
  return found;
}
const index = process.argv.indexOf('--packages');
const packagesDir = index >= 0 ? process.argv[index + 1] : process.env.AV_PORTAL_GROUP1_PACKAGES;
if (!packagesDir) throw new Error('로컬 Group 1 패키지 폴더를 --packages로 지정하세요.');
// 기준 25개는 파생 필드를 뺀 형태로 고정한다. 재생성해도 이 해시는 바뀌지 않는다.
const baseline = JSON.parse(await readFile(join(site, 'catalog.json'), 'utf8')).slice(0, 25).map(stripDerivedCatalogFields);
assert.equal(baseline.length, 25);
assert.equal(createHash('sha256').update(JSON.stringify(baseline)).digest('hex').toUpperCase(), '5A330BBEC27FA2CCA38B619984C4707C17F097BB67C11A17097772DBAD5AE212');
const filenames = await packageFilenames(packagesDir);
const products = await loadGroup1(packagesDir);
const brcFile = filenames.get(normalizeSlug('brc-am7'));
if (!brcFile) throw new Error('BRC-AM7 로컬 패키지를 찾지 못했습니다.');
const rawBrc = parseGroup1Package(await readFile(join(packagesDir, brcFile), 'utf8'));
products.get('brc-am7').imageStatuses = rawBrc.imageStatuses;
const publicProducts = new Map([...products].map(([slug, product]) => [slug, projectPublicDetail(product, options[slug])]));
const brc = publicProducts.get('brc-am7');
assert.equal(brc.model, 'BRC-AM7');
assert.deepEqual(brc.images, []);
for (const [slug, product] of publicProducts) applyPublishedImages(product, slug);
const slugByProduct = new Map([...publicProducts].map(([slug, product]) => [product, slug]));
const catalog = buildPreviewCatalog(baseline, [...publicProducts.values()], {
  slugOf: product => slugByProduct.get(product) ?? null,
  cardImageOf: product => cardImages[slugByProduct.get(product)] ?? null
});
assert.equal(catalog.length, 27);
assert.equal(catalog.filter(item => item.slug).length, publicProducts.size);
await mkdir(join(site, 'detail/data'), { recursive: true });
await writeFile(join(site, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n', 'utf8');
for (const [slug, product] of publicProducts) await writeFile(join(site, 'detail/data', `${slug}.json`), JSON.stringify(product, null, 2) + '\n', 'utf8');
for (const [source, generated, kind] of detailAssetPairs) {
  const content = await readFile(join(root, source), 'utf8');
  await writeFile(join(root, generated), transformDetailAsset(content, kind), 'utf8');
}
console.log('Group 1 Pages bundle: 27 Library entries, five details, 13 reviewed official images, no PDF binaries.');
