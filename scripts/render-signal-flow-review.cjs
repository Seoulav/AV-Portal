const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const out=path.resolve(__dirname,'../Work/기록/W-20261001-001-flow-screens');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
(async()=>{
 const {scenarios}=await import('../tests/fixtures/signal-flow.mjs');
 const browser=await chromium.launch({executablePath:process.env.AV_PORTAL_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1580,height:1000}});
  for(const width of [1280,390]){
   const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><title>QMS-88UX Signal Flow 비교 ${width}px</title><style>body{font:16px system-ui;background:#eef2f7;margin:24px;color:#20344d}h1{font-size:22px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}figure{margin:0}figcaption{padding:12px;font-weight:700}img{width:100%;border:1px solid #d7e0ed;border-radius:16px}</style><h1>QMS-88UX · ${width}px 뷰포트에서 캡처한 03 Signal Flow</h1><p>왼쪽은 실제 RTCOM, 오른쪽은 AV Portal 공통 렌더러의 비교 fixture입니다. 제품 등록·배포는 하지 않았습니다.</p><div class="pair"><figure><figcaption>RTCOM 실제 공개 화면</figcaption><img src="rtcom-qms-${width}.png"></figure><figure><figcaption>AV Portal 공통 렌더러 · 검토안</figcaption><img src="av-qms-card-${width}.png"></figure></div></html>`;
   const f=path.join(out,`comparison-qms-${width}.html`);fs.writeFileSync(f,html);await page.setViewportSize({width:width===390?840:1580,height:1000});await page.goto(pathToFileURL(f).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:f.replace('.html','.png'),fullPage:true});
  }
  const rows=Object.entries(scenarios).map(([type,[title]])=>`<section><h2>${escape(title)}</h2><div class="pair"><a href="${type}-1280.png"><img loading="lazy" src="${type}-1280.png" alt="${escape(title)} 데스크톱"><span>1280px</span></a><a href="${type}-390.png"><img loading="lazy" src="${type}-390.png" alt="${escape(title)} 모바일"><span>390px · 그림 내부 가로 스크롤</span></a></div></section>`).join('');
  const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signal Flow 23유형 검토 모음</title><style>body{font:16px system-ui;margin:24px auto;max-width:1120px;background:#f4f6fa;color:#20354f;padding:0 16px}a{color:#185da5}.pair{display:grid;grid-template-columns:2fr 1fr;gap:16px;align-items:start}section{background:white;padding:20px;margin:24px 0;border-radius:20px;border:1px solid #dce4f0}img{width:100%;border-radius:10px;border:1px solid #e5e9f0}span{display:block;padding:8px}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>Signal Flow 확장 · 검토 화면</h1><p>23개 유형은 처리 방식의 UI 검증용 합성 자료입니다. 실제 제품 등록이나 기술 검증 완료를 의미하지 않습니다. 데이터가 없는 기존 240종은 연결 단자 화면을 그대로 유지합니다.</p><p>먼저 <a href="comparison-qms-1280.html">QMS 데스크톱 나란히 비교</a> · <a href="comparison-qms-390.html">QMS 모바일 나란히 비교</a>를 확인하세요.</p><p>모바일 캡처는 스크롤 시작 위치입니다. 오른쪽으로 움직일 수 있는 흐림 표시와 안내를 유지합니다. 실제 키보드 가로 이동도 브라우저 검사했습니다.</p>${rows}<h2>기존 대표 제품</h2>${['brc-am7','dm7','ua874xa'].map(slug=>`<p>${slug}: <a href="before-${slug}-1280.png">변경 전 desktop</a> / <a href="after-${slug}-1280.png">변경 후 desktop</a> · <a href="before-${slug}-390.png">변경 전 mobile</a> / <a href="after-${slug}-390.png">변경 후 mobile</a></p>`).join('')}</html>`;
  fs.writeFileSync(path.join(out,'index.html'),html);
  const md=`# Signal Flow 검토 캡처\n\n[전체 유형 HTML 모음](index.html) · [QMS 데스크톱 비교](comparison-qms-1280.png) · [QMS 모바일 비교](comparison-qms-390.png)\n\n| 유형 | 1280px | 390px |\n|---|---|---|\n${Object.entries(scenarios).map(([t,[title]])=>`| ${title} | [보기](${t}-1280.png) | [보기](${t}-390.png) |`).join('\n')}\n\n모든 유형은 fixture이며 실제 제품 기술값으로 재사용하지 않는다. QMS만 기존 RTCOM 데이터를 참고한 비교 전용 fixture다. 공개 제품 JSON과 RTCOM 원본은 변경하지 않았다.\n`;
  fs.writeFileSync(path.join(out,'README.md'),md);
 }finally{await browser.close();}
 console.log('Comparison screenshots and 23-type review index ready');
})().catch(e=>{console.error(e);process.exitCode=1;});
