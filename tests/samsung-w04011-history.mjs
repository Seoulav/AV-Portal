// Earlier task tests reconstruct their own published baseline. Undo only the
// approved W-20261004-011 VXT annotation before comparing historical hashes.
import {beforeSamsungW04017, beforeSamsungW04017Raw} from './samsung-w04017-history.mjs';
const supported = new Set(['lh32qmcebgcxkr', 'lh43qmcebgcxkr', 'lh85qmcebgcxkr', 'lh98qmcebgcxkr', 'lh43qhcebgcxkr', 'lh75qhcebgcxkr', 'lh115qhfebgxkr']);
const videoWalls = new Set(['lh55vhcrbgbxkr', 'lh55vmcrbgbxkr']);
const memoTargets = new Set(['lh32qmcebgcxkr', 'lh43qmcebgcxkr', 'lh85qmcebgcxkr', 'lh43qhcebgcxkr', 'lh75qhcebgcxkr']);
const oldMemo = ' / CMS 솔루션: 별도 구매 필요, VXT는 국내 추후 출시 예정';

export function beforeSamsungW04011(product, slug) {
  product = beforeSamsungW04017(product, slug);
  if (!supported.has(slug) && !videoWalls.has(slug)) return product;
  if (!product.sources?.some(source => source.code === 'U1')) return product;
  const earlier = structuredClone(product);
  earlier.sources = earlier.sources.filter(source => source.code !== 'U1');
  if (memoTargets.has(slug)) earlier.sources.find(source => source.code === 'P').scope += oldMemo;
  if (slug === 'lh32qmcebgcxkr')
    earlier.overview = earlier.overview.replace('VXT를 지원한다', 'VXT(국내 추후 출시 예정)를 지원한다');
  if (slug === 'lh115qhfebgxkr') {
    const row = earlier.specifications.find(row => row.name === 'VXT Player 지원');
    row.name = 'VXT Player Support';
    row.condition = '';
    row.source = 'S5';
  } else earlier.specifications = earlier.specifications.filter(row => row.name !== 'VXT Player 지원');
  return earlier;
}

export function beforeSamsungW04011Raw(raw, slug) {
  raw = beforeSamsungW04017Raw(raw, slug);
  if (!supported.has(slug) && !videoWalls.has(slug)) return raw;
  return `${JSON.stringify(beforeSamsungW04011(JSON.parse(raw), slug), null, 2)}\n`;
}
