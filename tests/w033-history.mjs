// Reconstruct pre-W-033 upload history without replacing the current manifest.
const files = new Set([
  'manuals/samsung-behx-h-quick-guide-ko.pdf',
  'manuals/samsung-behx-h-installation-guide-ko.pdf',
  'manuals/samsung-behx-h-common-manual-ko.pdf',
]);

export function beforeW033Uploads(uploads) {
  return uploads.filter(entry => entry.slug !== 'lh43behhlbfxkr' || !files.has(entry.file));
}

export function isW033Manual(name) {
  return files.has(`manuals/${name}`);
}
