import { readFile, writeFile } from 'node:fs/promises';
import { detailAssetPairs, transformDetailAsset } from './detail-asset-transforms.mjs';
const root = new URL('../', import.meta.url);
for (const [source, target, kind] of detailAssetPairs) {
  await writeFile(new URL(target, root), transformDetailAsset(await readFile(new URL(source, root), 'utf8'), kind), 'utf8');
}
console.log(`Generated ${detailAssetPairs.length} detail assets; product data untouched.`);
