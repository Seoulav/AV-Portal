import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/catalog.html', ['catalog.html', 'text/html; charset=utf-8']],
  ['/llms.txt', ['llms.txt', 'text/plain; charset=utf-8']],
  ['/catalog.json', ['catalog.json', 'application/json; charset=utf-8']]
]);
const headers = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};

export function createPreviewServer(dir) {
  if (typeof dir !== 'string' || !dir.trim()) throw new Error('배포본 폴더가 필요합니다.');
  const base = resolve(dir);
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const asset = routes.get(pathname);
    if (request.method !== 'GET' || !asset) {
      response.writeHead(asset ? 405 : 404, headers);
      response.end();
      return;
    }
    try {
      const body = await readFile(join(base, asset[0]));
      response.writeHead(200, { ...headers, 'Content-Type': asset[1] });
      response.end(body);
    } catch {
      response.writeHead(404, headers);
      response.end();
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = Object.fromEntries(process.argv.slice(2).filter((_, i) => i % 2 === 0)
    .map((key, i) => [key, process.argv[3 + i * 2]]));
  const port = Number(args['--port'] ?? 4174);
  if (!args['--dir'] || !Number.isInteger(port) || port < 1 || port > 65535) {
    process.stderr.write('사용법: node beta/serve.mjs --dir <생성된 site 폴더> [--port 4174]\n');
    process.exitCode = 1;
  } else {
    createPreviewServer(args['--dir']).listen(port, '127.0.0.1', () => {
      process.stdout.write(`로컬 베타 미리보기: http://127.0.0.1:${port}/\n`);
    });
  }
}
