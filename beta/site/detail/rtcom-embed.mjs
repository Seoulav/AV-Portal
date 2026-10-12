const CONFIGURATOR = 'https://seoulav.github.io/rtcom-configurator/';

export function rtcomProductViewUrl(id) {
  return typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)
    ? `${CONFIGURATOR}#products/${id}` : null;
}

export function rtcomEmbedLayout() {
  return {
    primary: ['gallery', 'related-products', 'documents', 'sources'],
    disclosure: ['overview', 'io', 'specifications', 'features', 'setting-*']
  };
}

// The published portal and configurator share an origin. If that changes, leave
// the portal's existing cards in place rather than showing a broken partial view.
export function mountRtcomProductView(id, hero, onReady) {
  const url = rtcomProductViewUrl(id);
  if (!url) return null;
  const section = document.createElement('section');
  section.className = 'rtcom-product-view pg-card';
  section.hidden = true;
  const heading = document.createElement('h2');
  heading.textContent = '알티컴 원본 제품정보';
  heading.className = 'sr-only';
  const frame = document.createElement('iframe');
  frame.title = `알티컴 ${id} 제품정보`;
  frame.src = url;
  frame.loading = 'eager';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  section.append(heading, frame);
  hero.after(section);

  let ready = false;
  let resizeObserver;
  let mutationObserver;
  let deadline;
  const fail = () => {
    if (ready) return;
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    section.remove();
  };
  const check = () => {
    let doc;
    try { doc = frame.contentDocument; } catch { fail(); return; }
    if (!doc) { fail(); return; }
    const product = doc.querySelector('.rt-products-view h1');
    if (!product) return;
    if (!ready) {
      ready = true;
      clearTimeout(deadline);
      const style = doc.createElement('style');
      style.textContent = '.rt-top,.rt-view-tabs,.rt-nav,.rt-footer{display:none!important}body{padding:0!important;min-height:0!important}.rt-products-view{margin:0!important}';
      doc.head.append(style);
      section.hidden = false;
      onReady();
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(doc.querySelector('.rt-products-view'));
    }
    updateHeight();
  };
  const updateHeight = () => {
    const doc = frame.contentDocument;
    if (!doc) return;
    const product = doc.querySelector('.rt-products-view');
    if (!product) return;
    // Measuring the product avoids a feedback loop with the iframe viewport's
    // own documentElement scrollHeight / min-height rules.
    frame.style.height = `${Math.ceil(product.getBoundingClientRect().bottom + doc.defaultView.scrollY) + 2}px`;
  };
  frame.addEventListener('load', () => {
    let doc;
    try { doc = frame.contentDocument; } catch { fail(); return; }
    if (!doc) { fail(); return; }
    mutationObserver?.disconnect();
    mutationObserver = new MutationObserver(check);
    mutationObserver.observe(doc.documentElement, { childList: true, subtree: true });
    check();
  });
  deadline = setTimeout(fail, 20000);
  return section;
}
