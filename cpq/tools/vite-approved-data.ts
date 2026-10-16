/**
 * `data/approved/`를 dev와 build에서 **같은 상대 경로**로 읽히게 한다 (단계 3-A Task 0).
 *
 * 앱은 `${import.meta.env.BASE_URL}data/approved/products.json`으로 읽는다.
 * 빌드 타임 `import`를 쓰지 않는 이유는 결정 D3이다 — 배포 자료를 번들에 박지 않는다.
 *
 * `publicDir`을 `data`로 바꾸지 않는 이유: 기존 `public/`이 죽는다.
 * 대신 플러그인 두 갈래로 처리한다.
 *
 *   dev   — 미들웨어가 `/data/approved/*`를 디스크에서 바로 내준다
 *   build — `closeBundle`에서 `dist/data/approved/`로 복사한다
 *
 * ## 판매 단가는 배포하지 않는다 (B-20261016-06)
 *
 * `prices.json`은 저장소·Pages에서 뺐다. 판매가·원가는 직원이 「가격표 불러오기」로
 * 이 브라우저에만 저장한다(LED 구성기 방식). 누가 로컬에 `prices.json`을 다시
 * 만들어 두어도 **dev 서버는 내주지 않고(404), build는 멈춘다** — 공개 웹에 다시
 * 올라가지 않게 한다.
 */
import { copyFileSync, existsSync, mkdirSync, createReadStream } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import type { Plugin } from 'vite';

const SOURCE_DIR = 'data/approved';
const URL_PREFIX = '/data/approved/';

/**
 * 배포하면 안 되는 파일 — 가격(판매 단가·원가). dev 서버는 404로 답하고,
 * build는 이 파일이 원본 폴더에 있으면 멈춘다(B-20261016-06).
 */
export const FORBIDDEN_APPROVED_FILES: readonly string[] = ['prices.json'];

/** 반드시 있어야 하는 파일. 없으면 빌드를 멈춘다. */
const REQUIRED = ['products.json', 'labor-items.json', 'wage-table.json', 'labor-mappings.json'];

export function approvedDataPlugin(root = process.cwd()): Plugin {
  const sourcePath = resolve(root, SOURCE_DIR);

  // `vite-node`로 스크립트를 돌릴 때도 `closeBundle`이 불린다. `apply: 'build'`를 쓰면
  // dev 미들웨어까지 꺼지므로, 명령을 보고 복사만 건너뛴다.
  let isBuild = false;

  return {
    name: 'avcpq-approved-data',

    configResolved(config) {
      isBuild = config.command === 'build';
    },

    // --- dev: 디스크에서 바로 내준다 ---
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === undefined || !url.startsWith(URL_PREFIX)) {
          next();
          return;
        }
        const name = url.slice(URL_PREFIX.length);
        // 경로 탈출 방지 — 파일 이름만 받는다.
        if (name === '' || name.includes('/') || name.includes('\\') || name.includes('..')) {
          res.statusCode = 400;
          res.end();
          return;
        }
        const file = join(sourcePath, name);
        // 가격 파일은 로컬에 있어도 내주지 않는다(B-20261016-06).
        if (FORBIDDEN_APPROVED_FILES.includes(name) || !existsSync(file)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader(
          'Content-Type',
          extname(name) === '.json' ? 'application/json; charset=utf-8' : 'application/octet-stream',
        );
        // 배포 데이터는 버전이 바뀌면 파일 내용이 바뀐다. dev에서는 캐시하지 않는다.
        res.setHeader('Cache-Control', 'no-store');
        createReadStream(file).pipe(res);
      });
    },

    // --- build: dist로 복사한다 ---
    closeBundle: {
      sequential: true,
      handler() {
        if (!isBuild) return;

        const outDir = resolve(root, 'dist', SOURCE_DIR);

        const forbidden = FORBIDDEN_APPROVED_FILES.filter((name) => existsSync(join(sourcePath, name)));
        if (forbidden.length > 0) {
          throw new Error(
            `배포하면 안 되는 가격 파일이 있다: ${forbidden.map((n) => `${SOURCE_DIR}/${n}`).join(', ')}
` +
              '판매 단가·원가는 「가격표 불러오기」로 브라우저에만 저장한다(B-20261016-06). 이 파일을 지운다.',
          );
        }

        const missing = REQUIRED.filter((name) => !existsSync(join(sourcePath, name)));
        if (missing.length > 0) {
          throw new Error(
            `배포 데이터가 없다: ${missing.join(', ')}\n` +
              `먼저 \`npm run build:approved\`를 돌린다.`,
          );
        }

        mkdirSync(outDir, { recursive: true });
        for (const name of REQUIRED) {
          copyFileSync(join(sourcePath, name), join(outDir, name));
        }
        // eslint-disable-next-line no-console
        console.log(
          `\n배포 데이터 ${REQUIRED.length}개 복사: ${REQUIRED.join(', ')} ` +
            '(판매 단가 없음 — 가격표는 브라우저에서 불러온다, B-20261016-06)',
        );
      },
    },
  };
}
