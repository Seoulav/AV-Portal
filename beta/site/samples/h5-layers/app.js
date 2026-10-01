import { scenario } from './model.mjs?v=h5-sample-1';
const $ = id => document.getElementById(id);
function render(mode) {
  const p = scenario(mode);
  $('video-layer').setAttribute('transform', `translate(${p.x} 104)`);
  const span = p.id === 'span';
  const name = p.id === 'left' ? 'A' : 'B';
  const title = span ? '영상은 1개, 사용하는 카드 자원은 1 + 1개.' : `영상은 1개, 카드 ${name}에서만 자원 1개 사용.`;
  const explanation = span ? '경계에 걸친 부분이 양쪽 카드의 자원을 각각 사용합니다.' : `다른 카드에는 이 영상의 자원이 배정되지 않습니다.`;
  $('result-sentence').querySelector('strong').textContent = title;
  $('result-sentence').querySelector('span').textContent = explanation;
  $('svg-title').textContent = span ? '출력 카드 A와 B에 걸친 영상 한 개' : `출력 카드 ${name} 안의 영상 한 개`;
  $('svg-desc').textContent = `${title} ${explanation} 사용자 운용 설명에 따른 2K 영상 배치 예시입니다.`;
  ['a', 'b'].forEach((key, i) => {
    $(`used-${key}`).textContent = p.used[i];
    $(`remaining-${key}`).textContent = `이 영상만 배치하면 ${p.remaining[i]}개 남음`;
    $(`slots-${key}`).replaceChildren(...Array.from({ length: 16 }, (_, n) => {
      const slot = document.createElement('i');
      if (n < p.used[i]) slot.className = 'used';
      return slot;
    }));
  });
}
document.querySelectorAll('input[name="placement"]').forEach(input => input.addEventListener('change', () => render(input.value)));
const scroll = document.querySelector('.diagram-scroll');
scroll.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Home') scroll.scrollLeft = 0;
  else if (event.key === 'End') scroll.scrollLeft = scroll.scrollWidth;
  else scroll.scrollLeft += event.key === 'ArrowRight' ? 120 : -120;
});
render('span');
document.querySelector('.modes').disabled = false;

requestAnimationFrame(() => { scroll.scrollLeft = Math.max(0, (scroll.scrollWidth - scroll.clientWidth) / 2); });
