// Local-only Group 1 preview. Manufacturer image bytes live under ignored outputs/.
import { createServer } from 'node:http';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, join, extname } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = join(root, 'beta/site');
const photos = join(root, 'outputs/product-detail-preview/images');
const picture = (role, file, model, sourceUrl, status = 'REVIEW REQUIRED') => ({
  role, file, alt: `${model} ${role} 제조사 공식 이미지`, note: `${role} · 로컬 검토`,
  provider: model.split(' ')[0], model, sourceUrl, officialSource: true,
  verificationStatus: status, publicationStatus: 'REVIEW REQUIRED'
});
const images = {
  'brc-am7': [
    picture('Main', 'brc-am7-main.jpg', 'Sony BRC-AM7', 'https://www.sony.com/image/826ea30c6742e760e0c500edc5787dff?fmt=jpeg&wid=1200&hei=720', 'VERIFIED'),
    picture('Front', 'brc-am7-front.jpg', 'Sony BRC-AM7', 'https://www.sony.com/image/90470eb5cd45473e16b04e7ff772fb9b?fmt=jpeg&wid=1200&hei=720', 'VERIFIED'),
    picture('Rear', 'brc-am7-rear.jpg', 'Sony BRC-AM7', 'https://www.sony.com/image/ff7d8e54abe4d0be10dbd75baceaff7d?fmt=jpeg&wid=1200&hei=720', 'VERIFIED'),
    picture('Perspective', 'brc-am7-perspective.jpg', 'Sony BRC-AM7', 'https://www.sony.com/image/e7123a37278e1e6838d2a9d17326cbfc?fmt=jpeg&wid=1200&hei=720', 'VERIFIED')
  ],
  dm7: [
    picture('Front', 'dm7-front.jpg', 'Yamaha DM7', 'https://kr.yamaha.com/ko/files/DM7-front-4000_tcm144-2158404.jpg'),
    picture('Rear', 'dm7-rear.jpg', 'Yamaha DM7', 'https://kr.yamaha.com/ko/files/DM7-rear_tcm144-2158567.jpg', 'FOUND'),
    picture('Perspective', 'dm7-perspective.jpg', 'Yamaha DM7', 'https://kr.yamaha.com/ko/files/DM7-angle-left_tcm144-2159042.jpg')
  ],
  'ki-pro-go2': [picture('Main', 'ki-pro-go2-main.png', 'AJA Ki Pro GO2', 'https://d26ddnfpy9hzf8.cloudfront.net/aja-web/public/assets/products/img/728/ki_pro_go_2_product_3600.png')],
  'pt-mz17k': [
    picture('Front', 'pt-mz17k-front.jpg', 'Panasonic PT-MZ17K', 'https://eu.connect.panasonic.com/sites/default/files/media/image/2024-04/mz17k_bk_front_low.jpg', 'FOUND'),
    picture('Perspective', 'pt-mz17k-perspective.jpg', 'Panasonic PT-MZ17K', 'https://eu.connect.panasonic.com/sites/default/files/media/image/2024-04/mz17k_bk_slant_l_high.jpg', 'FOUND')
  ],
  'rally-bar': [
    picture('Front', 'rally-bar-01.png', 'Logitech Rally Bar', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/video-conferencing/rally-bar/buy/gallery/rally-bar-graphite-01.png?v=1'),
    picture('Perspective', 'rally-bar-02.png', 'Logitech Rally Bar', 'https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/video-conferencing/rally-bar/buy/gallery/rally-bar-graphite-02.png?v=1')
  ]
};
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" };

export function createGroup1PreviewServer() {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (request.method !== 'GET' || !/^\/[\w./-]*$/.test(pathname) || pathname.includes('..')) {
      response.writeHead(404, headers); response.end(); return;
    }
    const imageName = /^\/detail\/images\/([a-z0-9-]+\.(?:jpg|png))$/.exec(pathname)?.[1];
    const allowedImage = imageName && Object.values(images).flat().some(item => item.file === imageName);
    const dataKey = /^\/detail\/data\/(brc-am7|dm7|ki-pro-go2|pt-mz17k|rally-bar)\.json$/.exec(pathname)?.[1];
    const relative = pathname === '/' ? 'index.html' : pathname.endsWith('/') ? pathname.slice(1) + 'index.html' : pathname.slice(1);
    try {
      let body = await readFile(allowedImage ? join(photos, imageName) : join(site, relative));
      if (relative === 'detail/index.html') body = Buffer.from(body.toString('utf8').replaceAll('PUBLIC BETA', 'LOCAL PREVIEW').replaceAll('PRODUCT DETAIL BETA', 'PRODUCT DETAIL LOCAL PREVIEW'));
      if (dataKey) {
        const record = JSON.parse(body.toString('utf8'));
        const localImages = (await Promise.all(images[dataKey].map(async image => {
          try { await access(join(photos, image.file)); return image; } catch { return null; }
        }))).filter(Boolean);
        if (!record.images?.length && localImages.length) {
          record.images = localImages;
          record.presentation ??= {};
          record.presentation.visualVariant = 'official-local';
          record.presentation.galleryRightsBadge = '로컬 검토 · 재게시 권한 미확인';
          record.presentation.galleryRights = '제조사 공식 사진을 이 PC의 로컬 검토 화면에서만 표시합니다. 공개 재게시·핫링크 권한은 확인되지 않았습니다.';
        }
        body = Buffer.from(JSON.stringify(record));
      }
      response.writeHead(200, { ...headers, 'Content-Type': mime[extname(allowedImage ? imageName : relative)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404, headers); response.end();
    }
  });
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.argv[process.argv.indexOf('--port') + 1] || 4225);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  createGroup1PreviewServer().listen(port, '127.0.0.1', () => process.stdout.write(`Group 1 local preview: http://127.0.0.1:${port}/\n`));
}
