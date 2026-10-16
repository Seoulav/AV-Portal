import assert from 'node:assert/strict';
export const w20261016_003Slugs=Object.freeze(['insta360-connect','insta360-link-2','insta360-wave','insta360-wave-business']);
const featureText=Object.freeze({
 'insta360-connect':['AI Resolution+ 기반 화자 화질·디테일 향상','프라이버시 모드·화이트보드 자동 보정','기본 데스크 스탠드 제공 및 TV·벽걸이·듀얼 스크린 설치 지원','8K Gallery Mode에서 최대 8명 개별 화면 표시'],
 'insta360-link-2':['음성 포커스·소음 억제·음성 밸런스 오디오 모드 3종'],
 'insta360-wave':['32GB 내장 저장 공간 및 MP3 최대 1,000시간 저장','복수 Wave 무선 연동 및 수음 범위 확장(OTA 제공 예정)'],
 'insta360-wave-business':['테이블 마운트 기본 구성품 포함','온디바이스 AI 텍스트 변환','역할 기반 접근 제어 및 관리자 기능 설정'],
});
const sourceNames={
 'insta360-connect':'사용자 제공 Insta360 Connect 제품 브로슈어(한국어, 2026-10-16)',
 'insta360-link-2':'사용자 제공 Insta360 Link 2 제품 브로슈어(한국어, 2026-10-16)',
 'insta360-wave':'사용자 제공 Insta360 Wave 제품 브로슈어(한국어, 2026-10-16)',
 'insta360-wave-business':'사용자 제공 Insta360 Wave for Business 제품 브로슈어(한국어, 2026-10-16)',
};
const files={
 'insta360-connect':'manuals/insta360-connect-brochure-20261016.pdf',
 'insta360-link-2':'manuals/insta360-link-2-brochure-20261016.pdf',
 'insta360-wave':'manuals/insta360-wave-brochure-20261016.pdf',
 'insta360-wave-business':'manuals/insta360-wave-for-business-brochure-20261016.pdf',
};
export function beforeW20261016_003Product(current,slug){
 if(!Object.hasOwn(featureText,slug)) return current;
 const result=structuredClone(current);
 for(const text of featureText[slug]){const matches=result.features.filter(x=>x.text===text&&x.source==='B');assert.equal(matches.length,1,slug+': expected one W-003 feature '+text);result.features=result.features.filter(x=>!(x.text===text&&x.source==='B'));}
 const source=result.sources.filter(x=>x.code==='B'&&x.name===sourceNames[slug]);assert.equal(source.length,1,slug+': expected W-003 brochure source');result.sources=result.sources.filter(x=>!(x.code==='B'&&x.name===sourceNames[slug]));
 if(slug==='insta360-wave-business'){const feature=result.features.find(x=>x.text==='Video Bar(Insta360 Connect) 오디오 캐스케이딩 연동 지원');assert.ok(feature&&feature.source==='M, B, U','W-003 source addition must exist');feature.source='M, U';const range=result.specifications.find(x=>x.name==='Connect 결합 수음 범위');assert.ok(range&&range.source==='M, B');range.source='M';range.condition='제품 개요 페이지 표기. 상세 연결 장은 Wave 5m·Connect 10m를 별도 표기';const issue=result.issues.find(x=>x.code==='C1');assert.ok(issue&&issue.detail.includes('사용자 제공 Wave for Business 브로슈어'));issue.detail='한국어 제품 개요는 Wave x Connect 결합 시 최대 20m라고 표기합니다. 상세 연결 장은 Wave 5m와 Connect 10m를 각각 제시합니다. 두 원문 수치를 병기하고 결합 범위를 단일값으로 환산하지 않습니다.';}
 if(slug==='insta360-connect'){const spec=result.specifications.find(x=>x.name==='광각 카메라 화소'&&x.value==='48'&&x.source==='B');assert.ok(spec,'W-003 Connect pixel specification must exist');result.specifications=result.specifications.filter(x=>x!==spec);}
 if(slug==='insta360-wave'){
  const dim=result.specifications.find(x=>x.name==='크기'&&x.value==='52.8'&&x.source==='B');const os=result.specifications.find(x=>x.name==='컴퓨터 OS'&&x.value==='Windows 7 이상, macOS 10 이상'&&x.source==='B');assert.ok(dim&&os,'W-003 brochure conflicts must exist');result.specifications=result.specifications.filter(x=>x!==dim&&x!==os);
  const oldMobile=result.specifications.find(x=>x.name==='스마트폰·태블릿 OS'&&x.value==='Android 8.0 이상, iOS 9 이상, iPadOS 9 이상'&&x.source==='B');const currentMobile=result.specifications.find(x=>x.name==='스마트폰·태블릿 OS'&&x.value==='Android 10 이상, iOS 12 이상, iPadOS 12 이상'&&x.source==='M');assert.ok(oldMobile&&currentMobile,'W-003 mobile OS conflict must exist');result.specifications=result.specifications.filter(x=>x!==oldMobile&&x!==currentMobile);const oldDim=result.specifications.find(x=>x.name==='크기'&&x.value==='Ø64.3');const oldOs=result.specifications.find(x=>x.name==='컴퓨터 OS'&&x.value==='Windows 10 이상, macOS 12 이상');assert.ok(oldDim&&oldOs,'W-003 must preserve existing values');oldDim.verification='FOUND';oldOs.verification='FOUND';oldOs.condition='';
  assert.deepEqual(result.issues.filter(x=>['C3','C4','C5'].includes(x.code)).map(x=>x.code).sort(),['C3','C4','C5']);result.issues=result.issues.filter(x=>!['C3','C4','C5'].includes(x.code));
 }
 return result;
}
export function beforeW20261016_003Uploads(rows){const matches=rows.filter(x=>files[x.slug]===x.file);assert.deepEqual(matches.map(x=>x.slug).sort(),[...w20261016_003Slugs].sort(),'W-003 requires exactly four brochure uploads');return rows.filter(x=>files[x.slug]!==x.file);}
export function isW20261016_003Manual(value){const name=typeof value==='string'?value:value.name;return Object.values(files).some(file=>file.endsWith('/'+name));}
export const w20261016_003UploadFiles=files;
