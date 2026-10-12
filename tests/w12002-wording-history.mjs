import { readFileSync } from 'node:fs';
import { beforeW12003Product, beforeW12003Raw } from './w12003-kiprogo2-history.mjs';
import { beforeMx392Ulxd4qFollowupProduct } from './mx392-ulxd4q-followup-history.mjs';

// Undo only approved W-002 sentence text when an older whole-product hash is
// tested. Current non-wording fields pass through, so unrelated regressions
// remain visible to the historical assertions.
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-002-wording-history.json',import.meta.url),'utf8'));
export const w12002Slugs=new Set(Object.keys(fixture));

export function beforeW12002Path(path,current){
  const match=/(?:^|\/)beta\/site\/detail\/data\/([a-z0-9-]+)\.json$/.exec(path);
  return match?beforeW12002Product(current,match[1]):current;
}

export function beforeW12002Product(current,slug){
  if((slug==='ulxd4q' && current.portMap?.items?.length===13)||slug==='mx392-c')current=beforeMx392Ulxd4qFollowupProduct(current,slug);
  const record=fixture[slug];
  if(!record)return current;
  // Ki Pro GO2's later W-003 grouping must be undone before the older
  // 24-marker wording fixture can inspect only its approved descriptions.
  if(slug==='ki-pro-go2' && current.portMap?.items?.length===11)current=beforeW12003Product(current,slug);
  if((current.features?.length??0)!==record.featureCount)throw new Error(`${slug}: unexpected W-002 feature count`);
  if((current.portMap?.items?.length??0)!==record.markerCount)throw new Error(`${slug}: unexpected W-002 marker count`);
  const result=structuredClone(current);
  for(const {index,prior,approved} of record.features){
    const feature=result.features?.[index-1];
    if(!feature||feature.text!==approved)throw new Error(`${slug}: unexpected W-002 feature ${index}`);
    feature.text=prior;
  }
  for(const {n,prior,approved} of record.desc){
    const items=result.portMap?.items?.filter(item=>item.n===n)??[];
    if(items.length!==1||items[0].desc!==approved)throw new Error(`${slug}: unexpected W-002 desc ${n}`);
    items[0].desc=prior;
  }
  return result;
}

export function beforeW12002Raw(raw,slug){
  if(!fixture[slug])return raw;
  if(slug==='ki-pro-go2' && JSON.parse(raw).portMap?.items?.length===11)raw=beforeW12003Raw(raw,slug);
  beforeW12002Product(JSON.parse(raw),slug);
  // Historical byte hashes include hand-formatted JSON. Replace only the
  // approved value literals so their original whitespace stays observable.
  let restored=raw;
  for(const [field,rows] of [['text',fixture[slug].features],['desc',fixture[slug].desc]]){
    const replacements=new Map();
    for(const {prior,approved} of rows){
      const key=`"${field}": ${JSON.stringify(approved)}`;
      const value=`"${field}": ${JSON.stringify(prior)}`;
      if(replacements.has(key)&&replacements.get(key).value!==value)throw new Error(`${slug}: ambiguous W-002 raw ${field}`);
      const previous=replacements.get(key);
      replacements.set(key,{value,count:(previous?.count??0)+1});
    }
    for(const [key,{value,count}] of replacements){
      const occurrences=restored.split(key).length-1;
      if(occurrences!==count)throw new Error(`${slug}: unexpected W-002 raw ${field} count`);
      restored=restored.split(key).join(value);
    }
  }
  return restored;
}
