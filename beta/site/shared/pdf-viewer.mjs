const ZOOMS = [1, 1.5, 2, 3];
const WIDTH_KEY = 'avPortal.docPopupWidth';
const MIN_WIDTH = 480;
let pdfLibrary;

async function library() {
  if (!pdfLibrary) {
    const lib = await import('../vendor/pdfjs/pdf.min.mjs');
    lib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
    pdfLibrary = lib;
  }
  return pdfLibrary;
}

function button(label, action, extra = '') {
  const item = document.createElement('button');
  item.type = 'button';
  item.textContent = label;
  item.dataset.pdfAction = action;
  item.className = extra;
  return item;
}

export function createPdfViewer() {
  const dialog = document.createElement('dialog');
  dialog.id = 'pdf-dialog';
  dialog.className = 'pdf-dialog';
  dialog.setAttribute('aria-label', 'PDF 문서 보기');
  const head = document.createElement('div');
  head.className = 'pdf-head';
  const title = document.createElement('strong');
  title.className = 'pdf-title';
  const tools = document.createElement('div');
  tools.className = 'pdf-tools';
  const previous = button('‹', 'previous');
  previous.setAttribute('aria-label', '이전 쪽');
  const pageInput = document.createElement('input');
  pageInput.className = 'pdf-page-input';
  pageInput.type = 'number';
  pageInput.min = '1';
  pageInput.value = '1';
  pageInput.setAttribute('aria-label', '이동할 쪽 번호');
  const pageTotal = document.createElement('span');
  pageTotal.className = 'pdf-page-total';
  const next = button('›', 'next');
  next.setAttribute('aria-label', '다음 쪽');
  const zoomOut = button('−', 'zoom-out');
  zoomOut.setAttribute('aria-label', '축소');
  const zoomLevel = document.createElement('span');
  zoomLevel.className = 'pdf-zoom-level';
  const zoomIn = button('+', 'zoom-in');
  zoomIn.setAttribute('aria-label', '확대');
  const download = document.createElement('a');
  download.className = 'pdf-link';
  download.textContent = '↓ 내려받기';
  const source = document.createElement('a');
  source.className = 'pdf-link';
  source.textContent = '원문 링크 ↗';
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  const wide = button('넓게', 'wide');
  wide.className = 'pdf-wide';
  wide.setAttribute('aria-pressed', 'false');
  const close = button('닫기 ×', 'close');
  close.className = 'pdf-close';
  tools.append(previous, pageInput, pageTotal, next, zoomOut, zoomLevel, zoomIn, download, source, wide, close);
  head.append(title, tools);
  const scroller = document.createElement('div');
  scroller.className = 'pdf-body';
  const status = document.createElement('p');
  status.className = 'pdf-status';
  status.setAttribute('role', 'status');
  const pages = document.createElement('div');
  pages.className = 'pdf-pages';
  scroller.append(status, pages);
  const left = document.createElement('div');
  left.className = 'pdf-resize';
  left.dataset.pdfResize = 'left';
  left.setAttribute('aria-hidden', 'true');
  const right = document.createElement('div');
  right.className = 'pdf-resize';
  right.dataset.pdfResize = 'right';
  right.setAttribute('aria-hidden', 'true');
  dialog.append(head, scroller, left, right);
  document.body.append(dialog);

  let state = null;
  let trigger = null;
  let drag = null;
  let resizeTimer = 0;
  const maxWidth = () => innerWidth - 16;
  const fitWidth = () => Math.max(240, scroller.clientWidth - 24);
  const readWidth = () => {
    try { return Number(localStorage.getItem(WIDTH_KEY)) || 0; }
    catch { return 0; }
  };
  const saveWidth = width => {
    try { width ? localStorage.setItem(WIDTH_KEY, String(Math.round(width))) : localStorage.removeItem(WIDTH_KEY); }
    catch { /* Storage can be disabled. */ }
  };
  const applyWidth = width => {
    const custom = width >= MIN_WIDTH && innerWidth > 560;
    dialog.style.width = custom ? `${Math.min(width, maxWidth())}px` : '';
    wide.setAttribute('aria-pressed', String(custom && width >= maxWidth()));
  };
  function release(slot) {
    const canvas = slot.querySelector('canvas');
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    slot.replaceChildren();
    delete slot.dataset.drawn;
  }
  function clearCurrent() {
    const old = state;
    state = null;
    old?.observer?.disconnect();
    old?.slots?.forEach(release);
    old?.task?.destroy();
    if (trigger?.isConnected) trigger.focus();
    trigger = null;
  }
  function updateTools() {
    if (!state) return;
    zoomLevel.textContent = `${ZOOMS[state.zoom] * 100}%`;
    zoomOut.disabled = !state.ready || state.zoom === 0;
    zoomIn.disabled = !state.ready || state.zoom === ZOOMS.length - 1;
    previous.disabled = !state.ready || Number(pageInput.value) <= 1;
    next.disabled = !state.ready || Number(pageInput.value) >= (state.pdf?.numPages ?? 0);
  }
  async function pump(current) {
    if (current.busy) return;
    current.busy = true;
    try {
      while (state === current && dialog.open) {
        const generation = current.generation;
        const box = scroller.getBoundingClientRect();
        const middle = box.top + box.height / 2;
        let target = -1, distance = Infinity;
        for (const index of current.visible) {
          const slot = current.slots[index];
          if (slot.dataset.drawn === String(generation)) continue;
          const rect = slot.getBoundingClientRect();
          const diff = Math.abs(rect.top + rect.height / 2 - middle);
          if (diff < distance) { target = index; distance = diff; }
        }
        if (target < 0) break;
        const slot = current.slots[target];
        const page = await current.pdf.getPage(target + 1);
        const base = page.getViewport({ scale: 1 });
        const cssWidth = Number.parseFloat(slot.style.width);
        const cssHeight = Math.floor(cssWidth * base.height / base.width);
        slot.style.height = `${cssHeight}px`;
        const pixelScale = Math.min(devicePixelRatio || 1, 4096 / cssWidth, 4096 / cssHeight);
        const viewport = page.getViewport({ scale: cssWidth / base.width * pixelScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        if (state !== current || generation !== current.generation || !current.visible.has(target)) {
          canvas.width = 0; canvas.height = 0; continue;
        }
        slot.replaceChildren(canvas);
        slot.dataset.drawn = String(generation);
        status.hidden = true;
      }
    } catch {
      current.error = true;
      if (state === current && dialog.open) { status.hidden = false; status.textContent = '미리보기를 불러오지 못했습니다. 원문 링크를 이용해 주세요.'; }
    } finally {
      current.busy = false;
      if (state === current && !current.error && [...current.visible].some(index => current.slots[index]?.dataset.drawn !== String(current.generation))) queueMicrotask(() => pump(current));
    }
  }
  function layout(current) {
    if (state !== current || !current.ready) return;
    const ratio = scroller.scrollHeight > scroller.clientHeight ? scroller.scrollTop / scroller.scrollHeight : 0;
    current.generation++;
    current.fitWidth = fitWidth();
    current.observer?.disconnect();
    current.visible = new Set();
    current.slots.forEach((slot, index) => {
      const size = current.sizes[index];
      const scale = current.fitWidth / size.width * ZOOMS[current.zoom];
      slot.style.width = `${Math.floor(size.width * scale)}px`;
      slot.style.height = `${Math.floor(size.height * scale)}px`;
      release(slot);
    });
    scroller.scrollTop = ratio * scroller.scrollHeight;
    current.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const index = Number(entry.target.dataset.page) - 1;
        if (entry.isIntersecting) current.visible.add(index);
        else { current.visible.delete(index); release(entry.target); }
      }
      const first = [...current.visible].sort((a, b) => a - b)[0];
      if (first !== undefined) { pageInput.value = String(first + 1); updateTools(); }
      pump(current);
    }, { root: scroller, rootMargin: '100% 0px' });
    current.slots.forEach(slot => current.observer.observe(slot));
    updateTools();
  }
  async function open({ file, title: documentTitle, sourceUrl, trigger: sourceButton }) {
    if (dialog.open) dialog.close();
    if (state) clearCurrent();
    trigger = sourceButton ?? document.activeElement;
    const current = { zoom: 0, ready: false, visible: new Set(), generation: 0, busy: false };
    state = current;
    title.textContent = documentTitle || 'PDF 문서';
    download.href = file;
    download.download = file.split('/').at(-1);
    source.href = sourceUrl || file;
    pageInput.value = '1';
    pageTotal.textContent = '/ –';
    pages.replaceChildren();
    status.hidden = false;
    status.textContent = '문서를 불러오는 중입니다…';
    applyWidth(readWidth());
    updateTools();
    dialog.showModal();
    close.focus();
    try {
      const lib = await library();
      const task = lib.getDocument({ url: file, isEvalSupported: false });
      current.task = task;
      const pdf = await task.promise;
      if (state !== current || !dialog.open) { await pdf.destroy(); return; }
      current.pdf = pdf;
      const firstPage = await pdf.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: 1 });
      const fallbackSize = { width: firstViewport.width, height: firstViewport.height };
      current.sizes = Array.from({ length: pdf.numPages }, () => fallbackSize);
      if (state !== current || !dialog.open) { await pdf.destroy(); return; }
      current.slots = current.sizes.map((_, index) => {
        const slot = document.createElement('div');
        slot.className = 'pdf-page';
        slot.dataset.page = String(index + 1);
        slot.setAttribute('role', 'img');
        slot.setAttribute('aria-label', `${documentTitle} ${index + 1}쪽`);
        return slot;
      });
      pages.replaceChildren(...current.slots);
      pageTotal.textContent = `/ ${pdf.numPages}`;
      current.ready = true;
      layout(current);
    } catch {
      if (state === current && dialog.open) status.textContent = '미리보기를 불러오지 못했습니다. 원문 링크를 이용해 주세요.';
    }
  }
  function goToPage(value) {
    if (!state?.ready) return;
    const number = Math.max(1, Math.min(state.slots.length, Number(value) || 1));
    pageInput.value = String(number);
    state.slots[number - 1].scrollIntoView({ block: 'start' });
    updateTools();
  }
  tools.addEventListener('click', event => {
    const action = event.target.closest('button[data-pdf-action]')?.dataset.pdfAction;
    if (!action) return;
    if (action === 'close') dialog.close();
    if (action === 'previous') goToPage(Number(pageInput.value) - 1);
    if (action === 'next') goToPage(Number(pageInput.value) + 1);
    if (action === 'zoom-in' || action === 'zoom-out') {
      state.zoom = Math.max(0, Math.min(ZOOMS.length - 1, state.zoom + (action === 'zoom-in' ? 1 : -1)));
      layout(state);
    }
    if (action === 'wide') {
      const expand = wide.getAttribute('aria-pressed') !== 'true';
      const width = expand ? maxWidth() : 0;
      applyWidth(width);
      saveWidth(width);
    }
  });
  pageInput.addEventListener('change', () => goToPage(pageInput.value));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    if (!dialog.open) clearCurrent();
  });
  dialog.addEventListener('pointerdown', event => {
    const handle = event.target.closest('[data-pdf-resize]');
    if (!handle || event.button !== 0 || innerWidth <= 560) return;
    const box = dialog.getBoundingClientRect();
    drag = { center: box.left + box.width / 2, id: event.pointerId };
    handle.setPointerCapture(event.pointerId);
    dialog.classList.add('pdf-resizing');
  });
  dialog.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    dialog.style.width = `${Math.round(Math.max(MIN_WIDTH, Math.min(maxWidth(), Math.abs(event.clientX - drag.center) * 2)))}px`;
  });
  const endDrag = event => {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    dialog.classList.remove('pdf-resizing');
    const width = dialog.getBoundingClientRect().width;
    saveWidth(width);
    applyWidth(width);
  };
  dialog.addEventListener('pointerup', endDrag);
  dialog.addEventListener('pointercancel', endDrag);
  dialog.addEventListener('dblclick', event => {
    if (event.target.closest('[data-pdf-resize]')) { saveWidth(0); applyWidth(0); }
  });
  new ResizeObserver(() => {
    if (!state?.ready || !dialog.open || Math.abs(fitWidth() - state.fitWidth) < 4) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state?.ready) layout(state); }, 200);
  }).observe(dialog);
  return { open, dialog };
}
