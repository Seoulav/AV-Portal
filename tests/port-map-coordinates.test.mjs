import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeMobileRs232 } from './mobile-rs232-history.mjs';

const root = new URL('../', import.meta.url);
const a = ['lh43qmcebgcxkr', 'lh85qmcebgcxkr', 'lh98qmcebgcxkr', 'lh43qhcebgcxkr', 'lh75qhcebgcxkr'];
const b = 'lh32qmcebgcxkr';
const c = 'lh115qhfebgxkr';
const product = slug => JSON.parse(readFileSync(new URL(`beta/site/detail/data/${slug}.json`, root), 'utf8'));
const imageBytes = file => readFileSync(new URL(`beta/site/detail/images/${file}`, root));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

// Decode the published WebP itself in Chromium, then scan the dark connector icons.
// This deliberately checks the pixels rather than an independently maintained list of coordinates.
function pixelBands(files) {
  const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(path => path && existsSync(path));
  assert.ok(chrome, 'Chromium/Chrome is needed to verify published WebP pixels');
  const sources = files.map(file => `data:image/webp;base64,${imageBytes(file).toString('base64')}`);
  const html = `<!doctype html><meta charset="utf-8"><body>WAIT
    ${sources.map(src => `<img src="${src}">`).join('')}
    <script>window.addEventListener('load', () => {
    try {
    const result = [...document.images].map(image => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', {willReadFrequently:true});
      context.drawImage(image, 0, 0);
      const {data} = context.getImageData(0, 0, canvas.width, canvas.height);
      const ranges = []; let begin = -1;
      for (let y = 0; y < canvas.height; y++) {
        let dark = 0;
        for (let x = 35; x < Math.min(115, canvas.width); x++) {
          const at = (y * canvas.width + x) * 4;
          if ((data[at] * 299 + data[at + 1] * 587 + data[at + 2] * 114) / 1000 < 140) dark++;
        }
        if (dark && begin < 0) begin = y;
        else if (!dark && begin >= 0) { ranges.push([begin, y - 1]); begin = -1; }
      }
      if (begin >= 0) ranges.push([begin, canvas.height - 1]);
      const bands = ranges.filter(([first,last]) => last - first >= 3 &&
        !(first < 65 && last - first < 9) &&
        !(first > canvas.height - 110 && last - first < 9));
      return {width:canvas.width, height:canvas.height, bands};
    }); document.body.textContent = 'BANDS:' + JSON.stringify(result);
    } catch (error) { document.body.textContent = 'ERROR:' + error.message; }
    });
  </script></body>`;
  const dir = mkdtempSync(join(tmpdir(), 'av-port-bands-'));
  try {
    const file = join(dir, 'scan.html'); writeFileSync(file, html);
    const result = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu',
      `--user-data-dir=${join(dir, 'chrome-profile')}`, '--disable-background-networking',
      '--disable-dev-shm-usage', '--virtual-time-budget=10000', '--dump-dom', pathToFileURL(file).href],
    {encoding:'utf8', timeout:30000, maxBuffer:2_000_000});
    assert.equal(result.status, 0, result.stderr);
    const found = result.stdout.match(/BANDS:(\[[^<]+\])/);
    assert.ok(found, result.stdout.slice(-500));
    return JSON.parse(found[1].replaceAll('&quot;', '"'));
  } finally { rmSync(dir, {recursive:true, force:true}); }
}

function matchesBands(slug, scan) {
  const map = product(slug).portMap;
  assert.equal(map.items.length, scan.bands.length, `${slug}: icon count`);
  assert.deepEqual(map.measuredImage, {file: `${slug}-diagram.webp`, width:scan.width, height:scan.height});
  for (const [index, item] of map.items.entries()) {
    const [top, bottom] = scan.bands[index];
    assert.ok(Math.abs(item.y1 - top) <= 8 && Math.abs(item.y2 - bottom) <= 8,
      `${slug} #${item.n}: diagram ${top}–${bottom}, map ${item.y1}–${item.y2}`);
  }
}

