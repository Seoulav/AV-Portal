import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const imageDir = fileURLToPath(new URL('../../outputs/brc-am7-detail/images/', import.meta.url));
const images = {
  main: 'https://www.sony.com/image/826ea30c6742e760e0c500edc5787dff?fmt=jpeg&wid=1200&hei=720',
  front: 'https://www.sony.com/image/90470eb5cd45473e16b04e7ff772fb9b?fmt=jpeg&wid=1200&hei=720',
  rear: 'https://www.sony.com/image/ff7d8e54abe4d0be10dbd75baceaff7d?fmt=jpeg&wid=1200&hei=720',
  perspective: 'https://www.sony.com/image/e7123a37278e1e6838d2a9d17326cbfc?fmt=jpeg&wid=1200&hei=720'
};
await mkdir(imageDir, { recursive: true });
for (const [role, url] of Object.entries(images)) {
  const response = await fetch(url);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/jpeg')) {
    throw new Error(role + ': Sony image response was not JPEG (' + response.status + ')');
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000 || bytes.length > 5_000_000) throw new Error(role + ': unexpected image size');
  await writeFile(imageDir + '/' + role + '.jpg', bytes);
  console.log(role + ': local-only JPEG, ' + bytes.length + ' bytes');
}
