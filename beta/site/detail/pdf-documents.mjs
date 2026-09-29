const validName = name => /^[a-z0-9-]+\.pdf$/.test(name);

export function resolveDocumentAction(document, manifest) {
  if (!document?.url) return null;
  const copy = (manifest?.mirrors ?? []).find(entry => entry.url === document.url && validName(entry.file));
  if (copy) return { kind: 'local', file: `../docs/${copy.file}`, sourceUrl: document.url };
  return { kind: 'external', url: document.url };
}

export function uploadedDocumentsFor(slug, manifest) {
  return (manifest?.uploads ?? [])
    .filter(entry => entry.slug === slug && /^manuals\/[a-z0-9-]+\.pdf$/.test(entry.file))
    .map(entry => {
      const file = `../${entry.file}`;
      return {
        title: entry.title,
        label: entry.kind === 'manual' ? '매뉴얼' : '참고자료',
        status: 'FOUND',
        action: { kind: 'local', file, sourceUrl: file }
      };
    });
}

export function documentCardVisible(existingDocuments, uploadedDocuments) {
  return existingDocuments.length > 0 || uploadedDocuments.length > 0;
}
