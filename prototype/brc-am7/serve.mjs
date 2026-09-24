import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const siteDir = fileURLToPath(new URL('./', import.meta.url));
const imageDir = fileURLToPath(new URL('../../outputs/brc-am7-detail/images/', import.meta.url));
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/local-visual.css', ['local-visual.css', 'text/css; charset=utf-8']],
  ['/images/ptz-pictogram.svg', ['ptz-pictogram.svg', 'image/svg+xml']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/product-detail-model.mjs', ['product-detail-model.mjs', 'text/javascript; charset=utf-8']],
  ['/content.json', ['content.json', 'application/json; charset=utf-8']]
]);
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};
export function createPreviewServer({ pictogram = false } = {}) {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const imageMatch = /^\/images\/([a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp))$/.exec(pathname);
    const imageType = imageMatch?.[1].split('.').at(-1).toLowerCase();
    const route = routes.get(pathname) ?? (imageMatch ? [imageMatch[1], imageType === 'png' ? 'image/png' : imageType === 'webp' ? 'image/webp' : 'image/jpeg', true] : null);
    if (request.method !== 'GET' || !route) {
      response.writeHead(route ? 405 : 404, headers);
      response.end();
      return;
    }
    try {
      const file = (route[2] ? imageDir : siteDir) + '/' + route[0];
      let body = await readFile(file);
      if (route[0] === 'index.html') {
        body = Buffer.from(body.toString('utf8')
          .replace('<meta name="color-scheme" content="dark">', '<meta name="color-scheme" content="light">')
          .replace('</head>', '  <link rel="stylesheet" href="./local-visual.css">\n</head>')
          .replace('PRODUCT DETAIL LAB', 'LOCAL VISUAL STUDY')
          .replace('<body>', pictogram ? '<body class="pictogram-preview">' : '<body>')
          .replace('id="gallery-title">제품 이미지', pictogram ? 'id="gallery-title">제품 시각화' : 'id="gallery-title">제품 이미지')
          .replace('제조사 공식 출처', pictogram ? '제품 공식 페이지' : '제조사 공식 출처')
          .replace('로컬 시안 이미지 · 재게시 권한 미확인', pictogram ? '자체 제작 픽토그램 · 실물 사진 아님' : '로컬 시안 이미지 · 재게시 권한 미확인'));
      }
      if (pictogram && route[0] === 'content.json') {
        const content = JSON.parse(body.toString('utf8'));
        content.images = [{
          role: 'Illustration',
          file: 'ptz-pictogram.svg',
          alt: '실제 제품 사진이 아닌 자체 제작 범용 PTZ 카메라 픽토그램',
          note: '제품 사진 준비 중 · 실제 외형과 다를 수 있음',
          provider: 'AV Portal 자체 제작',
          model: '범용 PTZ 카메라',
          publicationStatus: 'CC0 1.0'
        }];
        content.presentation.galleryRightsBadge = '자체 제작 · CC0 픽토그램';
        content.presentation.galleryFootNote = '실물 사진이 아닌 범용 그림';
        content.presentation.galleryRights = '현재 그림은 BRC-AM7 실물 사진이 아닙니다. 직접 촬영한 사진이 준비되면 교체할 수 있습니다.';
        content.presentation.footerNote = 'SONY BRC-AM7 · 범용 픽토그램 시안 · 실물 사진 준비 중';
        body = Buffer.from(JSON.stringify(content));
      }
      response.writeHead(200, { ...headers, 'Content-Type': route[1] });
      response.end(body);
    } catch {
      response.writeHead(404, headers);
      response.end();
    }
  });
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const portArg = process.argv.indexOf('--port');
  const port = Number(portArg >= 0 ? process.argv[portArg + 1] : 4185);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('유효한 --port 값이 필요합니다.');
  createPreviewServer({ pictogram: process.argv.includes('--pictogram') }).listen(port, '127.0.0.1', () => {
    process.stdout.write('BRC-AM7 로컬 시안: http://127.0.0.1:' + port + '/\n');
  });
}
