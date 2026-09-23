import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCatalog } from './catalog.mjs';

const defaultPublicDir = join(dirname(fileURLToPath(import.meta.url)), 'public');
const fixedRoutes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/catalog-view.mjs', ['catalog-view.mjs', 'text/javascript; charset=utf-8']]
]);
const securityHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};

export function createAppServer({ dataPath, publicDir = defaultPublicDir }) {
  return createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (request.method !== 'GET') {
      response.writeHead(405, { ...securityHeaders, Allow: 'GET' });
      response.end();
      return;
    }
    if (url.pathname === '/api/catalog') {
      try {
        const { as_of, counts, products } = await loadCatalog(dataPath);
        response.writeHead(200, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ as_of, counts, products }));
      } catch (error) {
        response.writeHead(500, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: error.message }));
      }
      return;
    }
    const asset = fixedRoutes.get(url.pathname);
    if (!asset) {
      response.writeHead(404, securityHeaders);
      response.end();
      return;
    }
    try {
      const body = await readFile(join(publicDir, asset[0]));
      response.writeHead(200, { ...securityHeaders, 'Content-Type': asset[1] });
      response.end(body);
    } catch {
      response.writeHead(500, securityHeaders);
      response.end('화면 파일을 읽을 수 없습니다.');
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const dataPath = process.env.AV_PORTAL_PRODUCT_LIST_PATH ||
    resolve('outputs/research-master-20260923/AV_Portal_Product_List_2026-09-23.json');
  const port = Number(process.env.PORT || 4173);
  const server = createAppServer({ dataPath });
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`AV Portal: http://127.0.0.1:${port}\n`);
  });
}
