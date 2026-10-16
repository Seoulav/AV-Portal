const SLUG = 'belkin-connect-air';
const PDF_URL = 'https://s3.belkin.com/resources/pdf/avc024-sales-sheet.pdf';
const PDF_FILE = 'belkin-connect-air-specification-2650a8f7c667.pdf';
const PDF_SHA = 'e7e3f1a8d8b438aa2f26e1cad5202505980bc1e36d0cadee6952b8c39a25214b';

// Rewind only the W-008 addition when an older test checks its original snapshot.
// The dedicated W-008 tests validate the live Belkin catalog, product, and PDF.
export function beforeW008Catalog(catalog) {
  const additions = catalog.filter(item => item.slug === SLUG || item.brand === 'Belkin' && item.product === 'Connect Air');
  if (additions.length !== 1 || additions[0].slug !== SLUG || additions[0].brand !== 'Belkin' || additions[0].product !== 'Connect Air') {
    throw new Error('Unexpected W-008 catalog record; historical checks cannot rewind it');
  }
  return catalog.filter(item => item !== additions[0]);
}

export function beforeW008Manifest(manifest) {
  const additions = manifest.mirrors.filter(item => item.url === PDF_URL || item.file === PDF_FILE);
  if (additions.length !== 1 || additions[0].url !== PDF_URL || additions[0].file !== PDF_FILE || additions[0].sha256 !== PDF_SHA) {
    throw new Error('Unexpected W-008 Belkin document; historical checks cannot rewind it');
  }
  return { ...manifest, mirrors: manifest.mirrors.filter(item => item !== additions[0]) };
}

export function isW008DetailFile(name) {
  return String(name).replaceAll('\\', '/').split('/').at(-1) === `${SLUG}.json`;
}
export function beforeW008Snapshot(snapshot) {
  if (!snapshot.details?.[SLUG] || snapshot.catalog?.count < 1) throw new Error('Unexpected W-008 public snapshot; historical checks cannot rewind it');
  const details = { ...snapshot.details };
  delete details[SLUG];
  return { ...snapshot, catalog: { ...snapshot.catalog, count: snapshot.catalog.count - 1 }, details };
}
