import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as home from '../beta/site/app.js';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('card summary uses only the existing Korean detail description', () => {
  assert.equal(typeof home.publicCardSummary, 'function');
  assert.equal(home.publicCardSummary({ korean: '  공식 한국어 요약  ' }), '공식 한국어 요약');
  assert.equal(home.publicCardSummary({ korean: '', english: 'English marketing text' }), '');
  assert.equal(home.publicCardSummary({}), '');
});

test('stage 3 home keeps the search-first structure and shared design shell', async () => {
  const html = await read('../beta/site/index.html');
  assert.match(html, /<body[^>]*class="pg-page"/);
  assert.match(html, /class="pg-orbs"/);
  assert.match(html, /class="[^\"]*pg-topbar[^\"]*"/);
  assert.match(html, /id="hero-search-form"/);
  assert.match(html, /id="results-workspace"[^>]+hidden/);
  assert.match(html, /id="top-categories"/);
  assert.match(html, /id="manufacturer-browser"/);
  assert.match(html, /catalog\.html/);
  assert.match(html, /llms\.txt/);
});

test('stage 3 card style uses four responsive columns and no status badge', async () => {
  const css = await read('../beta/site/styles.css');
  const app = await read('../beta/site/app.js');
  assert.match(css, /\.cards\s*\{[^}]*repeat\(4,/s);
  assert.match(css, /@media\s*\(max-width:\s*1000px\)/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /@media\s*\(max-width:\s*420px\)/);
  assert.doesNotMatch(app, /card-status/);
  assert.match(app, /item\.cardSummary = publicCardSummary\(detail\)/);
  assert.match(app, /if \(item\.cardSummary\)/);
});

test('long detail key facts get the smaller type treatment', async () => {
  const prototype = await read('../prototype/brc-am7/app.js');
  const generated = await read('../beta/site/detail/app.js');
  const styles = await read('../prototype/brc-am7/styles.css');
  assert.match(prototype, /displayValue\.length\s*>\s*20/);
  assert.match(prototype, /long-key-value/);
  assert.match(generated, /displayValue\.length\s*>\s*20/);
  assert.match(styles, /\.long-key-value\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*700/s);
});
