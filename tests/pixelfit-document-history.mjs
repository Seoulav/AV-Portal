import assert from 'node:assert/strict';

const pixelFitDocuments = Object.freeze([
  'emision-pixelfit-capture.pdf',
  'emision-pixelfit-description.pdf',
]);
const pixelFitFiles = new Set(pixelFitDocuments.map(file => 'manuals/' + file));

export function withoutPixelFitDocumentUpload(uploads) {
  const matches = uploads.filter(item => item.slug === 'emision-pixelfit' && pixelFitFiles.has(item.file));
  assert.deepEqual(matches.map(item => item.file).sort(), [...pixelFitFiles].sort(), 'expected both PixelFit document uploads before reversing them');
  return uploads.filter(item => item.slug !== 'emision-pixelfit' || !pixelFitFiles.has(item.file));
}

export function isPixelFitDocument(file) {
  const name = typeof file === 'string' ? file : file.name;
  return pixelFitDocuments.includes(name);
}
