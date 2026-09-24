import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGroup1Package, buildPreviewCatalog } from './group1-data.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const files = {
  '/styles.css': ['beta/site/styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['beta/site/app.js', 'text/javascript; charset=utf-8'],
  '/group1-links.js': ['prototype/group1/group1-links.js', 'text/javascript; charset=utf-8'],
  '/group1.css': ['prototype/group1/group1.css', 'text/css; charset=utf-8'],
  '/detail/app.js': ['prototype/brc-am7/app.js', 'text/javascript; charset=utf-8'],
  '/detail/styles.css': ['prototype/brc-am7/styles.css', 'text/css; charset=utf-8'],
  '/detail/product-detail-model.mjs': ['prototype/brc-am7/product-detail-model.mjs', 'text/javascript; charset=utf-8']
};
const packageNames = new Map([
  ['brc-am7', 'BRC-AM7_PRODUCT_DETAIL_DATA.md'],
  ['dm7', 'DM7_PRODUCT_DETAIL_DATA.md'],
  ['ki-pro-go2', 'KI_PRO_GO2_PRODUCT_DETAIL_DATA.md'],
  ['pt-mz17k', 'PT-MZ17K_PRODUCT_DETAIL_DATA.md'],
  ['rally-bar', 'RALLY_BAR_PRODUCT_DETAIL_DATA.md']
]);
const mediaTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
};
function getArg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
}
export async function loadGroup1(packagesDir) {
  const products = new Map();
  for (const [slug, filename] of packageNames) {
    const markdown = await readFile(join(packagesDir, filename), 'utf8');
    products.set(slug, parseGroup1Package(markdown));
  }
  const brc = products.get('brc-am7');
  const visual = JSON.parse(await readFile(join(root, 'prototype/brc-am7/content.json'), 'utf8'));
  const coreTypes = new Set(brc.documents.map(item => item.type));
  products.set('brc-am7', {
    ...brc,
    packageStatus: 'READY FOR CODEX',
    images: visual.images,
    imageStatuses: [],
    documents: [...brc.documents, ...visual.documents.filter(item => !coreTypes.has(item.type))],
    sources: visual.sources,
    issues: visual.issues,
    presentation: visual.presentation,
    seriesNote: visual.seriesNote
  });
  return products;
}
export async function createGroup1Server({ packagesDir, imagesDir }) {
  const products = await loadGroup1(packagesDir);
  const publicCatalog = JSON.parse(await readFile(join(root, 'beta/site/catalog.json'), 'utf8'));
  const catalog = buildPreviewCatalog(publicCatalog, [...products.values()]);
  return createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const path = url.pathname;
    if (request.method !== 'GET') { response.writeHead(405, headers).end(); return; }
    try {
      let body;
      let type = 'text/html; charset=utf-8';
      if (path === '/' || path === '/index.html') {
        body = (await readFile(join(root, 'beta/site/index.html'), 'utf8'))
          .replace('<script type="module" src="./app.js"></script>', '<script type="module" src="./app.js"></script>\n  <script type="module" src="./group1-links.js"></script>')
          .replace('<link rel="stylesheet" href="./styles.css">', '<link rel="stylesheet" href="./styles.css">\n  <link rel="stylesheet" href="./group1.css">')
          .replace('공개 베타 검토본', 'Group 1 로컬 검토본')
          .replace('현재 공개 범위를 검토하는 베타 화면입니다.', 'Group 1 로컬 검토본입니다. 공개 사이트에는 반영되지 않았습니다.');
      } else if (path === '/catalog.json') { body = JSON.stringify(catalog); type = 'application/json; charset=utf-8'; }
      else if (path === '/detail/' || path === '/detail/index.html') {
        body = (await readFile(join(root, 'prototype/brc-am7/index.html'), 'utf8'))
          .replaceAll('https://seoulav.github.io/AV-Portal/', '/');
      } else if (path === '/detail/content.json') {
        const product = products.get(url.searchParams.get('product'));
        if (!product) { response.writeHead(404, headers).end(); return; }
        body = JSON.stringify(product); type = 'application/json; charset=utf-8';
      } else if (files[path]) {
        body = await readFile(join(root, files[path][0])); type = files[path][1];
      } else {
        const image = /^\/detail\/images\/([a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp))$/.exec(path);
        if (!image || !imagesDir) { response.writeHead(404, headers).end(); return; }
        body = await readFile(join(imagesDir, image[1])); type = mediaTypes[image[2]];
      }
      response.writeHead(200, { ...headers, 'Content-Type': type }).end(body);
    } catch {
      response.writeHead(404, headers).end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const packagesDir = getArg('--packages', process.env.AV_PORTAL_GROUP1_PACKAGES);
  const imagesDir = getArg('--brc-images', process.env.AV_PORTAL_BRC_IMAGES);
  const port = Number(getArg('--port', 4186));
  if (!packagesDir || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('--packages <Group 1 로컬 패키지 폴더>와 유효한 --port가 필요합니다.');
  const server = await createGroup1Server({ packagesDir, imagesDir });
  server.listen(port, '127.0.0.1', () => process.stdout.write(`Group 1 로컬 검토본: http://127.0.0.1:${port}/\n`));
}
