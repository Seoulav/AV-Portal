import { beforeW015CloseoutProduct } from './w015-closeout-history.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import { beforeW20261016_015MidraProduct } from './w20261016-015-midra-zenith-history.mjs';
import { beforeW20261017_002Product, beforeW20261017_002Raw } from './w20261017-002-history.mjs';
import { beforeW20261017_011Stage1Product, beforeW20261017_011Stage1Raw } from './w20261017-011-stage1-history.mjs';
const prior=JSON.parse(fs.readFileSync(new URL('./fixtures/w014-analogway-prior-portmaps.json',import.meta.url)));
const approvedPrevious={"aquilon-rsalpha":"ee4f664ea6552b077ee6cc1bc3e5a17981ef71f9c2a1014b63946675f16e583b","aquilon-rs1":"0971b0047b0af3efb84ef23f612c23b0909d4ee0dc564e0e0f6c4ab2233393f2","aquilon-rs2":"21e3f866d290949deac2ef68ad46babe11d9daad744e3349690cc73006870c00","aquilon-rs3":"27d0c36efa4b2288ac1751c2b9c3bc5ec1c5251b5796ee3cf0c7de34bc6418d2","aquilon-rs4":"880f5048e8dafcc6d4e6e28f0b465bf57ee2d3f98be8a1ac4bec68dc6dcdc90f","aquilon-rs5":"b5357a65ccfef4a5fcd338f99a104aaaf0a71d81c33155e75f3c28a8d11c58e1","aquilon-rs6":"1dc439912d4b42d9bffaf51449c55a2df57473ff45659193ae96872150c9e46b","pulse-4k":"f21e0d6959070adbd7a52b15334fd8e16ba20791f59dd8eb87268cd985f0f68c","eikos-4k":"634ae94f3cd2d0507bcff57e64bd2e5ac980e8641d3ff892892fab81ec9b26f4","zenith-100":"80a0549c81fa0ededab78e786ccf192e3672bc16126f7d0be8d8328302ea1276","zenith-200":"bf9d866b03335e44d20c479f06a1dac599c7450f9c580e003f52d224fc9b8630"};
const approved={"aquilon-rsalpha":"13a3b19032ea5008bfc877cba913c4088ac8634ae19ec302b08df1e11cca7393","aquilon-rs1":"710d5e96758adb592c81f496a043199ed676728861101fc3b7ae6a04c6000d88","aquilon-rs2":"f11d5ca1f02a8089d8bc5b2316ca5db46f0820861b05d4136ceb645d56a11c7d","aquilon-rs3":"5df2dcc0f5c36392d7e529405da3cf6563a3562efbe452a562a3651f2239a805","aquilon-rs4":"43efd0e4923911ae1bfe49ee8a28c5e60b518cd6feab84d4f61f49ff7b2a1a3e","aquilon-rs5":"589bd4f58071c0b06987998f6062947abb3fad931ca5303b981fe5d254928963","aquilon-rs6":"dda20dc438fdc8ed87ce0c861778f1f3207293590a35b1486a040cbc2354ba8e","pulse-4k":"bbb72a4caaef6658e863a4d933fae5077ec3ff5d5a9189bbe686b6b931f03062","eikos-4k":"0b4c6ab110415df73ca4cd3e2004c1745525ee68b72b0e158a632f5c0a4d3118","zenith-100":"3a906402bada3d13c39241dc2e6c9fa62e39883987534901fab70c3e2b1e4177","zenith-200":"b818835b356837f03d08f4486287e9dc841b49d6ba0d2fb3070e0be008a3d0e5"};
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const priorCards=`export function renderPortMapCards(items) {
  const cards = el('div', 'port-map-ports');
  for (const item of [...items].sort((a, b) => a.n - b.n)) {
    const card = el('div', 'port-map-port');
    const heading = el('b');
    heading.append(el('span', 'port-map-n', item.n), document.createTextNode(item.label));
    card.append(heading, document.createTextNode(item.desc));
    cards.append(card);
  }
  return cards;
}`;
const approvedCardsSha='3c26040ed484f3a2a6ae3ed3eaf49f9b69852eadf52bc8ed5a8e17b4cd1015c0';
export function beforeW014View(current){
 const start=current.indexOf('export function renderPortMapCards('),nextExport=current.indexOf('export function ',start+1),end=current.lastIndexOf(String.fromCharCode(10),nextExport);
 if(start<0||end<0)throw Error('W-014 renderer boundary changed');
 const block=current.slice(start,end);
 if(block===priorCards)return current;
 const blockSha=createHash('sha256').update(block).digest('hex');
 if(blockSha!==approvedCardsSha)throw Error('unexpected W-014 Port Map list renderer change: '+blockSha);
 return current.slice(0,start)+priorCards+current.slice(end);
}
export function beforeW014AnalogWayProduct(product,slug,{w002Undone=false}={}){
 product=beforeW20261017_011Stage1Product(product,slug);
 if(!w002Undone)product=beforeW20261017_002Product(product,slug);
 product=beforeW20261016_015MidraProduct(product,slug,{w002Undone:true});
 const old=prior[slug];if(!old||!product.portMap)return product;
 let currentHash=sha(product.portMap);if(currentHash===sha(old))return product;
 if(![approvedPrevious[slug],approved[slug]].includes(currentHash)){
  product=beforeW015CloseoutProduct(product,slug,'W-014 Port Map changes');
  currentHash=sha(product.portMap);
 }
 assert.ok([approvedPrevious[slug],approved[slug]].includes(currentHash),slug+': unexpected W-014 Port Map changes');
 const restored=structuredClone(product);restored.portMap=structuredClone(old);return restored;
}
export function beforeW014AnalogWayRaw(raw,slug){raw=beforeW20261017_011Stage1Raw(raw,slug);raw=beforeW20261017_002Raw(raw,slug);if(!prior[slug])return raw;return JSON.stringify(beforeW014AnalogWayProduct(JSON.parse(raw),slug,{w002Undone:true}),null,2)+'\n';}
