import {readFileSync} from 'node:fs';

const evidence=JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-001-evidence.json',import.meta.url),'utf8'));

// Earlier Samsung audits lock their own publication snapshots. Restore only
// this prose correction before those historical comparisons run.
export function beforeVideowallProse(product,slug){
  const prior=evidence.target[slug]?.before;
  const restored=structuredClone(product);
  if(!prior)return restored;
  restored.lead=prior.lead;
  restored.overview=prior.overview;
  restored.korean=prior.korean;
  restored.features[3]=structuredClone(prior.features[3]);
  restored.issues=structuredClone(prior.issues);
  return restored;
}
