#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'beta/site/detail/data');
const relativeDir = 'beta/site/detail/data';

// A parenthetical qualification is not the sentence ending. Peel it off for
// classification, while the diff check below protects its exact content.
function endingCore(text) {
  let core = text.trim();
  const hadPeriod = /\.$/.test(core);
  if (hadPeriod) core = core.slice(0, -1).trimEnd();
  while (core.endsWith(')')) {
    let depth = 0;
    let start = -1;
    for (let i = core.length - 1; i >= 0; i--) {
      if (core[i] === ')') depth++;
      else if (core[i] === '(' && --depth === 0) { start = i; break; }
    }
    if (start < 0) break;
    core = core.slice(0, start).trimEnd();
  }
  return { core, hadPeriod };
}

export function endingType(text) {
  if (typeof text !== 'string') return null;
  const { core, hadPeriod } = endingCore(text);
  if (/(?:할|될|볼|쓸|받을|낼|줄|갈) 수 있다$/.test(core)) return 'CAN';
  if (/(?:있다|없다)$/.test(core)) return 'EXIST';
  if (/[가-힣]+니다$/.test(core)) return 'POLITE';
  if (/(?:했다|였다|었다|았다|됐다|췄다|뒀다|냈다|졌다|왔다)$/.test(core)) return 'PAST';
  if (/(?:이다|기다|것이다|아니다)$/.test(core)) return 'COPULA';
  if (/않는다$/.test(core) || /[가-힣]+(?:한다|된다|친다|긴다|난다|받는다|낸다|쓴다|준다|간다|운다|인다)$/.test(core)) return 'HANDA';
  if (hadPeriod && !/(?:Inc|No|approx|Ltd|Co)\.$/i.test(text.trim())) return 'PERIOD';
  return null;
}

export function entriesForProduct(slug, product, field = 'all') {
  const entries = [];
  if (field !== 'desc') {
    for (const [index, feature] of (product.features ?? []).entries()) {
      entries.push({ slug, manufacturer: product.manufacturer, field: 'features', index: index + 1,
        text: feature.text, type: endingType(feature.text) });
    }
  }
  if (field !== 'features') {
    for (const item of (product.portMap?.items ?? [])) {
      const type = endingType(item.desc);
      // The Port Map scope is verbal prose, not already nominal cards that
      // happen to carry a final full stop (e.g. "최대 10 AWG 배선.").
      entries.push({ slug, manufacturer: product.manufacturer, field: 'desc', n: item.n,
        text: item.desc, type: type === 'PERIOD' ? null : type });
    }
  }
  return entries;
}

export function findTargets(products, { manufacturer, field = 'all' } = {}) {
  const all = Object.entries(products).flatMap(([slug, product]) => entriesForProduct(slug, product, field))
    .filter(entry => entry.type && (!manufacturer || entry.manufacturer?.toLowerCase() === manufacturer.toLowerCase()));
  const firstByText = new Map();
  for (const entry of all) {
    if (firstByText.has(entry.text)) entry.sameTextAs = firstByText.get(entry.text);
    else firstByText.set(entry.text, `${entry.slug}:${entry.field === 'desc' ? `d${entry.n}` : `f${entry.index}`}`);
  }
  return all;
}

export function readProducts() {
  return Object.fromEntries(readdirSync(dataDir).filter(name => name.endsWith('.json')).sort().map(name =>
    [name.slice(0, -5), JSON.parse(readFileSync(path.join(dataDir, name), 'utf8'))]));
}

// Keep order and attached units. A changed value can never be hidden by a
// matching count of numbers elsewhere in the same sentence.
export function numberTokens(text) {
  return text.match(/\d+(?:[.,/x×:~–-]\d+)*(?:\s?(?:kHz|MHz|GHz|Hz|kW|mW|W|mA|A|dB|mm|cm|km|kg|ms|fps|nit|bit|RU|U|V|m|g|%|Ω|채널|인치|개))?/gi) ?? [];
}

// Keep mathematical signs and degree marks as well as the digits themselves.
// A value such as -10°C or <5% must not silently become +10°C or >5%.
export function numericSymbols(text) {
  return text.match(/[+\-−±°<>≤≥]/g) ?? [];
}

export function englishTokens(text) {
  return (text.match(/[A-Za-z][A-Za-z0-9+./_-]*/g) ?? []).sort();
}

export function parentheses(text) {
  const result = [];
  const stack = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') stack.push(i);
    else if (text[i] === ')' && stack.length) {
      const start = stack.pop();
      if (stack.length === 0) result.push(text.slice(start, i + 1));
    }
  }
  return result;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function checkSentence(before, after, place, errors) {
  if (before === after) return false;
  if (!same(numberTokens(before), numberTokens(after))) errors.push(`${place}: number/unit tokens changed: ${JSON.stringify(numberTokens(before))} -> ${JSON.stringify(numberTokens(after))}`);
  if (!same(numericSymbols(before), numericSymbols(after))) errors.push(`${place}: numeric signs/comparison symbols changed: ${JSON.stringify(numericSymbols(before))} -> ${JSON.stringify(numericSymbols(after))}`);
  if (!same(englishTokens(before), englishTokens(after))) errors.push(`${place}: English/model tokens changed: ${JSON.stringify(englishTokens(before))} -> ${JSON.stringify(englishTokens(after))}`);
  if (!same(parentheses(before), parentheses(after))) errors.push(`${place}: parenthetical content changed`);
  if (endingType(after)) errors.push(`${place}: verbal ending remains (${endingType(after)})`);
  return true;
}