test('five QMC/QHC diagrams have identical pixels and markers match each visible connector', () => {
  const scans = pixelBands(a.map(slug => `${slug}-diagram.webp`));
  const firstMap = product(a[0]).portMap.items.map(({y1,y2}) => [y1,y2]);
  const hashes = a.map(slug => sha(imageBytes(`${slug}-diagram.webp`)));
  assert.equal(new Set(hashes).size, 1);
  assert.equal(hashes[0], '43a0ce418f6779a153b1d43f565a37272b24f8ca4f3f1843615f33e2ef811a56',
    'the five approved diagram files stay byte-for-byte unchanged');
  for (const [index, slug] of a.entries()) {
    assert.deepEqual(product(slug).portMap.items.map(({y1,y2}) => [y1,y2]), firstMap);
    matchesBands(slug, scans[index]);
  }
});

test('new QM50C and QM75C diagrams match the published connector pixels', () => {
  const slugs = ['lh50qmcebgcxkr', 'lh75qmcebgcxkr'];
  const scans = pixelBands(slugs.map(slug => `${slug}-diagram.webp`));
  const approved = sha(imageBytes('lh43qmcebgcxkr-diagram.webp'));
  for (const [index, slug] of slugs.entries()) {
    assert.equal(sha(imageBytes(`${slug}-diagram.webp`)), approved, slug);
    matchesBands(slug, scans[index]);
  }
});

test('QM32C diagram markers match ten physical connectors including RJ45 and IR', () => {
  matchesBands(b, pixelBands([`${b}-diagram.webp`])[0]);
});

test('QH115FX uses its own eleven-port manual diagram in the published map', () => {
  const map = product(c).portMap;
  assert.equal(map.image, 'Diagram');
  assert.equal(sha(imageBytes(`${c}-diagram.webp`)),
    'f7e81af74ec54e29262cff3c38ffe214d613ad3903f30e5cf226c7efe10072e8');
  assert.deepEqual(map.items.slice(3,7).map(item => item.label),
    ['HDMI 입력 3 (ARC)', 'HDMI 입력 2', 'HDMI 입력 1', 'DisplayPort 입력']);
  matchesBands(c, pixelBands([`${c}-diagram.webp`])[0]);
});

test('all seven products preserve the approved marker numbers, labels, and manual descriptions', () => {
  const hash = createHash('sha256');
  for (const slug of [...a, b, c]) {
    hash.update(slug).update(JSON.stringify(beforeMobileRs232(product(slug), slug).portMap.items.map(
      ({n,label,desc,side}) => ({n,label,desc,side}))));
  }
  assert.equal(hash.digest('hex'), '6efdeff673bef36f69c6859ea400b7f02eb77d06f6fd00ebdccfd28f4068b6cd');
});

test('the seven product cores and photograph-only loupe rule remain scoped', () => {
  const hash = createHash('sha256');
  for (const slug of [...a, b, c]) {
    const core = structuredClone(beforeMobileRs232(product(slug), slug));
    delete core.portMap;
    core.images = core.images.filter(image => image.role !== 'Diagram');
    core.imageStatuses = core.imageStatuses.filter(image => image.role !== 'Diagram');
    hash.update(slug).update(JSON.stringify(core));
  }
  assert.equal(hash.digest('hex'), '31844c9b89df4ea3e85c586baf0f28e4697952a1cd797e18ede2644813f5acb9');
  for (const file of ['beta/site/detail/app.js', 'prototype/brc-am7/app.js']) {
    const source = readFileSync(new URL(file, root), 'utf8');
    assert.equal(source.match(/data\.images\[selectedImage\]\?\.role === 'Diagram'/g)?.length, 2,
      `${file}: both the inline and dialog loupe exclude diagrams by image role`);
  }
});
