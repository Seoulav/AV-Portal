import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {unzipSync,strFromU8} from 'fflate';
const out=resolve('../.integration/real-workflow');
test('실제 Portal 장비를 화면에서 구성하여 승인 CPQ 자료로 새 견적과 Excel 3종을 만든다',async({page,context})=>{
 test.setTimeout(120000);page.setDefaultTimeout(12000);mkdirSync(out,{recursive:true});
 await page.setViewportSize({width:1440,height:1100});
 const errors:string[]=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/AV-Portal/builder/');
 const add=async(model:string)=>{
  await page.getByPlaceholder('브랜드·모델·분류 검색').fill(model);
  const group=page.locator('.group-title').first();if((await group.innerText()).includes('▸')) await group.click();
  await page.getByRole('button',{name:`${model} 추가`,exact:true}).click();
 };
 // 시스템명·옵션은 장비 설정 창(B-20261013-01)에서 넣는다: 장비를 고르고 "설정 열기" → 적용
 const settings=page.getByRole('dialog',{name:'장비 설정'});
 const configure=async(node:ReturnType<typeof page.locator>,option?:string)=>{
  // 세 번째 장비부터는 캔버스 밖에 놓일 수 있어 먼저 전체 보기로 맞춘다
  await page.getByRole('button',{name:'Fit View'}).click();
  await node.locator('.node-header').click();await page.getByRole('button',{name:'설정 열기'}).click();
  await settings.getByLabel('장비 시스템명').fill('가상 회의실 A');
  if(option){await settings.getByRole('tab',{name:'견적 옵션'}).click();await settings.getByLabel('포털 옵션 품목').selectOption(option);await settings.getByRole('button',{name:'옵션 1개 추가'}).click();}
  await settings.getByRole('button',{name:'적용',exact:true}).click();await expect(settings).toHaveCount(0);
 };
 const cameraNodes=()=>page.locator('.react-flow__node-equipment').filter({hasText:'SRG-A40'});
 await add('SRG-A40');await configure(cameraNodes().first(),'rm-ip10');
 await add('SRG-A40');await configure(cameraNodes().last());
 await add('HD-13U');
 const distributor=page.locator('.react-flow__node-equipment').filter({hasText:'HD-13U'});
 await configure(distributor);
 await page.getByRole('button',{name:'오토 레이아웃',exact:true}).click();
 await page.waitForTimeout(500);
 const from=await cameraNodes().first().locator('[data-handleid="out-hdmi-1"]').boundingBox();const to=await distributor.locator('[data-handleid="in-hdmi-1"]').boundingBox();
 expect(from).not.toBeNull();expect(to).not.toBeNull();
 await page.mouse.move(from!.x+from!.width-4,from!.y+from!.height/2);await page.mouse.down();await page.mouse.move(to!.x+4,to!.y+to!.height/2,{steps:25});await page.mouse.up();
 await expect(page.locator('.react-flow__edge')).toHaveCount(1);
 await page.getByRole('button',{name:'오토 레이아웃',exact:true}).click();await page.waitForTimeout(500);
 const point=await page.locator('.react-flow__edge-interaction').evaluate((element)=>{
  const path=element as SVGPathElement;const matrix=path.getScreenCTM()!;
  for(const fraction of [0.5,0.4,0.6,0.25,0.75]) { const p=path.getPointAtLength(path.getTotalLength()*fraction); const screen=new DOMPoint(p.x,p.y).matrixTransform(matrix);if(document.elementFromPoint(screen.x,screen.y)?.closest('.react-flow__edge'))return {x:screen.x,y:screen.y}; }
  throw new Error('연결선의 보이는 클릭 위치를 찾지 못했습니다');
 });
 await page.mouse.click(point.x,point.y);
 await page.getByRole('button',{name:'케이블 추가',exact:true}).click();
 await page.getByPlaceholder('제품명',{exact:true}).fill('UMC-002');await page.getByRole('button',{name:'저장',exact:true}).click();
 await page.screenshot({path:resolve(out,'01-builder.png'),fullPage:true});
 const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'견적 만들기',exact:true}).click();const quote=await popup;
 await expect(quote.getByText('구성도를 새 견적으로 가져왔습니다.',{exact:false})).toBeVisible();
 await expect(quote.getByRole('button',{name:'Excel 다운로드'})).toBeDisabled();
 await quote.screenshot({path:resolve(out,'02-review-required.png'),fullPage:true});
 // Confirm each mapped row against the displayed adopted labor basis. Unknown labor is never silently zeroed.
 const toggles=quote.getByRole('button',{name:/노무 처리 펼치기/});
 while(await toggles.count()) await toggles.first().click();
 const confirmations=quote.getByRole('button',{name:'확인함',exact:true});
 const confirmed=await confirmations.count();
 while(await confirmations.count()) await confirmations.first().click();
 await quote.screenshot({path:resolve(out,'03-labor-reviewed.png'),fullPage:true});
 const downloadButton=quote.getByRole('button',{name:'Excel 다운로드'});
 await expect(downloadButton).toBeEnabled();
 const saved=quote.waitForEvent('download');await quote.getByRole('button',{name:'작업 파일로 저장'}).click();const work=await saved;const text=readFileSync((await work.path())!,'utf8');const doc=JSON.parse(text);
 await work.saveAs(resolve(out,'synthetic.avcpq.json'));
 expect(doc.systems.map((s:any)=>s.name)).toEqual(['가상 회의실 A']);
 const items=doc.rows.filter((r:any)=>r.type==='item');
 expect(items.find((r:any)=>r.specification==='SRG-A40').quantity).toBe('2');
 expect(items.some((r:any)=>r.optionId==='portal-option:rm-ip10'&&r.quantity==='1')).toBe(true);
 expect(items.some((r:any)=>r.sourceEdgeIds?.length===1)).toBe(true);
 const downloads=[];
 for(const grade of ['0 영업팀용','1 공유용','2 고객용']) {
  await quote.getByLabel(grade,{exact:true}).check();
  if(grade.startsWith('0')) quote.once('dialog',d=>d.accept());
  const event=quote.waitForEvent('download');await downloadButton.click();const file=await event;const bytes=readFileSync((await file.path())!);const zip=unzipSync(bytes);
  expect(zip['xl/workbook.xml']).toBeDefined();
  const formulaCount=Object.entries(zip).filter(([n])=>/xl\/worksheets\/sheet/.test(n)).reduce((sum,[,b])=>sum+(strFromU8(b).match(/<f[ >]/g)??[]).length,0);expect(formulaCount).toBeGreaterThan(0);
  await file.saveAs(resolve(out,grade[0]+'-'+file.suggestedFilename()));downloads.push({grade,bytes:bytes.length,formulaCount});
 }
 await quote.setViewportSize({width:390,height:844});await quote.screenshot({path:resolve(out,'04-cpq-mobile.png'),fullPage:true});
 expect(await quote.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 writeFileSync(resolve(out,'summary.json'),JSON.stringify({scenario:'가상 현장, 실제 고객 자료 없음',items:items.map((r:any)=>({sku:r.sku,spec:r.specification,quantity:r.quantity,sellingUnitPrice:r.sellingUnitPrice,laborMode:r.laborMode})),confirmed,downloads,errors},null,2));
 expect(errors).toEqual([]);
});
