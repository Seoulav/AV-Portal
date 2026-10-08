import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

// jsPDF가 필요할 때만 불러오는 선택 모듈. 도면 내보내기는 쓰지 않으므로 빈 모듈로 바꿔 번들에서 뺀다(B-20261006-10)
const UNUSED_PDF_FEATURE = fileURLToPath(new URL('./src/export/unusedPdfFeature.ts', import.meta.url));

export default defineConfig({
  base: '/AV-Portal/builder/',
  plugins: [react(), localLibrary()],
  resolve: { alias: { canvg: UNUSED_PDF_FEATURE, html2canvas: UNUSED_PDF_FEATURE, dompurify: UNUSED_PDF_FEATURE } },
  build: { outDir: 'dist', sourcemap: false, emptyOutDir: true },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
