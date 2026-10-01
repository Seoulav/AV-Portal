import { scenario } from './model.mjs?v=h5-output-2';
const $=id=>document.getElementById(id);
function render(mode){
 const p=scenario(mode);$('video-layer').setAttribute('transform',`translate(${p.x} 114)`);$('video-rect').setAttribute('width',p.width);
 for(const id of ['video-name','video-caption'])$(id).setAttribute('x',p.width/2);
 const title=`영상 1개 · 걸친 출력 ${p.totalConsumed}개 · 카드 자원 ${p.totalConsumed}개 사용.`;
 const usedNames=p.used.flatMap((n,i)=>n?[`OUT ${i+1}`]:[]).join(' · ');
 $('result-sentence').querySelector('strong').textContent=title;
 $('result-sentence').querySelector('span').textContent=`카드 한 장의 ${usedNames}에서 자원을 사용하는 예시입니다.`;
 $('svg-title').textContent=title;$('svg-desc').textContent=`사용자 운용 설명 예시. ${title} 공식 문구와의 적용 조건은 대조가 필요합니다.`;
 $('used-total').textContent=p.totalConsumed;$('remaining-card').textContent=`이 영상만 배치하면 ${p.remaining}개 남음`;
 $('output-usage').textContent=p.used.map((n,i)=>`OUT ${i+1}: ${n}`).join(' · ');
 $('slots-card').replaceChildren(...Array.from({length:16},(_,i)=>{const item=document.createElement('i');if(i<p.totalConsumed)item.className='used';return item;}));
}
document.querySelectorAll('input[name="placement"]').forEach(input=>input.addEventListener('change',()=>render(input.value)));
const scroll=document.querySelector('.diagram-scroll');
scroll.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(event.key==='Home')scroll.scrollLeft=0;else if(event.key==='End')scroll.scrollLeft=scroll.scrollWidth;else scroll.scrollLeft+=event.key==='ArrowRight'?120:-120;});
render('two');document.querySelector('.modes').disabled=false;
