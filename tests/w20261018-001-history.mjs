import { readFileSync } from 'node:fs';

export const w20261018_001Fixture = JSON.parse(readFileSync(new URL('./fixtures/w20261018-001-ultrix-history.json', import.meta.url), 'utf8'));

const approvedFields = ['value', 'condition', 'source', 'verification'];
const rowsBySlug = {
  'ultrix-ns-fr2': ['최대 UHD 게이트박스 수', '최대 UHD 입력 프레임 동기화 수'],
  'ultrix-hdx-io': ['AUX C 포트 기능', 'AUX D 포트 기능']
};

export function beforeW20261018_001Product(product, slug) {
  const prior = w20261018_001Fixture[slug];
  if (!prior) throw new Error(`unexpected W-20261018-001 product: ${slug}`);
  const restored = structuredClone(product);
  if (slug === 'ultrix-ns-fr2') restored.overview = prior.overview;
  restored.sources.find(source => source.code === 'B').name = prior.sources.find(source => source.code === 'B').name;
  for (const name of rowsBySlug[slug]) {
    const currentRow = restored.specifications.find(row => row.name === name);
    const priorRow = prior.specifications.find(row => row.name === name);
    if (!currentRow || !priorRow) throw new Error(`missing W-20261018-001 row: ${slug} ${name}`);
    for (const field of approvedFields) currentRow[field] = priorRow[field];
  }
  if (!['ultrix-ns-fr2', 'ultrix-hdx-io'].includes(slug)) throw new Error(`unexpected W-20261018-001 product: ${slug}`);
  return restored;
}
