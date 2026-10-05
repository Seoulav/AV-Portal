import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const slugs = {
  lh115qhfebgxkr: 10,
  lh32qmcebgcxkr: 5,
  lh43qmcebgcxkr: 10,
  lh85qmcebgcxkr: 10,
  lh98qmcebgcxkr: 10,
  lh43qhcebgcxkr: 10,
  lh75qhcebgcxkr: 10
};
const oldDescription = 'RS232C 어댑터를 이용하여 MDC를 연결할 때 사용합니다.';

test('detail header scrolls with the mobile page while desktop remains sticky', () => {
  for (const path of ['beta/site/detail/styles.css', 'prototype/brc-am7/styles.css']) {
    const css = read(path);
    assert.match(css, /\.site-header\s*\{\s*position:\s*sticky;\s*z-index:/);
    assert.match(css, /@media\s*\(max-width:\s*650px\)[\s\S]*?\.site-header\s*\{\s*position:\s*relative;/);
    assert.doesNotMatch(css, /@media\s*\(max-width:\s*650px\)[\s\S]*?\.site-header\s*\{\s*display:\s*none/);
  }
});

test('seven Samsung RS-232C output markers explain passthrough without changing inputs', () => {
  for (const [slug, number] of Object.entries(slugs)) {
    const data = JSON.parse(read(`beta/site/detail/data/${slug}.json`));
    const output = data.portMap.items.find(item => item.n === number);
    const input = data.portMap.items.find(item => item.n === number - 1);
    assert.equal(output.label, 'RS-232C 출력', slug);
    assert.equal(input.label, 'RS-232C 입력', slug);
    assert.equal(input.desc, oldDescription, slug);
    assert.match(output.desc, /다음 (디스플레이|모니터).*명령/, slug);
    assert.doesNotMatch(output.desc, /MDC/, slug);
    const user = data.sources.find(source => source.code === 'U2');
    assert.ok(user, `${slug}: user-confirmed source`);
    assert.match(user.name, /사용자.*확인/);
    assert.match(user.scope, /RS-232C.*출력/);
    assert.doesNotMatch(user.scope, /매뉴얼.*근거/);
  }
});
