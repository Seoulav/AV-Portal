const validName = name => /^[a-z0-9-]+\.pdf$/.test(name);
const RTCOM_DOCUMENT_PREFIX = '/rtcom-configurator/output/design/assets/docs/';

function trustedRtcomPdf(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:'
      && parsed.hostname === 'seoulav.github.io'
      && !parsed.username
      && !parsed.password
      && parsed.pathname.startsWith(RTCOM_DOCUMENT_PREFIX)
      && parsed.pathname.toLowerCase().endsWith('.pdf');
  } catch { return false; }
}

export function resolveDocumentAction(document, manifest) {
  if (typeof document?.file === 'string' && /^manuals\/[a-z0-9-]+\.pdf$/.test(document.file)) {
    const upload = (manifest?.uploads ?? []).find(entry => entry.file === document.file && typeof entry.slug === 'string');
    if (upload) return { kind: 'local', file: `../${upload.file}`, sourceUrl: `../${upload.file}`, ...(upload.locked === true ? { locked: true } : {}) };
  }
  if (!document?.url) return null;
  const copy = (manifest?.mirrors ?? []).find(entry => entry.url === document.url && validName(entry.file));
  if (copy) return { kind: 'local', file: `../../beta/site/docs/${copy.file}`, sourceUrl: document.url };
  if (trustedRtcomPdf(document.url)) return { kind: 'remote-pdf', file: document.url, sourceUrl: document.url };
  return { kind: 'external', url: document.url };
}

export function uploadedDocumentsFor(slug, manifest, excludedFiles = []) {
  const excluded = new Set(excludedFiles);
  return (manifest?.uploads ?? [])
    .filter(entry => entry.slug === slug && !excluded.has(entry.file) && /^manuals\/[a-z0-9-]+\.pdf$/.test(entry.file))
    .map(entry => {
      const file = `../${entry.file}`;
      return {
        title: entry.title,
        label: entry.kind === 'manual' ? '매뉴얼' : '참고자료',
        status: 'FOUND',
        action: { kind: 'local', file, sourceUrl: file, ...(entry.locked === true ? { locked: true } : {}) }
      };
    });
}

export function documentCardVisible(existingDocuments, uploadedDocuments) {
  return existingDocuments.length > 0 || uploadedDocuments.length > 0;
}

export function documentActionLabels(item, action, header = false) {
  const label = String(item.label || item.type || '문서').trim();
  if (action.kind === 'external') {
    return { primary: header ? `${label} ↗` : '제조사에서 열기 ↗' };
  }
  return {
    primary: header ? `${label} 보기` : '보기',
    download: header ? '↓' : '↓ 내려받기',
    downloadAria: `${label} 내려받기`
  };
}
