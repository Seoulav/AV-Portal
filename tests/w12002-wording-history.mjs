import {beforeH5PanelProduct,beforeH5PanelRaw} from './h5-panel-history.mjs';
import { readFileSync } from 'node:fs';
import { beforeW20261016_015B4Product, beforeW20261016_015B4Raw } from './w20261016-015-b4-history.mjs';
import { beforeW16015SamsungHotelPlacementProduct, beforeW16015SamsungHotelPlacementRaw } from './w16015-samsung-hotel-placement-history.mjs';
import { beforeW13007HotelProduct, beforeW13007HotelRaw } from './w13007-hotel-history.mjs';
import { beforeW13007WmfProduct, beforeW13007WmfRaw } from './w13007-wmf-history.mjs';
import { beforeW13007BehhlGuideProduct, beforeW13007BehhlGuideRaw } from './w13007-behhl-guide-history.mjs';
import { beforeW12003Product, beforeW12003Raw } from './w12003-kiprogo2-history.mjs';
import { beforeMx392Ulxd4qFollowupProduct } from './mx392-ulxd4q-followup-history.mjs';
import { beforeAverW12009Product, beforeAverW12009Raw } from './aver-w12009-history.mjs';
import { beforeW13001Product, beforeW13001Raw } from './w13001-powersoft-history.mjs';
import { beforeB13003Product, beforeB13003Raw } from './b13003-slot-history.mjs';
import { beforeW13007Product, beforeW13007Raw } from './w13007-videowall-history.mjs';
import { beforeW13010Product, beforeW13010Raw } from './w13010-yamaha-history.mjs';
import { beforeW141002004Product, beforeW141002004Raw } from './w141002-004-history.mjs';
import { beforeW20261015_006Product, beforeW20261015_006Raw } from './w20261015-006-history.mjs';
import { beforeW20261015_011Product, beforeW20261015_011Raw } from './w20261015-011-history.mjs';
import { beforeW20261015_006LabelsProduct, beforeW20261015_006LabelsRaw } from './w20261015-006-labels-history.mjs';
import { beforeW20261015_008Product, beforeW20261015_008Raw } from './w20261015-008-history.mjs';
import { beforeW20261016_015MidraProduct, beforeW20261016_015MidraRaw } from './w20261016-015-midra-zenith-history.mjs';

// Undo only approved W-002 sentence text when an older whole-product hash is
// tested. Current non-wording fields pass through, so unrelated regressions
// remain visible to the historical assertions.
const fixture=JSON.parse(readFileSync(new URL('../Work/기록/W-20261012-002-wording-history.json',import.meta.url),'utf8'));
export const w12002Slugs=new Set(Object.keys(fixture));

export function beforeW12002Path(path,current){
  const match=/(?:^|\/)beta\/site\/detail\/data\/([a-z0-9-]+)\.json$/.exec(path);
  return match?beforeW12002Product(current,match[1]):current;
}

export function beforeW12002Product(current,slug,{w011Undone=false,w015PlacementUndone=false}={}){
  current=beforeW20261016_015MidraProduct(current,slug);
  current=beforeH5PanelProduct(current,slug);
  if(!w015PlacementUndone)current=beforeW16015SamsungHotelPlacementProduct(current,slug);
  current=beforeW20261016_015B4Product(current,slug,{allowHistorical:true});
  if(!w011Undone)current=beforeW20261015_011Product(current,slug);
  current=beforeW20261015_008Product(current,slug);
  current=beforeW20261015_006Product(beforeW20261015_006LabelsProduct(current,slug),slug);
  current=beforeW141002004Product(current,slug);
  current=beforeW13007BehhlGuideProduct(current,slug);
  current=beforeW13010Product(current,slug);
  current=beforeW13007WmfProduct(beforeW13007HotelProduct(beforeW13007Product(current,slug),slug),slug);
  current=beforeW13001Product(beforeB13003Product(current,slug),slug);
  current=beforeAverW12009Product(current,slug);
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
  raw=beforeW20261016_015MidraRaw(raw,slug);
  raw=beforeH5PanelRaw(raw,slug);
  raw=beforeW16015SamsungHotelPlacementRaw(raw,slug);
  raw=beforeW20261016_015B4Raw(raw,slug,{allowHistorical:true});
  raw=beforeW20261015_011Raw(raw,slug);
  raw=beforeW20261015_008Raw(raw,slug);
  raw=beforeW20261015_006Raw(beforeW20261015_006LabelsRaw(raw,slug),slug);
  raw=beforeW141002004Raw(raw,slug);
  raw=beforeW13007BehhlGuideRaw(raw,slug);
  raw=beforeW13010Raw(raw,slug);
  raw=beforeW13007WmfRaw(beforeW13007HotelRaw(beforeW13007Raw(raw,slug),slug),slug);
  raw=beforeW13001Raw(beforeB13003Raw(raw,slug),slug);
  raw=beforeAverW12009Raw(raw,slug);
  if(!fixture[slug])return raw;
  if(slug==='ki-pro-go2' && JSON.parse(raw).portMap?.items?.length===11)raw=beforeW12003Raw(raw,slug);
  beforeW12002Product(JSON.parse(raw),slug,{w011Undone:true,w015PlacementUndone:true});
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
