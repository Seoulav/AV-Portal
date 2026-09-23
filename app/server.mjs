import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCatalog } from './catalog.mjs';
import { loadResourceIndex } from './resource-register.mjs';

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

function json(response, status, body) {
  response.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

export function createAppServer({ dataPath, resourcePath = null, publicDir = defaultPublicDir }) {
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
        json(response, 200, { as_of, counts, products });
      } catch (error) {
        json(response, 500, { error: error.message });
      }
      return;
    }

    const resourceRoute = /^\/api\/products\/([^/]+)\/resources$/.exec(url.pathname);
    if (resourceRoute) {
      let productId;
      try {
        productId = decodeURIComponent(resourceRoute[1]);
      } catch {
        json(response, 404, { error: '제품을 찾을 수 없습니다.' });
        return;
      }
      let catalog;
      try {
        catalog = await loadCatalog(dataPath);
      } catch {
        json(response, 500, { status: 'unavailable', error: '제품 목록을 읽을 수 없습니다.' });
        return;
      }
      if (!catalog.products.some(item => item.id === productId)) {
        json(response, 404, { error: '제품을 찾을 수 없습니다.' });
        return;
      }
      if (!resourcePath) {
        json(response, 200, { status: 'not_configured', product_id: productId, resources: [] });
        return;
      }
      try {
        const index = await loadResourceIndex(resourcePath, catalog);
        json(response, 200, { status: 'available', product_id: productId, resources: index.resourcesFor(productId) });
      } catch {
        json(response, 500, { status: 'unavailable', error: '자료대장을 읽을 수 없습니다.' });
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
  const resourcePath = process.env.AV_PORTAL_RESOURCE_REGISTER_PATH || null;
  const port = Number(process.env.PORT || 4173);
  const server = createAppServer({ dataPath, resourcePath });
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`AV Portal: http://127.0.0.1:${port}\n`);
  });
}
