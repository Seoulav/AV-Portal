function allowedPdf(pdf, viewer) {
  if (pdf.origin !== viewer.origin || pdf.username || pdf.password || pdf.search || pdf.hash) return false;
  const siteRoot = new URL('../../', viewer);
  return ['docs/', 'manuals/'].some(directory => {
    const prefix = new URL(directory, siteRoot).pathname;
    return pdf.pathname.startsWith(prefix) && /^[a-z0-9-]+\.pdf$/.test(pdf.pathname.slice(prefix.length));
  });
}

export function resolveViewerPdf(search, viewerUrl) {
  try {
    const viewer = new URL(viewerUrl);
    const files = new URLSearchParams(search).getAll('file');
    if (files.length !== 1) return null;
    const pdf = new URL(files[0], viewer);
    return allowedPdf(pdf, viewer) ? pdf : null;
  } catch { return null; }
}

export function viewerHrefFor(file, pageUrl) {
  try {
    const page = new URL(pageUrl);
    const viewer = new URL('../pdfjs/web/viewer.html', page);
    const pdf = new URL(file, page);
    if (!allowedPdf(pdf, viewer)) return null;
    viewer.searchParams.set('file', pdf.pathname);
    return viewer.href;
  } catch { return null; }
}

export function isViewerPdfLocked(pdf, viewerUrl, manifest) {
  const viewer = new URL(viewerUrl);
  if (!pdf || !allowedPdf(pdf, viewer)) return true;
  const siteRoot = new URL('../../', viewer);
  const file = pdf.pathname.slice(siteRoot.pathname.length);
  if (!file.startsWith('manuals/')) return false;
  const upload = manifest?.uploads?.find(entry => entry.file === file);
  return upload ? upload.locked === true : true;
}
