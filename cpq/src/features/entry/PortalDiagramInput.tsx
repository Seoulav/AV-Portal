import { useEffect, useRef, useState } from 'react';
import type { Catalog } from '../../data/catalog/load';
import type { LoadedDocument } from '../../app/workspace';
import { defaultHeader } from '../../app/defaultHeader';
import { parseDiagram } from '../../import/diagram/schema';
import { diagramToQuote } from '../../import/diagram/toQuote';
import { PROTOCOL, isHandoffMessage, toQuotePayload } from '../../../../shared/quote-handoff';

export function PortalDiagramInput({catalog,onLoaded,onBeginLoad}:{catalog:Catalog;onLoaded(input:LoadedDocument):boolean;onBeginLoad():()=>boolean}) {
 const current=useRef({catalog,onLoaded,onBeginLoad}); current.current={catalog,onLoaded,onBeginLoad};
 const [notice,setNotice]=useState('');
 useEffect(()=>{
  const sender=window.opener as Window | null;
  if(!sender) return;
  let pending: {id:string;started:number;isLatest:()=>boolean} | undefined;
  const consumed=new Set<string>();
  const reply=(id:string,kind:'ready'|'result',accepted?:boolean)=>sender.postMessage({protocol:PROTOCOL,kind,id,...(accepted===undefined?{}:{accepted})},location.origin);
  const receive=(event:MessageEvent)=>{
   if(event.origin!==location.origin || event.source!==sender || !isHandoffMessage(event.data)) return;
   const message=event.data;
   if(consumed.has(message.id)) return;
   if(message.kind==='hello') {
    if(pending?.id!==message.id) pending={id:message.id,started:Date.now(),isLatest:current.current.onBeginLoad()};
    reply(message.id,'ready'); return;
   }
   if(message.kind!=='diagram' || pending?.id!==message.id) return;
   const request=pending; pending=undefined; consumed.add(message.id);
   // A page lifetime accepts at most 1000 transfers; never evict tokens and allow replay.
   if(consumed.size>1000 || Date.now()-request.started>30000 || !request.isLatest()) {reply(message.id,'result',false);return;}
   try {
    const result=diagramToQuote(parseDiagram(toQuotePayload(message.payload)),current.current.catalog,{header:defaultHeader('포털 구성도'),defaultSystemName:'시스템1'});
    const accepted=current.current.onLoaded({document:result.document,importWarnings:result.warnings});
    setNotice(accepted?'구성도를 새 견적으로 가져왔습니다. 케이블·커넥터는 기존 기준에 따라 첫 시스템에 표시합니다.':'기존 견적을 유지했습니다.');
    reply(message.id,'result',accepted);
   } catch {setNotice('구성도를 가져오지 못했습니다. 기존 견적을 유지합니다. 구성도 JSON을 확인해 주세요.');reply(message.id,'result',false);}
  };
  window.addEventListener('message',receive);
  return ()=>window.removeEventListener('message',receive);
 },[]);
 return notice ? <p role="status" className="q-notice">{notice}</p>:null;
}
