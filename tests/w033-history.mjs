// Reconstruct pre-W-033 upload history without replacing the current manifest.
const files = new Set([
  'manuals/samsung-behx-h-quick-guide-ko.pdf',
  'manuals/samsung-behx-h-installation-guide-ko.pdf',
  'manuals/samsung-behx-h-common-manual-ko.pdf',
]);

export function beforeW033Uploads(uploads) {
  // The DS-8S uploads were added after W-033. They also must not enter
  // assertions about the earlier upload inventory.
  return uploads.filter(entry => entry.slug !== 'ds-8s' && (entry.slug !== 'lh43behhlbfxkr' || !files.has(entry.file)));
}

export function isW033Manual(name) {
  return files.has(`manuals/${name}`);
}
