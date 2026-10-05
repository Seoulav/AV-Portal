import { readFileSync } from 'node:fs';

// Earlier work tests protect their then-current baseline. W-032 deliberately
// changes only these camera JSON files and adds four PDF mirrors; compare the
// preserved pre-W-032 bytes when replaying those historical assertions.
const cameraSlugs = new Set(['brc-am7', 'srg-a40', 'srg-x40uh', 'rm-ip10', 'rm-ip500']);
const mirrorFiles = new Set([
  'sony-brc-am7-helpguide-ko.pdf',
  'sony-srg-a40-a12-manual-ko.pdf',
  'sony-srg-x40uh-h40uh-manual-ko.pdf',
  'sony-rm-ip500-manual-ko.pdf'
]);

export function beforeW032Raw(raw, slug) {
  return cameraSlugs.has(slug)
    ? readFileSync(new URL(`./fixtures/w032-before/${slug}.json`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
    : raw;
}

export function beforeW032Product(product, slug) {
  return cameraSlugs.has(slug) ? JSON.parse(beforeW032Raw('', slug)) : product;
}

export function beforeW032Mirrors(mirrors) {
  return mirrors.filter(entry => !mirrorFiles.has(entry.file));
}
