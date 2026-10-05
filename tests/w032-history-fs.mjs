import { readFileSync as readCurrentFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export * from 'node:fs';

// Historical tests compare their original whole-catalog baseline. Replay only
// W-032's five changed camera files as they were at the start of this batch;
// current camera behavior is checked separately in camera-documents-flow.
const cameraNames = new Set(['brc-am7.json', 'srg-a40.json', 'srg-x40uh.json', 'rm-ip10.json', 'rm-ip500.json']);

export function readFileSync(path, options) {
  const file = path instanceof URL ? fileURLToPath(path) : String(path);
  const normalized = file.replace(/\\/g, '/');
  if (cameraNames.has(basename(file)) && normalized.includes('/beta/site/detail/data/')) {
    return readCurrentFileSync(new URL(`./fixtures/w032-before/${basename(file)}`, import.meta.url), options);
  }
  return readCurrentFileSync(path, options);
}
