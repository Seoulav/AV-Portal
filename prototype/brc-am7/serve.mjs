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
export function createPreviewServer() {
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
          .replace('PRODUCT DETAIL LAB', 'LOCAL VISUAL STUDY'));
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
  createPreviewServer().listen(port, '127.0.0.1', () => {
    process.stdout.write('BRC-AM7 로컬 시안: http://127.0.0.1:' + port + '/\n');
  });
}
