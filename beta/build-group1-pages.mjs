import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGroup1 } from '../prototype/group1/serve.mjs';
import { parseGroup1Package, buildPreviewCatalog } from '../prototype/group1/group1-data.mjs';
import { projectPublicDetail } from './group1-public.mjs';

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
const filenames = new Map([
  ['brc-am7', 'BRC-AM7_PRODUCT_DETAIL_DATA.md'], ['dm7', 'DM7_PRODUCT_DETAIL_DATA.md'],
  ['ki-pro-go2', 'KI_PRO_GO2_PRODUCT_DETAIL_DATA.md'], ['pt-mz17k', 'PT-MZ17K_PRODUCT_DETAIL_DATA.md'],
  ['rally-bar', 'RALLY_BAR_PRODUCT_DETAIL_DATA.md']
]);
const index = process.argv.indexOf('--packages');
const packagesDir = index >= 0 ? process.argv[index + 1] : process.env.AV_PORTAL_GROUP1_PACKAGES;
if (!packagesDir) throw new Error('로컬 Group 1 패키지 폴더를 --packages로 지정하세요.');
const baseline = JSON.parse(await readFile(join(site, 'catalog.json'), 'utf8')).slice(0, 25);
assert.equal(baseline.length, 25);
assert.equal(createHash('sha256').update(JSON.stringify(baseline)).digest('hex').toUpperCase(), '5A330BBEC27FA2CCA38B619984C4707C17F097BB67C11A17097772DBAD5AE212');
const products = await loadGroup1(packagesDir);
const rawBrc = parseGroup1Package(await readFile(join(packagesDir, filenames.get('brc-am7')), 'utf8'));
products.get('brc-am7').imageStatuses = rawBrc.imageStatuses;
const publicProducts = new Map([...products].map(([slug, product]) => [slug, projectPublicDetail(product, options[slug])]));
const catalog = buildPreviewCatalog(baseline, [...publicProducts.values()]);
assert.equal(catalog.length, 27);
await mkdir(join(site, 'detail/data'), { recursive: true });
await writeFile(join(site, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n', 'utf8');
for (const [slug, product] of publicProducts) await writeFile(join(site, 'detail/data', `${slug}.json`), JSON.stringify(product, null, 2) + '\n', 'utf8');
await copyFile(join(root, 'prototype/brc-am7/styles.css'), join(site, 'detail/styles.css'));
await copyFile(join(root, 'prototype/brc-am7/product-detail-model.mjs'), join(site, 'detail/product-detail-model.mjs'));
await copyFile(join(root, 'prototype/group1/group1-links.js'), join(site, 'detail-links.js'));
await copyFile(join(root, 'prototype/group1/group1.css'), join(site, 'detail-links.css'));
const libraryHtml = await readFile(join(root, 'beta/site/index.html'), 'utf8');
await writeFile(join(site, 'index.html'), libraryHtml
  .replace('<script type="module" src="./app.js"></script>', libraryHtml.includes('detail-links.js') ? '<script type="module" src="./app.js"></script>' : '<script type="module" src="./app.js"></script>\n  <script type="module" src="./detail-links.js"></script>')
  .replace('<link rel="stylesheet" href="./styles.css">', libraryHtml.includes('detail-links.css') ? '<link rel="stylesheet" href="./styles.css">' : '<link rel="stylesheet" href="./styles.css">\n  <link rel="stylesheet" href="./detail-links.css">'), 'utf8');
const prototypeHtml = await readFile(join(root, 'prototype/brc-am7/index.html'), 'utf8');
await writeFile(join(site, 'detail/index.html'), prototypeHtml
  .replaceAll('Product Detail 시안', 'Product Detail Beta')
  .replaceAll('https://seoulav.github.io/AV-Portal/', '../')
  .replaceAll('PRODUCT DETAIL LAB', 'PRODUCT DETAIL')
  .replaceAll('LOCAL PREVIEW', 'PUBLIC BETA')
  .replaceAll('공개 Library', 'Library')
  .replaceAll('로컬 이미지가 없습니다', '게시된 이미지가 없습니다')
  .replaceAll('로컬 시안 이미지', '공식 제품 이미지')
  .replaceAll('AV PORTAL · PRODUCT DETAIL LOCAL STUDY', 'AV PORTAL · PRODUCT DETAIL BETA'), 'utf8');
const prototypeApp = await readFile(join(root, 'prototype/brc-am7/app.js'), 'utf8');
await writeFile(join(site, 'detail/app.js'), prototypeApp
  .replace('Product Detail 시안', 'Product Detail')
  .replace('시안 콘텐츠를 읽을 수 없습니다.', '제품 상세 데이터를 읽을 수 없습니다.')
  .replace('제품의 로컬 검토본입니다. 공개 사이트와 별도로 검토합니다.', '제품의 공개 Beta 상세페이지입니다. 검토 중인 항목은 상태를 확인해 주세요.')
  .replaceAll('로컬 이미지 없음', '게시 이미지 없음')
  .replaceAll('로컬 표시 파일 없음', '게시 이미지 없음'), 'utf8');
console.log('Group 1 Pages bundle: 27 Library entries, five public-safe details, no image/PDF binaries.');
