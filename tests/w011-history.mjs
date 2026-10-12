// DS-8S is new after these historical inventory checkpoints. Remove only its
// two approved uploads / catalog row, leaving every earlier entry observable.
export const withoutW011Uploads = uploads => uploads.filter(entry => entry.slug !== 'ds-8s');
export const withoutW011Catalog = catalog => catalog.filter(entry => entry.slug !== 'ds-8s');
export const isW011Manual = name => new Set([
  'vs-ent-ds-8s-leaflet-ko.pdf', 'vs-ent-ds-8s-amx-manual-ko.pdf'
]).has(name);
