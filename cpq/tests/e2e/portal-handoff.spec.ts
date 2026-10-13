import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {mockResources} from './fixtures';
const portal='/AV-Portal/';
const library={schema:'av-portal.builder-library',schemaVersion:'1.0.0',source:{},vocabulary:{connectorWildcards:{},connectorEquivalents:[],levelPairs:[]},lineTypes:JSON.parse(readFileSync(new URL('../../../builder/examples/small-room.diagram.json',import.meta.url),'utf8')).lineTypes,products:[{productId:'fix',source:'portal',brand:'TEST',product:'FIX',categories:['AV','Video','Camera'],placeable:true,detailUrl:'',readiness:{},units:[{unitId:'fix',equipment:{id:'fix',name:'합성 장비',model:'FIX',category:'video',inputs:[],outputs:[],bidirectional:[],portal:{productId:'fix',source:'portal',detailUrl:''}}}]}]};
async function save(page:Page) {const event=page.waitForEvent('download');await page.getByRole('button',{name:'작업 파일로 저장'}).click();return JSON.parse(readFileSync((await(await event).path())!,'utf8'));}
for(const width of [1280,390]) test(`Builder 작성 → CPQ 새 견적, 시스템/옵션/수량 보존 및 취소 (${width})`,async({page,context})=>{
 await page.setViewportSize({width,height:900});
 await context.route('**/builder-library.json',route=>route.fulfill({json:library}));
 await mockResources(context as unknown as Page);
 await page.goto(portal+'builder/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:/영상/}).click();
 await page.getByRole('button',{name:'FIX 추가',exact:true}).click();
 const node=page.locator('.react-flow__node-equipment').first();await node.click();
 // 시스템명·옵션은 장비 설정 창(B-20261013-01)에서 넣는다. 오른쪽 패널은 요약과 "설정 열기"다
 await page.getByRole('button',{name:'설정 열기'}).click();
 const settings=page.getByRole('dialog',{name:'장비 설정'});
 await settings.getByLabel('장비 시스템명').fill('회의실 A');
 await settings.getByRole('tab',{name:'견적 옵션'}).click();
 await settings.getByLabel('포털 옵션 품목').selectOption('fix');
 await settings.getByRole('button',{name:'옵션 1개 추가'}).click();
 await settings.getByLabel('옵션 수량 portal-option:fix').fill('2');
 await settings.getByRole('button',{name:'적용',exact:true}).click();
 await expect(settings).toHaveCount(0);
 const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'견적 만들기',exact:true}).click();const quote=await popup;
 await expect(quote.getByText('구성도를 새 견적으로 가져왔습니다.',{exact:false})).toBeVisible();
 const doc=await save(quote);expect(doc.systems.map((s:any)=>s.name)).toEqual(['회의실 A']);
 expect(doc.rows.filter((r:any)=>r.type==='item').map((r:any)=>r.quantity)).toEqual(['1','2']);
 // Editing a quantity makes replacement require the existing confirmation.
 const qty=quote.getByLabel('수량').first();await qty.fill('3');await qty.press('Tab');
 quote.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'견적 만들기',exact:true}).click();
 await expect(quote.getByText('기존 견적을 유지했습니다.',{exact:true})).toBeVisible();
 expect((await save(quote)).rows.filter((r:any)=>r.type==='item')[0].quantity).toBe('3');
 await quote.reload();await expect(quote.getByRole('button',{name:'품목 직접 선택'})).toBeVisible();
 await expect(quote.locator('.q-quote-sheet')).toHaveCount(0);
 await page.screenshot({path:`test-results/portal-builder-${width}.png`,fullPage:true});
});
test('실제 배포 자료와 PDF 경로, 직접 접속 및 포털 복귀',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');await expect(page.getByRole('button',{name:'품목 직접 선택'})).toBeEnabled();
 for(const path of ['data/approved/products.json','data/approved/prices.json','templates/sanitized/guide-won.xlsx','templates/sanitized/guide-ds.xlsx','templates/sanitized/guide-pumsem.xlsx','templates/sanitized/guide-ds-won.xlsx','reference-docs/2026년도-적용-정보통신공사-표준품셈.pdf','reference-docs/2026년_하반기_적용_정보통신부문_시중노임단가_공표_안내_1부.pdf']) expect((await page.request.get(portal+'cpq/'+path)).status()).toBe(200);
 await page.getByRole('link',{name:'AV 포털',exact:true}).click();await expect(page).toHaveURL(/\/AV-Portal\/$/);await page.goBack();await expect(page.getByRole('button',{name:'품목 직접 선택'})).toBeVisible();
 expect(errors).toEqual([]);
 expect(await page.evaluate(async()=>({sw:(await navigator.serviceWorker.getRegistrations()).length,storage:Object.keys(localStorage)}))).toEqual({sw:0,storage:[]});
});

