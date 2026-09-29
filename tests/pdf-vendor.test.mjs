import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const expected = {
  'LICENSE': '0d542e0c8804e39aa7f37eb00da5a762149dc682d7829451287e11b938e94594',
  'VERSION.txt': '43de5948cefba83d704fbf3f6079f9ede2f812aa3b59c30674a04e14028e2086',
  'pdf.min.mjs': '44ec6f011027ee77791386b66c14876a5fc29e20bf0433c07c6726fff7212b72',
  'pdf.worker.min.mjs': 'bd88805178a26c729db8c0107a5b630cb900ec070f4d8c7529a3e45530afd41d'
};

test('same PDF.js build as RTCOM is packaged locally', async () => {
  for (const [name, sha] of Object.entries(expected)) {
    const bytes = await readFile(new URL(`../beta/site/vendor/pdfjs/${name}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha, name);
  }
});
