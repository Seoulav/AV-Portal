const detailSlugs = new Map([
  ['sony\0brc-am7', 'brc-am7'],
  ['yamaha\0dm7', 'dm7'],
  ['aja\0ki pro go2', 'ki-pro-go2'],
  ['panasonic\0pt-mz17k', 'pt-mz17k'],
  ['logitech\0rally bar', 'rally-bar']
]);
const cards = document.querySelector('#cards');
function addDetailLinks() {
  for (const card of cards.querySelectorAll('.card')) {
    if (card.querySelector('.detail-link')) continue;
    const brand = card.querySelector('.card-brand')?.textContent.toLowerCase();
    const product = card.querySelector('h4')?.textContent.toLowerCase();
    const slug = detailSlugs.get(`${brand}\0${product}`);
    if (!slug) continue;
    const link = document.createElement('a');
    link.className = 'official-link detail-link';
    link.href = `./detail/?product=${encodeURIComponent(slug)}`;
    link.textContent = 'Product Detail 보기 →';
    const title = card.querySelector('h4');
    const titleLink = document.createElement('a');
    titleLink.href = link.href;
    titleLink.textContent = title.textContent;
    title.replaceChildren(titleLink);
    card.querySelector('.links').prepend(link);
  }
}
new MutationObserver(addDetailLinks).observe(cards, { childList: true });
addDetailLinks();
