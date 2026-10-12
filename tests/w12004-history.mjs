import { createHash } from 'node:crypto';

// Undo only the three approved W-004 flow additions for older whole-product
// hashes. All other current fields remain visible to their original tests.
const approved = Object.freeze({
  'srg-x40uh': '6913100f74d90910f52e289aa67aeee806fdcb9b184dba44de109a11f3cddb29',
  tr335: '1b7a596e4884295d0f4bbba253b77a1eb2c339cd41ff4e627d113a815397ea61',
  tr315: '1b7a596e4884295d0f4bbba253b77a1eb2c339cd41ff4e627d113a815397ea61'
});
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeW12004Product(current, slug) {
  if (!Object.hasOwn(approved, slug)) return current;
  if (sha(current.signalFlow) !== approved[slug]) throw new Error(`${slug}: unexpected W-004 signalFlow change`);
  const prior = structuredClone(current);
  delete prior.signalFlow;
  return prior;
}

export function beforeW12004Raw(raw, slug) {
  if (!Object.hasOwn(approved, slug)) return raw;
  return JSON.stringify(beforeW12004Product(JSON.parse(raw), slug), null, 2) + (raw.endsWith('\n') ? '\n' : '');
}
