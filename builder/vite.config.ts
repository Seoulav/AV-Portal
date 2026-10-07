import { readFileSync } from 'node:fs';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// 배포에서는 Pages 작업이 /AV-Portal/builder-library.json을 만든다.
// 개발·미리보기 서버에서는 같은 주소로 로컬 생성본(beta/.generated)을 내준다. npm run dev·preview가 먼저 생성한다.
const LIBRARY_PATH = '/AV-Portal/builder-library.json';
const LOCAL_LIBRARY = new URL('../beta/.generated/builder-library.json', import.meta.url);

function localLibrary(): Plugin {
  const serve = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use(LIBRARY_PATH, (_request, response) => {
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(readFileSync(LOCAL_LIBRARY));
    });
  };
  return { name: 'av-portal-local-library', configureServer: serve, configurePreviewServer: serve };
}

export default defineConfig({
  base: '/AV-Portal/builder/',
  plugins: [react(), localLibrary()],
  build: { outDir: 'dist', sourcemap: false, emptyOutDir: true },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
