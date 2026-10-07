// 브라우저 시험(B-20261006-05). 빌드한 앱(dist)을 vite preview로 열고, 장비 라이브러리는 합성 픽스처로 바꿔 끼운다.
// 브라우저는 설치된 Chrome을 쓴다(GitHub Ubuntu 실행기에도 있다). 다른 브라우저는 PW_CHANNEL로 바꾼다.
//   npm run build && npm run e2e
import { defineConfig } from '@playwright/test';

const PORT = 4319;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/AV-Portal/builder/`,
    channel: process.env.PW_CHANNEL ?? 'chrome',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    // 지금 돌고 있는 node를 그대로 쓴다(PATH에 node가 없는 셸에서도 뜨게)
    command: `${JSON.stringify(process.execPath)} node_modules/vite/bin/vite.js preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/AV-Portal/builder/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
