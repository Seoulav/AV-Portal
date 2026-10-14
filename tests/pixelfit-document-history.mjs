import assert from 'node:assert/strict';

const pixelFitDocument = Object.freeze({
  slug: 'emision-pixelfit',
  file: 'manuals/emision-pixelfit-capture.pdf',
});

export function withoutPixelFitDocumentUpload(uploads) {
  const matches = uploads.filter(item => item.slug === pixelFitDocument.slug && item.file === pixelFitDocument.file);
  assert.equal(matches.length, 1, 'expected exactly one PixelFit document upload before reversing it');
  return uploads.filter(item => item.slug !== pixelFitDocument.slug || item.file !== pixelFitDocument.file);
}

export function isPixelFitDocument(file) {
  const name = typeof file === 'string' ? file : file.name;
  return name === pixelFitDocument.file.slice('manuals/'.length);
}
