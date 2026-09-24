import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { detailAssetPairs, transformDetailAsset } from './detail-asset-transforms.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const [source, generated, kind] of detailAssetPairs) {
  const content = await readFile(join(root, source), 'utf8');
  await writeFile(join(root, generated), transformDetailAsset(content, kind), 'utf8');
}
console.log('Six Product Detail source/generated asset pairs synchronized.');
