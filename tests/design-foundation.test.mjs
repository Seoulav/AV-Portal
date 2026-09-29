import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('design foundation includes the exact font, license, and scoped shared style', async () => {
  const font = await readFile(new URL('beta/site/fonts/PretendardVariable.woff2', root));
  const license = await read('beta/site/fonts/OFL.txt');
  const css = await read('beta/site/shared/pg.css');
  assert.equal(font.subarray(0, 4).toString('ascii'), 'wOF2');
  assert.ok(font.length > 1_000_000);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(css, /@font-face/);
  assert.match(css, /\.pg-page\s*\{/);
  assert.doesNotMatch(css, /(?:^|\})\s*body\s*\{/);
  assert.match(css, /repeat\(auto-fill,\s*minmax\(180px,\s*1fr\)\)/);
});

test('stage 3 opts home and detail into the shared style', async () => {
  const home = await read('beta/site/index.html');
  const details = [await read('prototype/brc-am7/index.html'), await read('beta/site/detail/index.html')];
  for (const page of [home, ...details]) {
    assert.match(page, /pg\.css/);
    assert.match(page, /PretendardVariable\.woff2/);
  }
  assert.match(home, /<body[^>]*class="pg-page"/);
  for (const page of details) assert.match(page, /<body[^>]*class="pg-page"/);
});

test('local sample has all seven ordered cards and stays outside Pages', async () => {
  const sample = await read('prototype/pg-sample/index.html');
  const ids = [...sample.matchAll(/data-card="(0[1-7])"/g)].map(match => match[1]);
  assert.deepEqual(ids, ['01', '02', '03', '04', '05', '06', '07']);
  assert.match(sample, /class="pg-page/);
  assert.ok(!(await readdir(new URL('beta/site/', root))).includes('pg-sample'));
});