export function compareProducts(before, after, slug, { field = 'all' } = {}) {
  const errors = [];
  let changed = 0;
  if (!before || !after) return { changed, errors: [`${slug}: product missing at one revision`] };
  if (field !== 'desc') {
    const a = before.features ?? [], b = after.features ?? [];
    if (a.length !== b.length) errors.push(`${slug}: features length changed ${a.length} -> ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const place = `${slug}:f${i + 1}`;
      if (a[i].source !== b[i].source) errors.push(`${place}: source changed`);
      const oldFields = { ...a[i] }, newFields = { ...b[i] };
      delete oldFields.text; delete newFields.text;
      if (!same(oldFields, newFields)) errors.push(`${place}: non-text feature fields changed`);
      if (checkSentence(a[i].text, b[i].text, place, errors)) changed++;
    }
  }
  if (field !== 'features') {
    const a = before.portMap?.items ?? [], b = after.portMap?.items ?? [];
    if (a.length !== b.length) errors.push(`${slug}: Port Map item count changed ${a.length} -> ${b.length}`);
    if (!same(a.map(item => item.n), b.map(item => item.n))) errors.push(`${slug}: Port Map item order or number changed`);
    const oldByN = new Map(a.map(item => [item.n, item]));
    const newByN = new Map(b.map(item => [item.n, item]));
    for (const [n, oldItem] of oldByN) {
      const item = newByN.get(n);
      const place = `${slug}:d${n}`;
      if (!item) { errors.push(`${place}: marker removed`); continue; }
      const oldFields = { ...oldItem }, newFields = { ...item };
      delete oldFields.desc; delete newFields.desc;
      if (!same(oldFields, newFields)) errors.push(`${place}: non-desc marker fields changed`);
      if (checkSentence(oldItem.desc, item.desc, place, errors)) changed++;
    }
    for (const n of newByN.keys()) if (!oldByN.has(n)) errors.push(`${slug}:d${n}: marker added`);
  }
  if (field === 'all') {
    const oldRest = structuredClone(before), newRest = structuredClone(after);
    delete oldRest.features; delete newRest.features;
    if (oldRest.portMap) delete oldRest.portMap.items;
    if (newRest.portMap) delete newRest.portMap.items;
    if (!same(oldRest, newRest)) errors.push(`${slug}: non-wording product fields changed`);
  }
  return { changed, errors };
}

function parseArgs(argv) {
  const options = { field: 'all', check: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--manufacturer' || arg === '--field' || arg === '--diff') {
      if (!argv[i + 1]) throw new Error(`${arg} requires a value`);
      options[arg.slice(2)] = argv[++i];
    } else throw new Error(`unknown option: ${arg}`);
  }
  if (!['all', 'features', 'desc'].includes(options.field)) throw new Error('--field must be features or desc');
  if (options.diff && !/^[\w./-]+$/.test(options.diff)) throw new Error('invalid Git ref');
  return options;
}

export function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const products = readProducts();
  const records = findTargets(products, options);
  const summary = { targets: records.length, products: new Set(records.map(r => r.slug)).size,
    byType: Object.fromEntries([...new Set(records.map(r => r.type))].sort().map(type => [type, records.filter(r => r.type === type).length])) };
  let diff = null;
  if (options.diff) {
    const errors = [];
    let changed = 0;
    const baselineFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', options.diff, '--', relativeDir],
      { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).filter(name => name.endsWith('.json'));
    const baselineSlugs = new Set(baselineFiles.map(name => path.posix.basename(name, '.json')));
    if (!options.manufacturer) for (const slug of baselineSlugs) {
      if (!products[slug]) errors.push(`${slug}: product removed since ${options.diff}`);
    }
    for (const [slug, current] of Object.entries(products)) {
      if (options.manufacturer && current.manufacturer?.toLowerCase() !== options.manufacturer.toLowerCase()) continue;
      if (!baselineSlugs.has(slug)) { errors.push(`${slug}: product added since ${options.diff}`); continue; }
      const gitPath = `${relativeDir}/${slug}.json`;
      let previous;
      try { previous = JSON.parse(execFileSync('git', ['show', `${options.diff}:${gitPath}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); }
      catch { errors.push(`${slug}: missing at ${options.diff}`); continue; }
      const result = compareProducts(previous, current, slug, options);
      changed += result.changed;
      errors.push(...result.errors);
    }
    diff = { changed, errors };
  }
  if (options.json) console.log(JSON.stringify({ summary, records, diff }, null, 2));
  else {
    for (const r of records) console.log(`${r.slug}\t${r.field === 'desc' ? `d${r.n}` : `f${r.index}`}\t${r.type}\t${r.text}${r.sameTextAs ? `\t= ${r.sameTextAs}` : ''}`);
    console.log(`targets ${summary.targets} / products ${summary.products}`);
    if (diff) {
      console.log(`diff changed ${diff.changed} / errors ${diff.errors.length}`);
      for (const error of diff.errors) console.error(error);
    }
  }
  if ((options.check && records.length) || diff?.errors.length) process.exitCode = 1;
  return { summary, records, diff };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
