import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const evidence=JSON.parse(readFileSync(new URL('Work/기록/W-20261003-011-evidence.json',root),'utf8'));
const changed=new Set(['blu-100','blu-101','blu-160','blu-dan','ec-4bv']);

export const bssW03011Slug=slug=>changed.has(slug);

export function beforeBssW03011(product,slug){
  if(!changed.has(slug))return product;
  const prior=evidence.products[slug];
  return {...product,specifications:prior.beforeSpecifications,sources:prior.beforeSources};
}
