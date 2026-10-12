import { useEffect, useState } from 'react';
import { useBuilder } from '../state/useBuilder';
export function EquipmentQuotePanel({nodeId}:{nodeId:string}) {
 const state=useBuilder(s=>s);
 const node=state.diagram.nodes.find(n=>n.id===nodeId)!;
 const [system,setSystem]=useState(''); const [quantities,setQuantities]=useState<Record<string,number>>({});
 const [productId,setProduct]=useState(''); const [search,setSearch]=useState('');
 useEffect(()=>{setSystem(String(node.data.systemName??''));setQuantities({...node.data.selectedOptionQuantities as Record<string,number>??{}});},[node.data]);
 const products=[...(state.library?.products.values()??[])].filter(p=>(p.brand+' '+p.product).toLowerCase().includes(search.toLowerCase()));
 const save=(add=false)=>{
  const q={...quantities}; if(add && productId) {const id=`portal-option:${productId}`;q[id]=(q[id]??0)+1;}
  if(!state.setQuoteMetadata(nodeId,system,q,add?productId:undefined)) state.notify({text:'옵션 품목과 수량을 확인해 주세요.',tone:'error'});
  else state.notify({text:'견적 정보를 적용했습니다.',tone:'info'});
 };
 return <aside className="side-panel equipment-quote-panel">
  <h2 className="panel-title">장비 견적 정보</h2><strong>{String(node.data.model)}</strong>
  <label className="field">시스템명<input aria-label="장비 시스템명" value={system} onChange={e=>setSystem(e.target.value)} placeholder="비우면 시스템1" /></label>
  <p className="panel-note">노드 1개는 장비 1대입니다. 옵션은 견적에 추가할 품목이며 단자와 호환성을 자동 설정하지 않습니다.</p>
  {Object.entries(quantities).map(([id,q])=><label className="field" key={id}>{state.diagram.options?.find(o=>o.id===id)?.model??`미확인 옵션 ${id}`}<input aria-label={`옵션 수량 ${id}`} type="number" min="0" step="1" value={Number.isNaN(q)?'':q} onChange={e=>setQuantities({...quantities,[id]:e.target.value===''?NaN:Number(e.target.value)})}/></label>)}
  <button onClick={()=>save()}>견적 정보 적용</button>
  <label className="field">옵션 검색<input value={search} onChange={e=>setSearch(e.target.value)} /></label>
  <label className="field">포털 옵션 품목<select value={productId} onChange={e=>setProduct(e.target.value)}><option value="">품목 선택</option>{products.map(p=><option key={p.productId} value={p.productId}>{p.brand} {p.product}</option>)}</select></label>
  <button disabled={!productId} onClick={()=>save(true)}>옵션 1개 추가</button>
 </aside>;
}
