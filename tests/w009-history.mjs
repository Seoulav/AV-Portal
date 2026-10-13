import assert from 'node:assert/strict';

export const insta360W009Slugs = Object.freeze([
  'insta360-connect',
  'insta360-link-2',
  'insta360-wave-business',
  'insta360-wave',
]);
const slugSet = new Set(insta360W009Slugs);

function removeExactW009Additions(items, getSlug, label) {
  const matches = items.filter(item => slugSet.has(getSlug(item)));
  assert.deepEqual(
    matches.map(getSlug).sort(),
    [...insta360W009Slugs].sort(),
    `${label}: expected the four W-009 additions before reversing them`,
  );
  return items.filter(item => !slugSet.has(getSlug(item)));
}

// Historical regression tests compare the repository with snapshots from before W-009.
// Reverse only the four newly registered Insta360 identities; preserve every other row.
export function beforeW009Catalog(items) {
  return removeExactW009Additions(items, item => item.slug, 'W-009 catalog');
}

export function beforeW009DetailFiles(files) {
  const names = new Set(insta360W009Slugs.map(slug => `${slug}.json`));
  const matches = files.filter(file => names.has(typeof file === 'string' ? file : file.name));
  assert.deepEqual(
    matches.map(file => typeof file === 'string' ? file : file.name).sort(),
    [...names].sort(),
    'W-009 detail files: expected the four additions before reversing them',
  );
  return files.filter(file => !names.has(typeof file === 'string' ? file : file.name));
}

export function beforeW009Uploads(uploads) {
  return removeExactW009Additions(uploads, item => item.slug, 'W-009 uploaded documents');
}
export function isW009DetailFile(file) {
  const name = typeof file === 'string' ? file : file.name;
  return new Set(insta360W009Slugs.map(slug => `${slug}.json`)).has(name);
}
export function beforeW009Snapshot(snapshot) {
  const result = structuredClone(snapshot);
  const detailSlugs = Object.keys(result.details ?? {}).filter(slugSet.has.bind(slugSet));
  assert.deepEqual(detailSlugs.sort(), [...insta360W009Slugs].sort(), 'W-009 snapshot details');
  for (const slug of insta360W009Slugs) delete result.details[slug];
  result.catalog.count -= insta360W009Slugs.length;
  return result;
}
export function isW009Manual(file) {
  const name = typeof file === 'string' ? file : file.name;
  return name === 'insta360-conference-line-collection-20260729.pdf';
}
