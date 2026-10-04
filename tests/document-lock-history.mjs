const lockedFiles = new Set([
  'manuals/samsung-115qhf-spec-ko.pdf',
  'manuals/samsung-lcd-signage-product-guide-ko.pdf',
  'manuals/samsung-videowall-product-guide-ko.pdf'
]);

// Older evidence predates W-021. Remove only its twelve new annotations for historical SHA checks.
export function beforeW04021Uploads(uploads) {
  return uploads.map(entry => {
    if (!lockedFiles.has(entry.file)) return entry;
    const { locked, ...prior } = entry;
    return prior;
  });
}