test('handoff rejects wrong source/origin and replay; allowed fields alone reach the work file',async({page,context})=>{
 await mockResources(context as unknown as Page);
 await page.goto(portal);
 const popup=page.waitForEvent('popup');
 await page.evaluate(()=>{(window as any).__quoteWindow=window.open('./cpq/','_blank');});
 const quote=await popup;
 await expect(quote.getByRole('button',{name:'품목 직접 선택'})).toBeEnabled();
 const id='a'.repeat(32), protocol='av-portal:quote:1';
 const payload={version:'1.1',nodes:[{id:'n',type:'equipment',data:{model:'FIX',systemName:'합성 시스템',costPrice:'COST-SENTINEL'}},{id:'unknown',type:'equipment',data:{model:'SYNTHETIC-UNMATCHED',systemName:'합성 시스템 B'}}],edges:[],lineTypes:[],privateCost:'COST-SENTINEL'};
 // A same-origin message from the wrong window and an event with a wrong origin must both be ignored.
 await quote.evaluate(({id,protocol,payload})=>{
  for(const kind of ['hello','diagram']) {
   window.postMessage({id,protocol,kind,payload},location.origin);
   window.dispatchEvent(new MessageEvent('message',{origin:'https://invalid.example',source:window.opener,data:{id,protocol,kind,payload}}));
  }
 },{id,protocol,payload});
 await expect(quote.locator('.q-quote-sheet')).toHaveCount(0);
 // Wait for the actual receiver handshake before sending from its opener.
 await page.evaluate(({id,protocol,payload})=>new Promise<void>(resolve=>{
  const child=(window as any).__quoteWindow;
  const listener=(e:MessageEvent)=>{
   if(e.source!==child || e.origin!==location.origin || e.data.id!==id)return;
   if(e.data.kind==='ready')child.postMessage({id,protocol,kind:'diagram',payload},location.origin);
   if(e.data.kind==='result'){window.removeEventListener('message',listener);resolve();}
  };
  window.addEventListener('message',listener);child.postMessage({id,protocol,kind:'hello'},location.origin);
 }),{id,protocol,payload});
 await expect(quote.getByText('구성도를 새 견적으로 가져왔습니다.',{exact:false})).toBeVisible();
 const saved=await save(quote);
 expect(saved.systems.map((s:any)=>s.name)).toEqual(['합성 시스템','합성 시스템 B']);
 const unresolved=saved.rows.find((r:any)=>r.specification==='SYNTHETIC-UNMATCHED');
 expect(unresolved).toBeDefined();expect(unresolved.sku).toBeUndefined();expect(unresolved.sellingUnitPrice).toBeUndefined();
 await expect(quote.getByRole('button',{name:'Excel 다운로드'})).toBeDisabled();
 expect(JSON.stringify(saved)).not.toContain('COST-SENTINEL');
 const qty=quote.getByLabel('수량').first();await qty.fill('3');await qty.press('Tab');
 let dialogs=0;quote.on('dialog',async d=>{dialogs++;await d.dismiss();});
 await page.evaluate(({id,protocol,payload})=>{const child=(window as any).__quoteWindow;for(const kind of ['hello','diagram'])child.postMessage({id,protocol,kind,payload},location.origin);},{id,protocol,payload});
 expect((await save(quote)).rows.find((r:any)=>r.type==='item').quantity).toBe('3');
 expect(dialogs).toBe(0);
 expect(await quote.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))).toEqual({local:{},session:{}});
});
