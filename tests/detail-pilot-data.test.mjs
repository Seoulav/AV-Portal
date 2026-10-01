import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { enhancementErrors, prepareEnhancements } from '../prototype/brc-am7/detail-enhancements.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)));
const proof = read('Work/기록/W-20261001-001-pilot-evidence.json');
const optional = ['lead', 'subtitle', 'keyFacts', 'portMap', 'signalFlow', 'settings'];
for (const [slug, baseline] of Object.entries(proof.products)) {
  test(`pilot ${slug}: evidence-backed optional UI and original values preserved`, () => {
    const p = read(`beta/site/detail/data/${slug}.json`);
    assert.deepEqual(enhancementErrors(p), []);
    assert.equal(p.keyFacts?.length, 4);
    assert.equal((p.lead.match(/\*\*[^*]+\*\*/g) || []).length, 1);
    const prepared = prepareEnhancements(p);
    if (slug === 'eb-pq2220b') {
      assert.equal(prepared.signalFlow, null);
      assert.equal(prepared.portMap, null);
      assert.deepEqual(prepared.settings, []);
    } else {
      assert.ok(prepared.signalFlow);
      assert.ok(prepared.settings.length);
      for (const ref of JSON.stringify(p.signalFlow).matchAll(/"file":"([^"]+)"/g)) {
        assert.equal(readFileSync(new URL('../beta/site/' + ref[1], import.meta.url)).subarray(0, 4).toString(), '%PDF');
      }
    }
    assert.equal(Boolean(prepared.portMap), slug === 'novastar-h5');
    const evidence = baseline.evidence;
    for (const key of optional.filter(key => Object.hasOwn(p, key))) assert.ok(evidence.fields[key], `${slug}.${key} evidence`);
    if (evidence.file) {
      const bytes = readFileSync(new URL('../beta/site/' + evidence.file, import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), evidence.sha256);
      assert.equal(p.sources.find(s => s.code === evidence.source).url, evidence.sourceUrl);
      for (const pages of Object.values(evidence.fields)) {
        for (const page of pages.filter(Number.isInteger)) assert.ok(evidence.pages.includes(page), `${slug} undeclared page ${page}`);
      }
      for (const match of JSON.stringify(p.signalFlow).matchAll(/"page":(\d+)/g)) {
        assert.ok(evidence.pages.includes(Number(match[1])));
        assert.ok(Number(match[1]) <= evidence.pageCount);
      }
    }
    const original = structuredClone(p);
    optional.forEach(key => delete original[key]);
    original.sources.forEach((source, i) => {
      if (baseline.sourcePages[i] === null) delete source.page;
      else assert.equal(source.page, baseline.sourcePages[i]);
    });
    assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'), baseline.originalSha256);
    for (const key of ['features', 'specifications', 'io']) assert.equal(p[key].length, baseline.counts[key]);
  });
}

test('H5 control evidence uses the control-card page, not only a rear photograph', () => {
  const p = read('beta/site/detail/data/novastar-h5.json');
  for (const item of [...p.signalFlow.inputs, ...p.signalFlow.auxiliary].filter(x => x.signal === 'control')) {
    assert.ok(item.evidence.some(e => e.kind === 'pdf' && e.source === 'D' && e.page === 46));
  }
});
