import {readFileSync} from 'node:fs';
import {beforeVideowallProse} from './videowall-w03001-history.mjs';

const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261002-015-evidence.json',import.meta.url),'utf8'));

// Older audits describe their own publication dates. Restore only W-015's I/O and
// source additions before applying the earlier W-014/W-010 reconstruction helpers.
export function beforeSamsungManualIo(product,slug){
  const prior=evidence.products[slug];
  const restored=beforeVideowallProse(product,slug);
  if(!prior)return restored;
  restored.io=structuredClone(prior.previousIo);
  restored.sources=structuredClone(prior.previousSources);
  return restored;
}
